/**
*
*   ModelView.js
*   @version: 0.26.3
*   @dependencies: jQuery
*
*   A micro-MV* (MVVM) jQuery-based framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/!function ( root, name, deps, factory ) {
    "use strict";
    
    //
    // export the module umd-style (with deps bundled-in or external)
    
    // Get current filename/path
    function getPath( isNode, isWebWorker, isAMD, isBrowser, amdMod ) 
    {
        var f;
        if (isNode) return {file:__filename, path:__dirname};
        else if (isWebWorker) return {file:(f=self.location.href), path:f.split('/').slice(0, -1).join('/')};
        else if (isAMD&&amdMod&&amdMod.uri)  return {file:(f=amdMod.uri), path:f.split('/').slice(0, -1).join('/')};
        else if (isBrowser&&(f=document.getElementsByTagName('script'))&&f.length) return {file:(f=f[f.length - 1].src), path:f.split('/').slice(0, -1).join('/')};
        return {file:null,  path:null};
    }
    function getDeps( names, paths, deps, depsType, require/*offset*/ )
    {
        //offset = offset || 0;
        var i, dl = names.length, mods = new Array( dl );
        for (i=0; i<dl; i++) 
            mods[ i ] = (1 === depsType)
                    ? /* node */ (deps[ names[ i ] ] || require( paths[ i ] )) 
                    : (2 === depsType ? /* amd args */ /*(deps[ i + offset ])*/ (require( names[ i ] )) : /* globals */ (deps[ names[ i ] ]))
                ;
        return mods;
    }
    // load javascript(s) (a)sync using <script> tags if browser, or importScripts if worker
    function loadScripts( scope, base, names, paths, callback, imported )
    {
        var dl = names.length, i, rel, t, load, next, head, link;
        if ( imported )
        {
            for (i=0; i<dl; i++) if ( !(names[ i ] in scope) ) importScripts( base + paths[ i ] );
            return callback( );
        }
        head = document.getElementsByTagName("head")[ 0 ]; link = document.createElement( 'a' );
        rel = /^\./; t = 0; i = 0;
        load = function( url, cb ) {
            var done = 0, script = document.createElement('script');
            script.type = 'text/javascript'; script.language = 'javascript';
            script.onload = script.onreadystatechange = function( ) {
                if (!done && (!script.readyState || script.readyState == 'loaded' || script.readyState == 'complete'))
                {
                    done = 1; script.onload = script.onreadystatechange = null;
                    cb( );
                    head.removeChild( script ); script = null;
                }
            }
            if ( rel.test( url ) ) 
            {
                // http://stackoverflow.com/a/14781678/3591273
                // let the browser generate abs path
                link.href = base + url;
                url = link.protocol + "//" + link.host + link.pathname + link.search + link.hash;
            }
            // load it
            script.src = url; head.appendChild( script );
        };
        next = function( ) {
            if ( names[ i ] in scope )
            {
                if ( ++i >= dl ) callback( );
                else if ( names[ i ] in scope ) next( ); 
                else load( paths[ i ], next );
            }
            else if ( ++t < 30 ) { setTimeout( next, 30 ); }
            else { t = 0; i++; next( ); }
        };
        while ( i < dl && (names[ i ] in scope) ) i++;
        if ( i < dl ) load( paths[ i ], next );
        else callback( );
    }
    
    deps = deps || [[],[]];
    
    var isNode = ("undefined" !== typeof global) && ("[object global]" === {}.toString.call(global)),
        isBrowser = !isNode && ("undefined" !== typeof navigator), 
        isWebWorker = !isNode && ("function" === typeof importScripts) && (navigator instanceof WorkerNavigator),
        isAMD = ("function" === typeof define) && define.amd,
        isCommonJS = isNode && ("object" === typeof module) && module.exports,
        currentGlobal = isWebWorker ? self : root, currentPath = getPath( isNode, isWebWorker, isAMD, isBrowser ), m,
        names = [].concat(deps[0]), paths = [].concat(deps[1]), dl = names.length, i, requireJSPath, ext_js = /\.js$/i
    ;
    
    // commonjs, node, etc..
    if ( isCommonJS ) 
    {
        module.$deps = module.$deps || {};
        module.exports = module.$deps[ name ] = factory.apply( root, [{NODE:module}].concat(getDeps( names, paths, module.$deps, 1, require )) ) || 1;
    }
    
    // amd, requirejs, etc..
    else if ( isAMD && ("function" === typeof require) && ("function" === typeof require.specified) &&
        require.specified(name) ) 
    {
        if ( !require.defined(name) )
        {
            requireJSPath = { };
            for (i=0; i<dl; i++) 
                require.specified( names[ i ] ) || (requireJSPath[ names[ i ] ] = paths[ i ].replace(ext_js, ''));
            //requireJSPath[ name ] = currentPath.file.replace(ext_js, '');
            require.config({ paths: requireJSPath });
            // named modules, require the module by name given
            define( name, ["require", "exports", "module"].concat( names ), function( require, exports, module ) {
                return factory.apply( root, [{AMD:module}].concat(getDeps( names, paths, arguments, 2, require )) );
            });
        }
    }
    
    // browser, web worker, other loaders, etc.. + AMD optional
    else if ( !(name in currentGlobal) )
    {
        loadScripts( currentGlobal, currentPath.path + '/', names, paths, function( ){ 
            currentGlobal[ name ] = m = factory.apply( root, [{}].concat(getDeps( names, paths, currentGlobal )) ) || 1; 
            isAMD && define( name, ["require"], function( ){ return m; } );
        }, isWebWorker);
    }


}(  /* current root */          this, 
    /* module name */           "ModelView",
    /* module dependencies */   [['jQuery'],['./jquery.js']], 
    /* module factory */        function( exports, jQuery ) {
        
    /* main code starts here */

/**
*
*   ModelView.js
*   @version: 0.26.3
*   @dependencies: jQuery
*
*   A micro-MV* (MVVM) jQuery-based framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
// jQuery should be already loaded, it is a dependency
!function( exports, $, undef ) {
    
    "use strict";
    
    /**
    *   uses concepts from various MV* frameworks like:
    *       knockoutjs 
    *       agility.js
    *       backbone.js 
    **/
    
    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //
    // utility functions
    //
    //
    ///////////////////////////////////////////////////////////////////////////////////////
    
    var bindF = function( f, scope ) { return f.bind(scope); },
        proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
        Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys,
        Func = Function, FP = Func[proto], Str = String, SP = Str[proto], FPCall = FP.call,
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
        hasProp = bindF(FPCall, OP.hasOwnProperty), toStr = bindF(FPCall, OP.toString), slice = bindF(FPCall, AP.slice),
        
        is_instance = function( o, T ){ return o instanceof T; }, //typeOff = function( v ){ return typeof(v); },
        
        newFunc = function( args, code ){ return new Func(args, code); },
        
        INF = Infinity, rnd = Math.random, parse_float = parseFloat, 
        parse_int = parseInt, is_nan = isNaN, is_finite = isFinite,
        
        // types
        T_NUM = 2, T_NAN = 3, /*T_INF = 3,*/ T_BOOL = 4, T_STR = 8, T_CHAR = 9,
        T_ARRAY = 16, T_OBJ = 32, T_FUNC = 64, T_REGEX = 128,  
        T_NULL = 256, T_UNDEF = 512, T_UNKNOWN = 1024, 
        T_ARRAY_OR_OBJ = T_ARRAY | T_OBJ, T_ARRAY_OR_STR = T_ARRAY | T_STR,
        
        get_type = function( v ) {
            var type_of, to_string;
            
            if (null === v)  return T_NULL;
            
            else if (true === v || false === v)  return T_BOOL;
            
            type_of = typeof(v); to_string = toStr(v);
            
            if (undef === v || "undefined" === type_of)  return T_UNDEF;
            
            else if (v instanceof Num || "number" === type_of)  return is_nan(v) ? T_NAN : T_NUM;
            
            else if (v instanceof Str || "string" === type_of) return (1 === v.length) ? T_CHAR : T_STR;
            
            else if (v instanceof Arr || "[object Array]" === to_string)  return T_ARRAY;
            
            else if (v instanceof Regex || "[object RegExp]" === to_string)  return T_REGEX;
            
            else if (v instanceof Func || ("function" === type_of && "[object Function]" === to_string))  return T_FUNC;
            
            else if ("[object Object]" === to_string)  return T_OBJ;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        is_type = function( v, type ) { return !!( type & get_type( v ) ); },

        ATTR = 'getAttribute', SET_ATTR = 'setAttribute', 
        CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
        NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value', 
        OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
        STYLE = 'style', CLASS = 'className', HTML = 'innerHTML', TEXT = 'innerText', TEXTC = 'textContent',
        
        /*INPUT_SELECT_TEXTAREA = 'input|select|textarea|INPUT|SELECT|TEXTAREA',
        
        is_input_element = function( el ) {
            return -1 < INPUT_SELECT_TEXTAREA.indexOf( el[TAG] );
        },
        
        element_is = function( el, check, what ) {
            return what === el[check];
        },*/
        
        opt_val = function( o ) {
            // attributes.value is undefined in Blackberry 4.7 but
            // uses .value. See #6932
            var val = o.attributes[VAL];
            return !val || val.specified ? o[VAL] : o.text;
        },
        
        // adapted from jQuery
        select_get = function( el ) {
            var val, opt, options = el[OPTIONS], sel_index = el[SELECTED_INDEX],
                one = "select-one" === el[TYPE] || sel_index < 0,
                values = one ? null : [],
                max = one ? sel_index + 1 : options.length,
                i = sel_index < 0 ? max : (one ? sel_index : 0)
            ;

            // Loop through all the selected options
            for ( ; i<max; i++ ) 
            {
                opt = options[ i ];

                // oldIE doesn't update selected after form reset (#2551)
                if ( ( opt[SELECTED] || i === sel_index ) &&
                    // Don't return options that are disabled or in a disabled optgroup
                    ( !opt[DISABLED] ) &&
                    ( !opt[PARENT][DISABLED] || "optgroup" !== opt[PARENT][TAG] ) 
                ) 
                {
                    // Get the specific value for the option
                    val = opt_val( opt );
                    // We don't need an array for one selects
                    if ( one ) return val;
                    // Multi-Selects return an array
                    values.push( val );
                }
            }
            return values;
        },
        
        select_set = function( el, v ) {
            var values = [ ].concat( v ), 
                options = el[OPTIONS],//el.getElementsByTagName('option'), 
                opt, i, sel_index = -1
            ;
            
            for (i=0; i<options.length; i++ )
            {
                opt = options[ i ];
                opt[SELECTED] = -1 < values.indexOf( opt_val( opt ) );
                //if ( opt[SELECTED] ) sel_index = i;
            }
            if ( !values.length ) el[SELECTED_INDEX] = -1;
        },
        
        get_val = function( el ) {
            if ( !el ) return;
            switch( el[TAG].toLowerCase( ) )
            {
                case 'textarea':case 'input': return el[VAL/*HTML*/];
                case 'select': return select_get( el );
                default: return (TEXTC in el) ? el[TEXTC] : el[TEXT];
            }
        },
        
        set_val = function( el, v ) {
            if ( !el ) return;
            switch( el[TAG].toLowerCase( ) )
            {
                case 'textarea':case 'input': el[VAL/*HTML*/] = v; break;
                case 'select': select_set( el, v ); break;
                default: 
                    if ( TEXTC in el ) el[TEXTC] = v; 
                    else el[TEXT] = v;
                    break;
            }
        },
        
        // http://stackoverflow.com/a/2364000/3591273
        getStyle = window.getComputedStyle || function( el ) { return el.currentStyle; },
        
        show = function( el ) {
            if ( !el._displayCached ) el._displayCached = getStyle( el, null ).display || 'block';
            el[STYLE].display = 'none' !== el._displayCached ? el._displayCached : 'block';
            el._displayCached = undef;
        },
        
        hide = function( el ) {
            if ( !el._displayCached ) el._displayCached = getStyle( el, null ).display || 'block';
            el[STYLE].display = 'none';
        },
        
        fromJSON = JSON.parse, toJSON = JSON.stringify,
        
        // http://www.sitepoint.com/jquery-vs-raw-javascript-1-dom-forms/
        //SELECT = 'querySelectorAll', SELECT_FIRST = 'querySelector', BY_ID = 'getElementById',
        //BY_TAG = 'getElementsByTagName', BY_CLASS = 'getElementsByClassName',
        
        NOW = function( ) { return new Date( ).getTime( ); },
        
        // jQuery methods
        Event = $.Event, extend = $.extend
    ;
    
    // use native methods and abbreviation aliases if available
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    if ( !SP.trim ) SP.trim = function( ) { return this.replace(/^\s+|\s+$/g, ''); };
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    if ( !SP.startsWith ) SP.startsWith = function( prefix, pos ) { pos=pos||0; return ( prefix === this.substr(pos, prefix.length+pos) ); };
    SP.tR = SP.trim; SP.sW = SP.startsWith;
    
    var
        WILDCARD = "*", NAMESPACE = "modelview",
        
        // http://stackoverflow.com/questions/6449611/how-to-check-whether-a-value-is-a-number-in-javascript-or-jquery
        is_numeric = function( n ) { return !is_nan( parse_float( n ) ) && is_finite( n ); },
    
        is_array_index = function( n ) {
            if ( is_numeric( n ) ) // is numeric
            {
                n = +n;  // make number if not already
                if ( (0 === n % 1) && n >= 0 ) // and is positive integer
                    return true;
            }
            return false
        },
    
        Mixin = function(/* var args here.. */) { 
            var args = slice( arguments ), argslen, 
                o1, o2, v, p, i, T ;
            o1 = args.shift( ) || {}; 
            argslen = args.length;
            for (i=0; i<argslen; i++)
            {
                o2 = args[ i ];
                if ( T_OBJ === get_type( o2 ) )
                {
                    for (p in o2)
                    {            
                        v = o2[ p ];
                        T = get_type( v );
                        
                        if ( T_NUM & T )
                            // shallow copy for numbers, better ??
                            o1[ p ] = 0 + v;  
                        
                        else if ( T_ARRAY_OR_STR & T )
                            // shallow copy for arrays or strings, better ??
                            o1[ p ] = v.slice( 0 );  
                        
                        else
                            // just reference copy
                            o1[ p ] = v;  
                    }
                }
            }
            return o1; 
        },

        hasNamespace = function( evt, namespace ) { 
            return !!evt.namespace && new Regex( "\\b" + namespace + "\\b" ).test( evt.namespace || '' ); 
        },
        
        getNext = function( a, k ) {
            if ( !a ) return null;
            var b = [ ], i, ai, l = a.length;
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai )
                {
                    if ( ai[ k ] ) b.push( ai[ k ].next );
                    if ( ai[ WILDCARD ] ) b.push( ai[ WILDCARD ].next );
                }
            }
            return b.length ? b : null;
        },
        
        getValue = function( a, k ) {
            if ( !a ) return null;
            var i, ai, l = a.length;
            if ( k )
            {
                for (i=0; i<l; i++)
                {
                    ai = a[ i ];
                    if ( ai )
                    {
                        if ( ai[ k ] && ai[ k ].value ) return ai[ k ].value;
                        if ( ai[ WILDCARD ] && ai[ WILDCARD ].value ) return ai[ WILDCARD ].value;
                    }
                }
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    ai = a[ i ];
                    if ( ai && ai.value )  return ai.value;
                }
            }
            return null;
        },
        
        walkadd = function( v, p, obj, isCollectionEach ) {
            var o = obj, k;
            while ( p.length )
            {
                k = p.shift( );
                if ( !(k in o) ) o[ k ] = { value: null, next: {} };
                o = o[ k ];
                if ( p.length ) 
                {
                    o = o.next;
                }
                else 
                {
                    if ( isCollectionEach )
                    {
                        if ( !(WILDCARD in o.next) ) o.next[ WILDCARD ] = { value: null, next: {} };
                        o.next[ WILDCARD ].value = v;
                    }
                    else
                    {
                        o.value = v;
                    }
                }
            }
            return obj;
        },
        
        walkcheck = function( p, obj, aux, C ) {
            var o = obj, a = aux ? [aux] : null, k, to;
            while ( p.length ) 
            {
                k = p.shift( );
                to = get_type( o );
                if ( p.length )
                {
                    if ( (to&T_ARRAY_OR_OBJ) && (k in o) )
                    {
                        o = o[ k ];
                        // nested sub-composite class
                        if ( o instanceof C ) return [C, o, p];
                        a && (a = getNext( a, k ));
                    }
                    else if ( !a || !(a = getNext( a, k )) )
                    {
                        return false;
                    }
                }
                else
                {
                    if ( a && getValue( a, k ) ) return true;
                    else if ( (to&T_ARRAY_OR_OBJ) && (k in o) ) return true;
                    else if ( T_OBJ === to && 'length' == k ) return true;
                    return false;
                }
            }
            return false;
        },
        
        walk2 = function( p, obj, aux, C ) {
            var o = obj, a = aux ? [aux] : null, k, to;
            while ( p.length ) 
            {
                k = p.shift( );
                to = get_type( o );
                if ( p.length )
                {
                    if ( (to&T_ARRAY_OR_OBJ) && (k in o) )
                    {
                        o = o[ k ];
                        // nested sub-composite class
                        if ( o instanceof C ) return [C, o, p];
                        a && (a = getNext( a, k ));
                    }
                    else if ( !a || !(a = getNext( a, k )) )
                    {
                        return false;
                    }
                }
                else
                {
                    if ( a && (a = getValue( a, k )) ) return [false, a];
                    else if ( (to&T_ARRAY_OR_OBJ) && (k in o) ) return [true, o[k]];
                    else if ( T_OBJ === to && 'length' == k ) return [true, Keys(o).length];
                    return false;
                }
            }
            return false;
        },
        
        walk3 = function( p, obj, aux1, aux2, aux3, C, all3 ) {
            var o = obj, a1 = null, a2 = null, a3 = null, 
                k, to
            ;
            all3 = false !== all3;
            if ( all3 ) { a1 = [aux1]; a2 = [aux2]; a3 = [aux3]; }
            
            while ( p.length ) 
            {
                k = p.shift( );
                to = get_type( o );
                if ( p.length )
                {
                    if ( (to&T_ARRAY_OR_OBJ) && (k in o) )
                    {
                        o = o[ k ];
                        // nested sub-composite class
                        if ( o instanceof C ) return [C, o, p, 0, null, null, null];
                        if ( all3 )
                        {
                            a1 = getNext( a1, k );
                            a2 = getNext( a2, k );
                            a3 = getNext( a3, k );
                        }
                    }
                    else
                    {
                        return [false, o, k, p, null, null, null];
                    }
                }
                else if ( (to&T_ARRAY_OR_OBJ) ) 
                {
                    
                    // nested sub-composite class
                    if ( o[ k ] instanceof C )
                        return [C, o[k], p, 0, null, null, null];
                    else if ((k in o) /*|| (to === T_OBJ && "length" === k)*/) 
                        return [true, o, k, p, a1, a2, a3];
                    return [false, o, k, p, a1, a2, a3];
                }
            }
            return [false, o, k, p, null, null, null];
        },
        
        // UUID counter for Modelviews
        _uuidCnt = 0,
            
        // get a Universal Unique Identifier (UUID)
        uuid =  function( namespace ) {
            return [ namespace||'UUID', ++_uuidCnt, NOW( ) ].join( '_' );
        },
        
        // namespaced events, play nice with possible others
        NSEvent = function( evt, namespace ) { 
            var nsevent = [ ( evt || "" ), NAMESPACE ]; 
            if ( namespace ) nsevent = nsevent.concat( namespace );
            return nsevent.join( '.' )
        }
    ;
    //
    // PublishSubscribe (Interface)
    var PublishSubscribe = {
    
        $PB: null
        ,namespace: null
        
        ,initPubSub: function( ) {
            var self = this;
            // use a jQuery object as simple PubSub
            self.$PB = $( {} );
            return self;
        }
        
        ,disposePubSub: function( ) {
            var self = this;
            // unbind all namespaced events on this pubsub
            self.$PB.off( NSEvent('') ); 
            self.$PB = null;
            return self;
        }
        
        ,trigger: function( message, data, namespace ) {
            var self = this;
            if ( self.namespace )
                namespace = namespace ? [self.namespace].concat(namespace) : [self.namespace];
            
            self.$PB.trigger( NSEvent(message, namespace), data );
            return self;
        }
        
        ,on: function( message, callback, namespace ) {
            var self = this;
            if ( is_type( callback, T_FUNC ) )
            {
                if ( self.namespace )
                    namespace = namespace ? [self.namespace].concat(namespace) : [self.namespace];
            
                self.$PB.on( NSEvent(message, namespace), callback );
            }
            return self;
        }
        
        ,onTo: function( pubSub, message, callback, namespace ) {
            var self = this;
            if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
            pubSub.on( message, callback, namespace );
            return self;
        }
        
        ,off: function( message, callback, namespace ) {
            var self = this;
            if ( self.namespace )
                namespace = namespace ? [self.namespace].concat(namespace) : [self.namespace];
            
            if ( is_type( callback, T_FUNC ) ) 
                self.$PB.off( NSEvent(message, namespace), callback );
            else 
                self.$PB.off( NSEvent(message, namespace) );
            return self;
        }
        
        ,offFrom: function( pubSub, message, callback, namespace ) {
            var self = this;
            if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
            pubSub.off( message, callback, namespace );
            return self;
        }
    };
    // aliases
    PublishSubscribe.publish = PublishSubscribe.trigger;
    //
    // Cache with max duration and max size conditions
    var Cache = function( cacheSize, refreshInterval ) {
        var self = this, argslen = arguments.length;
        self.$store = { };
        self.$size = INF;
        self.$interval = INF;
        if ( argslen > 0 && cacheSize > 0 ) self.$size = cacheSize;
        if ( argslen > 1 && refreshInterval > 0 ) self.$interval = refreshInterval;
    };
    Cache[proto] = {
        
        constructor: Cache
        
        ,$store: null
        ,$size: null
        ,$interval: null
        
        ,dispose: function( ) {
            var self = this;
            self.$store = null;
            self.$size = null;
            self.$interval = null;
            return self;
        }

        ,reset: function( ) {
            this.$store = { };
            return this;
        }
        
        ,size: function( size ) {
            if ( arguments.length )
            {
                if ( size > 0 ) this.$size = size;
                return this;
            }
            return this.$size;
        }
        
        ,interval: function( interval ) {
            if ( arguments.length )
            {
                if ( interval > 0 ) this.$interval = interval;
                return this;
            }
            return this.$interval;
        }
        
        ,has: function( key ) {
            var self = this, sk = key ? self.$store[ key ] : null;
            return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
        }
        
        ,get: function( key ) {
            if ( key )
            {
                var self = this, sk = self.$store[ key ];
                if ( sk )
                {
                    if ( ( NOW( ) - sk.time ) > self.$interval )
                    {
                        delete self.$store[ key ];
                        return undef;
                    }
                    else
                    {
                        return sk.data;
                    }
                }
            }
            return undef;
        }
        
        ,set: function( key, val ) {
            var self = this, store, size, storekeys;
            if ( key )
            {
                store = self.$store; size = self.$size; storekeys = Keys( store );
                // assuming js hash-keys maintain order in which they were added
                // then this same order is also chronological
                // and can remove top-k elements which should be the k-outdated also
                while ( storekeys.length >= size ) delete store[ storekeys.shift( ) ];
                store[ key ] = { data: val, time: NOW( ) };
            }
            return self;
        }
        
        ,del: function( key ) {
            if ( key && this.$store[ key ] ) delete this.$store[ key ];
            return this;
        }
    
        ,toString: function( ) {
            return '[ModelView.Cache]';
        }
    };
    //
    // Data Types / Validators (Static)
    var 
        // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
        dotted = function( key ) {
            return key
                    .replace(/\[([^\]]*)\]/g, '.$1')         // convert indexes to properties
                    .replace(/^\.+/, '')                       // strip a leading dot
                    .replace(/\.+$/, '')                       // strip trailing dots
            ;
        },
        
        bracketed = function( dottedKey ) { return '['+dottedKey.split('.').join('][')+']'; },
        
        removePrefix = function( prefix ) {
            // strict mode (after prefix, a key follows)
            var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
            return function( key, to_dotted ) { 
                var k = key.replace( regex, '$1' );
                return to_dotted ? dotted( k ) : k;
            };
        },
    
        keyLevelUp = function( dottedKey, level ) {
            return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
        },
        
        ModelField = function( modelField ) {
            if ( !is_instance(this, ModelField) ) return new ModelField( modelField );
            this.f = modelField || null;
        },
        
        CollectionEach = function( f ) {
            if ( !is_instance(this, CollectionEach) ) return new CollectionEach( f );
            this.f = f || null;
        },
        
        bindFieldsToModel = function( model, fields ) {
            var p, t;
            for ( p in fields )
            {
                t = fields[ p ];
                if ( is_instance( t, CollectionEach ) )
                {
                    fields[ p ] = bindF( t.f, model );
                    fields[ p ].fEach = true;
                }
                else
                {
                    fields[ p ] = bindF( t, model );
                }
            }
            return fields;
        },
        
        // Type Compositor
        TC = function( T ) {
            
            T.BEFORE = function( T2 ) {
                return TC(function( v, k ) { 
                    var self = this;
                    return T2.call(self, T.call(self, v, k), k);
                }); 
            };
            T.AFTER = function( T2 ) {
                return TC(function( v, k ) { 
                    var self = this;
                    return T.call(self, T2.call(self, v, k), k);
                }); 
            };
            
            return T;
        },
            
        // Validator Compositor
        VC = function( V ) {
            
            V.NOT = function( ) { 
                return VC(function( v, k ) { 
                    return !V.call(this, v, k); 
                }); 
            };
            
            V.AND = function( V2 ) { 
                return VC(function( v, k ) { 
                    var self = this;
                    return V.call(self, v, k) && V2.call(self, v, k);
                }); 
            };
            
            V.OR = function( V2 ) { 
                return VC(function( v, k ) { 
                    var self = this;
                    return V.call(self, v, k) || V2.call(self, v, k);
                }); 
            };

            V.XOR = function( V2 ) { 
                return VC(function( v, k ) { 
                    var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                    return (r1 && !r2) || (r2 && !r1);
                }); 
            };
            
            return V;
        },
        
        Type = {
            
            TypeCaster: TC
            
            // default type casters
            ,Cast: {
                // collection for each item type caster
                EACH: CollectionEach,
                
                // type caster for each specific field of an object
                FIELDS: function( typesPerField ) {
                    var notbinded = true;
                    typesPerField = extend( {}, typesPerField || {} );
                    return TC(function( v ) { 
                        var field, type, val, l, i;
                        if ( notbinded ) { bindFieldsToModel( this, typesPerField ); notbinded = false; }
                        for ( field in typesPerField )
                        {
                            type = typesPerField[ field ]; val = v[ field ];
                            if ( type.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) val[ i ] = type( val[ i ] );
                               v[ field ] = val;
                            }
                            else
                            {
                                v[ field ] = type( val );
                            }
                        }
                        return v;
                    }); 
                },
                
                DEFAULT: function( defaultValue ) {  
                    return TC(function( v ) { 
                        var T = get_type( v );
                        if ( (T_UNDEF & T) || ((T_STR & T) && !v.tR().length)  ) v = defaultValue;
                        return v;
                    }); 
                },
                BOOL: TC(function( v ) { 
                    return !!v; 
                }),
                INT: TC(function( v ) { 
                    return parseInt(v, 10);
                }),
                FLOAT: TC(function( v ) { 
                    return parseFloat(v, 10); 
                }),
                MIN: function( m ) {  
                    return TC(function( v ) { return (v < m) ? m : v; }); 
                },
                MAX: function( M ) {  
                    return TC(function( v ) { return (v > M) ? M : v; }); 
                },
                CLAMP: function( m, M ) {  
                    // swap
                    if ( m > M ) { var tmp = M; M = m; m = tmp; }
                    return TC(function( v ) { return (v < m) ? m : ((v > M) ? M : v); }); 
                },
                TRIM: TC(function( v ) { 
                    return Str(v).tR();
                }),
                LCASE: TC(function( v ) { 
                    return Str(v).toLowerCase( );
                }),
                UCASE: TC(function( v ) { 
                    return Str(v).toUpperCase( );
                }),
                STR: TC(function( v ) { 
                    return (''+v); 
                })
            }
            
            ,add: function( type, handler ) {
                if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) Type.Cast[ type ] = TC( handler );
                return Type;
            }
            
            ,del: function( type ) {
                if ( is_type( type, T_STR ) && Type.Cast[ type ] ) delete Type.Cast[ type ];
                return Type;
            }
        
            ,toString: function( ) {
                return '[ModelView.Type]';
            }
        },
        
        Validation = {
            
            Validator: VC
            
            // default validators
            ,Validate: {
                // collection for each item validator
                EACH: CollectionEach,
                
                // validator for each specific field of an object
                FIELDS: function( validatorsPerField ) {
                    var notbinded = true;
                    validatorsPerField = extend( {}, validatorsPerField || {} );
                    return VC(function( v ) { 
                        var field, validator, val, l, i;
                        if ( notbinded ) { bindFieldsToModel( this, validatorsPerField ); notbinded = false; }
                        for ( field in validatorsPerField )
                        {
                            validator = validatorsPerField[ field ]; val = v[ field ];
                            if ( validator.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) if ( !validator( val[ i ] ) )  return false;
                            }
                            else
                            {
                                if ( !validator( val ) ) return false;
                            }
                        }
                        return true;
                    }); 
                },

                NUMERIC: VC(function( v ) { 
                    return is_numeric( v ); 
                }),
                NOT_EMPTY: VC(function( v ) { 
                    return !!( v && (0 < Str(v).tR().length) ); 
                }),
                MAXLEN: function( len ) {
                    return VC(newFunc("v", "return v.length <= "+len+";")); 
                },
                MINLEN: function( len ) {
                    return VC(newFunc("v", "return v.length >= "+len+";")); 
                },
                MATCH: function( regex_pattern ) { 
                    return VC(function( v ) { return regex_pattern.test( v ); }); 
                },
                NOT_MATCH: function( regex_pattern ) { 
                    return VC(function( v ) { return !regex_pattern.test( v ); }); 
                },
                EQUAL: function( val, strict ) { 
                    if ( is_instance(val, ModelField) ) 
                        return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;")); 
                    return false !== strict 
                        ? VC(function( v ) { return val === v; })
                        : VC(function( v ) { return val == v; })
                    ; 
                },
                NOT_EQUAL: function( val, strict ) { 
                    if ( is_instance(val, ModelField) ) 
                        return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
                    return false !== strict 
                        ? VC(function( v ) { return val !== v; })
                        : VC(function( v ) { return val != v; })
                    ; 
                },
                GREATER_THAN: function( m, strict ) { 
                    if ( is_instance(m, ModelField) ) m = "this.$data."+m.f;
                    else if ( is_type(m, T_STR) ) m = '"' + m + '"';
                    return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;")); 
                },
                LESS_THAN: function( M, strict ) { 
                    if ( is_instance(M, ModelField) ) M = "this.$data."+M.f;
                    else if ( is_type(M, T_STR) ) M = '"' + M + '"';
                    return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;")); 
                },
                BETWEEN: function( m, M, strict ) {  
                    if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                    
                    var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                    // swap
                    if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                    m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                    M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                    return false !== strict 
                        ? VC(newFunc("v", "return ( "+m+" < v ) && ( "+M+" > v );"))
                        : VC(newFunc("v", "return ( "+m+" <= v ) && ( "+M+" >= v );"))
                    ; 
                },
                NOT_BETWEEN: function( m, M, strict ) {  
                    if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                    
                    var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                    // swap
                    if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                    m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                    M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                    return false !== strict 
                        ? VC(newFunc("v", "return ( "+m+" > v ) || ( "+M+" < v );"))
                        : VC(newFunc("v", "return ( "+m+" >= v ) || ( "+M+" <= v );"))
                    ; 
                },
                IN: function( /* vals,.. */ ) { 
                    var vals = slice( arguments ); 
                    if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                    return VC(function( v ) { 
                        return ( -1 < vals.indexOf( v ) ); 
                    }); 
                },
                NOT_IN: function( /* vals,.. */ ) { 
                    var vals = slice( arguments ); 
                    if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                    return VC(function( v ) { 
                        return ( 0 > vals.indexOf( v ) ); 
                    }); 
                }
            }
            
            ,add: function( type, handler ) {
                if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) Validation.Validate[ type ] = VC( handler );
                return Validation;
            }
            
            ,del: function( type ) {
                if ( is_type( type, T_STR ) && Validation.Validate[ type ] ) delete Validation.Validate[ type ];
                return Validation;
            }
        
            ,toString: function( ) {
                return '[ModelView.Validation]';
            }
        },
        
        addModelTypeValidator = function( model, dottedKey, typeOrValidator, modelTypesValidators ) {
            var k, t, isCollectionEach = false;
            t = get_type( typeOrValidator );
            if ( T_FUNC & t )
            {
                isCollectionEach = is_instance( typeOrValidator, CollectionEach );
                // each wrapper
                if ( isCollectionEach ) typeOrValidator = bindF( typeOrValidator.f, model );
                else typeOrValidator = bindF( typeOrValidator, model );
                // bind the typeOrValidator handler to 'this model'
                walkadd( typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach );
            }
            else if ( T_ARRAY_OR_OBJ & t )
            {
                // nested keys given, recurse
                for ( k in typeOrValidator ) addModelTypeValidator( model, dottedKey + '.' + k, typeOrValidator[ k ], modelTypesValidators );
            }
        },
        
        addModelGetterSetter = function( model, dottedKey, getterOrSetter, modelGettersSetters ) {
            var k, t;
            t = get_type( getterOrSetter );
            if ( T_FUNC & t )
            {
                // bind the getterOrSetter handler to 'this model'
                walkadd( bindF( getterOrSetter, model ), -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelGettersSetters );
            }
            else if ( T_ARRAY_OR_OBJ & t )
            {
                // nested keys given, recurse
                for ( k in getterOrSetter ) addModelGetterSetter( model, dottedKey + '.' + k, getterOrSetter[ k ], modelGettersSetters );
            }
        },
        
        // handle sub-composite models as data, via walking the data
        serializeModel = function( modelClass, data, dataType ) {
            var key, type;
            
            while ( data instanceof modelClass ) { data = data.data( ); }
            
            type = dataType || get_type( data );
            data = (T_OBJ & type) ? extend({}, data) : ((T_ARRAY & type) ? data.slice(0) : data);
            
            if ( T_ARRAY_OR_OBJ & type )
            {
                for (key in data)
                {
                    if ( data[ key ] instanceof modelClass )
                        data[ key ] = serializeModel( modelClass, extend( {}, data[ key ].data( ) ) );
                    else if ( T_ARRAY_OR_OBJ & (type=get_type(data[ key ])) )
                        data[ key ] = serializeModel( modelClass, data[ key ], type );
                }
            }
            
            return data;
        }
    ;
    
    //
    // Model Class
    var Model = function( id, data, types, validators, getters, setters ) {
        var model = this;
        
        // constructor-factory pattern
        if ( !(model instanceof Model) ) return new Model( id, data, types, validators, getters, setters );
        
        model.namespace = model.id = id || uuid('Model');
        model.key = removePrefix( model.id );
        
        model.$view = null;
        model.atomic = false;  model.$atom = null;
        model.$types = { }; model.$validators = { }; model.$getters = { }; model.$setters = { };
        
        model.data( data || { } )
            .types( types ).validators( validators )
            .getters( getters ).setters( setters )
            .initPubSub( )
        ;
    };
    Model[proto] = Mixin( Create( Obj[proto] ), PublishSubscribe, {
        
        // allow chaining, return this;
        constructor: Model
        
        ,id: null
        ,$view: null
        ,$data: null
        ,$types: null
        ,$validators: null
        ,$getters: null
        ,$setters: null
        ,atomic: false
        ,$atom: null
        
        ,dispose: function( ) {
            var model = this;
            model.disposePubSub( ).$view = null;
            model.$data = null;
            model.$types = null;
            model.$validators = null;
            model.$getters = null;
            model.$setters = null;
            model.atomic = false;
            model.$atom = null;
            model.key = null;
            return model;
        }
        
        ,isValid: function( ) {
            // todo
            return true;
        }
        
        ,view: function( v ) {
            var model = this;
            if ( arguments.length )
            {
                model.$view = v;
                return model;
            }
            return model.$view;
        }
        
        ,data: function( d ) {
            var model = this;
            if ( arguments.length )
            {
                model.$data = d;
                return model;
            }
            return model.$data;
        }
        
        ,types: function( types ) {
            var model = this, k;
            if ( is_type(types, T_OBJ) )
            {
                for (k in types) addModelTypeValidator( model, k, types[ k ], model.$types );
            }
            return model;
        }
        
        ,validators: function( validators ) {
            var model = this, k;
            if ( is_type(validators, T_OBJ) )
            {
                for (k in validators) addModelTypeValidator( model, k, validators[ k ], model.$validators );
            }
            return model;
        }
        
        ,getters: function( getters ) {
            var model = this, k;
            if ( is_type(getters, T_OBJ) )
            {
                for (k in getters) addModelGetterSetter( model, k, getters[ k ], model.$getters );
            }
            return model;
        }
        
        ,setters: function( setters ) {
            var model = this, k;
            if ( is_type(setters, T_OBJ) )
            {
                for (k in setters) addModelGetterSetter( model, k, setters[ k ], model.$setters );
            }
            return model;
        }
        
        // handle sub-composite models as data, via walking the data
        ,serialize: function( ) {
            return serializeModel( Model, this.$data );
        }
        
        ,toJSON: function( dottedKey ) {
            var model = this, json, data, T, e;
            
            if ( arguments.length ) data = model.get( dottedKey );
            else data = model.data( );
            
            try { json = toJSON( serializeModel( Model, data ) ); } 
            catch( e ) { throw e; return; }
            
            return json;
        }
        
        ,fromJSON: function( dataJson, dottedKey ) {
            var model = this, data, e;
            if ( dataJson )
            {
                try { data = fromJSON( dataJson ); } 
                catch( e ) { throw e; return; }
                
                if ( dottedKey ) model.set( dottedKey, data );
                else model.data( data );
            }
            return model;
        }
        
        ,count: function( dottedKey, val ) {
            if ( !arguments.length ) return 0;
            var o = dottedKey ? this.get( dottedKey ) : val, T = get_type( o );
            
            if ( T_OBJ === T ) return Keys( o ).length;
            else if ( T_ARRAY === T ) return o.length;
            else if ( T_UNDEF !== T ) return 1; //  is scalar value, set count to 1
            return 0;
        }
        
        ,has: function( dottedKey, RAW ) {
            var model = this, r;
            
            // http://jsperf.com/regex-vs-indexof-with-and-without-char
            // http://jsperf.com/split-vs-test-and-split
            // test and split (if needed) is fastest
            if ( 0 > dottedKey.indexOf('.') && ( (dottedKey in model.$data) || (!RAW && (r=model.$getters[dottedKey]) && r.value) ) )
            {
                // handle single key fast
                return true;
            }
            else if ( (r = walkcheck( dottedKey.split('.'), model.$data, RAW ? null : model.$getters, Model )) )
            {
                return (true === r) ? true : r[1].has(r[2].join('.'));
            }
            return false;
        }
        
        ,get: function( dottedKey, RAW ) {
            var model = this, r, p;
            
            // http://jsperf.com/regex-vs-indexof-with-and-without-char
            // http://jsperf.com/split-vs-test-and-split
            // test and split (if needed) is fastest
            if ( 0 > dottedKey.indexOf('.') )
            {
                // handle single key fast
                if ( !RAW && (r=model.$getters[dottedKey]) && r.value ) return r.value( dottedKey );
                return model.$data[ dottedKey ];
            }
            else if ( (r = walk2( dottedKey.split('.'), model.$data, RAW ? null : model.$getters, Model )) )
            {
                // nested sub-model
                if ( Model === r[ 0 ] ) return r[ 1 ].get(r[ 2 ].join('.'), RAW);
                // custom getter
                else if ( false === r[ 0 ] ) return r[ 1 ]( dottedKey );
                // model field
                return r[ 1 ];
            }
            return undef;
        }
        
        // it can add last node also if not there
        ,set: function ( dottedKey, val, pub, callData ) {
            var model = this, r, o, k, p,
                type, validator, setter,
                types, validators, setters,
                prevval, canSet = false
            ;
            
            if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
            
            o = model.$data;
            types = model.$types; 
            validators = model.$validators; 
            setters = model.$setters;
            
            // http://jsperf.com/regex-vs-indexof-with-and-without-char
            // http://jsperf.com/split-vs-test-and-split
            // test and split (if needed) is fastest
            if ( 0 > dottedKey.indexOf('.') )
            {
                // handle single key fast
                k = dottedKey;
                setter = (r=setters[k]) ? r.value : null;
                type = (r=types[k] || types[WILDCARD]) ? r.value : null;
                validator = (r=validators[k] || validators[WILDCARD]) ? r.value : null;
                canSet = true;
            }
            else if ( (r = walk3( dottedKey.split('.'), o, types, validators, setters, Model )) )
            {
                o = r[ 1 ]; k = r[ 2 ];
                type = getValue( r[4], k );
                validator = getValue( r[5], k );
                setter = getValue( r[6], k );
                
                if ( Model === r[ 0 ]  ) 
                {
                    // nested sub-model
                    if ( k.length ) 
                    {
                        k = k.join('.');
                        prevval = o.get( k );
                        if ( prevval !== val ) o.set( k, val, pub, callData ); 
                        else  pub = false;
                    }
                    else 
                    {
                        prevval = o.data( );
                        if ( prevval !== val ) o.data( val );
                        else  pub = false;
                    }
                    
                    pub && model.publish('change', {
                            model: model, 
                            key: dottedKey, 
                            value: val, 
                            valuePrev: prevval,
                            $callData: callData
                        });
                    
                    return model;
                }
                else if ( !setter  && (false === r[0] && r[3].length) )
                {
                    // cannot add intermediate values
                    return model;
                }
                canSet = true;
            }
            
            if ( canSet )
            {
                if ( type ) val = type( val, dottedKey );
                if ( validator && !validator( val, dottedKey ) )
                {
                    if ( pub )
                    {
                        if ( callData ) callData.error = true;
                        model.publish('error', {
                            model: model, 
                            key: dottedKey, 
                            value: o[k], 
                            $callData: callData
                        });
                    }
                    return model;
                }
                
                // custom setter
                if ( setter ) 
                {
                    if ( setter( dottedKey, val ) ) 
                    {
                        pub && model.publish('change', {
                                model: model, 
                                key: dottedKey, 
                                value: val,
                                $callData: callData
                            });
                        
                        if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                    }
                    return model;
                }
                
                prevval = o[ k ];
                // update/set only if different
                if ( prevval !== val )
                {
                    // modify or add final node here
                    o[ k ] = val;
                
                    pub && model.publish('change', {
                            model: model, 
                            key: dottedKey, 
                            value: val, 
                            valuePrev: prevval,
                            $callData: callData
                        });
                    
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
            }
            return model;
        }
        
        // append value (for arrays like structures)
        ,append: function ( dottedKey, val, pub, callData ) {
            var model = this, r, o, k, p,
                type, validator, setter,
                canSet = false
            ;
            
            if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
            
            o = model.$data;
            types = model.$types; 
            validators = model.$validators; 
            setters = model.$setters;
            
            // http://jsperf.com/regex-vs-indexof-with-and-without-char
            // http://jsperf.com/split-vs-test-and-split
            // test and split (if needed) is fastest
            if ( 0 > dottedKey.indexOf('.') )
            {
                // handle single key fast
                k = dottedKey;
                setter = (r=setters[k]) && r.next[WILDCARD] ? r.next[WILDCARD].value : null;
                type = (r=types[k] || types[WILDCARD]) && r.next[WILDCARD] ? r.next[WILDCARD].value : null;
                validator = (r=validators[k] || validators[WILDCARD]) && r.next[WILDCARD] ? r.next[WILDCARD].value : null;
                canSet = true;
            }
            else if ( (r = walk3( dottedKey.split('.'), o, types, validators, setters, Model )) )
            {
                o = r[ 1 ]; k = r[ 2 ];
                type = getValue( getNext( r[4], k ), WILDCARD );
                validator = getValue( getNext( r[5], k ), WILDCARD );
                setter = getValue( getNext( r[6], k ), WILDCARD );
                
                if ( Model === r[ 0 ]  ) 
                {
                    // nested sub-model
                    if ( k.length ) 
                    {
                        k = k.join('.');
                        o.append( k, val, pub, callData ); 
                    }
                    else 
                    {
                        o.data( val );
                    }
                    
                    pub && model.publish('change', {
                            model: model, 
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                    
                    return model;
                }
                else if ( !setter && (false === r[0] && r[3].length) )
                {
                    // cannot add intermediate values or not array
                    return model;
                }
                canSet = true;
            }
            
            if ( canSet )
            {
                if ( type ) val = type( val, dottedKey );
                if ( validator && !validator( val, dottedKey ) )
                {
                    if ( pub )
                    {
                        if ( callData ) callData.error = true;
                        model.publish('error', {
                            model: model, 
                            key: dottedKey, 
                            value: /*val*/undef,
                            $callData: callData
                        });
                    }
                    return model;
                }
                
                // custom setter
                if ( setter ) 
                {
                    if ( setter( dottedKey, val ) ) 
                    {
                        pub && model.publish('change', {
                                model: model, 
                                key: dottedKey, 
                                value: val,
                                $callData: callData
                            });
                        
                        if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                    }
                    return model;
                }
                
                if ( T_ARRAY === get_type( o[ k ] ) )
                {
                    // append node here
                    o[ k ].push( val );
                }
                else
                {
                    // not array-like, do a set operation, in case
                    o[ k ] = val;
                }
            
                pub && model.publish('change', {
                        model: model, 
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
            }
            return model;
        }
        
        // delete, without re-arranging (array) indexes
        ,del: function( dottedKey, pub, callData ) {
            var model = this, r, o, k, p, val, canDel = false;
            
            if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
            
            o = model.$data;
            
            // http://jsperf.com/regex-vs-indexof-with-and-without-char
            // http://jsperf.com/split-vs-test-and-split
            // test and split (if needed) is fastest
            if ( 0 > dottedKey.indexOf('.') )
            {
                // handle single key fast
                k = dottedKey;
                canDel = true;
            }
            else if ( (r = walk3( dottedKey.split('.'), o, null, null, null, Model, false )) )
            {
                o = r[ 1 ]; k = r[ 2 ];
                
                if ( Model === r[ 0 ] && k.length ) 
                {
                    // nested sub-model
                    k = k.join('.');
                    val = o.get( k );
                    o.del( k, pub, callData ); 
                    pub && model.publish('remove', {
                            model: model, 
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                    
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                    return model;
                }
                else if ( r[ 3 ].length )
                {
                    // cannot remove intermediate values
                    return model;
                }
                canDel = true;
            }
            
            if ( canDel )
            {
                val = o[ k ];
                delete o[ k ]; // not re-arrange indexes
                pub && model.publish('remove', {
                        model: model, 
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
            }
            return model;
        }
        
        // remove, re-arranging (array) indexes
        ,rem: function( dottedKey, pub, callData ) {
            var model = this, r, o, k, p, val, T, canDel = false;
            
            if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
            
            o = model.$data;
            
            // http://jsperf.com/regex-vs-indexof-with-and-without-char
            // http://jsperf.com/split-vs-test-and-split
            // test and split (if needed) is fastest
            if ( 0 > dottedKey.indexOf('.') )
            {
                // handle single key fast
                k = dottedKey;
                canDel = true;
            }
            else if ( (r = walk3( dottedKey.split('.'), o, null, null, null, Model, false )) )
            {
                o = r[ 1 ]; k = r[ 2 ];
                
                if ( Model === r[ 0 ] && k.length ) 
                {
                    // nested sub-model
                    k = k.join('.');
                    val = o.get( k );
                    o.rem( k, pub, callData ); 
                    pub && model.publish('remove', {
                            model: model, 
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                    
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                    return model;
                }
                else if ( r[ 3 ].length )
                {
                    // cannot remove intermediate values
                    return model;
                }
                canDel = true;
            }
            
            if ( canDel )
            {
                val = o[ k ];
                o[ k ] = undef;
                T = get_type( o );
                if ( T_ARRAY == T && is_array_index( k ) ) o.splice( +k, 1 );
                else if ( T_OBJ == T ) delete o[ k ];
                pub && model.publish('remove', {
                        model: model, 
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
            }
            return model;
        }
        
        // shortcut to trigger "model:change" per given key
        ,notify: function( dottedKey, evt, callData ) {
            dottedKey && this.publish(evt||'change', {
                    model: this, 
                    key: dottedKey,
                    /*, value: null*/
                    $callData: callData
                });
            return this;
        }
        
        // atomic (update) operation(s) by key
        ,atom: function( dottedKey ) {
            var model = this;
            if ( undef !== dottedKey )
            {
                if ( false === dottedKey )
                {
                    model.atomic = false;
                    model.$atom = null;
                }
                else
                {
                    model.atomic = false;
                    model.$atom = dottedKey;
                }
            }
            return model;
        }
        
        ,toString: function( ) {
            return '[ModelView.Model id: '+this.id+']';
        }
   });
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
                var el = this, $el = $(el), bind, do_action, name, key;
                
                bind = getBindData( event, view.attr(el, 'bind') );
                // during sync, dont do any actions based on (other) events
                if ( !bind || !bind.action ) return;
                
                do_action = 'do_' + bind.action;
                if ( !is_type( view[ do_action ], T_FUNC ) ) return;
                name = el[NAME];
                key = bind.key || (!!name && model.key(name, 1));
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
                var el = this, $el = $(el), name = el[NAME], 
                    key = !!name ? model.key( name, 1 ) : 0, value;
                    
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
        if ( !('bind' in (atts=atts||{})) ) atts['bind'] = "data-bind";
        view.$atts = atts;
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
        ,attr: function( el, att ) {
            var view = this, attr = view.$atts[ att ],
                memoizeCache = view.$memoize, attribute, attbind
            ;
            
            // use memoization/caching
            if ( /*el && attr &&*/ !!(attr=el[ATTR]( attr )) )
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
            return ( ref && ref.sW("$this::") ) ? $( ref.slice( 7 ), $el ) : $( ref );
            //return ( ref && ref.sW("$this::") ) ? $el[0][SELECT](ref.slice( 7 )) : document[SELECT]( ref );
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
                            bind = view.$bindbubble ? view.attr(el, 'bind') : null
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
            var view = this, model = view.$model, 
                $el = data.$el, el = $el[0],
                name, key, val, checkbox, modeldata = { }
            ;
            
            // update model and propagate to other elements of same view (via model publish hook)
            if ( data.isAutoBind && !!(name=el[NAME]) )
            {
                key = model.key( name, 1 );
                
                if ( key && model.has( key ) )
                {
                    if ( 'checkbox' === el[TYPE].toLowerCase( ) )
                    {
                        checkbox = view.get('input[type="checkbox"][name="'+name+'"]');
                        
                        if ( checkbox.length > 1 )
                        {
                            val = [ ];
                            checkbox.each(function( ) {
                                var c = this;
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
                prop = data.prop, p, k, v, vT, el//, eT, eV
            ;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
                
            el = $el[0]; //eT = el[TAG]; //eV = get_val( el );
            for (p in prop)
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
                        el[p] = ( T_BOOL === vT ) ? v : (v == el[VAL]);
                        break;
                    
                    case 'options':
                        if ( 'select' === el[TAG] && (T_ARRAY === vT) )
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
                    
                    default:
                        //hash[ p ] = v;
                        //$el.prop( p, v );
                        //$el.attr( p, v );
                        //el[p] = v;
                        el[SET_ATTR](p, v);
                        break;
                }
            }
            //$el.attr( hash );
        }
        
        // set element(s) html/text prop based on model key value
        ,do_html: function( evt, $el, data ) {
            if ( !data.key ) return;
            var view = this, model = view.$model, key = data.key, el;
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length || !key || !model.has( key ) ) return;
            (el=$el[0])[data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = model.get( key );
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
                key = data.key || model.key($el[0][NAME], 1), val;
            if ( !!key ) 
            {
                if ( "value" in data ) 
                {
                    val = data.value;
                }
                else
                {
                    if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
                    val = get_val( $el[0] );
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
            var view = this, model = view.$model, key = data.key, el;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length || !key ) return;
            el = $el[0];    
            if ( 'value' in data )
            {
                // show if data[key] is value, else hide
                if ( data.value === model.get( key ) ) show(el); /*$el.show( );*/
                else hide(el);/*$el.hide( );*/
            }
            else
            {
                // show if data[key] is true, else hide
                if ( !!model.get( key ) ) show(el); /*$el.show( );*/
                else hide(el); /*$el.hide( );*/
            }
        }
        
        // hide/show element(s) according to binding
        ,do_hide: function( evt, $el, data ) {
            var view = this, model = view.$model, key = data.key, el;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length || !key ) return;
            el = $el[0];    
            if ( 'value' in data )
            {
                // hide if data[key] is value, else show
                if ( data.value === model.get( key ) ) hide(el); /*$el.hide( );*/
                else show(el); /*$el.show( );*/
            }
            else
            {
                // hide if data[key] is true, else show
                if ( !!model.get( key ) ) hide(el); /*$el.hide( );*/
                else show(el); /*$el.show( );*/
            }
        }
        
        // default bind/update element(s) values according to binding on model:change
        ,do_bind: function( evt, $el, data ) {
            var view = this, model = view.$model, 
                name = data.name, key = data.key, 
                el = $el[ 0 ], elType = el[TYPE].toLowerCase( ),
                value, valueType
            ;
            
            // use already computed/cached key/value from calling method passed in "data"
            if ( !key ) return;
            value = data.value; valueType = get_type( value );
            
            if ( 'radio' === elType )
            {
                if ( value == el[VAL] )
                {
                    view.get('input[name="'+name+'"]').not( el ).prop('checked', false);
                    el[CHECKED] = true;
                }
            }
            
            else if ( 'checkbox' === elType )
            {
                var checkbox = view.get('input[type="checkbox"][name="'+name+'"]'); 
                
                if ( checkbox.length > 1 && (T_ARRAY === valueType) )
                {
                    checkbox.each(function( ) {
                        var cb = this;
                        if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                        else cb[CHECKED] = false;
                    });
                }
                
                else
                {
                    el[CHECKED] = T_BOOL === valueType ? value : (value == el[VAL]);
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
    // main
    // export it
    exports['ModelView'] = {
    
        VERSION: "0.26.3"
        
        ,UUID: uuid
        
        ,Extend: Mixin
        
        ,Field: ModelField
        
        ,Type: Type
        
        ,Validation: Validation
        
        ,Cache: Cache
        
        ,Model: Model
        
        ,View: View
    };
}(exports, jQuery);/**
*
*   ModelView.js (jQuery plugin, optional)
*   @version: 0.26.3
*   @dependencies: jQuery
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

}(exports['ModelView'], jQuery);
    
    /* main code ends here */
    /* export the module */
    return exports["ModelView"];
});