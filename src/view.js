    var
        getSelectors = function( bind, autobind, exact ) {
            return [
                bind ? '[' + bind + ']' : null,
                
                autobind 
                ? (exact ? 'input[name="' + autobind + '"],textarea[name="' + autobind + '"],select[name="' + autobind + '"]': 'input[name^="' + autobind + '"],textarea[name^="' + autobind + '"],select[name^="' + autobind + '"]') 
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
        
        doAction = function( view, $elements, evt, fromModel ) {
            var model = view.$model, isSync = 'sync' == evt.type, 
                event = isSync ? 'change' : evt.type;
            
            $elements.each(function( ) {
                var $el = $(this), bind, do_action, name, key;
                
                bind = getBindData( event, view.attr($el, 'bind') );
                // during sync, dont do any actions based on (other) events
                if ( !bind || !bind.action ) return;
                
                do_action = 'do_' + bind.action;
                if ( !is_type( view[ do_action ], T_FUNC ) ) return;
                name = $el.attr('name')
                key = bind.key || (name && model.key(name, 1));
                // "model:change" event and element does not reference the (nested) model key
                // OR model atomic operation(s)
                if ( fromModel && (!key || !key.sW( fromModel.key ) || 
                    (model.atomic && key.sW( model.$atom ))) ) return;
                
                view[ do_action ]( evt, $el, bind );
            });
        },
        
        doAutoBindAction = function( view, $elements, evt, fromModel ) {
            var model = view.$model, cached = { }, isSync = 'sync' == evt.type, 
                event = isSync ? 'change' : evt.type;
            
            $elements.each(function( ) {
                var $el = $(this), name = $el.attr('name'), 
                    key = name ? model.key( name, 1 ) : 0, value;
                    
                if ( !key ) return;
                
                // use already cached key/value
                if ( cached[ key ] )  value = cached[ key ][ 0 ];
                else if ( model.has( key ) ) cached[ key ] = [ value=model.get( key ) ];
                else return;  // nothing to do here
                
                // call default action (ie: live update)
                view.do_bind( evt, $el, {name:name, key:key, value:value} );
            });
        }
    ;
    
    //
    // View Class
    var View = function( id, model, atts, cacheSize, refreshInterval ) {
        var view = this;
        
        // constructor-factory pattern
        if ( !(view instanceof View) ) return new View( id, model, atts, cacheSize, refreshInterval );
        
        view.namespace = view.id = id || uuid('View');
        view.$atts = atts || { "bind": "data-bind" };
        cacheSize = cacheSize || View._CACHE_SIZE;
        refreshInterval = refreshInterval || View._REFRESH_INTERVAL;
        view.$memoize = new Cache( cacheSize, refreshInterval );
        view.$selectors = new Cache( cacheSize, refreshInterval );
        view.$bind = view.attribute( "bind" );
        view.model( model || new Model( ) ).initPubSub( );
    };
    // STATIC
    View._CACHE_SIZE = 600;
    View._REFRESH_INTERVAL = INF; // refresh cache interval
    View[proto] = Mixin( Create( Obj[proto] ), PublishSubscribe, {
        
        // allow chaining, return this;
        constructor: View
        
        ,id: null
        ,$dom: null
        ,$bind: null
        ,$model: null
        ,$bindbubble: false
        ,$autobind: false
        ,$template: null
        ,$atts: null
        ,$memoize: null
        ,$selectors: null
        
        ,dispose: function( ) {
            var view = this;
            view.unbind( ).disposePubSub( );
            if ( view.$model ) view.$model.dispose( );
            view.$model = null;
            view.$dom = null;
            view.$bind = null;
            view.$template = null;
            view.$atts = null;
            view.$memoize.dispose( );
            view.$memoize = null;
            view.$selectors.dispose( );
            view.$selectors = null;
            return view;
        }
        
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
        
        ,attribute: function( type, att ) {
            var view = this;
            if ( arguments.length > 1 )
            {
                view.$atts[ type ] = att;
                return view;
            }
            return type ? (view.$atts[ type ] || undef) : undef;
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
        
        ,event: function( name, handler ) {
            var view = this,
                evt = name ? ('on_' + name.split(':').join('_')) : null;
            if ( evt && undef !== handler )
            {
                view[ evt ] = is_type( handler, T_FUNC ) ? handler : null;
                return view;
            }
            return evt ? view[ evt ] : undef;
        }
        
        ,action: function( name, handler ) {
            var view = this, do_action = name && ('do_'+name);
            if ( arguments.length > 1 )
            {
                view[ do_action ] = is_type( handler, T_FUNC ) ? handler : null;
                return view;
            }
            return do_action && view[ do_action ];
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
        
        ,autobind: function( enable ) {
            var view = this;
            if ( arguments.length )
            {
                view.$autobind = !!enable;
                return view;
            }
            return view.$autobind;                        
        }
        
        // cache jquery selectors for even faster performance
        ,get: function( selector, $dom, bypass ) {
            var view = this, selectorsCache = view.$selectors, elements;
            
            $dom = $dom ? $($dom) : view.$dom;
            
            if ( bypass ) return $dom.find( selector );
            
            elements = selectorsCache.get( selector );
            if ( !elements ) selectorsCache.set( selector, elements = $dom.find( selector ) );
            
            return elements;
        }
        
        // http://stackoverflow.com/questions/10892322/javascript-hashtable-use-object-key
        // http://stackoverflow.com/questions/2937120/how-to-get-javascript-object-references-or-reference-count
        ,attr: function( $el, att ) {
            var view = this, attr = view.$atts[ att ], 
                memoizeCache = view.$memoize, attribute, attbind
            ;
            
            // use memoization/caching
            if ( attr && hasAtt( $el, attr ) )
            {
                attr = $el.attr( attr );
                attribute = memoizeCache.get( attr );
                
                if ( undef === attribute )
                {
                    attribute = fromJSON( attr );
                    
                    // shortcut abbreviations for some default actions
                    if ( attribute.set )
                    {
                        attribute.click = attribute.set;
                        attribute.click.action = "set";
                        attribute.set = undef;
                        delete attribute.set;
                    }
                    
                    if ( attribute.show )
                    {
                        attribute.change = {action:"show", key:attribute.show};
                        attribute.show = undef;
                        delete attribute.show;
                    }
                    if ( attribute.hide )
                    {
                        attribute.change = {action:"hide", key:attribute.hide};
                        attribute.hide = undef;
                        delete attribute.hide;
                    }
                    
                    if ( attribute.html )
                    {
                        attribute.change = {action:"html", key:attribute.html};
                        attribute.html = undef;
                        delete attribute.html;
                        attribute.text = undef;
                        delete attribute.text;
                    }
                    else if ( attribute.text )
                    {
                        attribute.change = {action:"html", key:attribute.text, text:1};
                        attribute.text = undef;
                        delete attribute.text;
                    }
                    
                    if ( attribute.css )
                    {
                        attribute.change = {action:"css", css:attribute.css};
                        attribute.css = undef;
                        delete attribute.css;
                    }
                    
                    if ( attribute.value )
                    {
                        if ( attribute.change && ("prop" == attribute.change.action) )
                            attribute.change.prop.value = attribute.value;
                        else
                            attribute.change = {action:"prop", prop:{value:attribute.value}};
                        attribute.value = undef;
                        delete attribute.value;
                    }
                    if ( attribute.checked )
                    {
                        if ( attribute.change && ("prop" == attribute.change.action) )
                            attribute.change.prop.checked = attribute.checked;
                        else
                            attribute.change = {action:"prop", prop:{checked:attribute.checked}};
                        attribute.checked = undef;
                        delete attribute.checked;
                    }
                    if ( attribute.disabled )
                    {
                        if ( attribute.change && ("prop" == attribute.change.action) )
                            attribute.change.prop.disabled = attribute.disabled;
                        else
                            attribute.change = {action:"prop", prop:{disabled:attribute.disabled}};
                        attribute.disabled = undef;
                        delete attribute.disabled;
                    }
                    if ( attribute.options )
                    {
                        if ( attribute.change && ("prop" == attribute.change.action) )
                            attribute.change.prop.options = attribute.options;
                        else
                            attribute.change = {action:"prop", prop:{options:attribute.options}};
                        attribute.options = undef;
                        delete attribute.options;
                    }
                    if ( attribute['class'] )
                    {
                        if ( attribute.change && ("prop" == attribute.change.action) )
                            attribute.change.prop["class"] = attribute['class'];
                        else
                            attribute.change = {action:"prop", prop:{"class":attribute['class']}};
                        attribute['class'] = undef;
                        delete attribute['class'];
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
        
        ,getDomRef: function( $el, ref ) {
            // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
            return ( ref && ("$this::" == ref.slice(0, 7)) ) ? $( ref.slice( 7 ), $el ) : $( ref );
        }
        
        ,bind: function( events, dom ) {
            var view = this, model = view.$model,
                sels = getSelectors( view.$bind, model.id+'[' ),
                bindSelector = sels[ 0 ], autobindSelector = sels[ 1 ],
                method, evt, namespaced, modelMethodPrefix = /^on_model_/
            ;
            
            events = events || ['change', 'click'];
            view.$dom = $(dom || window.document);
             
            // view/dom change events
            if ( view.on_view_change && events.length )
            {
                namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
                
                // use one event handler for bind and autobind
                // avoid running same (view) action twice on autobind and bind elements
                view.$dom.on( 
                    events.map( namespaced ).join( ' ' ), 
                    
                    [ autobindSelector, bindSelector ].join( ',' ),
                    
                    function( evt ) {
                        // avoid "ghosting" events on other elements which may be inside a bind element
                        // Chrome issue on nested button clicked, when data-bind on original button
                        // add "bubble" option in modelview data-bind params
                        var el = this, $el = $(el),
                            isAutoBind = false, isBind = false, 
                            bind = view.$bindbubble ? view.attr($el, 'bind') : null
                        ;
                        if ( (evt.target === el) || (bind && bind.bubble) )
                        {
                            // view/dom change events
                            isBind = view.$bindbubble ? !!bind : $el.is( bindSelector );
                            // view change autobind events
                            isAutoBind = view.$autobind && "change" == evt.type && $el.is( autobindSelector );
                            
                            if ( isBind || isAutoBind ) 
                                view.on_view_change( evt, {$el:$el, isBind:isBind, isAutoBind:isAutoBind} );
                        }
                        return true;
                    }
                );
            }
            
            // model events
            for (method in view)
            {
                if ( !is_type( view[ method ], T_FUNC ) || !modelMethodPrefix.test( method ) ) continue;
                
                evt = method.replace( modelMethodPrefix, '' );
                evt.length && view.onTo( model, evt, view[ method ], view.namespace );
            }
            
            return view;
        }
        
        ,unbind: function( events, dom ) {
            var view = this, model = view.$model,
                selectors = getSelectors( view.$bind, model.id+'[' ),
                namespaced, $dom
            ;
            
            events = events || null;
            $dom = dom ? $(dom) : view.$dom;
             
            // view/dom change events
            if ( view.on_view_change )
            {
                namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
                
                $dom.off( 
                    
                    events && events.length ? events.map( namespaced ).join(' ') : NSEvent('', view.namespace), 
                    
                    [ selectors[ 1 ], selectors[ 0 ] ].join( ',' )
                );
            }
            
            // model events
            view.offFrom( model, '', null, view.namespace );
            
            return view;
        }
        
        ,rebind: function( events, $dom ) {
            var view = this;
            // refresh caches
            view.$memoize.reset( );
            view.$selectors.reset( );
            // re-bind to UI
            return view.unbind( ).bind( events, $dom );
        }
        
        ,sync: function( $dom ) {
            var view = this, selectors = getSelectors( view.$bind, view.$model.id+'[' ), 
                syncEvent = Event('sync');
            
            $dom = $dom ? $($dom) : view.$dom;
            doAction( view, view.get( selectors[ 0 ], $dom, 1 ), syncEvent );
            if ( view.$autobind /*&& view.do_bind*/ )
                doAutoBindAction( view, view.get( selectors[ 1 ], $dom, 1 ), syncEvent );
            return view;
        }
        
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
            var view = this, model = view.$model, $el = data.$el, 
                name, key, val, isCheckbox, checkbox, modeldata = { }
            ;
            
            // update model and propagate to other elements of same view (via model publish hook)
            if ( data.isAutoBind && $el.attr('name') )
            {
                key = model.key( name=$el.attr('name'), 1 );
                
                if ( key && model.has( key ) )
                {
                    isCheckbox = $el.is(':checkbox');
                    
                    if ( isCheckbox )
                    {
                        checkbox = view.get('input[type="checkbox"][name="'+name+'"]');
                        
                        if ( checkbox.length > 1 )
                        {
                            val = [ ];
                            checkbox.each(function( ) {
                                var $c = $(this);
                                val.push( $c.is(':checked') ? $c.val() : '' );
                            });
                        }
                        else if ( checkbox.is(':checked') )
                        {
                            val = checkbox.val( );
                        }
                        else
                        {
                            val = '';
                        }
                    }
                    else
                    {
                        val = $el.val( );
                    }
                    
                    modeldata.$trigger = $el;
                    model.set( key, val, 1, modeldata );
                }
            }
            
            // if not model update error and element is bind element
            if ( !modeldata.error && data.isBind )
                // do view action
                doAction( view, $el, evt/*, data*/ );
            
            // notify any 3rd-party also if needed
            view.publish( 'change', data );
        }
        
        ,on_model_change: function( evt, data ) {
            var view = this, model = view.$model,
                selectors = getSelectors( view.$bind, model.id + bracketed( data.key ) ),
                bindElements, autoBindElements, autobind = view.$autobind
            ;
            
            bindElements = view.get( selectors[ 0 ] );
            if ( autobind ) autoBindElements = view.get( selectors[ 1 ] );
            
            // bypass element that triggered the "model:change" event
            if ( data.$callData && data.$callData.$trigger )
            {
                bindElements = bindElements.not( data.$callData.$trigger );
                if ( autobind ) autoBindElements = autoBindElements.not( data.$callData.$trigger );
                data.$callData = null;
            }
            
            // do actions ..
            
            // do view action first
            doAction( view, bindElements, evt, data );
            
            if ( autobind && autoBindElements.length /*&& view.do_bind*/ )
                // do view autobind action to bind input elements that map to the model, afterwards
                doAutoBindAction( view, autoBindElements, evt, data );
        }

        ,on_model_error: function( evt, data ) {
            var view = this, model = view.$model,
                selectors = getSelectors( view.$bind, model.id + bracketed( data.key ) )
            ;

            // do actions ..
            
            // do view bind action first
            doAction( view, view.get( selectors[ 0 ] ), evt, data );
            if ( view.$autobind /*&& view.do_bind*/ )
                // do view autobind action to bind input elements that map to the model, afterwards
                doAutoBindAction( view, view.get( selectors[ 1 ] ), evt, data );
        }
        
        //
        // view "do_action" methods
        //
        
        // NOP action
        ,do_nop: null
        
        // set element(s) attributes/properties according to binding
        ,do_prop: function( evt, $el, data ) {
            if ( !is_type(data.prop, T_OBJ) ) return;
            
            var view = this, model = view.$model, 
                prop = data.prop, hash, p, k, v, vT
            ;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
                
            hash = { };
            for (p in prop)
            {
                k = prop[ p ];
                if ( !model.has( k ) ) continue;
                v = model.get( k ); vT = get_type( v );
                switch( p )
                {
                    case 'value':
                        $el.val( v );
                        break;
                    
                    case 'options':
                        if ( $el.is('select') && (T_ARRAY === vT) )
                        {
                            var sel, ii, vl = v.length,
                                _options = '', group = $el.find('optgroup');
                            sel = $el.val( ); // get selected value
                            if ( !group.length ) group = $el;
                            group.find( 'option' ).remove( );
                            for (ii=0; ii<vl; ii++)
                            {
                                if ( v[ii] && v[ii].label )
                                    _options += '<option value="' + v[ii].value + '">' + v[ii].label + '</option>';
                                else
                                    _options += '<option value="' + v[ii] + '">' + v[ii] + '</option>';
                            }
                            group.append( _options );
                            $el.val( sel ); // select the appropriate option
                        }
                        break;
                    
                    case 'class':
                        if ( v && v.length )
                        {
                            var v0 = v.charAt( 0 ), hasClass;
                            if ( '-' == v0 ) $el.removeClass( v.slice( 1 ) );
                            else if ( '+' == v0 ) $el.addClass( v.slice( 1 ) );
                            else if ( (hasClass=$el.hasClass( v )) ) $el.removeClass( v );
                            else if ( !hasClass ) $el.addClass( v );
                        }
                        break;
                    
                    case 'checked':
                        if ( T_BOOL === vT ) $el.prop(p, v);
                        else if ( v == $el.val( ) ) $el.prop(p, true);
                        else  $el.prop(p, false);
                        break;
                    
                    case 'disabled':
                        if ( T_BOOL === vT ) $el.prop(p, v);
                        else if ( v == $el.val( ) ) $el.prop(p, true);
                        else $el.prop(p, false);
                        break;
                        
                    default:
                        hash[ p ] = v;
                        //$el.prop( p, v );
                        //$el.attr( p, v );
                        break;
                }
            }
            $el.attr( hash );
        }
        
        // set element(s) html/text prop based on model key value
        ,do_html: function( evt, $el, data ) {
            if ( !data.key ) return;
            var view = this, model = view.$model, key = data.key, html;
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length || !key || !model.has( key ) ) return;
            html = model.get( key );
            (data.text ? $el.text( html ) : $el.html( html ));
        }
        
        // set element(s) css props based on model key value
        ,do_css: function( evt, $el, data ) {
            if ( !is_type(data.css, T_OBJ) ) return;
            var view = this, model = view.$model, css = data.css, k, p, v, hash;
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
            // css attributes
            hash = { };
            for ( p in css )
            {
                k = css[ p ]; v = model.get( k );
                if ( /*model.has( k )*/v ) hash[ p ] = v;
            }
            $el.css( hash );
        }
        
        // update/set a model field with a given value
        ,do_set: function( evt, $el, data ) {
            var view = this, model = view.$model, 
                key = data.key || model.key($el.attr(name), 1), val;
            if ( !!key ) 
            {
                if ( "value" in data ) 
                {
                    val = data.value;
                }
                else
                {
                    if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
                    val = $el.is('input,select,textarea') ? $el.val( ) : $el.text( );
                }
                model.set( key, val, 1 );
            }
        }
        
        // render an element using a custom template and model data
        ,do_tpl: function( evt, $el, data ) {
            var view = this, model, 
                key = data.key, tplID = data.tpl,
                mode, html
            ;
            if ( !view.$template || !key || !tplID ) return;
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
            
            model = view.$model;
            if ( !key || !model.has( key ) ) return;
            
            mode = data.mode || 'replace';
            if ( 'replace' == mode ) $el.empty( );
            html = view.$template( tplID, model.get( key ) );
            if ( html ) $el.append( html );
        }
        
        // show/hide element(s) according to binding
        ,do_show: function( evt, $el, data ) {
            var view = this, model = view.$model, key = data.key;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length || !key ) return;
                
            if ( 'value' in data )
            {
                // show if data[key] is value, else hide
                if ( data.value === model.get( key ) ) $el.show( );
                else $el.hide( );
            }
            else
            {
                // show if data[key] is true, else hide
                if ( !!model.get( key ) ) $el.show( );
                else $el.hide( );
            }
        }
        
        // hide/show element(s) according to binding
        ,do_hide: function( evt, $el, data ) {
            var view = this, model = view.$model, key = data.key;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length || !key ) return;
                
            if ( 'value' in data )
            {
                // hide if data[key] is value, else show
                if ( data.value === model.get( key ) ) $el.hide( );
                else $el.show( );
            }
            else
            {
                // hide if data[key] is true, else show
                if ( !!model.get( key ) ) $el.hide( );
                else $el.show( );
            }
        }
        
        // default bind/update element(s) values according to binding on model:change
        ,do_bind: function( evt, $el, data ) {
            var view = this, model = view.$model, 
                name = data.name, key = data.key, 
                value, valueT, val
            ;
            
            // use already computed/cached key/value from calling method passed in "data"
            if ( !key ) return;
            value = data.value; valueT = get_type( value ); val = $el.val( );
            
            if ( $el.is(':radio') )
            {
                if ( value == val )
                {
                    view.get('input[name="'+name+'"]').not( $el ).prop('checked', false);
                    $el.prop('checked', true);
                }
            }
            
            else if ( $el.is(':checkbox') )
            {
                var checkbox = view.get('input[type="checkbox"][name="'+name+'"]'); 
                
                if ( checkbox.length > 1 && (T_ARRAY === valueT) )
                {
                    checkbox.each(function(i, v) {
                        var $this = $(this);
                        if ( $.inArray($this.val(), value) > -1 )  $this.prop('checked', true);
                        else $this.prop('checked', false);
                    });
                }
                
                else if ( T_BOOL === valueT )
                {
                    $el.prop('checked', value);
                }
                
                else if ( value == val )
                {
                    $el.prop('checked', true);
                }
                
                else
                {
                    $el.prop('checked', false);
                }
            }
            else
            {
                $el.val( value );
            }
        }
        
        ,toString: function( ) {
            return '[ModelView.View id: '+this.id+']';
        }
    });
