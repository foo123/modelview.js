
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

        iterate(function(i) {
            var el, do_action, name, key;
            el = elements[i]; if (!el) return;
            do_action = el[ATTR]('mv-on-'+event);
            if (!do_action) return;

            do_action = 'do_' + do_action;
            if (!is_type(view[do_action], T_FUNC)) return;

            view[do_action](evt, el);
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
    view.initPubSub();
};
// STATIC
View.node = find_node;
View.index = node_index;
View.indexClosest = node_closest_index;
View.getDomRef = get_dom_ref;
View.serialize = serialize_fields;
View.parse = function(str, args) {
    // supports 2 types of template separators 1. {% %} and 2. <script> </script>
    // both can be used simultaneously
    var tpl = Str(str), p1, p2, ps1, code = 'var _$$_ = \'\';', echo = 0;
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
    code += "\n"+'return _$$_;';
    return newFunc(Str(args||''), code);
};
// View implements PublishSubscribe pattern
View[proto] = Merge(Create(Obj[proto]), PublishSubscribe, {

    constructor: View

    ,id: null
    ,$dom: null
    ,$model: null
    ,$tpl: ''
    ,$out: null
    ,$livebind: true
    ,$autobind: true
    ,$shortcuts: null
    ,$num_shortcuts: null
    ,$components: null
    ,_dbnc: null

/**[DOC_MARKDOWN]
// dispose view (and model)
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function() {
        var view = this;
        view.unbind().disposePubSub();
        view.$dom = null;
        view.$model = null;
        view.$tpl = null;
        view.$out = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        view.$components = null;
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
                    view.$components[k] = components[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render a custom view named component
view.component( String componentName, Object props );

[/DOC_MARKDOWN]**/
    ,component: function(name, props) {
        var view = this;
        if (HAS.call(view.$components,name))
            return view.$components[name].render(props || {}, view);
        return '';
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
            view.$livebind = !!enable;
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
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom) {
        var view = this, model = view.$model,
            method, evt, namespaced, autobindSelector, bindSelector,
            autobind = view.$autobind, livebind = view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;

        view.$dom = dom || (hasDocument ? document.body : null);

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
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when bind on original button
                    // add "bubble" option in modelview bind params
                    var el = this, isAutoBind = false, isBind = false;
                    // view/dom change events
                    isBind = el[MATCHES]('[mv-evt]') && el[ATTR]('mv-on-'+evt.type);
                    // view change autobind events
                    isAutoBind = autobind && "change" == evt.type && el[MATCHES](autobindSelector);
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
        var self = this;
        if (!self.$out && self.$tpl) self.$out = View.parse(self.$tpl);
        if (self.$out)
        {
            if (!self.$dom)
            {
                return self.$out.call(self); // return the rendered string
            }
            else if (true === immediate)
            {
                morph(self.$dom, str2dom(self.$out.call(self)), self);
            }
            else
            {
                debounce(function() {
                    morph(self.$dom, str2dom(self.$out.call(self)), self);
                }, self);
            }
        }
        return self;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, hasDocument = 'undefined' !== typeof document;

        if (hasDocument && view.$dom)
        {
            view.render(true);
            if (view.$autobind && !view.$livebind) do_auto_bind_action(view, {type:'change'}, $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom), null);
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

        // update model and propagate to other elements of same view (via model publish hook)
        if (data.isAutoBind && !!(name=el[NAME]))
        {
            if (!el[namedKeyProp]) el[namedKeyProp] = model.key(name, 1);
            key = el[namedKeyProp];

            if (key /*&& model.has( key )*/)
            {
                input_type = el[TYPE].toLowerCase( );

                if ('checkbox' === input_type)
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

        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        input_type = 'TEXTAREA' === el.tagName ? 'text' : ('INPUT' === el.tagName ? el[TYPE].toLowerCase( ) : '');
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
            autobindSelector = 'input[name="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]',
            bindSelector = '[mv-evt]', bindElements, autoBindElements,
            hasDocument = 'undefined' !== typeof document,
            notTriggerElem
        ;

        if (hasDocument)
        {
            bindElements = $sel(bindSelector, view.$dom);
            if (autobind) autoBindElements = $sel(autobindSelector, view.$dom);

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
        //if (hasDocument && bindElements.length) do_bind_action(view, evt, bindElements, data);
        // do view autobind action to bind input elements that map to the model, afterwards
        if (hasDocument && !livebind && autobind && autoBindElements.length) do_auto_bind_action(view, evt, autoBindElements, data);
        // do view live DOM update action
        if (livebind) view.render();
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model, key = model.id + bracketed(data.key),
            autobind = view.$autobind, livebind = view.$livebind,
            autobindSelector = 'input[name="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]',
            bindSelector = '[mv-evt]',
            hasDocument = 'undefined' !== typeof document,
            bindElements, autoBindElement
        ;

        // do actions ..

        // do view bind action first
        //if (hasDocument && (bindElements=$sel(bindSelector, view.$dom)).length) do_bind_action(view, evt, bindElements, data);
        // do view autobind action to bind input elements that map to the model, afterwards
        if (hasDocument && !livebind && autobind && (autoBindElements=$sel(autobindSelector, view.$dom)).length) do_auto_bind_action(view, evt, autoBindElements, data);
        // do view live DOM bindings update action
        if (livebind) view.render();
    }

    // component lifecycle hooks
    ,$attachComponent: function(name, el) {
        var view = this;
        if (name && view.$components && HAS.call(view.$components,name)) view.$components[name].onAttach(el, view);
        return view;
    }
    ,$detachComponent: function(name, el) {
        var view = this;
        if (name && view.$components && HAS.call(view.$components,name)) view.$components[name].onDetach(el, view);
        return view;
    }

    //
    // view "do_action" methods
    //

    // NOP action
    ,do_nop: null

    // show/hide element(s) according to binding
    ,do_show: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-key') || data.key,
            modelkey, domref, enabled;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        modelkey = model.get(key);
        // show if data[key] is value, else hide
        // show if data[key] is true, else hide
        enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
        each(el, function(el){
            if (!el) return;
            if (enabled) show(el);
            else hide(el);
        });
    }

    // hide/show element(s) according to binding
    ,do_hide: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-key') || data.key,
            modelkey, domref, enabled;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        modelkey = model.get(key);
        // hide if data[key] is value, else show
        // hide if data[key] is true, else show
        enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
        each(el, function(el){
            if (!el) return;
            if (enabled) hide(el);
            else show(el);
        });
    }

    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function(evt, el, data) {
        var view = this, model = view.$model,
            name = data.name, key = data.key,
            input_type = el[TYPE].toLowerCase(),
            value, value_type, checkboxes, is_dynamic_array
        ;

        if (view.$livebind) return; // should be updated via new live render

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
                el[CHECKED] = true;
            }
        }

        else if ('checkbox' === input_type)
        {
            is_dynamic_array = empty_brackets_re.test( name );

            if (is_dynamic_array)
            {
                value = T_ARRAY === value_type ? value : [value];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
            }
            else if (/*checkboxes.length > 1 &&*/ (T_ARRAY === value_type))
            {
                el[CHECKED] = contains_non_strict(value, el[VAL]);
            }

            else
            {
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
            }
        }
        else
        {
            set_val(el, value);
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
        if (!self.renderer && self.tpl) self.renderer = View.parse(self.tpl, 'props');
        return self.renderer ? self.renderer.call(view || self, props || {}) : '';
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
