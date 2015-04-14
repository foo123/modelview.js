
// View utils
var
    getInlineTplRE = function( InlineTplFormat, modelID ) {
        return new Regex(
            esc_re( InlineTplFormat )
            .replace('__MODEL__', esc_re( modelID || ''))
            .replace('__KEY__', '(\\S+?)')
        ,'');
    },
    
    getSelectors = function( bind, livebind, autobind ) {
        return [
            bind ? '[' + bind + ']' : null,
            
            livebind 
            ? (livebind[1] ? '[' + livebind[0] + '*="|'+livebind[1]+'"]' : '[' + livebind[0] + ']')
            : null,
            
            autobind 
            ? (autobind[1] 
                /* exact */ ? 'input[name="' + autobind[0] + '"],textarea[name="' + autobind[0] + '"],select[name="' + autobind[0] + '"]'
                /* prefix */ : 'input[name^="' + autobind[0] + '"],textarea[name^="' + autobind[0] + '"],select[name^="' + autobind[0] + '"]'
            ) 
            : null
        ];
    },
    
    getBindData = function( event, bind ) {
        if ( bind && bind[ event ] )
        {
            if ( is_type(bind[ event ], T_STR) ) bind[ event ] = { action: bind[ event ] };
            return bind[ event ];
        }
    },
    
    doBindAction = function( view, elements, evt, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, 
            event = isSync ? 'change' : evt.type, i, l = elements.length,
            modelkey = fromModel && fromModel.key ? fromModel.key : null,
            notmodelkey = !modelkey,
            modelkeyDot = modelkey ? (modelkey+'.') : null,
            el, bind, do_action, name, key, 
            isAtom = model.atomic, atom = model.$atom,
            atomDot = isAtom ? (atom+'.') : null
        ;
            
        for (i=0; i<l; i++)
        {
            el = elements[i]; if ( !el ) continue;
            bind = getBindData( event, view.attr(el, 'bind') );
            // during sync, dont do any actions based on (other) events
            if ( !bind || !bind[HAS]("action") ) continue;
            
            do_action = 'do_' + bind.action;
            if ( !is_type( view[ do_action ], T_FUNC ) ) continue;
            
            name = el[NAME]; key = bind.key;
            if ( !key )
            {
                if  ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key(name, 1);
                key = el[namedKeyProp];
            }
            // "model:change" event and element does not reference the (nested) model key
            // OR model atomic operation(s)
            if ( (isAtom && key && ((atom === key) || startsWith( key, atomDot ))) || (modelkey && !key) ) continue;
            
            if ( notmodelkey || key === modelkey || startsWith( key, modelkeyDot ) )
                view[ do_action ]( evt, el, bind );
        }
    },
    
    doAutoBindAction = function( view, elements, evt, fromModel ) {
        var model = view.$model, cached = { }, i, l = elements.length,
            el, name, key, ns_key, value
        ;
        
        for (i=0; i<l; i++)
        {
            el = elements[i];  if ( !el ) continue;
            name = el[NAME]; key = 0;
            if ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp]; if ( !key ) continue;
            
            // use already cached key/value
            ns_key = '_'+key;
            if ( cached[HAS]( ns_key ) )  value = cached[ ns_key ][ 0 ];
            else if ( model.has( key ) ) cached[ ns_key ] = [ value=model.get( key ) ];
            else continue;  // nothing to do here
            
            // call default action (ie: live update)
            view.do_bind( evt, el, {name:name, key:key, value:value} );
        }
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
    
    viewHandler = function( view, method ) {
        return function(evt){return view[method](evt, {el:this});};
    }
;

