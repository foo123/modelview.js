
// View utils
var namedKeyProp = "mv_namedkey",

    contains_non_strict = function(collection, value) {
        if (collection)
        {
            for (var i=0,l=collection.length; i<l; i++)
                if (value == Str(collection[i])) return true;
        }
        return false;
    },

    numeric_re = /^\d+$/,
    empty_brackets_re = /\[\s*\]$/,

    fields2model = function(view, elements) {
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
            if (startsWith(key, model_prefix)) key = key.slice(model_prefix.length);

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
    },

    serialize_fields = function(node, name_prefix) {
        var data = { },
            model_prefix = name_prefix&&name_prefix.length ? name_prefix + '.' : null,
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
    },

    do_bind_action = function(view, evt, elements, fromModel) {
        var model = view.$model, event = evt.type;

        if ('sync' === event) event = 'change';
        iterate(function(i) {
            var el, do_action, name, key, data = {};
            el = elements[i]; if (!el) return;
            do_action = el[ATTR]('mv-on-'+(fromModel ? 'model-' : '')+event);
            if (!do_action) return;
            if ('text' === do_action)
            {
                do_action = 'html';
                data.text = true;
            }

            do_action = 'do_' + do_action;
            if (!is_type(view[do_action], T_FUNC)) return;

            view[do_action](evt, el, data);
        }, 0, elements.length-1);
    },

    do_auto_bind_action = function(view, evt, elements, fromModel) {
        var model = view.$model, cached = { };

        iterate(function(i) {
            var el, name, key, ns_key, value;
            el = elements[i];  if (!el) return;
            name = el[NAME]; key = 0;
            if (!el[namedKeyProp] && !!name) el[namedKeyProp] = model.key(name, 1);
            key = el[namedKeyProp]; if (!key) return;

            // use already cached key/value
            ns_key = '_'+key;
            if (HAS.call(cached, ns_key))  value = cached[ ns_key ][ 0 ];
            else if (model.has(key)) cached[ ns_key ] = [ value=model.get( key ) ];
            else return;  // nothing to do here

            // call default action (ie: live update)
            view.do_bind(evt, el, {name:name, key:key, value:value});
        }, 0, elements.length-1);
    },

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

    viewHandler = function(view, method) {
        return function(evt){return view[method](evt, {el:this});};
    },

    getFuncsScoped = function(view, viewvar) {
        var code = '';
        viewvar = viewvar || 'view';
        for (var k in view.$funcs)
        {
            if (HAS.call(view.$funcs,k))
                code += 'var '+k+'='+viewvar+'.$funcs["'+k+'"];'
        }
        return code;
    }
