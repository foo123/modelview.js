
// View utils
var numeric_re = /^\d+$/,
    empty_brackets_re = /\[\s*\]$/,
    //Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
    shift_nums = {
     "~" : "`"
    ,"!" : "1"
    ,"@" : "2"
    ,"#" : "3"
    ,"$" : "4"
    ,"%" : "5"
    ,"^" : "6"
    ,"&" : "7"
    ,"*" : "8"
    ,"(" : "9"
    ,")" : "0"
    ,"_" : "-"
    ,"+" : "="
    ,":" : ";"
    ,"\"": "'"
    ,"<" : ","
    ,">" : "."
    ,"?" : "/"
    ,"|" : "\\"
    },
    //Special Keys - and their codes
    special_keys = {
     27 : 'escape'
    ,9  : 'tab'
    ,32 : 'space'
    ,13 : 'enter'
    ,8  : 'backspace'

    ,145 : 'scrolllock'
    ,20  : 'capslock'
    ,144 : 'numlock'

    ,19 : 'pause'
    //,19 : 'break'

    ,45 : 'insert'
    ,36 : 'home'
    ,46 : 'delete'
    ,35 : 'end'

    ,33 : 'pageup'
    ,34 : 'pagedown'

    ,37 : 'left'
    ,38 : 'up'
    ,39 : 'right'
    ,40 : 'down'

    ,112 : 'f1'
    ,113 : 'f2'
    ,114 : 'f3'
    ,115 : 'f4'
    ,116 : 'f5'
    ,117 : 'f6'
    ,118 : 'f7'
    ,119 : 'f8'
    ,120 : 'f9'
    ,121 : 'f10'
    ,122 : 'f11'
    ,123 : 'f12'
    },
    eventOptionsSupported = null
;

