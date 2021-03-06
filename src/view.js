
// View utils
var namedKeyProp = "mv_namedkey",

    contains_non_strict = function( collection, value ) {
        if ( collection )
        {
            for (var i=0,l=collection.length; i<l; i++)
                if ( value == Str(collection[i]) ) return true;
        }
        return false;
    },
    
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
    
    numeric_re = /^\d+$/,
    empty_brackets_re = /\[\s*\]$/,
    
    fields2model = function( view, elements ) {
        var model = view.$model,
            model_prefix = model.id + '.',
            checkboxes_done = { }
        ;
        
        iterate(function( i ) {
            var el, name, key, k, j, o, alternative,
            val, input_type, is_dynamic_array, checkboxes;
            el = elements[i]; name = el[ATTR]("name");
            if ( !name ) return;
            
            input_type = (el[TYPE]||'').toLowerCase( );
            
            key = dotted( name );
            if ( startsWith(key, model_prefix) ) key = key.slice( model_prefix.length );
            
            k = key.split('.'); o = model.$data;
            while ( k.length )
            {
                j = k.shift( );
                if ( k.length ) 
                {
                    if ( !o[HAS]( j ) ) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                    o = o[ j ];
                }
                else 
                {
                    if ( 'radio' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            val = '';
                            checkboxes = view.get('input[type="radio"][name="'+name+'"]', 0, 1);
                            if ( checkboxes.length > 1 )
                            {
                                each(checkboxes, function(c){
                                   if ( el[CHECKED] ) val = el[VAL];
                                });
                            }
                            else if ( el[CHECKED] )
                            {
                                val = el[VAL];
                            }
                            checkboxes_done[name] = 1;
                            model.set( key, val );
                        }
                    }
                    else if ( 'checkbox' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            is_dynamic_array = empty_brackets_re.test( name );
                            checkboxes = view.get('input[type="checkbox"][name="'+name+'"]', 0, 1);
                            
                            if ( is_dynamic_array )
                            {
                                // multiple checkboxes [name="model[key][]"] dynamic array
                                // only checked items are in the list
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                });
                            }
                            else if ( checkboxes.length > 1 )
                            {
                                // multiple checkboxes [name="model[key]"] static array
                                // all items are in the list either with values or defaults
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                    else val.push( !!(alternative=c[ATTR]('data-else')) ? alternative : '' );
                                });
                            }
                            else if ( el[CHECKED] )
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
                            model.set( key, val );
                        }
                    }
                    else
                    {
                        val = get_val( el );
                        model.set( key, val );
                    }
                }
            }
        }, 0, elements.length-1);
    },

    serialize_fields = function( node, name_prefix ) {
        var data = { },
            model_prefix = name_prefix&&name_prefix.length ? name_prefix + '.' : null,
            elements = $sel( 'input,textarea,select', node ), checkboxes_done = { }
        ;
        
        iterate(function( i ) {
            var el, name, key, k, j, o,
            val, input_type, is_dynamic_array, checkboxes;
            el = elements[i]; name = el[ATTR]("name");
            if ( !name ) return;
            
            input_type = (el[TYPE]||'').toLowerCase( );
            
            key = dotted( name );
            if ( model_prefix )
            {
                if ( !startsWith(key, model_prefix) ) return;
                key = key.slice( model_prefix.length );
            }
            
            k = key.split('.'); o = data;
            while ( k.length )
            {
                j = k.shift( );
                if ( k.length ) 
                {
                    if ( !o[HAS]( j ) ) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                    o = o[ j ];
                }
                else 
                {
                    if ( !o[HAS]( j ) ) o[ j ] = '';
                    
                    if ( 'radio' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            val = '';
                            checkboxes = $sel( 'input[type="radio"][name="'+name+'"]', node );
                            if ( checkboxes.length > 1 )
                            {
                                each(checkboxes, function(c){
                                   if ( el[CHECKED] ) val = el[VAL];
                                });
                            }
                            else if ( el[CHECKED] )
                            {
                                val = el[VAL];
                            }
                            checkboxes_done[name] = 1;
                            o[ j ] = val;
                        }
                    }
                    else if ( 'checkbox' === input_type )
                    {
                        if ( !checkboxes_done[name] )
                        {
                            is_dynamic_array = empty_brackets_re.test( name );
                            checkboxes = $sel( 'input[type="radio"][name="'+name+'"]', node );
                            
                            if ( is_dynamic_array )
                            {
                                // multiple checkboxes [name="model[key][]"] dynamic array
                                // only checked items are in the list
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                });
                            }
                            else if ( checkboxes.length > 1 )
                            {
                                // multiple checkboxes [name="model[key]"] static array
                                // all items are in the list either with values or defaults
                                val = [ ];
                                each(checkboxes, function( c ) {
                                    if ( c[CHECKED] ) val.push( c[VAL] );
                                    else val.push( !!(alternative=c[ATTR]('data-else')) ? alternative : '' );
                                });
                            }
                            else if ( el[CHECKED] )
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
                        val = get_val( el );
                        o[ j ] = val;
                    }
                }
            }
        }, 0, elements.length-1);
        return data;
    },

    do_bind_action = function( view, evt, elements, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, 
            event = isSync ? 'change' : evt.type, 
            modelkey = fromModel && fromModel.key ? fromModel.key : null,
            notmodelkey = !modelkey, modelkeyDot = modelkey ? (modelkey+'.') : null,
            isAtom = model.atomic, atom = model.$atom,
            atomDot = isAtom ? (atom+'.') : null
        ;
            
        iterate(function( i ) {
            var el, bind, do_action, name, key;
            el = elements[i]; if ( !el ) return;
            bind = getBindData( event, view.attr(el, 'bind') );
            // during sync, dont do any actions based on (other) events
            if ( !bind || !bind[HAS]("action") ) return;
            
            do_action = 'do_' + bind.action;
            if ( !is_type( view[ do_action ], T_FUNC ) ) return;
            
            name = el[NAME]; key = bind.key;
            if ( !key )
            {
                if  ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key(name, 1);
                key = el[namedKeyProp];
            }
            // "model:change" event and element does not reference the (nested) model key
            // OR model atomic operation(s)
            if ( (isAtom && key && ((atom === key) || startsWith( key, atomDot ))) || (modelkey && !key) ) return;
            
            if ( notmodelkey || key === modelkey || startsWith( key, modelkeyDot ) ) view[ do_action ]( evt, el, bind );
        }, 0, elements.length-1);
    },
    
    do_auto_bind_action = function( view, evt, elements, fromModel ) {
        var model = view.$model, cached = { };
        
        iterate(function( i ) {
            var el, name, key, ns_key, value;
            el = elements[i];  if ( !el ) return;
            name = el[NAME]; key = 0;
            if ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp]; if ( !key ) return;
            
            // use already cached key/value
            ns_key = '_'+key;
            if ( cached[HAS]( ns_key ) )  value = cached[ ns_key ][ 0 ];
            else if ( model.has( key ) ) cached[ ns_key ] = [ value=model.get( key ) ];
            else return;  // nothing to do here
            
            // call default action (ie: live update)
            view.do_bind( evt, el, {name:name, key:key, value:value} );
        }, 0, elements.length-1);
    },
    
    do_live_bind_action = function( view, evt, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, hasData = false,
            key, keyDot, keys = view.$tpl.keys(), kl = keys.length, data = {}
        ;
        if ( isSync )
        {
            iterate(function( k )  {
                var kk = keys[k];
                data[kk] = model.get(kk);
                hasData = true;
            }, 0, kl-1);
        }
        else if ( fromModel && fromModel.key )
        {
            key = fromModel.key; keyDot = key + '.';
            iterate(function( k )  {
                var kk = keys[k];
                if ( key === kk || startsWith(kk, keyDot) )
                {
                    data[kk] = model.get(kk);
                    hasData = true;
                }
            }, 0, kl-1);
        }
        if ( hasData ) view.$tpl.render( data );
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
    view.$atts = atts;
    cacheSize = cacheSize || View._CACHE_SIZE;
    refreshInterval = refreshInterval || View._REFRESH_INTERVAL;
    view.$memoize = new Cache( cacheSize, INF );
    view.$selectors = new Cache( cacheSize, refreshInterval );
    view.$atbind = view.attribute( "bind" );
    //view.$atkeys = view.attribute( "keys" );
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
View.serialize = serialize_fields;
// View implements PublishSubscribe pattern
View[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: View
    
    ,id: null
    ,$dom: null
    ,$tpl: null
    ,$model: null
    ,$livebind: null
    ,$autobind: false
    ,$isomorphic: false
    ,$bindbubble: false
    ,$template: null
    ,$atts: null
    ,$memoize: null
    ,$selectors: null
    ,$atbind: null
    //,$atkeys: null
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
        if ( view.$tpl ) view.$tpl.dispose( );
        view.$tpl = null;
        view.$template = null;
        view.$atts = null;
        view.$memoize.dispose( );
        view.$memoize = null;
        view.$selectors.dispose( );
        view.$selectors = null;
        view.$livebind = null;
        view.$isomorphic = null;
        view.$atbind = null;
        //view.$atkeys = null;
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
// get / set isomorphic flag, 
// isomorphic flag enables ModelView API to run both on server and browser and seamlessly and continously pass from one to the other
view.isomorphic( [Boolean false] );

[/DOC_MARKDOWN]**/
    ,isomorphic: function( bool ) {
        var view = this;
        if ( arguments.length )
        {
            view.$isomorphic = !!bool;
            return view;
        }
        return view.$isomorphic;
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
    ,get: function( selector, $dom, addRoot, not_cached ) {
        var view = this, selectorsCache = view.$selectors, elements;
        
        $dom = $dom || view.$dom;
        
        if ( not_cached || !(elements=selectorsCache.get( selector )) ) 
        {
            elements = $sel( selector, $dom );
            if ( addRoot && $dom[MATCHES](selector) ) elements.push( $dom );
            if ( !not_cached ) selectorsCache.set( selector, elements );
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
                
                if ( attribute.each )
                {
                    attribute.change = {action:"each", key:attribute.each};
                    del(attribute, 'each');
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
                    // domRef referenced in separate data-domref attribute
                    //if ( !attbind.domRef && attribute.domRef ) attbind.domRef = attribute.domRef;
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
            if ( view.$tpl ) view.$tpl.bind( el );
            if ( false !== and_sync ) view.sync( null, el );
        }
        return view;
    }
    
    ,remove: function( el, and_reset ) {  
        var view = this;
        if ( el ) 
        {
            if ( view.$tpl ) view.$tpl.free( el );
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
            sels = getSelectors( view.$atbind, null/*[view.$atkeys]*/, [model.id+'['] ),
            bindSelector = sels[ 0 ], autobindSelector = sels[ 2 ],
            method, evt, namespaced, 
            autobind = view.$autobind, livebind = !!view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;
        
        events = events || ['change', 'click'];
        view.$dom = dom || (hasDocument ? document.body : null);
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
        
        // live update dom nodes via special isomorphic Tpl live dom class
        if ( livebind ) view.$tpl = Tpl( view.$dom, view.$livebind, view.$isomorphic );
        
        // default view/dom binding events
        if ( hasDocument && view.on_view_change && events.length )
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent( view.$dom ).on( 
                map( events, namespaced ).join( ' ' ), 
                
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
            
            if ( startsWith( method, 'on_model_' ) )
            {
                evt = method.slice(9);
                evt.length && view.onTo( model, evt, view[ method ] );
            }
            else if ( hasDocument )
            {
                if ( startsWith( method, 'on_document_' ) )
                {
                    evt = method.slice(12);
                    evt.length && DOMEvent( document.body ).on( 
                        namespaced(evt), 
                        viewHandler( view, method )
                    );
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
        }
        
        return view;
    }
    
/**[DOC_MARKDOWN]
// unbind view from dom listening to events or all events (if no events given)
view.unbind( [Array events=null, DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,unbind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, null/*[view.$atkeys]*/, [model.id+'['] ),
            namespaced, $dom, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;
        
        events = events || null;
        $dom = dom || view.$dom;
        
        namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
         
        // view/dom change events
        if ( hasDocument && view.on_view_change )
        {
            DOMEvent( $dom ).off( 
                
                events && events.length ? map( events, namespaced ).join(' ') : viewEvent, 
                
                autobind ? [ sels[ 2 ], sels[ 0 ] ].join( ',' ) : sels[ 0 ]
            );
        }
        
        // model events
        view.offFrom( model );
        if ( hasDocument )
        {
            DOMEvent( $dom ).off( viewEvent );
            DOMEvent( document.body ).off( viewEvent );
        }
        // live update dom nodes
        if ( view.$tpl )
        {
            view.$tpl.dispose();
            view.$tpl = null;
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
            s = getSelectors( view.$atbind, null/*livebind ? [view.$atkeys] : 0*/, autobind ? [view.$model.id+'['] : 0 ),
            syncEvent = PBEvent('sync', view), binds, autobinds, livebinds, 
            hasDocument = 'undefined' !== typeof document,
            andCache;
        
        view.$selectors.reset( );
        if ( el )
        {
            syncEvent.currentTarget = el;
            if ( hasDocument )
            {
                binds = view.get( s[ 0 ], el, 0, 1 );
                if ( autobind ) autobinds = view.get( s[ 2 ], el, 0, 1 );
                //if ( livebind ) livebinds = view.get( s[ 1 ], el, 1, 1 );
            }
        }
        else if ( hasDocument )
        {
            $dom = $dom || view.$dom; andCache = !($dom === view.$dom);
            binds = view.get( s[ 0 ], $dom, 0, andCache );
            if ( autobind ) autobinds = view.get( s[ 2 ], $dom, 0, andCache );
            //if ( livebind ) livebinds = view.get( s[ 1 ], $dom, 1, andCache );
        }
        if ( hasDocument && binds.length ) do_bind_action( view, syncEvent, binds );
        if ( hasDocument && autobind && autobinds.length ) do_auto_bind_action( view, syncEvent, autobinds );
        if ( livebind && /*livebinds.length*/view.$tpl ) do_live_bind_action( view, syncEvent );
        return view;
    }
    
/**[DOC_MARKDOWN]
// synchronize model to underlying dom (or part of it)
view.sync_model( [DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,sync_model: function( $dom ) {
        var view = this, s,
            autobind = view.$autobind, 
            autobinds, hasDocument = 'undefined' !== typeof document
        ;
        
        if ( hasDocument && autobind )
        {
            s = getSelectors( null, null, [view.$model.id+'['] );
            view.$selectors.reset( );
            autobinds = view.get( s[ 2 ], $dom || view.$dom, 0, 1 );
            if ( autobinds.length ) fields2model( view, autobinds );
        }
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
            checkboxes, is_dynamic_array, input_type, alternative,
            modeldata = { }
        ;
        
        // update model and propagate to other elements of same view (via model publish hook)
        if ( data.isAutoBind && !!(name=el[NAME]) )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp];
            
            if ( key /*&& model.has( key )*/ )
            {
                input_type = el[TYPE].toLowerCase( );
                
                if ( 'checkbox' === input_type )
                {
                    is_dynamic_array = empty_brackets_re.test( name );
                    checkboxes = view.get('input[type="checkbox"][name="'+name+'"]');
                    
                    if ( is_dynamic_array )
                    {
                        // multiple checkboxes [name="model[key][]"] dynamic array
                        // only checked items are in the list
                        val = [ ];
                        each(checkboxes, function( c ) {
                            if ( c[CHECKED] ) val.push( c[VAL] );
                        });
                    }
                    else if ( checkboxes.length > 1 )
                    {
                        // multiple checkboxes [name="model[key]"] static array
                        // all items are in the list either with values or defaults
                        val = [ ];
                        each(checkboxes, function( c ) {
                            if ( c[CHECKED] ) val.push( c[VAL] );
                            else val.push( !!(alternative=c[ATTR]('data-else')) ? alternative : '' );
                        });
                    }
                    else if ( el[CHECKED] )
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
                    val = get_val( el );
                }
                
                modeldata.$trigger = el;
                model.set( key, val, 1, modeldata );
            }
        }
        
        // if not model update error and element is bind element
        // do view action
        if ( !modeldata.error && data.isBind ) do_bind_action( view, evt, [el]/*, data*/ );
        
        // notify any 3rd-party also if needed
        view.publish( 'change', data );
    }
    
    ,on_document_keydown: function( evt, data ) {
        var view = this, view_shortcuts = view.$shortcuts, 
            el = data.el, callback, ret, input_type,
            key, code, character, modifiers;
        
        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        input_type = 'TEXTAREA' === el.tagName ? 'text' : ('INPUT' === el.tagName ? el[TYPE].toLowerCase( ) : '');
        // no hotkeys assigned or text input element is the target, bypass
        if ( !view.$num_shortcuts || 'text' === input_type || 'email' === input_type || 'url' === input_type || 'number' === input_type ) return;
        
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
            s = getSelectors( view.$atbind, null/*livebind ? [view.$atkeys, data.key] : 0*/, autobind ? [model.id + bracketed( data.key )] : 0 ),
            bindElements, autoBindElements, liveBindings,  
            hasDocument = 'undefined' !== typeof document,
            notTriggerElem
        ;
        
        if ( hasDocument )
        {
            bindElements = view.get( s[ 0 ] );
            if ( autobind ) autoBindElements = view.get( s[ 2 ] );
            //if ( livebind ) liveBindings = view.get( s[ 1 ], 0, 1 );
            
            // bypass element that triggered the "model:change" event
            if ( data.$callData && data.$callData.$trigger )
            {
                notTriggerElem = function( ele ){ return ele !== data.$callData.$trigger; };
                bindElements = filter( bindElements, notTriggerElem );
                if ( autobind ) autoBindElements = filter( autoBindElements, notTriggerElem );
                data.$callData = null;
            }
        }
        
        // do actions ..
        
        // do view action first
        if ( hasDocument && bindElements.length ) do_bind_action( view, evt, bindElements, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( hasDocument && autobind && autoBindElements.length ) do_auto_bind_action( view, evt, autoBindElements, data );
        // do view live DOM bindings update action
        if ( livebind && /*liveBindings.length*/view.$tpl ) do_live_bind_action( view, evt, data );
    }

    ,on_model_error: function( evt, data ) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = !!view.$livebind, 
            s = getSelectors( view.$atbind, null/*livebind ? [view.$atkeys, data.key] : 0*/, autobind ? [model.id + bracketed( data.key )] : 0 ),
            hasDocument = 'undefined' !== typeof document,
            bindElements, autoBindElements, liveBindings
        ;

        // do actions ..
        
        // do view bind action first
        if ( hasDocument && (bindElements=view.get( s[ 0 ] )).length ) do_bind_action( view, evt, bindElements, data );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( hasDocument && autobind && (autoBindElements=view.get( s[ 2 ] )).length ) do_auto_bind_action( view, evt, autoBindElements, data );
        // do view live DOM bindings update action
        if ( livebind && /*(liveBindings=view.get( s[ 1 ], 0, 1 )).length*/view.$tpl ) do_live_bind_action( view, evt, data );
    }
    
    //
    // view "do_action" methods
    //
    
    // NOP action
    ,do_nop: null
    
    // update element each nodes dependiong on a model collection key
    ,do_each: function( evt, el, data ) {
        // in progress
    }
    
    // set element(s) attributes/properties according to binding
    ,do_prop: function( evt, el, data ) {
        if ( !is_type(data.prop, T_OBJ) ) return;
        
        var view = this, model = view.$model, 
            prop = data.prop, p, k, v, vT, domref
        ;
        
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        each(el, function( el ){
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
                            if ( 'SELECT' === el[TAG] && (T_ARRAY === vT) )
                            {
                                var sel, ii, vl = v.length,
                                    _options = '', group = $tag( 'optgroup', el );
                                sel = select_get( el ); // get selected value
                                group = group.length ? group[ 0 ] : el;
                                each($tag( 'option', group ), function( o ){ group.removeChild( o ); });
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
        });
    }
    
    // set element(s) html/text prop based on model key value
    ,do_html: function( evt, el, data ) {
        if ( !data.key ) return;
        var view = this, model = view.$model, key = data.key, domref;
        
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length || !key || !model.has( key ) ) return;
            
        each(el, function( el ){
            if ( !el ) return;
            el[data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = model.get( key );
        });
    }
    
    // set element(s) css props based on model key value
    ,do_css: function( evt, el, data ) {
        if ( !is_type(data.css, T_OBJ) ) return;
        var view = this, model = view.$model, css = data.css, k, p, v, domref;
        
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        each(el, function( el ){
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
        });
    }
    
    // update/set a model field with a given value
    ,do_set: function( evt, el, data ) {
        var view = this, model = view.$model, key = null, val, domref;
        
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
                if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref )[0];
                val = get_val( el );
            }
            model.set( key, val, 1 );
        }
    }
    
    // render an element using a custom template and model data
    ,do_tpl: function( evt, el, data ) {
        var view = this, model, 
            key = data.key, tplID = data.tpl,
            mode, html, domref
        ;
        if ( !view.$template || !key || !tplID ) return;
        model = view.$model;
        if ( !key || !model.has( key ) ) return;
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
        mode = data.mode || 'replace';
        html = view.$template( tplID, model.get( key ) );
            
        each(el, function( el ){
            if ( !el ) return;
            if ( 'replace' == mode ) el[HTML] = '';
            if ( html ) el[HTML] += html;
        });
    }
    
    // show/hide element(s) according to binding
    ,do_show: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key, 
            modelkey, domref, enabled;
        
        if ( !key ) return;
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        modelkey = model.get( key );
        // show if data[key] is value, else hide
        // show if data[key] is true, else hide
        enabled = data[HAS]('value') ? data.value === modelkey : !!modelkey;
        each(el, function( el ){
            if ( !el ) return;
            if ( enabled ) show(el);
            else hide(el);
        });
    }
    
    // hide/show element(s) according to binding
    ,do_hide: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key, 
            modelkey, domref, enabled;
        
        if ( !key ) return;
        if ( !!(domref=el[ATTR]('data-domref')) ) el = View.getDomRef( el, domref );
        else el = [el];
        if ( !el || !el.length ) return;
            
        modelkey = model.get( key );
        // hide if data[key] is value, else show
        // hide if data[key] is true, else show
        enabled = data[HAS]('value') ? data.value === modelkey : !!modelkey;
        each(el, function( el ){
            if ( !el ) return;
            if ( enabled ) hide(el);
            else show(el);
        });
    }
    
    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function( evt, el, data ) {
        var view = this, model = view.$model, 
            name = data.name, key = data.key, 
            input_type = el[TYPE].toLowerCase( ),
            value, value_type, checkboxes, is_dynamic_array
        ;
        
        // use already computed/cached key/value from calling method passed in "data"
        if ( !key ) return;
        value = data.value; value_type = get_type( value );
        
        if ( 'radio' === input_type )
        {
            if ( Str(value) == el[VAL] )
            {
                each(view.get('input[name="'+name+'"]'), function( ele ){
                    if ( el !== ele )
                        ele[CHECKED] = false;
                });
                el[CHECKED] = true;
            }
        }
        
        else if ( 'checkbox' === input_type )
        {
            is_dynamic_array = empty_brackets_re.test( name );
            //checkboxes = view.get('input[type="checkbox"][name="'+name+'"]'); 
            
            if ( is_dynamic_array )
            {
                value = T_ARRAY === value_type ? value : [value];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                // eventually all same name checkboxes will be updated similarly from autobind
                // so update only one element at a time here
                /*each(checkboxes, function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });*/
            }
            else if ( /*checkboxes.length > 1 &&*/ (T_ARRAY === value_type) )
            {
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                // eventually all same name checkboxes will be updated similarly from autobind
                // so update only one element at a time here
                /*each(checkboxes, function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });*/
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

####View Actions

Default View Actions (inherited by sub-views)


The declarative view binding format is like:

```html
<element bind-attr="JSON"></element>

<!-- for example: -->
<div data-bind='{"event_name":{"action":"action_name","key":"a.model.key","anotherparam":"anotherparamvalue"}}'></div>

<!-- for some actions there are shorthand formats (see below) e.g -->
<div data-bind='{"hide":"a.model.key"}'></div>

<!-- is shorthand for: -->
<div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'></div>

<!-- or -->
<div data-bind='{"event_name":"action_name"}'></div>

<!-- is shorthand for: -->
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
    <td><code>each</code></td>
    <td><code>view.do_each</code></td>
    <td>

<code><pre>
&lt;ul data-bind='{"each":"a.model.collection.key"}'>&lt;/ul>
&lt;!-- is shorthand for: -->
&lt;ul data-bind='{"change":{"action":"each","key":"a.model.collection.key"}}'>&lt;/ul>
</pre></code>

    </td>
    <td>update element each child node depending on model collection key (TODO)</td>
</tr>
<tr>
    <td><code>prop</code></td>
    <td><code>view.do_prop</code></td>
    <td>

<code><pre>
&lt;input type="text" data-bind='{"value":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="text" data-bind='{"change":{"action":"prop","prop":{"value":"a.model.key"}}}' />

&lt;input type="checkbox" data-bind='{"checked":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="checkbox" data-bind='{"change":{"action":"prop","prop":{"checked":"a.model.key"}}}' />

&lt;input type="text" data-bind='{"disabled":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="text" data-bind='{"change":{"action":"prop","prop":{"disabled":"a.model.key"}}}' />

&lt;select data-bind='{"options":"a.model.key"}'>&lt;/select>
&lt;!-- is shorthand for: -->
&lt;select data-bind='{"change":{"action":"prop","prop":{"options":"a.model.key"}}}'>&lt;/select>
</pre></code>

    </td>
    <td>set element properties based on model data keys</td>
</tr>
<tr>
    <td><code>html</code> / <code>text</code></td>
    <td><code>view.do_html</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"html":"a.model.key"}'>&lt;/div>
&lt;span data-bind='{"text":"a.model.key"}'>&lt;/span>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"html","key":"a.model.key"}}'>&lt;/div>
&lt;span data-bind='{"change":{"action":"text","key":"a.model.key"}}'>&lt;/span>
</pre></code>

    </td>
    <td>set element html/text property based on model data key</td>
</tr>
<tr>
    <td><code>css</code></td>
    <td><code>view.do_css</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"css":{"color":"a.model.key","background":"another.model.key"}}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"css","css":{"color":"a.model.key","background":"another.model.key"}}}'>&lt;/div>
</pre></code>

    </td>
    <td>set element css style(s) based on model data key(s)</td>
</tr>
<tr>
    <td><code>show</code></td>
    <td><code>view.do_show</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"show":"a.model.key"}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"show","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>show/hide element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td><code>hide</code></td>
    <td><code>view.do_hide</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"hide":"a.model.key"}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>hide/show element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td><code>tpl</code></td>
    <td><code>view.do_tpl</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"click":{"action":"tpl","tpl":"tplID","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>element render a template based on model data key</td>
</tr>
<tr>
    <td><code>set</code></td>
    <td><code>view.do_set</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"set":{"key":"akey","value":"aval"}}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"click":{"action":"set","key":"a.model.key","value":"aval"}}'>&lt;/div>
</pre></code>

    </td>
    <td>set/update model data key with given value on a UI event (default "click")</td>
</tr>
<tr>
    <td><code>bind</code></td>
    <td><code>view.do_bind</code></td>
    <td>

<code><pre>
&lt;input name="model[a][model][key]" />
&lt;select name="model[another][model][key]">&lt;/select>
</pre></code>

    </td>
    <td>input element default two-way autobind action (automaticaly update value on input elements based on changed model data key or vice-versa)</td>
</tr>
</tbody>
</table>

[/DOC_MARKDOWN]**/