;

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
    if (!(view instanceof View)) return new View(id);

    view.namespace = view.id = id || uuid('View');
    view.$shortcuts = {};
    view.$num_shortcuts = 0;
    view.$components = {};
    view.$funcs = {};
    view.initPubSub();
};
// STATIC
View.node = find_node;
View.index = node_index;
View.indexClosest = node_closest_index;
View.getDomRef = get_dom_ref;
View.serialize = serialize_fields;
View.parse = function(str, args, scoped, textOnly) {
    // supports 2 types of template separators 1. {% %} and 2. <script> </script>
    // both can be used simultaneously
    var tpl = Str(str), p1, p2, ps1, code = 'var view = this, _$$_ = \'\';', echo = 0;
    if (scoped && scoped.length) code += "\n" + String(scoped);
    if (true === textOnly)
    {
        args = 'MODEL';
        code += "\n MODEL = MODEL || function(key){return '{%='+String(key)+'%}';};";
        while (tpl && tpl.length)
        {
            p1 = tpl.indexOf('{%=');
            if (-1 === p1)
            {
                code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                break;
            }
            p2 = tpl.indexOf('%}', p1+3);
            if (-1 === p2)
            {
                code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                break;
            }
            code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
            code += "\n"+'_$$_ += String(MODEL(\''+trim(tpl.slice(p1+3, p2))+'\'));';
            tpl = tpl.slice(p2+2);
        }
    }
    else
    {
        while (tpl && tpl.length)
        {
            p1 = tpl.indexOf('<script>');
            ps1 = tpl.indexOf('{%');
            if (-1 === p1 && -1 === ps1)
            {
                code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                break;
            }
            else if (-1 !== ps1 && (-1 === p1 || ps1 < p1))
            {
                echo = '=' === tpl.charAt(ps1+2) ? 1 : 0;
                p2 = tpl.indexOf('%}', ps1+2+echo);
                if (-1 === p2)
                {
                    if (-1 === p1)
                    {
                        code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                        break;
                    }
                    else
                    {
                        code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                        tpl = tpl.slice(p1);
                        continue;
                    }
                }
                code += "\n"+'_$$_ += \''+tpl.slice(0, ps1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                if (echo)
                {
                    code += "\n"+'_$$_ += String('+trim(tpl.slice(ps1+3, p2))+');';
                }
                else
                {
                    code += "\n"+trim(tpl.slice(ps1+2, p2));
                }
                tpl = tpl.slice(p2+2);
            }
            else
            {
                echo = '=' === tpl.charAt(p1+8) ? 1 : 0;
                p2 = tpl.indexOf('</script>', p1+8+echo);
                if (-1 === p2)
                {
                    code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                    break;
                }

                code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                if (echo)
                {
                    code += "\n"+'_$$_ += String('+trim(tpl.slice(p1+9, p2))+');';
                }
                else
                {
                    code += "\n"+trim(tpl.slice(p1+8, p2));
                }
                tpl = tpl.slice(p2+9);
            }
        }
    }
    code += "\n"+'return _$$_;';
    return newFunc(Str(args||''), code);
};
// View implements PublishSubscribe pattern
View[proto] = Merge(Create(Obj[proto]), PublishSubscribe, {

    constructor: View

    ,id: null
    ,$dom: null
    ,$renderdom: null
    ,$model: null
    ,$tpl: ''
    ,$out: null
    ,$map: null
    ,$livebind: true
    ,$autobind: true
    ,$shortcuts: null
    ,$num_shortcuts: null
    ,$components: null
    ,$funcs: null
    ,_dbnc: null

/**[DOC_MARKDOWN]
// dispose view
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function() {
        var view = this;
        view.unbind().disposePubSub();
        view.$dom = null;
        view.$renderdom = null;
        view.$model = null;
        view.$tpl = null;
        view.$out = null;
        view.$map = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        view.$components = null;
        view.$funcs = null;
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
            view.$model = model.view(view);
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
            view.$tpl = trim(Str(html));
            view.$out = null;
            return view;
        }
        return view.$tpl;
    }

/**[DOC_MARKDOWN]
// add custom view event handlers for model/view/dom/document in {"target:eventName": handler} format
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
                    for (i=keys.length-1; i>=0; i--)
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
// add custom view named components which render output in {componentName: componentInstance} format
view.components( Object components );

[/DOC_MARKDOWN]**/
    ,components: function(components) {
        var view = this, k;
        if (is_type(components, T_OBJ))
        {
            for (k in components)
                if (HAS.call(components,k) && is_instance(components[k], View.Component))
                    view.$components[k] = {c:components[k], o:null};
        }
        return view;
    }

/**[DOC_MARKDOWN]
// register custom view functions (which can be used in templates) in {funcName: function} format
view.funcs( Object funcs );

[/DOC_MARKDOWN]**/
    ,funcs: function(funcs) {
        var view = this, k;
        if (is_type(funcs, T_OBJ))
        {
            for (k in funcs)
                if (HAS.call(funcs,k) && ('function' === typeof(funcs[k])))
                    view.$funcs[k] = funcs[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render a custom view named component
view.component( String componentName, Object props );

[/DOC_MARKDOWN]**/
    ,component: function(name, props) {
        var view = this, c;
        if (HAS.call(view.$components,name))
        {
            c = view.$components[name];
            if (!c.o && c.c.tpl) c.o = View.parse(c.c.tpl, 'props,component', getFuncsScoped(view, 'this'));
            return c.o ? c.o.call(view, props || {}, c.c) : '';
        }
        return '';
    }

    // can integrate with HtmlWidget
    ,widget: function(/*args*/) {
        var HtmlWidget = View.HtmlWidget;
        return HtmlWidget && ("function" === typeof(HtmlWidget.widget)) ? HtmlWidget.widget.apply(HtmlWidget, arguments) : '';
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
view.livebind( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,livebind: function(enable) {
        var view = this;
        if (arguments.length)
        {
            view.$livebind = 'text' === enable ? 'text' : !!enable;
            return view;
        }
        return view.$livebind;
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
            view.$autobind = !!enable;
            return view;
        }
        return view.$autobind;
    }

/**[DOC_MARKDOWN]
// bind view to dom listening given events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom, renderdom) {
        var view = this, model = view.$model,
            method, evt, namespaced, autobindSelector, bindSelector,
            autobind = view.$autobind, livebind = view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;

        view.$dom = dom || (hasDocument ? document.body : null);
        view.$renderdom = renderdom || view.$dom;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};

        // default view/dom binding events
        events = events || ['change', 'click'];
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '[mv-evt]';

        if (hasDocument && view.on_view_change && events.length)
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent(view.$dom).on(
                map(events, namespaced).join(' '),

                autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,

                function(evt) {
                    // event triggered by view itself, ignore
                    if (evt.data && (view === evt.data.trigger)) return;
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when bind on original button
                    // add "bubble" option in modelview bind params
                    var el = this, isAutoBind = false, isBind = false;
                    // view/dom change events
                    isBind = el[MATCHES]('[mv-evt]') && el[ATTR]('mv-on-'+evt.type);
                    // view change autobind events
                    isAutoBind = autobind && ("change" == evt.type) && el[MATCHES](autobindSelector);
                    if (isBind || isAutoBind) view.on_view_change(evt, {el:el, isBind:isBind, isAutoBind:isAutoBind});
                    return true;
                },

                true
            );
        }

        // bind model/view/dom/document (custom) event handlers
        for (method in view)
        {
            if (!is_type(view[method], T_FUNC)) continue;

            if (startsWith(method, 'on_model_'))
            {
                evt = method.slice(9);
                evt.length && view.onTo(model, evt, bindF(view[method], view));
            }
            else if (hasDocument)
            {
                if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && DOMEvent(document.body).on(
                        namespaced(evt),
                        viewHandler(view, method)
                    );
                }
                else if (startsWith(method, 'on_view_') && 'on_view_change' !== method)
                {
                    evt = method.slice(8);
                    evt.length && DOMEvent(view.$dom).on(
                        namespaced(evt),
                        autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,
                        viewHandler(view, method),
                        true
                    );
                }
                else if (startsWith(method, 'on_dom_'))
                {
                    evt = method.slice(7);
                    evt.length && DOMEvent(view.$dom).on(
                        namespaced(evt),
                        viewHandler(view, method)
                    );
                }
            }
        }

        return view;
    }

/**[DOC_MARKDOWN]
// unbind view from dom listening to events or all events (if no events given)
view.unbind( [Array events=null, DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,unbind: function() {
        var view = this, model = view.$model,
            autobindSelector, bindSelector,
            namespaced, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '[mv-evt]';

        // view/dom change events
        if (hasDocument && view.$dom && view.on_view_change)
        {
            DOMEvent(view.$dom).off(
                viewEvent,
                autobind ? [autobindSelector, bindSelector].join( ',' ) : bindSelector
            );
        }

        // model events
        if (model) view.offFrom(model);
        if (hasDocument && view.$dom)
        {
            DOMEvent(view.$dom).off(viewEvent);
            DOMEvent(document.body).off(viewEvent);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render view on actual DOM (immediately or deferred)
// .render is called internally by view auto-update methods
view.render( [Boolean immediate=false] );

[/DOC_MARKDOWN]**/
    ,render: function(immediate) {
        var self = this, out;
        if (!self.$out && self.$tpl) self.$out = View.parse(self.$tpl, '', getFuncsScoped(self, 'this'), 'text'===self.$livebind);
        if ('text' === self.$livebind)
        {
            if (!self.$renderdom)
            {
                out = self.$out.call(self, function(key){return Str(self.model().get(key));}); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            else
            {
                if (!self.$map)
                {
                    if (self.$out) self.$renderdom.innerHTML = self.$out.call(self, function(key){return '{%=' + Str(key) + '%}';});
                    self.add(self.$renderdom);
                }
                if (true === immediate)
                {
                    morphText(self.$map, self.model());
                    // notify any 3rd-party also if needed
                    self.publish('render', {});
                }
                else
                {
                    debounce(function() {
                        morphText(self.$map, self.model());
                        // notify any 3rd-party also if needed
                        self.publish('render', {});
                    }, self);
                }
            }
        }
        else if (self.$out)
        {
            if (!self.$renderdom)
            {
                out = self.$out.call(self); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            else if (true === immediate)
            {
                morph(self.$renderdom, str2dom(self.$out.call(self), true), Keys(self.$components||{}).filter(function(comp){return self.$components[comp].c.opts.attach || self.$components[comp].c.opts.detach;}).length ? self : null);
                // notify any 3rd-party also if needed
                self.publish('render', {});
            }
            else
            {
                debounce(function() {
                    morph(self.$renderdom, str2dom(self.$out.call(self), true), Keys(self.$components||{}).filter(function(comp){return self.$components[comp].c.opts.attach || self.$components[comp].c.opts.detach;}).length ? self : null);
                    // notify any 3rd-party also if needed
                    self.publish('render', {});
                }, self);
            }
        }
        return self;
    }

    ,add: function(node) {
        var view = this;
        if (node)
        {
            if (!view.$map) view.$map = {att:{}, txt:{}};
            get_placeholders(node, view.$map);
        }
        return node;
    }

    ,remove: function(node) {
        var view = this, map = view.$map;
        if (node && map)
        {
            Keys(map.att).forEach(function(k){
                var rem = [];
                map.att[k].forEach(function(a, i){if (is_child_of(a.node, node, view.$dom)) rem.push(i);});
                rem.reverse().forEach(function(i){map.att[k].splice(i, 1);});
                if (!map.att[k].length) delete map.att[k];
            });
            Keys(map.txt).forEach(function(k){
                var rem = [];
                map.txt[k].forEach(function(t, i){if (is_child_of(t, node, view.$dom)) rem.push(i);});
                rem.reverse().forEach(function(i){map.txt[k].splice(i, 1);});
                if (!map.txt[k].length) delete map.txt[k];
            });
        }
        return node;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, hasDocument = 'undefined' !== typeof document, els;

        if (hasDocument && view.$dom)
        {
            view.render(true);
            if (true !== view.$livebind) do_bind_action(view, {type:'sync'}, $sel('[mv-model-evt][mv-on-model-change]', view.$dom), {});
            if (view.$autobind && (true !== view.$livebind || view.$dom !== view.$renderdom))
            {
                els = $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom);
                //if (view.$livebind) els = els.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
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
            autobind = view.$autobind,
            autobinds, hasDocument = 'undefined' !== typeof document
        ;

        if (hasDocument && view.$dom && autobind)
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
            modeldata = { }
        ;

        // evt triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;

        // update model and propagate to other elements of same view (via model publish hook)
        if (data.isAutoBind && !!(name=el[NAME]))
        {
            if (!el[namedKeyProp]) el[namedKeyProp] = model.key(name, 1);
            key = el[namedKeyProp];

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

                modeldata.$trigger = el;
                model.set(key, val, 1, modeldata);
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
        if (!view.$num_shortcuts || 'text' === input_type || 'email' === input_type || 'url' === input_type || 'number' === input_type) return;

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
                evt.stopPropagation();
                evt.preventDefault();
                return false;
            }
        }
    }

    ,on_model_change: function(evt, data) {
        var view = this, model = view.$model, key = model.id + bracketed(data.key),
            autobind = view.$autobind, livebind = view.$livebind,
            autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]',
            bindSelector = '[mv-model-evt][mv-on-model-change]', bindElements = [], autoBindElements = [],
            hasDocument = 'undefined' !== typeof document,
            notTriggerElem
        ;

        if (hasDocument)
        {
            bindElements = true !== livebind ? $sel(bindSelector, view.$dom) : [];
            if (autobind) autoBindElements = (true !== livebind || view.$dom !== view.$renderdom) ? $sel(autobindSelector, view.$dom) : [];

            // bypass element that triggered the "model:change" event
            if (data.$callData && data.$callData.$trigger)
            {
                notTriggerElem = function(ele) {return ele !== data.$callData.$trigger;};
                bindElements = filter(bindElements, notTriggerElem);
                if (autobind) autoBindElements = filter(autoBindElements, notTriggerElem);
                data.$callData = null;
            }
        }

        // do actions ..

        // do view action first
        if (hasDocument && bindElements.length)
        {
            do_bind_action(view, evt, bindElements, data);
        }
        // do view autobind action to bind input elements that map to the model, afterwards
        if (hasDocument && autobind && autoBindElements.length)
        {
            //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
            do_auto_bind_action(view, evt, autoBindElements, data);
        }
        // do view live DOM update action
        if (livebind)
        {
            view.render();
        }
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model, key = model.id + bracketed(data.key),
            autobind = view.$autobind, livebind = view.$livebind,
            autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]',
            bindSelector = '[mv-model-evt][mv-on-model-error]',
            hasDocument = 'undefined' !== typeof document,
            bindElements, autoBindElements
        ;

        // do actions ..

        // do view bind action first
        if (hasDocument && (true !== livebind) && (bindElements=$sel(bindSelector, view.$dom)).length)
        {
            do_bind_action(view, evt, bindElements, data);
        }
        // do view autobind action to bind input elements that map to the model, afterwards
        if (hasDocument && autobind && (true !== livebind || view.$dom !== view.$renderdom))
        {
            autoBindElements = $sel(autobindSelector, view.$dom);
            //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
            do_auto_bind_action(view, evt, autoBindElements, data);
        }
        // do view live DOM bindings update action
        if (livebind)
        {
            view.render();
        }
    }

    // component lifecycle hooks
    ,$attachComponent: function(name, el) {
        var view = this;
        if (name && view.$components && HAS.call(view.$components,name)) view.$components[name].c.onAttach(el, view);
        return view;
    }
    ,$detachComponent: function(name, el) {
        var view = this;
        if (name && view.$components && HAS.call(view.$components,name)) view.$components[name].c.onDetach(el, view);
        return view;
    }

    //
    // view "do_action" methods
    //

    // NOP action
    ,do_nop: null

    // set element(s) html/text prop based on model key value
    ,do_html: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-model') || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var html = Str(model.get(key));
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                var val = el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML];
                if (val !== html) el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = html;
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // set element(s) css props based on model key value
    ,do_css: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-model') || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var style = model.get(key);
            if (!is_type(style, T_OBJ)) return;
            each(el, function(el){
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
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // show/hide element(s) according to binding
    ,do_show: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-model') || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var modelkey = model.get(key);
            // show if data[key] is value, else hide
            // show if data[key] is true, else hide
            var enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) show(el);
                else hide(el);
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // hide/show element(s) according to binding
    ,do_hide: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-model') || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var modelkey = model.get(key);
            // hide if data[key] is value, else show
            // hide if data[key] is true, else show
            var enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) hide(el);
                else show(el);
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function(evt, el, data) {
        var view = this, model = view.$model, trigger = DOMEvent.Dispatch,
            name = data.name, key = data.key,
            input_type = (el[TYPE]||'').toLowerCase(),
            value, value_type, checked, checkboxes, is_dynamic_array
        ;

        // if should be updated via new live render, ignore
        if (true===view.$livebind && (view.$dom===view.$renderdom || is_child_of(el, view.$renderdom, view.$dom))) return;

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
                    trigger('change', el, {trigger:view});
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
                    trigger('change', el, {trigger:view});
            }
            else if (/*checkboxes.length > 1 &&*/ (T_ARRAY === value_type))
            {
                checked = el[CHECKED];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                if (checked !== el[CHECKED])
                    trigger('change', el, {trigger:view});
            }

            else
            {
                checked = el[CHECKED];
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
                if (checked !== el[CHECKED])
                    trigger('change', el, {trigger:view});
            }
        }
        else
        {
            if (set_val(el, value))
                trigger('change', el, {trigger:view});
        }
    }

    ,toString: function( ) {
        return '[ModelView.View id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
#### View.Component

```javascript

var MyComponent = new ModelView.View.Component(String html [, Object options={attach:function(element, view), detach:function(element, view)}]);
MyComponent.render(Object props={} [, View view=null]); // render
MyComponent.dispose(); // dispose

```
[/DOC_MARKDOWN]**/
View.Component = function Component(tpl, opts) {
  var self = this;
  if (!(self instanceof Component)) return new Component(tpl, opts);
  self.tpl = trim(Str(tpl));
  self.opts = opts || {};
};
View.Component[proto] = {
    constructor: View.Component
    ,tpl: ''
    ,opts: null
    ,model: null
    ,renderer: null
    ,dispose: function() {
        var self = this;
        self.tpl = null;
        self.opts = null;
        self.renderer = null;
        return self;
    }
    ,render: function(props, view) {
        var self = this;
        if (!self.renderer && self.tpl) self.renderer = View.parse(self.tpl, 'props,component', getFuncsScoped(view, 'this'));
        return self.renderer ? self.renderer.call(view || self, props || {}, self) : '';
    }
    // component lifecycle hooks
    ,onAttach: function(el, view) {
        var self = this;
        if (self.opts && is_type(self.opts.attach, T_FUNC)) self.opts.attach.call(self, el, view);
        return self;
    }
    ,onDetach: function(el, view) {
        var self = this;
        if (self.opts && is_type(self.opts.detach, T_FUNC)) self.opts.detach.call(self, el, view);
        return self;
    }
};
// can integrate with HtmlWidget by setting the lib via this static property
View.HtmlWidget = null;