function contains_non_strict(collection, value)
{
    if (collection)
    {
        for (var i=0,l=collection.length; i<l; ++i)
            if (value == Str(collection[i])) return true;
    }
    return false;
}
function normalisePath(path)
{
    if (path && path.length)
    {
        path = trim(path);
        if ('#' === path.charAt(0)) path = path.slice(1);
        if ('/' === path.charAt(0)) path = path.slice(1);
        if ('/' === path.slice(-1)) path = path.slice(0, -1);
        path = trim(path);
    }
    return path;
}
function fields2model(view, elements)
{
    var model = view.$model,
        model_prefix = model.id + '.',
        checkboxes_done = { }
    ;

    iterate(function(i) {
        var el, name, key, k, j, o, alternative,
        val, input_type, is_dynamic_array, checkboxes;
        el = elements[i]; name = el[ATTR]("name");
        if (!name) return;

        input_type = (el[TYPE]||'').toLowerCase( );

        key = dotted(name);
        if (!startsWith(key, model_prefix)) return;
        key = key.slice(model_prefix.length);

        k = key.split('.'); o = model.$data;
        while (k.length)
        {
            j = k.shift( );
            if (k.length)
            {
                if (!HAS.call(o, j)) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                o = o[ j ];
            }
            else
            {
                if ('radio' === input_type)
                {
                    if (!checkboxes_done[name])
                    {
                        val = '';
                        checkboxes = $sel('input[type="radio"][name="'+name+'"]', view.$dom);
                        if (checkboxes.length > 1)
                        {
                            each(checkboxes, function(c){
                               if (el[CHECKED]) val = el[VAL];
                            });
                        }
                        else if (el[CHECKED])
                        {
                            val = el[VAL];
                        }
                        checkboxes_done[name] = 1;
                        model.set(key, val);
                    }
                }
                else if ('checkbox' === input_type)
                {
                    if (!checkboxes_done[name])
                    {
                        is_dynamic_array = empty_brackets_re.test(name);
                        checkboxes = $sel('input[type="checkbox"][name="'+name+'"]', view.$dom);

                        if (is_dynamic_array)
                        {
                            // multiple checkboxes [name="model[key][]"] dynamic array
                            // only checked items are in the list
                            val = [ ];
                            each(checkboxes, function(c) {
                                if (c[CHECKED]) val.push(c[VAL]);
                            });
                        }
                        else if (checkboxes.length > 1)
                        {
                            // multiple checkboxes [name="model[key]"] static array
                            // all items are in the list either with values or defaults
                            val = [ ];
                            each(checkboxes, function(c) {
                                if (c[CHECKED]) val.push( c[VAL] );
                                else val.push(!!(alternative=c[ATTR]('data-else')) ? alternative : '');
                            });
                        }
                        else if (el[CHECKED])
                        {
                            // single checkbox, checked
                            val = el[VAL];
                        }
                        else
                        {
                            // single checkbox, un-checked
                            // use alternative value in [data-else] attribute, if needed, else empty
                            val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                        }
                        checkboxes_done[name] = 1;
                        model.set(key, val);
                    }
                }
                else
                {
                    val = get_val(el);
                    model.set(key, val);
                }
            }
        }
    }, 0, elements.length-1);
}
function serialize_fields(node, name_prefix)
{
    var data = {},
        model_prefix = name_prefix && name_prefix.length ? name_prefix + '.' : null,
        elements = $sel('input,textarea,select', node), checkboxes_done = { }
    ;

    iterate(function(i) {
        var el, name, key, k, j, o,
        val, input_type, is_dynamic_array, checkboxes;
        el = elements[i]; name = el[ATTR]("name");
        if (!name) return;

        input_type = (el[TYPE]||'').toLowerCase( );

        key = dotted( name );
        if (model_prefix)
        {
            if (!startsWith(key, model_prefix)) return;
            key = key.slice(model_prefix.length);
        }

        k = key.split('.'); o = data;
        while (k.length)
        {
            j = k.shift( );
            if (k.length)
            {
                if (!HAS.call(o, j)) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                o = o[ j ];
            }
            else
            {
                if (!HAS.call(o, j)) o[ j ] = '';

                if ('radio' === input_type)
                {
                    if (!checkboxes_done[name])
                    {
                        val = '';
                        checkboxes = $sel('input[type="radio"][name="'+name+'"]', node);
                        if (checkboxes.length > 1)
                        {
                            each(checkboxes, function(c){
                               if (el[CHECKED]) val = el[VAL];
                            });
                        }
                        else if (el[CHECKED])
                        {
                            val = el[VAL];
                        }
                        checkboxes_done[name] = 1;
                        o[ j ] = val;
                    }
                }
                else if ('checkbox' === input_type)
                {
                    if (!checkboxes_done[name])
                    {
                        is_dynamic_array = empty_brackets_re.test( name );
                        checkboxes = $sel('input[type="radio"][name="'+name+'"]', node);

                        if (is_dynamic_array)
                        {
                            // multiple checkboxes [name="model[key][]"] dynamic array
                            // only checked items are in the list
                            val = [ ];
                            each(checkboxes, function(c) {
                                if (c[CHECKED]) val.push(c[VAL]);
                            });
                        }
                        else if (checkboxes.length > 1)
                        {
                            // multiple checkboxes [name="model[key]"] static array
                            // all items are in the list either with values or defaults
                            val = [ ];
                            each(checkboxes, function(c) {
                                if (c[CHECKED]) val.push(c[VAL]);
                                else val.push(!!(alternative=c[ATTR]('data-else')) ? alternative : '');
                            });
                        }
                        else if (el[CHECKED])
                        {
                            // single checkbox, checked
                            val = el[VAL];
                        }
                        else
                        {
                            // single checkbox, un-checked
                            // use alternative value in [data-else] attribute, if needed, else empty
                            val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                        }
                        checkboxes_done[name] = 1;
                        o[ j ] = val;
                    }
                }
                else
                {
                    val = get_val(el);
                    o[ j ] = val;
                }
            }
        }
    }, 0, elements.length-1);
    return data;
}
function do_bind_action(view, evt, elements, fromModel)
{
    var model = view.$model, event = evt.type;

    if ('sync' === event) event = 'change';
    iterate(function(i) {
        var el, cel, c, comp, do_action, data;
        el = elements[i]; if (!el) return;
        do_action = el[ATTR](view.attr('mv-on-'+(fromModel ? 'model-' : '')+event));
        if (!do_action || !do_action.length) return;
        each(do_action.split(','), function(do_action){
            do_action = trim(do_action);
            if (!do_action.length) return;
            data = {};
            if (':' === do_action.charAt(0))
            {
                // local component action
                do_action = do_action.slice(1);
                if (!do_action.length) return;
                cel = el;
                while (cel)
                {
                    c = cel[MV] ? cel[MV].comp : null;
                    if (c)
                    {
                        comp = view.$components['#'+c.name];
                        if (is_instance(comp, View.Component) && comp.opts && comp.opts.actions && ('function' === typeof comp.opts.actions[do_action]))
                        {
                            data.component = c;
                            comp.opts.actions[do_action].call(c, evt, el, data);
                            return;
                        }
                    }
                    cel = cel.parentNode;
                    if (cel === view.$renderdom) return;
                }
            }
            else
            {
                // main view action
                if ('text' === do_action)
                {
                    do_action = 'html';
                    data.text = true;
                }
                do_action = 'do_' + do_action;
                if ('function' !== typeof view[do_action]) return;
                data.view = view;
                view[do_action](evt, el, data);
            }
        });
    }, 0, elements.length-1);
}
function do_auto_bind_action(view, evt, elements, fromModel)
{
    var model = view.$model, cached = {};

    iterate(function(i) {
        var el, name, key, ns_key, value;
        el = elements[i];  if (!el) return;
        name = el[NAME]; key = 0;
        el[MV] = el[MV] || MV0();
        if (!el[MV].key && !!name) el[MV].key = model.key(name, 1);
        key = el[MV].key; if (!key) return;

        // use already cached key/value
        ns_key = '_'+key;
        if (HAS.call(cached, ns_key))  value = cached[ ns_key ][ 0 ];
        else if (model.has(key)) cached[ ns_key ] = [ value=model.get( key ) ];
        else return;  // nothing to do here

        // call default action (ie: live update)
        view.do_bind(evt, el, {name:name, key:key, value:value});
    }, 0, elements.length-1);
}
function add_nodes(el, nodes, index, move, isStatic)
{
    var f, i, n, l = nodes.length, frag, _mvModifiedNodes = el[MV] ? el[MV].mod : null;
    if (0 < l)
    {
        if (null == index)
        {
            index = el.childNodes.length;
            move = false;
        }
        if (0 <= index && index <= el.childNodes.length)
        {
            if (!move && _mvModifiedNodes)
            {
                f = false;
                for (i=0; i<_mvModifiedNodes.length; ++i)
                {
                    if (index < stdMath.max(_mvModifiedNodes[i].from, _mvModifiedNodes[i].to))
                    {
                        _mvModifiedNodes[i].from += l;
                        _mvModifiedNodes[i].to += l;
                    }
                    else if ((index >= _mvModifiedNodes[i].from && index <= _mvModifiedNodes[i].to) || (index === _mvModifiedNodes[i].from && _mvModifiedNodes[i].to < _mvModifiedNodes[i].from))
                    {
                        f = true;
                        if (!isStatic || (index < _mvModifiedNodes[i].to))
                        _mvModifiedNodes[i].to += l;
                    }
                }
                if (!f && !isStatic && _mvModifiedNodes.length && (index === el.childNodes.length) && (el.childNodes.length-1 === _mvModifiedNodes[_mvModifiedNodes.length-1].to))
                {
                    _mvModifiedNodes[_mvModifiedNodes.length-1].to += l;
                }
            }
            if (index >= el.childNodes.length)
            {
                if (1 < l)
                {
                    frag = Fragment();
                    for (i=0; i<l; ++i) frag.appendChild(nodes[i]);
                    el.appendChild(frag);
                }
                else
                {
                    el.appendChild(nodes[0]);
                }
            }
            else
            {
                if (1 < l)
                {
                    frag = Fragment();
                    n = el.childNodes[index];
                    for (i=0; i<l; ++i) frag.appendChild(nodes[i]);
                    el.insertBefore(frag, n);
                }
                else
                {
                    el.insertBefore(nodes[0], el.childNodes[index]);
                }
            }
        }
    }
    return el;
}
function remove_nodes(el, count, index, isStatic)
{
    var f, i, l, range, _mvModifiedNodes = el[MV] ? el[MV].mod : null;
    if (null == index) index = el.childNodes.length-1;
    if (0 < count && 0 <= index && index < el.childNodes.length)
    {
        l = stdMath.min(count, el.childNodes.length-index);
        if (0 < l)
        {
            if (_mvModifiedNodes)
            {
                f = false;
                for (i=0; i<_mvModifiedNodes.length; ++i)
                {
                    if (index < stdMath.max(_mvModifiedNodes[i].from, _mvModifiedNodes[i].to))
                    {
                        _mvModifiedNodes[i].from -= l;
                        _mvModifiedNodes[i].to -= l;
                    }
                    else if (index >= _mvModifiedNodes[i].from && index <= _mvModifiedNodes[i].to)
                    {
                        f = true;
                        _mvModifiedNodes[i].to = stdMath.max(_mvModifiedNodes[i].from-1, _mvModifiedNodes[i].to-l);
                    }
                }
            }
            range = 1 < l ? Range() : null;
            if (range)
            {
                range.setStart(el, index);
                range.setEnd(el, stdMath.min(el.childNodes.length, index+l));
                range.deleteContents();
            }
            else
            {
                for (; 0 < l; --l) el.removeChild(el.childNodes[index]);
            }
        }
    }
}
function getCtxScoped(view, viewvar)
{
    var k, code = '';
    viewvar = viewvar || 'this';
    for (k in view.$ctx)
    {
        if (HAS.call(view.$ctx,k))
            code += 'var '+k+'='+viewvar+'.$ctx["'+k+'"];'
    }
    return code;
}
function clearInvalid(view)
{
    // reset any Values/Collections present
    if (view.$model) view.$model.resetDirty();
    if (view.$reset) each(Keys(view.$reset), function(k) {
        view.$reset[k].reset();
    });
    view.$reset = null;
    if (view.$cache) each(Keys(view.$cache), function(id) {
        var comp = view.$cache[id], COMP;
        if (is_instance(comp, MVComponentInstance))
        {
            COMP = view.$components['#'+comp.name];
            if (2 === comp.status || !is_child_of(comp.dom, view.$renderdom, view.$renderdom))
            {
                if (1 === comp.status)
                {
                    comp.status = 2;
                    if (comp.dom && COMP && COMP.opts && 'function' === typeof COMP.opts.detached)
                        COMP.opts.detached.call(comp, comp);
                }
                comp.dispose();
                delete view.$cache[id];
            }
            else
            {
                if (comp.model) comp.model.resetDirty();
                if (0 === comp.status)
                {
                    comp.status = 1;
                    if (comp.dom && COMP && COMP.opts && 'function' === typeof COMP.opts.attached)
                        COMP.opts.attached.call(comp, comp);
                }
            }
        }
    });
}
function clearAll(view)
{
    view.$reset = null;
    if (view.$cache) each(Keys(view.$cache), function(id){
        var comp = view.$cache[id];
        if (is_instance(comp, MVComponentInstance))
        {
            comp.dispose();
            delete view.$cache[id];
        }
    });
}
function updateMap(node, action, map, topNode)
{
    if (!map) return node;
    if ('add' === action)
    {
        if (node) get_placeholders(node, map);
    }
    else if ('remove' === action)
    {
        del_map(map, function(v) {
            v.reduce(function(rem, t, i) {
                if (('list' === t.type) && ((node && is_child_of(t.start, node)) || (!node && !is_child_of(t.start, topNode)))) rem.push(i);
                else if (('list' !== t.type) && ((node && is_child_of(t.node, node)) || (!node && !is_child_of(t.node, topNode)))) rem.push(i);
                return rem;
            }, [])
            .reverse()
            .forEach(function(i) {
                v.splice(i, 1);
            });
        });
    }
    return node;
}
function hasComponent(view, name)
{
    return view && name && view.$components && is_instance(view.$components['#'+name], View.Component);
}
function viewHandler(view, method)
{
    return function(evt) {return method.call(view, evt, {el:evt.target});};
}
function closestEvtEl(el, evt, view)
{
    var mvEvt = view.attr('mv-evt'), mvOnEvt = view.attr('mv-on-'+evt.type);
    while (el)
    {
        if (view.$dom === el) break;
        if (el[HAS_ATTR](mvEvt) && el[ATTR](mvOnEvt)) return el;
        el = el.parentNode;
    }
}
function as_unit(node)
{
    if (is_instance(node, VNode))
    {
        node.unit = true;
        return node;
    }
    return is_array(node) ? node.map(as_unit) : node;
}
function debounce(callback, instance)
{
    if (HASDOC && window.requestAnimationFrame)
    {
        // If there's a pending render, cancel it
        if (instance && instance._dbnc) window.cancelAnimationFrame(instance._dbnc);
        // Setup the new render to run at the next animation frame
        if (instance) instance._dbnc = window.requestAnimationFrame(callback);
        else window.requestAnimationFrame(callback);
    }
    else
    {
        callback();
    }
}
function hasEventOptions()
{
    var passiveSupported = false, options = {};
    try {
        Object.defineProperty(options, 'passive', {
            get: function(){
                passiveSupported = true;
                return false;
            }
        });
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
    } catch(e) {
        passiveSupported = false;
    }
    return passiveSupported;
}
function addEvent(target, event, handler, options)
{
    if (!HASDOC || !target) return;
    if (null == eventOptionsSupported) eventOptionsSupported = hasEventOptions();
    if (target.attachEvent) target.attachEvent('on' + event, handler);
    else target.addEventListener(event, handler, eventOptionsSupported ? options : ('object' === typeof options ? !!options.capture : !!options));
}
function removeEvent(target, event, handler, options)
{
    if (!HASDOC || !target) return;
    if (null == eventOptionsSupported) eventOptionsSupported = hasEventOptions();
    // if (el.removeEventListener) not working in IE11
    if (target.detachEvent) target.detachEvent('on' + event, handler);
    else target.removeEventListener(event, handler, eventOptionsSupported ? options : ('object' === typeof options ? !!options.capture : !!options));
}
function dispatchEvent(target, event, data)
{
    var evt; // The custom event that will be created
    if (!HASDOC || !target) return;
    if (document.createEvent)
    {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        evt.eventName = event;
        if (null != data) evt.data = data;
        target.dispatchEvent(evt);
    }
    else
    {
        evt = document.createEventObject();
        evt.eventType = event;
        evt.eventName = event;
        if (null != data) evt.data = data;
        target.fireEvent('on' + event, evt);
    }
}


