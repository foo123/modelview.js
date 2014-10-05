/**
*
*   ModelView.js (jQuery plugin, jQueryUI widget optional)
*   @version: @@VERSION@@
*
*   A micro-MV* (MVVM) framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
!function( ModelView, window, undef ) {
    "use strict";
    
    ModelView.jquery = function( $ ) {
        "use strict";
        
        if ( !$.ModelView )
        {
            // add it to root jQuery object as a jQuery reference
            $.ModelView = ModelView;
            
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
                    ,autoSync: true
                    ,autobind: false
                    ,bindbubble: false
                    ,bindAttribute: 'data-bind'
                    ,inlineTplFormat: '$(__KEY__)'
                    ,cacheSize: View._CACHE_SIZE
                    ,refreshInterval: View._REFRESH_INTERVAL
                    
                    ,model: null
                    ,template: null
                    ,events: null
                    ,actions: { }
                    ,handlers: { }
                }
            ;
            
            // modelview jQuery plugin
            $.fn.modelview = function( arg0, arg1, arg2 ) {
                var argslen = arguments.length, 
                    method = argslen ? arg0 : null, 
                    options = arg0,
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
                            if ( argslen > 1 )
                            {
                                view.model( arg1 ); 
                                return this;
                            }
                                
                            map.push( model );
                        }
                        else if ( 'data' === method ) 
                        {
                            if ( argslen > 1 )
                            {
                                model.data( arg1 ); 
                                return this;
                            }
                                
                            map.push( model.data( ) );
                        }
                        else if ( 'sync' === method ) 
                        {
                            view.sync( arg1 );
                        }
                        else if ( 'reset' === method ) 
                        {
                            view.reset( );
                        }
                        else if ( 'dispose' === method ) 
                        {
                            $dom.data( 'modelview', null );
                            view.dispose( );
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
                    view
                        .inlineTplFormat( options.inlineTplFormat )
                        .bindbubble( options.bindbubble )
                        .autobind( options.autobind )
                        .bind( options.events, $dom[0] )
                    ;
                    $dom.data( 'modelview', view );
                    if ( options.autoSync ) view.sync( );
                });
                
                // chainable or values return
                return ( !isInit && map.length ) ? ( 1 == this.length ? map[ 0 ] : map ) : this;
            };
        }
        
        // add modelview as a jQueryUI widget as well if jQueryuI is loaded
        // to create state-full, self-contained, full-MVC widgets (e.g calendars, grids, etc..)
        if ( $.widget && (!$.mvc || !$.mvc.ModelViewWidget) )
        {
            $.widget( 'mvc.ModelViewWidget', {
                
                options: { },
                
                $view: null,
                
                _create: function() {
                    var self = this;
                    self.element.modelview( self.options );
                    self.$view = self.element.modelview( 'view' );
                },
                
                value: function( k, v ) {
                    var self = this;
                    if ( 1 < arguments.length ) 
                    {
                        self.$view.$model.set( k, v, true );
                        return self.element;
                    }
                    return self.$view.$model.get( k );
                },
                
                _destroy: function() {
                    var self = this.
                    self.$view = null;
                    self.element.modelview( 'dispose' );
                }
            });
        }
    };
    
    // add to jQuery if available/accesible now
    if ( 'undefined' !== typeof window.jQuery ) ModelView.jquery( window.jQuery );
    
}( exports['@@MODULE_NAME@@'], this );
