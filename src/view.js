
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
            do_action = el[ATTR](view.attr('mv-on-'+(fromModel ? 'model-' : '')+event));
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

    getCtxScoped = function(view, viewvar) {
        var k, code = '';
        viewvar = viewvar || 'this';
        for (k in view.$ctx)
        {
            if (HAS.call(view.$ctx,k))
                code += 'var '+k+'='+viewvar+'.$ctx["'+k+'"];'
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
    view.$ctx = {};
    view.$upds = [];
    view.$cache = {};
    view.$cache2 = {};
    view.$cnt = {};
    view.initPubSub();
};
// STATIC
View.serialize = serialize_fields;
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
    ,$ctx: null
    ,$upds: null
    ,$cache: null
    ,$cache2: null
    ,$cnt: null
    ,$prat: ''
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
        view.$ctx = null;
        view.$cache = null;
        view.$cache2 = null;
        view.$cnt = null;
        view.$upds = null;
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
// add custom view event handlers for model/view/dom/document targets in {"target:eventName": handler} format
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
                    view.$components[k] = components[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render a custom view named component
view.component( String componentName, uniqueComponentInstanceId || null, Object props );

[/DOC_MARKDOWN]**/
    ,component: function(name, id, props, childs) {
        var view = this, out, c, propsKey, prevProps, changed;
        if (name && HAS.call(view.$components, name))
        {
            c = view.$components[name];
            if (c.tpl && !c.out)
            {
                c.out = tpl2code(view, c.tpl, 'props,childs,', getCtxScoped(view, 'this'), true, {trim:true, id:view.attr('mv-id')}, '<mv-component>');
            }
            if (c.out)
            {
                if (!HAS.call(view.$cnt, name)) view.$cnt[name] = 0;
                view.$cnt[name]++;
                if ((arguments.length < 4) && is_type(id, T_OBJ))
                {
                    childs = props;
                    props = id;
                    id = null;
                }
                propsKey = null == id ? name+'_#'+Str(view.$cnt[name]) : name+'_id_'+Str(id);
                prevProps = view.$cache2[propsKey];
                if (prevProps && !prevProps[0] && !props) changed = false;
                else changed = true;
                if (prevProps && prevProps[0] && props && c.opts && c.opts.changed)
                    changed = c.opts.changed(prevProps[0], props, prevProps[1], view.$cnt[name]);
                view.$cache[propsKey] = [props, view.$cnt[name]];
                out = c.out.call(view, props, childs||[], htmlNode);
                out.changed = changed;
                out.component = name;
                return out;
            }
        }
        return '';
    }
    ,hasComponent: function(name) {
        return name && this.$components && HAS.call(this.$components, name);
    }

/**[DOC_MARKDOWN]
// can integrate with HtmlWidget
view.widget( ..args );

[/DOC_MARKDOWN]**/
    ,widget: function(/*args*/) {
        var HtmlWidget = View.HtmlWidget;
        return HtmlWidget && ("function" === typeof(HtmlWidget.widget)) ? this.html(HtmlWidget.widget.apply(HtmlWidget, arguments)) : '';
    }

/**[DOC_MARKDOWN]
// dynamically parse html string to html virtual dom at run-time
view.html( String htmlString );

[/DOC_MARKDOWN]**/
    ,html: function(str) {
        return parse(this, str, {trim:true, id:this.attr('mv-id')}, 'dyn');
    }
/**[DOC_MARKDOWN]
// mark html virtual node(s) to be morphed/replaced as a single unit, instead of recursively morphed piece by piece
view.unit( nodes );

[/DOC_MARKDOWN]**/
    ,unit: function(nodes) {
        return as_unit(nodes);
    }

/**[DOC_MARKDOWN]
// get / set custom prefix for ModelView specific attributes, eg 'data-', so [mv-evt] becomes [data-mv-evt] and so on..
view.attribute( [String prefix] );

[/DOC_MARKDOWN]**/
    ,attribute: function(prefix) {
        if (arguments.length)
        {
            this.$prat = trim(prefix);
            return this;
        }
        return this.$prat;
    }

    ,attr: function(attr) {
        return this.$prat + Str(attr);
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
view.livebind( [type=true|false|'text'] );

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
// bind view to dom listening given DOM events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom, renderdom) {
        var view = this, model = view.$model,
            method, evt, namespaced, autobindSelector, bindSelector,
            autobind = view.$autobind, livebind = view.$livebind
        ;

        view.$dom = dom || (HASDOC ? document.body : null);
        view.$renderdom = renderdom || view.$dom;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};

        // default view/dom binding events
        events = events || ['change', 'click'];
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '['+view.attr('mv-evt')+']';

        if (HASDOC && view.$dom && view.on_view_change && events.length)
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
                    isBind = el[MATCHES]('['+view.attr('mv-evt')+']') && el[ATTR](view.attr('mv-on-'+evt.type));
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

            if (view.$dom && startsWith(method, 'on_model_'))
            {
                evt = method.slice(9);
                evt.length && view.onTo(model, evt, bindF(view[method], view));
            }
            else if (HASDOC)
            {
                if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && DOMEvent(document.body).on(
                        namespaced(evt),
                        viewHandler(view, method)
                    );
                }
                else if (view.$dom && startsWith(method, 'on_view_') && 'on_view_change' !== method)
                {
                    evt = method.slice(8);
                    evt.length && DOMEvent(view.$dom).on(
                        namespaced(evt),
                        autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,
                        viewHandler(view, method),
                        true
                    );
                }
                else if (view.$dom && startsWith(method, 'on_dom_'))
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
// unbind view from underlying dom
view.unbind( );

[/DOC_MARKDOWN]**/
    ,unbind: function() {
        var view = this, model = view.$model,
            autobindSelector, bindSelector,
            namespaced, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind
        ;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '['+view.attr('mv-evt')+']';

        // view/dom change events
        if (HASDOC && view.$dom && view.on_view_change)
        {
            DOMEvent(view.$dom).off(
                viewEvent,
                autobind ? [autobindSelector, bindSelector].join( ',' ) : bindSelector
            );
        }

        // model events
        if (model) view.offFrom(model);
        if (HASDOC && view.$dom)
        {
            DOMEvent(view.$dom).off(viewEvent);
            DOMEvent(document.body).off(viewEvent);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render view on actual DOM (immediately or deferred)
// .render is also called internally by view auto-update methods
view.render( [Boolean immediate=false] );

[/DOC_MARKDOWN]**/
    ,render: function(immediate) {
        var self = this, out = '', callback;
        if (!self.$out && self.$tpl) self.$out = tpl2code(self, self.$tpl, '', getCtxScoped(self, 'this'), self.$livebind, {trim:true, id:self.attr('mv-id')});
        if ('text' === self.$livebind)
        {
            if (!self.$renderdom)
            {
                self.$upds = [];
                if (self.$out) out = self.$out.call(self, function(key){return Str(self.$model.get(key));}); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            else
            {
                if (!self.$map)
                {
                    if (self.$out) self.$renderdom.innerHTML = self.$out.call(self, function(key){return '{'+Str(key)+'}';});
                    self.updateMap(self.$renderdom, 'add');
                }
                callback = function() {
                    var upds = self.$upds;
                    self.$upds = [];
                    morphText(self.$map, self.model(), 'sync' === immediate ? null : upds);
                    // notify any 3rd-party also if needed
                    self.publish('render', {});
                };
                if (true === immediate || 'sync' === immediate)
                {
                    callback();
                }
                else
                {
                    debounce(callback, self);
                }
            }
        }
        else if (self.$out)
        {
            if (!self.$renderdom)
            {
                self.$upds = []; self.$cache2 = {}; self.$cache = {}; self.$cnt = {};
                var out = to_string(self.$out.call(self, htmlNode)); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            callback = function() {
                self.$upds = []; self.$cache2 = self.$cache; self.$cache = {}; self.$cnt = {};
                morph(self.$renderdom, self.$out.call(self, htmlNode));
                // notify any 3rd-party also if needed
                self.publish('render', {});
            };
            if (true === immediate || 'sync' === immediate)
            {
                callback();
            }
            else
            {
                debounce(callback, self);
            }
        }
        else
        {
            self.$upds = [];
        }
        return self;
    }

/**[DOC_MARKDOWN]
// directly add node at index position of parentNode (this method is compatible with general morphing routines)
view.addNode( parentNode, nodeToAdd, atIndex );

[/DOC_MARKDOWN]**/
    ,addNode: function(el, node, index, isStatic) {
        if (el && node)
            add_nodes(el, [node], index, true===isStatic);
        return this;
    }
/**[DOC_MARKDOWN]
// directly move node at index position of same parentNode (this method is compatible with general morphing routines)
view.moveNode( parentNode, nodeToMove, atIndex );

[/DOC_MARKDOWN]**/
    ,moveNode: function(el, node, index) {
        if (el && node)
            add_nodes(el, [node], index, true);
        return this;
    }
/**[DOC_MARKDOWN]
// directly remove node (this method is compatible with general morphing routines)
view.removeNode( nodeToRemove );

[/DOC_MARKDOWN]**/
    ,removeNode: function(node) {
        if (node && node.parentNode)
            remove_nodes(node.parentNode, 1, AP.indexOf.call(node.parentNode.childNodes, node));
        return this;
    }

/**[DOC_MARKDOWN]
// update internal key maps for dynamically added or to-be-removed node, when using text-only livebind
view.updateMap( node, action='add'|'remove' );

[/DOC_MARKDOWN]**/
    ,updateMap: function(node, action) {
        var view = this;
        if (view.$dom && node && ('text' === view.$livebind))
        {
            if ('add' === action)
            {
                if (!view.$map) view.$map = {att:{}, txt:{}};
                get_placeholders(node, view.$map);
            }
            else if (('remove' === action) && view.$map)
            {
                del_map(view.$map.txt, function(v){
                    v.reduce(function(rem, t, i){
                        if (is_child_of(t, node, view.$dom)) rem.push(i);
                        return rem;
                    }, [])
                    .reverse()
                    .forEach(function(i){
                        v.splice(i, 1);
                    });
                });
                del_map(view.$map.att, function(v){
                    v.reduce(function(rem, a, i){
                        if (is_child_of(a.node, node, view.$dom)) rem.push(i);
                        return rem;
                    }, [])
                    .reverse()
                    .forEach(function(i){
                        v.splice(i, 1);
                    });
                });
            }
        }
        return node;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, els;

        if (HASDOC && view.$dom)
        {
            view.render('sync');
            if (true !== view.$livebind) do_bind_action(view, {type:'sync'}, $sel('['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']', view.$dom), {});
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
            autobind = view.$autobind, autobinds
        ;

        if (HASDOC && view.$dom && autobind)
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
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = view.$livebind,
            key, autobindSelector, bindSelector,
            bindElements = [], autoBindElements = [], notTriggerElem
        ;

        if (HASDOC && view.$dom)
        {
            key = model.id + bracketed(data.key);
            autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
            bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']';

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
            // do actions ..

            // do view action first
            if (bindElements.length)
            {
                do_bind_action(view, evt, bindElements, data);
            }
            // do view autobind action to bind input elements that map to the model, afterwards
            if (autobind && autoBindElements.length)
            {
                //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
                do_auto_bind_action(view, evt, autoBindElements, data);
            }
            // do view live DOM update action
            if (livebind)
            {
                if (-1 === view.$upds.indexOf(data.key)) view.$upds.push(data.key);
                view.render();
            }
        }
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = view.$livebind,
            key, autobindSelector, bindSelector,
            bindElements, autoBindElements
        ;

        if (HASDOC && view.$dom)
        {
            key = model.id + bracketed(data.key);
            autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
            bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-error')+']';
            // do actions ..

            // do view bind action first
            if ((true !== livebind) && (bindElements=$sel(bindSelector, view.$dom)).length)
            {
                do_bind_action(view, evt, bindElements, data);
            }
            // do view autobind action to bind input elements that map to the model, afterwards
            if (autobind && (true !== livebind || view.$dom !== view.$renderdom))
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
    }

    //
    // view "do_action" methods
    //

    // NOP action
    ,do_nop: null

    // set element(s) html/text prop based on model key value
    ,do_html: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
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
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
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
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
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
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
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
// **Note** that component instances are attached to each view separately, if used in another view, a new instance should be used!
var MyComponent = new ModelView.View.Component(String name, String htmlTpl [, Object options={changed:function(oldProps,newProps){return true}}]);
MyComponent.dispose(); // dispose

```
[/DOC_MARKDOWN]**/
View.Component = function Component(name, tpl, opts) {
  var self = this;
  if (!(self instanceof Component)) return new Component(name, tpl, opts);
  self.name = trim(name);
  self.tpl = trim(tpl);
  self.out = null;
  self.opts = opts || {};
};
View.Component[proto] = {
    constructor: View.Component
    ,name: ''
    ,opts: null
    ,tpl: ''
    ,out: null

    ,dispose: function() {
        var self = this;
        self.opts = null;
        self.tpl = null;
        self.out = null;
        return self;
    }
};
// can integrate with HtmlWidget by setting the lib via this static property
View.HtmlWidget = null;