/**[DOC_MARKDOWN]
#### View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID] );

[/DOC_MARKDOWN]**/
//
// View Class
var View = function View(id) {
    var view = this;

    // constructor-factory pattern
    if (!is_instance(view, View)) return new View(id);

    view.$opts = {};
    view.option('view.uuid', uuid('View'));
    view.option('view.livebind', true);
    view.option('view.autobind', true);
    view.option('view.autobindAll', true);
    view.option('model.events', true);
    view.namespace = view.id = id || view.option('view.uuid');
    view.$shortcuts = {};
    view.$num_shortcuts = 0;
    view.$components = {};
    view.$ctx = {};
    view.$cache = {};
    view.$cnt = null;
    view.changeHandler = bindF(view.changeHandler, view);
    view.initPubSub();
};
// STATIC
View.serialize = serialize_fields;
View.nextTick = nextTick;
// View implements PublishSubscribe pattern
View[proto] = Merge(Create(Obj[proto]), PublishSubscribe, {

    constructor: View

    ,id: null
    ,namespace: null
    ,$opts: null
    ,$dom: null
    ,$renderdom: null
    ,$model: null
    ,$tpl: ''
    ,$out: null
    ,$map: null
    ,$shortcuts: null
    ,$num_shortcuts: null
    ,$components: null
    ,$ctx: null
    ,$cache: null
    ,$cnt: null
    ,$reset: null
    ,_dbnc: null

/**[DOC_MARKDOWN]
// dispose view
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function() {
        var view = this;
        view.unbind().disposePubSub();
        view.$opts = null;
        view.$dom = null;
        view.$renderdom = null;
        view.$model = null;
        view.$tpl = null;
        view.$out = null;
        view.$map = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        view.$components = null;
        view.$ctx = null;
        view.$cache = null;
        view.$cnt = null;
        view.$reset = null;
        return view;
    }

    ,nop: NOOP

    ,changeHandler: function changeHandler(evt) {
        var view = this;
        // event triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;
        var el = evt.target, tag = (el.tagName || '').toLowerCase(),
            isAutoBind = ('change' === evt.type) && view.option('view.autobind') && ('input' === tag || 'textarea' === tag || 'select' === tag) && ((view.$model && startsWith(el.name || '', view.$model.id+'[')) || startsWith(el.name || '', ':model[')),
            isBind = el[HAS_ATTR](view.attr('mv-evt')) && el[ATTR](view.attr('mv-on-'+evt.type));
        if (!isBind && !isAutoBind) isBind = !!(el = closestEvtEl(el.parentNode, evt, view));
        if (isBind || isAutoBind) view.on_view_change(evt, {el:el, isBind:isBind, isAutoBind:isAutoBind});
        return true;
    }


/**[DOC_MARKDOWN]
// get / set view builtin and user-defined options
view.option(String key [, Any val]);

[/DOC_MARKDOWN]**/
    ,option: function(key, val) {
        var view = this;
        if (!view.$opts) view.$opts = {};
        if (1 < arguments.length)
        {
            view.$opts[key] = val;
        }
        else if (key)
        {
            return HAS.call(view.$opts, key) ? view.$opts[key] : undef;
        }
        return view;
    }

/**[DOC_MARKDOWN]
// get / set view model
view.model( [Model model] );

[/DOC_MARKDOWN]**/
    ,model: function(model) {
        var view = this;
        if (arguments.length)
        {
            view.$model = model;
            return view;
        }
        return view.$model;
    }

/**[DOC_MARKDOWN]
// get / set the template of the view as HTML string
view.template( [String html] );

[/DOC_MARKDOWN]**/
    ,template: function(html) {
        var view = this;
        if (arguments.length)
        {
            view.$tpl = trim(html);
            view.$out = null;
            return view;
        }
        return view.$tpl;
    }

/**[DOC_MARKDOWN]
// register a view context (eg global functions and variables) which can be used in templates in {name: value} format
view.context( Object ctx );

[/DOC_MARKDOWN]**/
    ,context: function(ctx) {
        var view = this, k;
        if (is_type(ctx, T_OBJ))
        {
            for (k in ctx)
                if (HAS.call(ctx,k))
                    view.$ctx[k] = ctx[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add custom view event handlers for model/view/dom/document/window targets in {"target:eventName": handler} format
view.events( Object events );

[/DOC_MARKDOWN]**/
    ,events: function(events) {
        var view = this, k;
        if (is_type(events, T_OBJ))
        {
            for (k in events)
                if (HAS.call(events,k) && is_type(events[k], T_FUNC))
                    view['on_' + k.split(':').join('_')] = events[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );

[/DOC_MARKDOWN]**/
    ,shortcuts: function(shortcuts) {
        var view = this, k, key, keys, modifiers, i, view_shortcuts = view.$shortcuts;
        if (is_type(shortcuts, T_OBJ))
        {
            for (k in shortcuts)
            {
                if (HAS.call(shortcuts,k))
                {
                    modifiers = [];
                    keys = k.toLowerCase().split('+').map(trim);
                    for (i=keys.length-1; i>=0; --i)
                    {
                        key = keys[ i ];
                        if ('alt' === key || 'ctrl' === key || 'shift' === key || 'meta' === key)
                        {
                            modifiers.push(key);
                            keys.splice(i, 1);
                        }
                    }
                    key = modifiers.sort().concat(keys).join('+');

                    if (false === shortcuts[k])
                    {
                        if (HAS.call(view_shortcuts,key))
                        {
                            del(view_shortcuts, key);
                            view.$num_shortcuts--;
                        }
                    }
                    else
                    {
                        if (!HAS.call(view_shortcuts,key)) view.$num_shortcuts++;
                        view_shortcuts[ key ] = shortcuts[ k ];
                    }
                }
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add custom view named actions in {actionName: handler} format
view.actions( Object actions );

[/DOC_MARKDOWN]**/
    ,actions: function(actions) {
        var view = this, k;
        if (is_type(actions, T_OBJ))
        {
            for (k in actions)
                if (HAS.call(actions,k) && is_type(actions[k], T_FUNC))
                    view['do_' + k] = actions[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add custom view named components which render output in {componentName: componentInstance} format
view.components( Object components );

[/DOC_MARKDOWN]**/
    ,components: function(components) {
        var view = this, k;
        if (is_type(components, T_OBJ))
        {
            for (k in components)
                if (HAS.call(components,k) && is_instance(components[k], View.Component))
                    view.$components['#'+k] = components[k];
        }
        return view;
    }
    ,component: function(name, id, props, childs) {
        var view = this, out, c, compId, nk, component, changed;
        if (name && (c=view.$components[nk='#'+name]))
        {
            if (c.tpl && !c.out)
            {
                c.out = tpl2code(view, c.tpl, 'props,childs,', getCtxScoped(view, 'view'), {trim:true, id:view.attr('mv-id')}, '<mv-component>', 'this.view');
            }
            if (c.out)
            {
                view.$cnt[nk] = (view.$cnt[nk] || 0)+1;
                if (is_instance(id, Value)) id = id.val();
                if (view.$cache['#'] && view.$cache['#'].length)
                {
                    // already references given component instance, given in order of rendering
                    component = view.$cache['#'].shift();
                    if (!component || name !== component.name || (null != id && component.id !== name+'_id_'+Str(id))) component = null;
                }
                if (!component)
                {
                    compId = null == id ? name+'_#'+Str(view.$cnt[nk]) : name+'_id_'+Str(id);
                    component = view.$cache[compId];
                }
                if (!component)
                {
                    component = new MVComponentInstance(view, compId, name, null, c.opts && c.opts.model ? c.opts.model() : null);
                    view.$cache[compId] = component;
                    if (component.model) component.model.on('change', function(){view.render();});
                    changed = true;
                }
                else
                {
                    changed = component.model ? component.model.isDirty() : false;
                    changed = (c.opts && 'function' === typeof(c.opts.changed) ? c.opts.changed(component.props, props, component) : false) || changed;
                }
                component.props = props;
                out = c.out.call(component, props, childs||[], htmlNode);
                out.component = component;
                out.changed = changed;
                return out;
            }
        }
        return '';
    }

/**[DOC_MARKDOWN]
// basic view Router component
view.router({
    type: "hash", // "hash" or "path", default "hash"
    caseSensitive: false, // default true
    prefix: "/prefix/", // default no prefix ""
    routes: {
        "/": () => (<IndexPage/>),
        "/user/:id": (match) => (<UserPage props={{id:match.id}}/>),
        "/msg/:id/:line?": (match) => (<MsgPage props={{id:match.id,line:match.line}}/>) // if there is no :line, match.line will be null
    },
    fail: () => (<ErrorPage/>) // default empty
});

[/DOC_MARKDOWN]**/
    ,router: function(opts) {
        var view = this, loc, fail, r, rl, route, prefix, pattern, i, l, m, match, matches;
        opts = opts || {};
        if (!HAS.call(opts, 'type')) opts.type = 'hash';
        opts.type = Str(opts.type || 'hash').toLowerCase();
        if (!HAS.call(opts, 'caseSensitive')) opts.caseSensitive = true;
        opts.caseSensitive = !!opts.caseSensitive;
        if (!HAS.call(opts, 'prefix')) opts.prefix = '';
        opts.prefix = trim(opts.prefix || '');
        if (!HAS.call(opts, 'routes')) opts.routes = {};
        opts.routes = opts.routes || {};
        fail = opts.fail || function(){return [];/*empty*/};
        loc = (HASDOC ? window.location : view.option('router.location')) || {pathname:'/', hash:'#/'};
        route = normalisePath(('path' === opts.type ? loc.pathname : loc.hash) || '');
        if (opts.prefix && opts.prefix.length)
        {
            prefix = normalisePath(opts.prefix);
            if (opts.caseSensitive)
            {
                if ('/'+prefix+'/' !== '/'+route.slice(0, prefix.length+1)) return fail();
                else route = route.slice(prefix.length+2);
            }
            else
            {
                if ('/'+prefix.toLowerCase()+'/' !== '/'+route.slice(0, prefix.length+1).toLowerCase()) return fail();
                else route = route.slice(prefix.length+2);
            }
        }
        route = route.split('/'); rl = route.length;
        for (r in opts.routes)
        {
            if (!HAS.call(opts.routes, r)) continue;
            pattern = normalisePath(r).split('/');
            l = pattern.length;
            if (rl > l) continue;
            match = {};
            matches = true;
            for (i = 0; i < l; ++i)
            {
                m = null;
                if (i >= rl)
                {
                    if ('?' === pattern[i].slice(-1))
                    {
                        if (':' === pattern[i].charAt(0))
                        {
                            m = pattern[i].slice(1, -1);
                            match[m] = null;
                        }
                    }
                    else
                    {
                        matches = false;
                        break;
                    }
                }
                else
                {
                    if (':' === pattern[i].charAt(0))
                    {
                        m = pattern[i].slice(1);
                        if ('?' === m.slice(-1)) m = m.slice(0, -1);
                        match[m] = decodeURIComponent(route[i]);
                    }
                    else if (opts.caseSensitive)
                    {
                        if (pattern[i] !== route[i])
                        {
                            matches = false;
                            break;
                        }
                    }
                    else
                    {
                        if (pattern[i].toLowerCase() !== route[i].toLowerCase())
                        {
                            matches = false;
                            break;
                        }
                    }
                }
            }
            if (matches) return opts.routes[r](match);
        }
        return fail();
    }
/**[DOC_MARKDOWN]
// navigate to full url or path, or hash using window.history (or directly if noHistory is true)
view.navigateTo(String url[, Boolean noHistory = false]);

[/DOC_MARKDOWN]**/
    ,navigateTo: function(loc, noHistory) {
        var view = this, evt;
        if (HASDOC && loc)
        {
            loc = trim(loc);
            if (!loc.length) return view;
            if ('/' === loc.slice(-1) && '/' !== loc && '#/' !== loc)
                loc = loc.slice(0, -1);
            if (!noHistory && window.history && window.history.pushState)
            {
                window.history.pushState({}, '', loc);
                if ('undefined' !== typeof PopStateEvent)
                {
                    evt = new PopStateEvent('popstate', {state: {}});
                    evt.data = evt.data || {};
                    evt.data.trigger = view;
                    window.dispatchEvent(evt);
                }
            }
            else if ('#' === loc.charAt(0))
            {
                window.location.hash = loc;
            }
            else if ('/' === loc.charAt(0))
            {
                window.location.pathname = loc;
            }
            else if ('..' === loc.slice(0, 2) || '.' === loc.slice(0, 1))
            {
                window.location.pathname = window.location.pathname + ('/'===window.location.pathname.slice(-1) ? '' : '/') + loc;
            }
            else
            {
                window.location.href = loc;
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// can integrate with HtmlWidget
view.widget( ..args );

[/DOC_MARKDOWN]**/
    ,widget: function(/*args*/) {
        var HtmlWidget = View.HtmlWidget;
        return HtmlWidget && ("function" === typeof HtmlWidget.widget) ? this.html(HtmlWidget.widget.apply(HtmlWidget, arguments)) : '';
    }


/**[DOC_MARKDOWN]
// dynamically parse html string to virtual html node(s) at run-time
view.html( String htmlString );

[/DOC_MARKDOWN]**/
    ,html: function(str) {
        return parse(this, str, {trim:true, id:this.attr('mv-id')}, 'dyn');
    }
/**[DOC_MARKDOWN]
// mark html virtual node(s) to be morphed completely as a single unit
// (without using speed heuristics which may in some cases fail)
view.unit( nodes );

[/DOC_MARKDOWN]**/
    ,unit: function(nodes) {
        return as_unit(nodes);
    }
/**[DOC_MARKDOWN]
// declare that html virtual node(s) are keyed nodes
view.keyed( nodes );

[/DOC_MARKDOWN]**/
    ,keyed: function(nodes) {
        return new KeyedNode(nodes);
    }

    ,attr: function(attr) {
        return (this.option('view.attr') || '') + Str(attr);
    }

/**[DOC_MARKDOWN]
// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function(enable) {
        if (arguments.length)
        {
            this.$model.autovalidate(enable);
            return this;
        }
        return this.$model.autovalidate();
    }

/**[DOC_MARKDOWN]
// get / set livebind,
// livebind automatically updates dom when model changes, DEFAULT TRUE
view.livebind( [type=true|false|'simple'|'text'|'jsx'] );

[/DOC_MARKDOWN]**/
    ,livebind: function(enable) {
        var view = this;
        if (arguments.length)
        {
            view.option('view.livebind', 'simple' === enable || 'text' === enable ? 'text' : ('jsx' === enable ? true : !!enable));
            return view;
        }
        return view.option('view.livebind');
    }

/**[DOC_MARKDOWN]
// get / set autobind,
// autobind automatically binds (2-way) input elements to model keys via name attribute, DEFAULT TRUE
view.autobind( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autobind: function(enable) {
        var view = this;
        if (arguments.length)
        {
            view.option('view.autobind', !!enable);
            return view;
        }
        return view.option('view.autobind');
    }

/**[DOC_MARKDOWN]
// precompile content and component html templates
// should be called after all view options (eg livebind) have been set
view.precompile();

[/DOC_MARKDOWN]**/
    ,precompile: function() {
        var view = this, n, c, livebind = view.option('view.livebind');
        if ('text' === livebind)
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2codesimple(view, view.$tpl, '');

            if (!view.$map)
            {
                if (view.$out) view.$renderdom.innerHTML = view.$out.call(view);
                updateMap(view.$renderdom, 'add', view.$map={}, view.$dom);
            }
        }
        else if (true === livebind)
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2code(view, view.$tpl, '', getCtxScoped(view, 'this'), {trim:true, id:view.attr('mv-id')});

            for (n in view.$components)
            {
                if (HAS.call(view.$components, n))
                {
                    c = view.$components[n];
                    if (c.tpl && !c.out)
                    {
                        c.out = tpl2code(view, c.tpl, 'props,childs,', getCtxScoped(view, 'view'), {trim:true, id:view.attr('mv-id')}, '<mv-component>', 'this.view');
                    }
                }
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// bind view to dom listening given DOM events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom, renderdom) {
        var view = this, model = view.$model, method, evt;

        view.$dom = dom || (HASDOC ? document.body : null);
        view.$renderdom = renderdom || view.$dom;

        // default view/dom binding events
        view.option('view.events', events = events || ['change', 'click']);

        if (HASDOC && view.$dom && view.on_view_change && events.length)
        {
            each(events, function(event) {
                addEvent(view.$dom, event, view.changeHandler, {capture:true, passive:false});
            });
        }

        // bind model/dom/document/window (custom) event handlers
        for (method in view)
        {
            if (!is_type(view[method], T_FUNC)) continue;

            if (startsWith(method, 'on_model_') && model)
            {
                evt = method.slice(9);
                evt.length && view.onTo(model, evt, view[method] = bindF(view[method], view));
            }
            else if (HASDOC)
            {
                if (startsWith(method, 'on_window_'))
                {
                    evt = method.slice(10);
                    evt.length && addEvent(window, evt, view[method] = viewHandler(view, view[method]), {capture:true, passive:false});
                }
                else if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && addEvent(document.body, evt, view[method] = viewHandler(view, view[method]), {capture:false, passive:false});
                }
                else if (view.$dom && startsWith(method, 'on_dom_'))
                {
                    evt = method.slice(7);
                    evt.length && addEvent(view.$dom, evt, view[method] = viewHandler(view, view[method]), {capture:true, passive:false});
                }
            }
        }

        return view;
    }

/**[DOC_MARKDOWN]
// unbind view from underlying dom
view.unbind( );

[/DOC_MARKDOWN]**/
    ,unbind: function() {
        var view = this, model = view.$model;

        // model events
        if (model) view.offFrom(model);

        if (HASDOC && view.$dom && view.on_view_change && view.option('view.events'))
        {
            each(view.option('view.events'), function(event) {
                removeEvent(view.$dom, event, view.changeHandler, {capture:true, passive:false});
            });
        }

        // unbind dom/document/window (custom) event handlers
        if (HASDOC)
        {
            for (method in view)
            {
                if (!is_type(view[method], T_FUNC)) continue;

                if (startsWith(method, 'on_window_'))
                {
                    evt = method.slice(10);
                    evt.length && removeEvent(window, evt, view[method], {capture:true, passive:false});
                }
                else if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && removeEvent(document.body, evt, view[method], {capture:false, passive:false});
                }
                else if (view.$dom && startsWith(method, 'on_dom_'))
                {
                    evt = method.slice(7);
                    evt.length && removeEvent(view.$dom, evt, view[method], {capture:true, passive:false});
                }
            }
            clearAll(view);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render view on actual DOM (immediately or deferred) or return rendered string if on server
// .render is also called internally by view auto-update methods
view.render( [Boolean immediate=false] );

[/DOC_MARKDOWN]**/
    ,render: function(immediate) {
        var view = this, model = view.$model, out = '', callback,
            livebind = view.option('view.livebind');
        if ('text' === livebind)
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2codesimple(view, view.$tpl, '');

            if (!view.$renderdom)
            {
                view.$reset = {}; view.$cache = null;
                if (view.$out) out = view.$out.call(view, model); // return the rendered string
                if (model) model.resetDirty();
                view.$reset = null;
                // notify any 3rd-party also if needed
                view.publish('render', {});
                return out;
            }
            else
            {
                if (!view.$map)
                {
                    if (view.$out) view.$renderdom.innerHTML = view.$out.call(view);
                    updateMap(view.$renderdom, 'add', view.$map={}, view.$dom);
                }
                //if ('function' !== typeof morphSimple) throw err('Simple Mode is not included in this build');
                callback = function() {
                    view.$reset = {}; view.$cache = null;
                    morphSimple(view, view.$map, view.$model, !model || ('sync' === immediate) ? false : true);
                    nextTick(function() {
                        clearInvalid(view);
                        // notify any 3rd-party also if needed
                        view.publish('render', {});
                    });
                };
                if (true === immediate || 'sync' === immediate)
                {
                    callback();
                }
                else
                {
                    debounce(callback, view);
                }
            }
        }
        else
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2code(view, view.$tpl, '', getCtxScoped(view, 'this'), {trim:true, id:view.attr('mv-id')});

            if (view.$out)
            {
                if (!view.$renderdom)
                {
                    view.$cnt = {}; view.$reset = {}; view.$cache['#'] = null;
                    var out = to_string(view, view.$out.call(view, htmlNode)); // return the rendered string
                    if (model) model.resetDirty();
                    view.$reset = null; view.$cache['#'] = null;
                    // notify any 3rd-party also if needed
                    view.publish('render', {});
                    return out;
                }
                //if ('function' !== typeof morph) throw err('General Mode is not included in this build');
                callback = function() {
                    view.$cnt = {}; view.$reset = {}; view.$cache['#'] = null;
                    morph(view, view.$renderdom, view.$out.call(view, htmlNode));
                    view.$cache['#'] = null;
                    nextTick(function() {
                        clearInvalid(view);
                        // notify any 3rd-party also if needed
                        view.publish('render', {});
                    });
                };
                if (true === immediate || 'sync' === immediate)
                {
                    callback();
                }
                else
                {
                    debounce(callback, view);
                }
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// directly add node at index position of parentNode (this method is compatible with general morphing routines)
view.addNode( parentNode, nodeToAdd, atIndex );

[/DOC_MARKDOWN]**/
    ,addNode: function(el, node, index, isStatic) {
        var view = this;
        if (el && node)
        {
            if ((true!==isStatic) && ('text' === view.livebind()) && view.$map)
                updateMap(node, 'add', view.$map, view.$dom);
            add_nodes(el, [node], index, true===isStatic);
        }
        return view;
    }
/**[DOC_MARKDOWN]
// directly move node at index position of same parentNode (this method is compatible with general morphing routines)
view.moveNode( parentNode, nodeToMove, atIndex );

[/DOC_MARKDOWN]**/
    ,moveNode: function(el, node, index) {
        if (el && node) add_nodes(el, [node], index, true);
        return this;
    }
/**[DOC_MARKDOWN]
// directly remove node (this method is compatible with general morphing routines)
view.removeNode( nodeToRemove );

[/DOC_MARKDOWN]**/
    ,removeNode: function(node) {
        var view = this;
        if (node && node.parentNode)
        {
            remove_nodes(node.parentNode, 1, get_index(node));
            if (('text' === view.livebind()) && view.$map)
                updateMap(node, 'remove', view.$map, view.$dom);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, els,
            autobind = view.option('view.autobind'),
            livebind = view.option('view.livebind');

        if (HASDOC && view.$dom)
        {
            view.render('sync');

            if (model && (true !== livebind) && view.option('model.events'))
            {
                do_bind_action(view, {type:'sync'}, $sel('['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']', view.$dom), {});
            }

            if (model && autobind && ((true !== livebind) || (view.$dom !== view.$renderdom && view.option('view.autobindAll'))))
            {
                els = $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom);
                //if (livebind) els = filter(els, function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
                do_auto_bind_action(view, {type:'change'}, els, null);
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// synchronize model to underlying dom
view.sync_model();

[/DOC_MARKDOWN]**/
    ,sync_model: function() {
        var view = this, model = view.$model,
            autobind = view.option('view.autobind'), autobinds
        ;

        if (HASDOC && model && view.$dom && autobind)
        {
            autobinds = $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom);
            if (autobinds.length) fields2model(view, autobinds);
        }
        return view;
    }

    //
    // view "on_event" methods
    //

    ,on_view_change: function(evt, data) {
        var view = this, model = view.$model,
            el = data.el, name, key, val,
            checkboxes, is_dynamic_array, input_type, alternative,
            comp, isFromComponent = false, modeldata = {}
        ;

        // evt triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;

        // update model and propagate to other elements of same view (via model publish hook)
        if (data.isAutoBind && !!(name=el[NAME]))
        {
            el[MV] = el[MV] || MV0();
            if (':model[' === name.slice(0, 7))
            {
                isFromComponent = true;
                if (!el[MV].key) el[MV].key = dotted(name.slice(6));
            }
            else
            {
                if (!el[MV].key) el[MV].key = model.key(name, 1);
            }
            key = el[MV].key;

            if (key /*&& model.has( key )*/)
            {
                input_type = (el[TYPE]||'').toLowerCase();

                if ('checkbox' === input_type)
                {
                    is_dynamic_array = empty_brackets_re.test(name);
                    checkboxes = $sel('input[type="checkbox"][name="'+name+'"]', view.$dom);

                    if (is_dynamic_array)
                    {
                        // multiple checkboxes [name="model[key][]"] dynamic array
                        // only checked items are in the list
                        val = [];
                        each(checkboxes, function(c) {
                            if (c[CHECKED]) val.push(c[VAL]);
                        });
                    }
                    else if (checkboxes.length > 1)
                    {
                        // multiple checkboxes [name="model[key]"] static array
                        // all items are in the list either with values or defaults
                        val = [];
                        each(checkboxes, function(c) {
                            if (c[CHECKED]) val.push(c[VAL]);
                            else val.push(!!(alternative=c[ATTR]('data-else')) ? alternative : '');
                        });
                    }
                    else if (el[CHECKED])
                    {
                        // single checkbox, checked
                        val = el[VAL];
                    }
                    else
                    {
                        // single checkbox, un-checked
                        // use alternative value in [data-else] attribute, if needed, else empty
                        val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                    }
                }
                else
                {
                    val = get_val(el);
                }

                modeldata.triggerEl = el;
                if (isFromComponent)
                {
                    comp = el;
                    while (comp)
                    {
                        if (comp[MV] && comp[MV].comp) break;
                        comp = comp.parentNode;
                    }
                    if (comp && comp[MV] && comp[MV].comp && comp[MV].comp.model)
                        comp[MV].comp.model.set(key, val, 1, modeldata);
                }
                else if (model)
                {
                    model.set(key, val, 1, modeldata);
                }
            }
        }

        // if not model update error and element is bind element
        // do view action
        if (!modeldata.error && data.isBind) do_bind_action(view, evt, [el]/*, data*/);

        // notify any 3rd-party also if needed
        view.publish('change', data);
    }

    ,on_document_keydown: function(evt, data) {
        var view = this, view_shortcuts = view.$shortcuts,
            el = data.el, callback, ret, input_type,
            key, code, character, modifiers;

        // evt triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;
        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        input_type = 'TEXTAREA' === el[TAG].toUpperCase() ? 'text' : ('INPUT' === el[TAG].toUpperCase() ? (el[TYPE]||'').toLowerCase() : '');
        // no hotkeys assigned or text input element is the target, bypass
        if (!view.$num_shortcuts || 'text' === input_type || 'email' === input_type || 'password' === input_type || 'url' === input_type || 'number' === input_type || 'tel' === input_type) return;

        // find which key is pressed
        code = evt.keyCode || evt.which;

        // key modifiers (in alphabetical order)
        modifiers = [];
        if (!!evt.altKey) modifiers.push('alt');
        if (!!evt.ctrlKey) modifiers.push('ctrl');
        if (!!evt.metaKey) modifiers.push('meta');	// meta is Mac specific
        if (!!evt.shiftKey) modifiers.push('shift');

        // if it is a special key
        if (HAS.call(special_keys, code))
        {
            key = special_keys[ code ];
        }
        else
        {
            if ( 188 === code )         character = ","; //If the user presses , when the type is onkeydown
            else if ( 190 === code )    character = "."; //If the user presses , when the type is onkeydown
            else                        character = Str.fromCharCode(code).toLowerCase( );
            // stupid Shift key bug created by using lowercase
            if (!!evt.shiftKey && HAS.call(shift_nums,character)) character = shift_nums[character];
            key = character;
            //if ( '+' === key ) key = 'plus';
        }
        key = modifiers.concat(key).join('+');
        if (!!key && HAS.call(view_shortcuts,key) && view_shortcuts[key])
        {
            callback = view_shortcuts[key]; ret = true;
            if (callback.substr)
            {
                // view action id given
                if (is_type(view['do_' + callback], T_FUNC))
                {
                    /*ret = */view['do_' + callback](evt, el, {});
                    ret = false;
                }
            }
            else
            {
                // actual function handler given
                ret = callback.call(view, evt, el, {});
            }
            if (false === ret)
            {
                // stop the event
                evt.stopPropagation && evt.stopPropagation();
                evt.stopImmediatePropagation && evt.stopImmediatePropagation();
                evt.preventDefault && evt.preventDefault();
                return false;
            }
        }
    }

    ,on_model_change: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.option('view.autobind'),
            livebind = view.option('view.livebind'),
            key, autobindSelector, bindSelector, triggerEl,
            bindElements, autoBindElements, notTriggerElem
        ;

        if (HASDOC && model && view.$dom)
        {
            // bypass element that triggered the "model:change" event
            if (data.$callData && data.$callData.triggerEl)
            {
                triggerEl = data.$callData.triggerEl;
                data.$callData = null;
                notTriggerElem = function(ele) {return ele !== triggerEl;};
            }

            // do actions ..
            if ((true !== livebind) && view.option('model.events'))
            {
                bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']';
                bindElements = $sel(bindSelector, view.$dom);
                if (notTriggerElem) bindElements = filter(bindElements, notTriggerElem);
                // do view action first
                if (bindElements.length) do_bind_action(view, evt, bindElements, data);
            }

            if (autobind && ((true !== livebind) || ((view.$dom !== view.$renderdom) && view.option('view.autobindAll'))))
            {
                key = model.id + bracketed(data.key);
                autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
                autoBindElements = $sel(autobindSelector, view.$dom);
                if (notTriggerElem) autoBindElements = filter(autoBindElements, notTriggerElem);
                // do autobind action to bind input elements that map to the model, afterwards
                if (autoBindElements.length) do_auto_bind_action(view, evt, autoBindElements, data);
            }

            // do view live DOM update action
            if (livebind) view.render();
        }
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.option('view.autobind'),
            livebind = view.option('view.livebind'),
            key, autobindSelector, bindSelector,
            bindElements, autoBindElements
        ;

        if (HASDOC && model && view.$dom)
        {
            if ((true !== livebind) && view.option('model.events'))
            {
                bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']';
                bindElements = $sel(bindSelector, view.$dom);
                // do view action first
                if (bindElements.length) do_bind_action(view, evt, bindElements, data);
            }

            if (autobind && ((true !== livebind) || ((view.$dom !== view.$renderdom) && view.option('view.autobindAll'))))
            {
                key = model.id + bracketed(data.key);
                autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
                autoBindElements = $sel(autobindSelector, view.$dom);
                if (autoBindElements.length) do_auto_bind_action(view, evt, autoBindElements, data);
            }

            // do view live DOM bindings update action
            if (livebind) view.render();
        }
    }

    //
    // view "do_action" methods
    //

    // NOP action
    //,do_nop: null

    // simulate link url change, through history api
    ,do_link: function(evt, el, data) {
        var view = this, path, withHash;

        if (HASDOC && el)
        {
            path = trim(el[ATTR](view.attr('mv-link')) || el[ATTR]('href'));
            if (path && path.length)
            {
                withHash = view.option('router.useHash');
                if ('/' !== path.charAt(0) && '#' !== path.charAt(0)) path = '/'+path;
                if (true === withHash && '#' !== path.charAt(0)) path = '#'+path;
                if (false === withHash && '#' === path.charAt(0)) path = path.slice(1);
                if ('/' !== path.charAt(0) && '#' !== path.charAt(0)) path = '/'+path;
                evt.preventDefault && evt.preventDefault();
                view.navigateTo(path);
            }
        }
    }

    // set element(s) html/text prop based on model key value
    ,do_html: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function() {
            var html = Str(model.get(key));
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                var val = el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML];
                if (val !== html) el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = html;
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // set element(s) css props based on model key value
    ,do_css: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var style = model.get(key);
            if (!is_type(style, T_OBJ)) return;
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                // css attributes
                for (var p in style)
                {
                    if (HAS.call(style, p))
                    {
                        if (el.style[p] != style[p])
                            el.style[p] = style[p];
                    }
                }
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // show/hide element(s) according to binding
    ,do_show: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function() {
            var modelkey = model.get(key);
            // show if data[key] is value, else hide
            // show if data[key] is true, else hide
            var enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) show(el);
                else hide(el);
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // hide/show element(s) according to binding
    ,do_hide: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function() {
            var modelkey = model.get(key);
            // hide if data[key] is value, else show
            // hide if data[key] is true, else show
            var enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) hide(el);
                else show(el);
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function(evt, el, data) {
        var view = this, name = data.name, key = data.key,
            input_type = (el[TYPE]||'').toLowerCase(),
            value, value_type, checked, checkboxes, is_dynamic_array
        ;

        // if should be updated via new live render, ignore
        if (true===view.option('view.livebind') && (view.$dom===view.$renderdom || is_child_of(el, view.$renderdom, view.$dom))) return;

        // use already computed/cached key/value from calling method passed in "data"
        //if (!key) return;
        value = data.value; value_type = get_type(value);

        if ('radio' === input_type)
        {
            if (Str(value) == el[VAL])
            {
                each($sel('input[name="'+name+'"]', view.$dom), function(ele) {
                    if (el !== ele) ele[CHECKED] = false;
                });
                checked = el[CHECKED];
                el[CHECKED] = true;
                if (checked !== el[CHECKED])
                    dispatchEvent(el, 'change', {trigger:view});
            }
        }

        else if ('checkbox' === input_type)
        {
            is_dynamic_array = empty_brackets_re.test(name);

            if (is_dynamic_array)
            {
                value = T_ARRAY === value_type ? value : [value];
                checked = el[CHECKED];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                if (checked !== el[CHECKED])
                    dispatchEvent(el, 'change', {trigger:view});
            }
            else if (/*checkboxes.length > 1 &&*/ (T_ARRAY === value_type))
            {
                checked = el[CHECKED];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                if (checked !== el[CHECKED])
                    dispatchEvent(el, 'change', {trigger:view});
            }

            else
            {
                checked = el[CHECKED];
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
                if (checked !== el[CHECKED])
                    dispatchEvent(el, 'change', {trigger:view});
            }
        }
        else
        {
            if (set_val(el, value))
                dispatchEvent(el, 'change', {trigger:view});
        }
    }

    ,toString: function( ) {
        return '[ModelView.View id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

// can integrate with HtmlWidget by setting the lib via this static property
View.HtmlWidget = null;

/**[DOC_MARKDOWN]
#### View.Component

```javascript
// **Note** that component instances are attached to each view separately, if used in another view, a new instance should be used!
var MyComponent = ModelView.View.Component(
    String name,
    String htmlTpl [,
    Object options = {
         attached: (componentInstance) => {} // component attached to DOM, for componentInstance see below
        ,detached: (componentInstance) => {} // component detached from DOM, for componentInstance see below
        ,changed: (oldProps, newProps, componentInstance) => false // whether component has changed given new props
        ,model: () => ({clicks:0}) // initial state model data, if state model is to be used, else null
        ,actions: {
            // custom component actions here, if any, eg referenced as <.. mv-evt mv-on-click=":click"></..>
            click: function(evt, el, data) {
                // update local clicks count and re-render
                this.model.set('clicks', this.model.get('clicks')+1, true);
            }
        }
}]);

```
[/DOC_MARKDOWN]**/
View.Component = function Component(name, tpl, opts) {
  var self = this;
  if (!is_instance(self, Component)) return new Component(name, tpl, opts);
  self.name = trim(name);
  self.tpl = trim(tpl);
  self.htpl = null;
  self.out = null;
  self.opts = opts || {};
};
View.Component[proto] = {
    constructor: View.Component
    ,name: ''
    ,opts: null
    ,tpl: ''
    ,htpl: null
    ,out: null
    ,dispose: function() {
        var self = this;
        self.opts = null;
        self.tpl = null;
        self.htpl = null;
        self.out = null;
        return self;
    }
};
/**[DOC_MARKDOWN]
#### View.Component.Instance

```javascript
MyComponentInstance {
    view // the main view this component instance is attached to
    model // component state model, if any, else null
    props // current component instance props
    dom // domElement this component instance is attached to
    data // property to attach user-defined data, if needed
}

```
[/DOC_MARKDOWN]**/
function MVComponentInstance(view, id, name, props, state, dom)
{
    var self = this;
    if (!is_instance(self, MVComponentInstance)) return new MVComponentInstance(view, id, name, props, state, dom);
    self.status = 0;
    self.id = id;
    self.name = name;
    self.props = props || null;
    self.model = state ? (is_instance(state, Model) ? state : new Model(self.name, state)) : null;
    self.view = view;
    self.dom = dom || null;
    self.data = {};
}
View.Component.Instance = MVComponentInstance;
MVComponentInstance[proto] = {
    constructor: MVComponentInstance
    ,status: 0
    ,id: null
    ,name: null
    ,props: null
    ,model: null
    ,view: null
    ,dom: null
    ,data: null
    ,dispose: function() {
        var self = this;
        self.status = 2;
        self.data = null;
        self.props = null;
        if (self.model) self.model.dispose();
        self.model = null;
        self.view = null;
        if (self.dom && self.dom[MV]) self.dom[MV].comp = null;
        self.dom = null;
        return self;
    }
};
