/**
*
*   ModelView.js (jQuery plugin, optional)
*   @version: @@VERSION@@
*   @@DEPENDENCIES@@
*
*   A micro-MV* (MVVM) jQuery-based framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
!function( ModelView, $, undef ) {

    "use strict";
    
    var slice = Function.prototype.call.bind( Array.prototype.slice ),
        extend = $.extend, View = ModelView.View, Model = ModelView.Model,
        defaultModel = {
            id: 'model'
            ,data: { }
            ,types: { }
            ,validators: { }
            ,getters: { }
            ,setters: { }
        },
        defaultOptions = {
            
            viewClass: View
            ,modelClass: Model
            
            ,id: 'view'
            
            ,autobind: false
            ,bindbubble: false
            ,bindAttribute: 'data-bind'
            ,cacheSize: View._CACHE_SIZE
            ,refreshInterval: View._REFRESH_INTERVAL
            
            ,model: null
            ,template: null
            ,events: null
            ,actions: { }
            ,handlers: { }
        }
    ;
    
    // add it to root jQuery object as a jQuery reference
    $.ModelView = ModelView;
    
    // modelview jQuery plugin
    $.fn.modelview = function( options ) {
        var args = slice( arguments ), 
            method = args.length ? args.shift( ) : null, 
            isInit = true, optionsParsed = false,  map = [ ]
        ;
        
        // apply for each matched element (better use one element per time)
        this.each(function( ) {
            
            var $dom = $(this), model, view, handler;
            
            // modelview already set on element
            if ( $dom.data( 'modelview' ) )
            {
                isInit = false;
                
                view = $dom.data( 'modelview' );
                model = view.$model;
                
                // methods
                if ( 'view' === method ) 
                {
                    map.push( view );
                }
                else if ( 'model' === method ) 
                {
                    if ( args.length )
                    {
                        model.apply( view, args ); 
                        return this;
                    }
                        
                    map.push( model );
                }
                else if ( 'data' === method ) 
                {
                    if ( args.length )
                    {
                        model.data.apply( view.$model, args ); 
                        return this;
                    }
                        
                    map.push( model.data( ) );
                }
                else if ( 'dispose' === method ) 
                {
                    $dom.data( 'modelview', null );
                    view.dispose( );
                }
                else if ( 'sync' === method ) 
                {
                    view.sync.apply( view, args );
                }
                else if ( 'refresh' === method ) 
                {
                    view.refresh.apply( view, args );
                }
                
                return this;
            }
            
            if ( !optionsParsed )
            {
                // parse options once
                options = extend( {}, defaultOptions, options );
                
                if ( options.model && !(options.model instanceof Model) )
                {
                    options.model = extend( {}, defaultModel, options.model );
                }
                
                optionsParsed = true;
            }
            
            if ( !options.model ) return this;
            
            model = (options.model instanceof Model) 
                    ? options.model 
                    : new options.modelClass(
                        options.model.id, 
                        options.model.data, 
                        options.model.types, 
                        options.model.validators, 
                        options.model.getters, 
                        options.model.setters
                    )
                ;
            
            view = new options.viewClass(
                options.id, model, 
                { bind: options.bindAttribute || 'data-bind' },
                options.cacheSize, options.refreshInterval
            );
            
            // custom view template renderer
            if ( options.template )
            {
                view.template( options.template );
            }
            // custom view event handlers
            if ( options.handlers )
            {
                for (var eventname in options.handlers)
                {
                    handler = options.handlers[ eventname ];
                    if ( handler ) view.event( eventname, handler );
                }
            }
            // custom view actions
            if ( options.actions )
            {
                for (var action in options.actions)
                {
                    handler = options.actions[ action ];
                    if ( handler ) view.action( action, handler );
                }
            }
            
            // init view
            $dom.data( 'modelview', view );
            view
                .bindbubble( options.bindbubble )
                .autobind( options.autobind )
                .bind( options.events, $dom )
                //.sync( )
            ;
        });
        
        // chainable or values return
        return ( !isInit && map.length ) ? ( 1 == this.length ? map[ 0 ] : map ) : this;
    };

}(@@EXPORTS@@['@@MODULE_NAME@@'], jQuery);