/**[DOC_MARKDOWN]
####View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID, Model model=new Model(), Object viewAttributes={bind:"data-bind"}, Integer cacheSize=View._CACHE_SIZE, Integer refreshInterval=View._REFRESH_INTERVAL] );

[/DOC_MARKDOWN]**/
//
// View Class
var View = function View( id, model, atts, cacheSize, refreshInterval ) {
    var view = this;
    
    // constructor-factory pattern
    if ( !(view instanceof View) ) return new View( id, model, atts, cacheSize, refreshInterval );
    
    view.namespace = view.id = id || uuid('View');
    if ( !(atts=atts||{})[HAS]('bind') ) atts['bind'] = "data-bind";
    if ( !atts[HAS]('keys') ) atts['keys'] = "data-mvkeys" + (++nuuid);
    view.$atts = atts;
    cacheSize = cacheSize || View._CACHE_SIZE;
    refreshInterval = refreshInterval || View._REFRESH_INTERVAL;
    view.$memoize = new Cache( cacheSize, INF );
    view.$selectors = new Cache( cacheSize, refreshInterval );
    view.$atbind = view.attribute( "bind" );
    view.$atkeys = view.attribute( "keys" );
    view.$shortcuts = { };
    view.$num_shortcuts = 0;
    view.model( model || new Model( ) ).initPubSub( );
};
// STATIC
View._CACHE_SIZE = 600; // cache size
View._REFRESH_INTERVAL = INF; // refresh cache interval
View.node = find_node;
View.index = node_index;
View.indexClosest = node_closest_index;
View.getDomRef = get_dom_ref;
// View implements PublishSubscribe pattern
View[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: View
    
    ,id: null
    ,$dom: null
    ,$dom_tpl: null
    ,$model: null
    ,$livebind: null
    ,$autobind: false
    ,$bindbubble: false
    ,$template: null
    ,$atts: null
    ,$memoize: null
    ,$selectors: null
    ,$atbind: null
    ,$atkeys: null
    ,$shortcuts: null
    ,$num_shortcuts: null
    
/**[DOC_MARKDOWN]
// dispose view (and model)
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var view = this;
        view.unbind( ).disposePubSub( );
        if ( view.$model ) view.$model.dispose( );
        view.$model = null;
        view.$dom = null;
        if ( view.$dom_tpl ) view.$dom_tpl.dispose();
        view.$dom_tpl = null;
        view.$template = null;
        view.$atts = null;
        view.$memoize.dispose( );
        view.$memoize = null;
        view.$selectors.dispose( );
        view.$selectors = null;
        view.$livebind = null;
        view.$atbind = null;
        view.$atkeys = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        return view;
    }
    
/**[DOC_MARKDOWN]
// get / set view model
view.model( [Model model] );

[/DOC_MARKDOWN]**/
    ,model: function( model ) {
        var view = this;
        if ( arguments.length )
        {
            if ( view.$model ) view.$model.dispose( );
            view.$model = model.view( view );
            return view;
        }
        return view.$model;
    }
    
/**[DOC_MARKDOWN]
// get/set the name of view-specific attribute (e.g "bind": "data-bind" )
view.attribute( String name [, String att] );

[/DOC_MARKDOWN]**/
    ,attribute: function( name, att ) {
        var view = this;
        if ( arguments.length > 1 )
        {
            view.$atts[ name ] = att;
            view.$atbind = view.$atts.bind;
            view.$atkeys = view.$atts.keys;
            return view;
        }
        return name ? (view.$atts[ name ] || undef) : undef;
    }
    
    ,template: function( renderer ) {
        var view = this;
        if ( arguments.length )
        {
            if ( is_type( renderer, T_FUNC ) ) view.$template = renderer;
            return view;
        }
        return view.$template;
    }
    
/**[DOC_MARKDOWN]
// add custom view event handlers for model/view/dom/document in {"target:eventName": handler} format
view.events( Object events );

[/DOC_MARKDOWN]**/
    ,events: function( events ) {
        var view = this, k;
        if ( is_type(events, T_OBJ) )
        {
            for ( k in events ) 
                if ( events[HAS](k) && is_type(events[k], T_FUNC) )
                    view[ 'on_' + k.split(':').join('_') ] = events[k];
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );

[/DOC_MARKDOWN]**/
    ,shortcuts: function( shortcuts ) {
        var view = this, k, key, keys, modifiers, i, view_shortcuts = view.$shortcuts;
        if ( is_type(shortcuts, T_OBJ) )
        {
            for ( k in shortcuts ) 
            {
                if ( shortcuts[HAS](k) )
                {
                    modifiers = [];
                    keys = k.toLowerCase().split('+').map(trim);
                    for (i=keys.length-1; i>=0; i--)
                    {
                        key = keys[ i ];
                        if ( 'alt' === key || 'ctrl' === key || 'shift' === key || 'meta' === key )
                        {
                            modifiers.push( key );
                            keys.splice(i, 1);
                        }
                    }
                    key = modifiers.sort().concat(keys).join('+');
                    
                    if ( false === shortcuts[k] )
                    {
                        if ( view_shortcuts[HAS](key) ) 
                        {
                            del(view_shortcuts, key);
                            view.$num_shortcuts--;
                        }
                    }
                    else
                    {
                        if ( !view_shortcuts[HAS](key) ) view.$num_shortcuts++;
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
    ,actions: function( actions ) {
        var view = this, k;
        if ( is_type(actions, T_OBJ) )
        {
            for ( k in actions ) 
                if ( actions[HAS](k) && is_type(actions[k], T_FUNC) )
                    view[ 'do_' + k ] = actions[k];
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function( enabled ) {
        if ( arguments.length )
        {
            this.$model.autovalidate( enabled );
            return this;
        }
        return this.$model.autovalidate( );
    }
    
/**[DOC_MARKDOWN]
// get / set livebind, 
// livebind automatically binds DOM live nodes to model keys according to {model.key} inline tpl format
// e.g <span>model.key is $(model.key)</span>
view.livebind( [String format | Boolean false] );

[/DOC_MARKDOWN]**/
    ,livebind: function( format ) {
        var view = this;
        if ( arguments.length )
        {
            view.$livebind = !!format ? getInlineTplRE( format, view.$model ? view.$model.id : '' ) : null;
            return view;
        }
        return view.$livebind;
    }
    
/**[DOC_MARKDOWN]
// get / set autobind, 
// autobind automatically binds (2-way) input elements to model keys via name attribute 
// e.g <input name="model[key]" />, <select name="model[key]"></select>
view.autobind( [Boolean bool] );

[/DOC_MARKDOWN]**/
    ,autobind: function( enable ) {
        var view = this;
        if ( arguments.length )
        {
            view.$autobind = !!enable;
            return view;
        }
        return view.$autobind;                        
    }
    
    ,bindbubble: function( enable ) {
        var view = this;
        if ( arguments.length )
        {
            view.$bindbubble = !!enable;
            return view;
        }
        return view.$bindbubble;                        
    }
    
    // cache selectors for even faster performance
    ,get: function( selector, $dom, addRoot, bypass ) {
        var view = this, selectorsCache = view.$selectors, elements;
        
        $dom = $dom || view.$dom;
        
        if ( bypass || !(elements=selectorsCache.get( selector )) ) 
        {
            elements = $sel( selector, $dom );
            if ( addRoot && $dom[MATCHES](selector) ) elements.push( $dom );
            if ( !bypass ) selectorsCache.set( selector, elements );
        }
        
        return elements;
    }
    
    // http://stackoverflow.com/questions/10892322/javascript-hashtable-use-object-key
    // http://stackoverflow.com/questions/2937120/how-to-get-javascript-object-references-or-reference-count
    ,attr: function( el, att ) {
        var view = this, attr = view.$atts[ att ],
            memoizeCache = view.$memoize, attribute, attbind
        ;
        
        // use memoization/caching
        if ( !!(attr=el[ATTR]( attr )) )
        {
            attribute = memoizeCache.get( attr );
            
            if ( undef === attribute )
            {
                attribute = fromJSON( attr );
                
                // shortcut abbreviations for some default actions
                if ( attribute.set )
                {
                    attribute.click = attribute.set;
                    attribute.click.action = "set";
                    del(attribute, 'set');
                }
                
                if ( attribute.show )
                {
                    attribute.change = {action:"show", key:attribute.show};
                    del(attribute, 'show');
                }
                if ( attribute.hide )
                {
                    attribute.change = {action:"hide", key:attribute.hide};
                    del(attribute, 'hide');
                }
                
                if ( attribute.html )
                {
                    attribute.change = {action:"html", key:attribute.html};
                    del(attribute, 'html'); del(attribute, 'text');
                }
                else if ( attribute.text )
                {
                    attribute.change = {action:"html", key:attribute.text, text:1};
                    del(attribute, 'text');
                }
                
                if ( attribute.css )
                {
                    attribute.change = {action:"css", css:attribute.css};
                    del(attribute, 'css');
                }
                
                if ( attribute.value )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.value = attribute.value;
                    else
                        attribute.change = {action:"prop", prop:{value:attribute.value}};
                    del(attribute, 'value');
                }
                if ( attribute.checked )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.checked = attribute.checked;
                    else
                        attribute.change = {action:"prop", prop:{checked:attribute.checked}};
                    del(attribute, 'checked');
                }
                if ( attribute.disabled )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.disabled = attribute.disabled;
                    else
                        attribute.change = {action:"prop", prop:{disabled:attribute.disabled}};
                    del(attribute, 'disabled');
                }
                if ( attribute.options )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.options = attribute.options;
                    else
                        attribute.change = {action:"prop", prop:{options:attribute.options}};
                    del(attribute, 'options');
                }
                
                if ( (attbind=attribute.change) )
                {
                    if ( !attbind.domRef && attribute.domRef ) attbind.domRef = attribute.domRef;
                    if ( !attbind.key && attribute.key ) attbind.key = attribute.key;
                }
                
                // parsing is expensive, use memoize cache
                memoizeCache.set( attr, attribute );
            }
            
            return attribute;
        }
        
        return undef;
    }
    
    ,add: function( el, and_sync ) {  
        var view = this;
        if ( el )
        {
            if ( view.$dom_tpl ) view.$dom_tpl.bind( el );
            if ( false !== and_sync ) view.sync( null, el );
        }
        return view;
    }
    
    ,remove: function( el, and_reset ) {  
        var view = this;
        if ( el ) 
        {
            if ( view.$dom_tpl ) view.$dom_tpl.free( el );
            if ( false !== and_reset ) view.$selectors.reset( );
        }
        return view;
    }
    
/**[DOC_MARKDOWN]
// bind view to dom listening given events (default: ['change', 'click'])
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body] );

[/DOC_MARKDOWN]**/
    ,bind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, [view.$atkeys], [model.id+'['] ),
            bindSelector = sels[ 0 ], autobindSelector = sels[ 2 ],
            method, evt, namespaced, 
            autobind = view.$autobind, livebind = !!view.$livebind
        ;
        
        events = events || ['change', 'click'];
        view.$dom = dom || document.body;
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
        
        // live update dom nodes via special isomorphic Tpl live dom class
        if ( livebind )
            view.$dom_tpl = Tpl().dom( view.$dom, view.$livebind, view.$atkeys );
        
        // default view/dom binding events
        if ( view.on_view_change && events.length )
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent( view.$dom ).on( 
                events.map( namespaced ).join( ' ' ), 
                
                autobind ? [ autobindSelector, bindSelector ].join( ',' ) : bindSelector,
                
                function( evt ) {
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when data-bind on original button
                    // add "bubble" option in modelview data-bind params
                    var el = this,
                        isAutoBind = false, isBind = false, 
                        bind = view.$bindbubble ? view.attr(el, 'bind') : null
                    ;
                    if ( (evt.target === el) || (bind && bind.bubble) )
                    {
                        // view/dom change events
                        isBind = view.$bindbubble ? !!bind : el[MATCHES](bindSelector);
                        // view change autobind events
                        isAutoBind = autobind && "change" == evt.type && el[MATCHES](autobindSelector);
                        if ( isBind || isAutoBind ) 
                            view.on_view_change( evt, {el:el, isBind:isBind, isAutoBind:isAutoBind} );
                    }
                    return true;
                }
            );
        }
        
        // bind model/view/dom/document (custom) event handlers
        for (method in view)
        {
            if ( !is_type( view[ method ], T_FUNC ) ) continue;
            
            if ( startsWith( method, 'on_document_' ) )
            {
                evt = method.slice(12);
                evt.length && DOMEvent( document.body ).on( 
                    namespaced(evt), 
                    viewHandler( view, method )
                );
            }
            else if ( startsWith( method, 'on_model_' ) )
            {
                evt = method.slice(9);
                evt.length && view.onTo( model, evt, view[ method ] );
            }
            else if ( startsWith( method, 'on_view_' ) && 'on_view_change' !== method )
            {
                evt = method.slice(8);
                evt.length && DOMEvent( view.$dom ).on( 
                    namespaced(evt), 
                    autobind ? [ autobindSelector, bindSelector ].join( ',' ) : bindSelector, 
                    viewHandler( view, method )
                );
            }
            else if ( startsWith( method, 'on_dom_' ) )
            {
                evt = method.slice(7);
                evt.length && DOMEvent( view.$dom ).on( 
                    namespaced(evt), 
                    viewHandler( view, method )
                );
            }
        }
        
        return view;
    }
    
/**[DOC_MARKDOWN]
// unbind view from dom listening to events or all events (if no events given)
view.unbind( [Array events=null, DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,unbind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, [view.$atkeys], [model.id+'['] ),
            namespaced, $dom, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind
        ;
        
        events = events || null;
        $dom = dom || view.$dom;
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
         
        // view/dom change events
        if ( view.on_view_change )
        {
            DOMEvent( $dom ).off( 
                
                events && events.length ? events.map( namespaced ).join(' ') : viewEvent, 
                
                autobind ? [ sels[ 2 ], sels[ 0 ] ].join( ',' ) : sels[ 0 ]
            );
        }
        
        // model events
        view.offFrom( model );
        DOMEvent( $dom ).off( viewEvent );
        DOMEvent( document.body ).off( viewEvent );
        // live update dom nodes
        if ( view.$dom_tpl )
        {
            view.$dom_tpl.dispose();
            view.$dom_tpl = null;
        }
        
        return view;
    }
    
/**[DOC_MARKDOWN]
// reset view caches and re-bind to dom UI
view.rebind( [Array events=['change', 'click'], DOMNOde dom=document.body] );

[/DOC_MARKDOWN]**/
    ,rebind: function( events, $dom ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        // re-bind to UI
        return view.unbind( ).bind( events, $dom );
    }
    
/**[DOC_MARKDOWN]
// synchronize dom (or part of it) to underlying model
view.sync( [DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,sync: function( $dom, el ) {
        var view = this, 
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, livebind ? [view.$atkeys] : 0, autobind ? [view.$model.id+'['] : 0 ),
            syncEvent = PBEvent('sync', view), binds, autobinds, livebinds, 
            andCache;
        
        view.$selectors.reset( );
        if ( el )
        {
            syncEvent.currentTarget = el;
            binds = view.get( s[ 0 ], el, 0, 1 );
            if ( autobind ) autobinds = view.get( s[ 2 ], el, 0, 1 );
            if ( livebind ) livebinds = view.get( s[ 1 ], el, 1, 1 );
        }
        else
        {
            $dom = $dom || view.$dom; andCache = !($dom === view.$dom);
            binds = view.get( s[ 0 ], $dom, 0, andCache );
            if ( autobind ) autobinds = view.get( s[ 2 ], $dom, 0, andCache );
            if ( livebind ) livebinds = view.get( s[ 1 ], $dom, 1, andCache );
        }
        if ( binds.length ) doBindAction( view, binds, syncEvent );
        if ( autobind && autobinds.length ) doAutoBindAction( view, autobinds, syncEvent );
        if ( livebind && livebinds.length ) view.$dom_tpl.renderView(view, view.$model, syncEvent, livebinds, null, null, true);
        return view;
    }
    
/**[DOC_MARKDOWN]
// reset view caches only
view.reset( );

[/DOC_MARKDOWN]**/
    ,reset: function( ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        return view;
    }
    
    //
    // view "on_event" methods
    //
    
    ,on_view_change: function( evt, data ) {
        var view = this, model = view.$model, 
            el = data.el, name, key, val, 
            checkbox, modeldata = { }
        ;
        
        // update model and propagate to other elements of same view (via model publish hook)
        if ( data.isAutoBind && !!(name=el[NAME]) )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp];
            
            if ( key && model.has( key ) )
            {
                if ( 'checkbox' === el[TYPE].toLowerCase( ) )
                {
                    checkbox = view.get('input[type="checkbox"][name="'+name+'"]');
                    
                    if ( checkbox.length > 1 )
                    {
                        val = [ ];
                        checkbox.forEach(function( c ) {
                            val.push( c[CHECKED] ? c[VAL] : '' );
                        });
                    }
                    else if ( el[CHECKED] )
                    {
                        val = el[VAL];
                    }
                    else
                    {
                        val = '';
                    }
                }
                else
                {
                    val = get_val( el );
                }
                
                modeldata.$trigger = el;
                model.set( key, val, 1, modeldata );
            }
        }
        
        // if not model update error and element is bind element
        // do view action
        if ( !modeldata.error && data.isBind ) doBindAction( view, [el], evt/*, data*/ );
        
        // notify any 3rd-party also if needed
        view.publish( 'change', data );
    }
    
    ,on_document_keydown: function( evt, data ) {
        var view = this, view_shortcuts = view.$shortcuts, 
            el = data.el, callback, ret,
            key, code, character, modifiers;
        
        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        // no hotkeys assigned or text input element is the target, bypass
        if ( !view.$num_shortcuts || 'TEXTAREA' === el.tagName || 'INPUT' === el.tagName ) return;
        
        // find which key is pressed
        code = evt.keyCode || evt.which; 

        // key modifiers (in alphabetical order)
        modifiers = [];
        if ( !!evt.altKey ) modifiers.push('alt');
        if ( !!evt.ctrlKey ) modifiers.push('ctrl');
        if ( !!evt.metaKey ) modifiers.push('meta');	// meta is Mac specific
        if ( !!evt.shiftKey ) modifiers.push('shift');
        
        // if it is a special key
        if ( special_keys[HAS]( code ) ) 
        {
            key = special_keys[ code ];
        }
        else
        {
            if ( 188 === code )         character = ","; //If the user presses , when the type is onkeydown
            else if ( 190 === code )    character = "."; //If the user presses , when the type is onkeydown
            else                        character = Str.fromCharCode(code).toLowerCase( );
            // stupid Shift key bug created by using lowercase
            if ( !!evt.shiftKey && shift_nums[HAS](character) ) character = shift_nums[character];
            key = character;
            //if ( '+' === key ) key = 'plus';
        }
        key = modifiers.concat(key).join('+');
        if ( !!key && view_shortcuts[HAS](key) && view_shortcuts[key] ) 
        {
            callback = view_shortcuts[key]; ret = true;
            if ( callback.substr )
            {
                // view action id given
                if ( is_type(view['do_' + callback], T_FUNC) )
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
            if ( false === ret ) 
            { 
                // stop the event
                evt.stopPropagation( );
                evt.preventDefault( );
                return false;
            }
        }
    }
    
    ,on_model_change: function( evt, data ) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, livebind ? [view.$atkeys, data.key] : 0, autobind ? [model.id + bracketed( data.key )] : 0 ),
            bindElements, autoBindElements, liveBindings,  
            notTriggerElem
        ;
        
        bindElements = view.get( s[ 0 ] );
        if ( autobind ) autoBindElements = view.get( s[ 2 ] );
        if ( livebind ) liveBindings = view.get( s[ 1 ], 0, 1 );
        
        // bypass element that triggered the "model:change" event
        if ( data.$callData && data.$callData.$trigger )
        {
            notTriggerElem = function( ele ){ return ele !== data.$callData.$trigger; };
            bindElements = bindElements.filter( notTriggerElem );
            if ( autobind ) autoBindElements = autoBindElements.filter( notTriggerElem );
            data.$callData = null;
        }
        
        // do actions ..
        
        // do view action first
        if ( bindElements.length ) doBindAction( view, bindElements, evt, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( autobind && autoBindElements.length ) doAutoBindAction( view, autoBindElements, evt, data );
        // do view live DOM bindings update action
        if ( livebind && liveBindings.length ) view.$dom_tpl.renderView(view, view.$model, evt, liveBindings, data.key, data.value, 'sync' == evt.type);
    }

    ,on_model_error: function( evt, data ) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, livebind ? [view.$atkeys, data.key] : 0, autobind ? [model.id + bracketed( data.key )] : 0 ),
            bindElements, autoBindElements, liveBindings
        ;

        // do actions ..
        
        // do view bind action first
        if ( (bindElements=view.get( s[ 0 ] )).length ) doBindAction( view, bindElements, evt, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( autobind && (autoBindElements=view.get( s[ 2 ] )).length ) doAutoBindAction( view, autoBindElements, evt, data );
        // do view live DOM bindings update action
        if ( livebind && (liveBindings=view.get( s[ 1 ], 0, 1 )).length ) view.$dom_tpl.renderView(view, view.$model, evt, liveBindings, data.key, data.value, 'sync' == evt.type);
    }
    
    //
    // view "do_action" methods
    //
    
    // NOP action
    ,do_nop: null
    
    // set element(s) attributes/properties according to binding
    ,do_prop: function( evt, el, data ) {
        if ( !is_type(data.prop, T_OBJ) ) return;
        
        var view = this, model = view.$model, 
            prop = data.prop, p, k, v, vT
        ;
        
        if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[0];
        if ( !el ) return;
            
        for (p in prop)
        {
            if ( prop[HAS](p) )
            {
                k = prop[ p ];
                if ( !model.has( k ) ) continue;
                v = model.get( k ); vT = get_type( v );
                switch( p )
                {
                    case 'value':
                        set_val(el, v);
                        break;
                    
                    case 'checked': case 'disabled':
                        el[p] = ( T_BOOL === vT ) ? v : (Str(v) == el[VAL]);
                        break;
                    
                    case 'options':
                        if ( 'select' === el[TAG] && (T_ARRAY === vT) )
                        {
                            var sel, ii, vl = v.length,
                                _options = '', group = $tag( 'optgroup', el );
                            sel = select_get( el ); // get selected value
                            group = group.length ? group[ 0 ] : el;
                            $tag( 'option', group ).forEach(function( o ){ group.removeChild( o ); });
                            for (ii=0; ii<vl; ii++)
                            {
                                if ( v[ii] && v[ii].label )
                                    _options += '<option value="' + v[ii].value + '">' + v[ii].label + '</option>';
                                else
                                    _options += '<option value="' + v[ii] + '">' + v[ii] + '</option>';
                            }
                            group[HTML] = _options;
                            select_set( el, sel ); // select the appropriate option
                        }
                        break;
                    
                    default:
                        el[SET_ATTR](p, v);
                        break;
                }
            }
        }
    }
    
    // set element(s) html/text prop based on model key value
    ,do_html: function( evt, el, data ) {
        if ( !data.key ) return;
        var view = this, model = view.$model, key = data.key;
        if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key || !model.has( key ) ) return;
        el[data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = model.get( key );
    }
    
    // set element(s) css props based on model key value
    ,do_css: function( evt, el, data ) {
        if ( !is_type(data.css, T_OBJ) ) return;
        var view = this, model = view.$model, css = data.css, k, p, v;
        if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[ 0 ];
        if ( !el ) return;
        // css attributes
        for ( p in css )
        {
            if ( css[HAS](p) )
            {
                k = css[ p ]; v = model.get( k );
                if ( /*model.has( k )*/v ) el.style[ p ] = v;
            }
        }
    }
    
    // update/set a model field with a given value
    ,do_set: function( evt, el, data ) {
        var view = this, model = view.$model, key = null, val;
        
        if ( data.key ) 
        {
            key = data.key;
        }
        else if ( el[NAME] )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( el[NAME], 1 );
            key = el[namedKeyProp];
        }
        
        if ( !!key ) 
        {
            if ( data[HAS]("value") ) 
            {
                val = data.value;
            }
            else
            {
                if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[0];
                val = get_val( el );
            }
            model.set( key, val, 1 );
        }
    }
    
    // render an element using a custom template and model data
    ,do_tpl: function( evt, el, data ) {
        var view = this, model, 
            key = data.key, tplID = data.tpl,
            mode, html
        ;
        if ( !view.$template || !key || !tplID ) return;
        if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[0];
        if ( !el ) return;
        
        model = view.$model;
        if ( !key || !model.has( key ) ) return;
        
        mode = data.mode || 'replace';
        if ( 'replace' == mode ) el[HTML] = '';
        html = view.$template( tplID, model.get( key ) );
        if ( html ) el[HTML] += html;
    }
    
    // show/hide element(s) according to binding
    ,do_show: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key;
        
        if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key ) return;
        if ( data[HAS]('value') )
        {
            // show if data[key] is value, else hide
            if ( data.value === model.get( key ) ) show(el);
            else hide(el);
        }
        else
        {
            // show if data[key] is true, else hide
            if ( !!model.get( key ) ) show(el);
            else hide(el);
        }
    }
    
    // hide/show element(s) according to binding
    ,do_hide: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key;
        
        if ( data['domRef'] ) el = View.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key ) return;
        if ( data[HAS]('value') )
        {
            // hide if data[key] is value, else show
            if ( data.value === model.get( key ) ) hide(el);
            else show(el);
        }
        else
        {
            // hide if data[key] is true, else show
            if ( !!model.get( key ) ) hide(el);
            else show(el);
        }
    }
    
    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function( evt, el, data ) {
        var view = this, model = view.$model, 
            name = data.name, key = data.key, 
            elType = el[TYPE].toLowerCase( ),
            value, valueType
        ;
        
        // use already computed/cached key/value from calling method passed in "data"
        if ( !key ) return;
        value = data.value; valueType = get_type( value );
        
        if ( 'radio' === elType )
        {
            if ( Str(value) == el[VAL] )
            {
                view.get('input[name="'+name+'"]').forEach(function( ele ){
                    if ( el !== ele )
                        ele[CHECKED] = false;
                });
                el[CHECKED] = true;
            }
        }
        
        else if ( 'checkbox' === elType )
        {
            var checkbox = view.get('input[type="checkbox"][name="'+name+'"]'); 
            
            if ( checkbox.length > 1 && (T_ARRAY === valueType) )
            {
                checkbox.forEach(function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });
            }
            
            else
            {
                el[CHECKED] = T_BOOL === valueType ? value : (Str(value) == el[VAL]);
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

####View Actions

Default View Actions (inherited by sub-views)


The declarative view binding format is like:

```html
<element bind-attr="JSON"></element>

<!-- for example -->
<div data-bind='{"event_name":{"action":"action_name","key":"a.model.key","anotherparam":"anotherparamvalue"}}'></div>

<!-- for some actions there are shorthand formats (see below) e.g -->
<div data-bind='{"hide":"a.model.key"}'></div>

<!-- is shorthand for -->
<div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'></div>

<!-- or -->
<div data-bind='{"event_name":"action_name"}'></div>

<!-- is shorthand for -->
<div data-bind='{"event_name":{"action":"action_name"}}'></div>
```

<table>
<thead>
<tr>
    <td>Declarative Binding</td>
    <td>Method Name</td>
    <td>Bind Example</td>
    <td>Description</td>
</tr>
</thead>
<tbody>
<tr>
    <td>prop</td>
    <td>view.do_prop</td>
    <td>
&lt;div data-bind='{"value":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"prop","prop":{"value":"a.model.key"}}}'>&lt;/div>
<br /><br />
&lt;div data-bind='{"checked":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"prop","prop":{"checked":"a.model.key"}}}'>&lt;/div>
<br /><br />
&lt;div data-bind='{"disabled":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"prop","prop":{"disabled":"a.model.key"}}}'>&lt;/div>
<br /><br />
&lt;div data-bind='{"options":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"prop","prop":{"options":"a.model.key"}}}'>&lt;/div>
    </td>
    <td>set element properties based on model data keys</td>
</tr>
<tr>
    <td>html</td>
    <td>view.do_html</td>
    <td>
&lt;div data-bind='{"html":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"html","key":"a.model.key"}}'>&lt;/div>
    </td>
    <td>set element html/text property based on model data key</td>
</tr>
<tr>
    <td>css</td>
    <td>view.do_css</td>
    <td>
&lt;div data-bind='{"css":{"color":"a.model.key","background":"another.model.key"}}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"css","css":{"color":"a.model.key","background":"another.model.key"}}}'>&lt;/div>
    </td>
    <td>set element css style(s) based on model data key(s)</td>
</tr>
<tr>
    <td>show</td>
    <td>view.do_show</td>
    <td>
&lt;div data-bind='{"show":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"show","key":"a.model.key"}}'>&lt;/div>
    </td>
    <td>show/hide element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td>hide</td>
    <td>view.do_hide</td>
    <td>
&lt;div data-bind='{"hide":"a.model.key"}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'>&lt;/div>
    </td>
    <td>hide/show element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td>tpl</td>
    <td>view.do_tpl</td>
    <td>
&lt;div data-bind='{"click":{"action":"tpl","tpl":"tplID","key":"a.model.key"}}'>&lt;/div>
    </td>
    <td>element render a template based on model data key</td>
</tr>
<tr>
    <td>set</td>
    <td>view.do_set</td>
    <td>
&lt;div data-bind='{"set":{"key":"akey","value":"aval"}}'>&lt;/div>
<br />shorthand of:<br />
&lt;div data-bind='{"click":{"action":"set","key":"a.model.key","value":"aval"}}'>&lt;/div>
    </td>
    <td>set/update model data key with given value on a UI event (default "click")</td>
</tr>
<tr>
    <td>bind</td>
    <td>view.do_bind</td>
    <td>
&lt;input name="model[a][model][key]" /> <br />
&lt;select name="model[another][model][key]">&lt;/select>

    </td>
    <td>input element default two-way autobind action (automaticaly update value on input elements based on changed model data key or vice-versa)</td>
</tr>
</tbody>
</table>

[/DOC_MARKDOWN]**/
