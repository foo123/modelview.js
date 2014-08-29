/**
*
*   ModelView.js
*   @version: 0.24
*   @dependencies: jQuery
*
*   A micro-MV* (MVVM) jQuery-based framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/!function ( root, name, deps, factory, undef ) {

    "use strict";
    //
    // export the module in a umd-style generic way
    deps = ( deps ) ? [].concat(deps) : [];
    var A = Array, AP = A.prototype, i, dl = deps.length, mods = new A( dl ), mod;
        
    // node, commonjs, etc..
    if ( "object" === typeof( module ) && module.exports ) 
    {
        if ( undef === module.exports[name] )
        {
            for (i=0; i<dl; i++)  mods[i] = module.exports[ deps[i][0] ] || require( deps[i][1] )[ deps[i][0] ];
            mod = factory.apply(root, mods );
            // allow factory just to add to existing modules without returning a new module
            module.exports[ name ] = mod || 1;
        }
    }
    
    // amd, etc..
    else if ( "function" === typeof( define ) && define.amd ) 
    {
        define( ['exports'].concat( deps.map(function(d){return d[1];}) ), function( exports ) {
            if ( undef === exports[name] )
            {
                var i, args = AP.slice.call( arguments, 1 ), dl = args.length;
                for (i=0; i<dl; i++)   mods[i] = exports[ deps[i][0] ] || args[ i ];
                mod = factory.apply(root, mods );
                // allow factory just to add to existing modules without returning a new module
                exports[ name ] = mod || 1;
            }
        });
    }
    
    // browsers, other loaders, etc..
    else
    {
        if ( undef === root[name] )
        {
            
            for (i=0; i<dl; i++)  mods[i] = root[ deps[i][0] ];
            mod = factory.apply(root, mods );
            // allow factory just to add to existing modules without returning a new module
            root[name] = mod || 1;
        }
    }


}(  /* current root */          this, 
    /* module name */           "ModelView",
    /* module dependencies */   [ ['jQuery', 'jquery'] ], 
    /* module factory */        function( jQuery ) {

        /* custom exports object */
        var EXPORTS = {};
        
        /* main code starts here */

/**
*
*   ModelView.js
*   @version: 0.24
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
        
        //typeOff = function( v ){ return typeof(v); },
        
        INF = Infinity, rnd = Math.random, parse_float = parseFloat, parse_int = parseInt, is_nan = isNaN, is_finite = isFinite,
        
        fromJSON = JSON.parse, toJSON = JSON.stringify,
        
        // jQuery methods
        Event = $.Event, extend = $.extend
    ;
    
    // use native methods and abbreviation aliases if available
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    if ( !SP.trim ) SP.trim = function( ) { return this.replace(/^\s+|\s+$/g, ''); };
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    if ( !SP.startsWith ) SP.startsWith = function( prefix, pos ) { pos=pos||0; return ( prefix === this.substr(pos, prefix.length+pos) ); };
    SP.tr = SP.trim; SP.sW = SP.startsWith;
    
    var
        WILDCARD = "*", NAMESPACE = "modelview",
        PROPS = {
            options : 1, 
            html : 2, 
            text : 3,
            class : 4,
            value : 5,
            checked : 6,
            disabled : 7
        },
        
        // types
        T_NUM = 2,
        T_NAN = 3,
        //T_INF = 3,
        T_BOOL = 4,
        T_STR = 8,
        T_CHAR = 9,
        T_ARRAY = 16,
        T_OBJ = 32,
        T_FUNC = 64,
        T_REGEX = 128,
        T_NULL = 256,
        T_UNDEF = 512,
        T_UNKNOWN = 1024,
        T_ARRAY_OR_OBJ = T_ARRAY | T_OBJ,
        T_ARRAY_OR_STR = T_ARRAY | T_STR,
        
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

        newFunc = function( args, code ){ return new Func(args, code); },
        
        hasAtt = function( $el, att ) { return ( undef !== $el.attr( att ) ); },
    
        hasNamespace = function( evt, namespace ) { 
            return !!evt.namespace && new Regex( "\\b" + namespace + "\\b" ).test( evt.namespace || '' ); 
        },
        
        removePrefix = function( prefix, key ) {
            // strict mode (after prefix, a key follows)
            return key.replace( new Regex( '^' + prefix + '([\\.|\\[])' ), '$1' );
        },
    
        addBracket = function( k ) { return "[" + k + "]"; },
        
        // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
        parseKey = function( key, bracketed ) {
            if ( null == key ) return undef;
            
            if ( bracketed )
                return Str(key)
                        .replace( /\.+$/, '' )                       // strip trailing dots
                        .replace( /^\./, '' )                     // strip a leading dot
                        .split( '.' ).map( addBracket ).join( '' )  // convert properties to bracketed props
                ;
            
            return Str(key)
                    .replace( /\[([^\]]*)\]/g, '.$1' )         // convert indexes to properties
                    .replace( /^\./, '' )                       // strip a leading dot
                    .replace( /\.+$/, '' )                       // strip trailing dots
            ;
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
                        if ( ai[ k ] && is_type(ai[ k ].value, T_FUNC) )
                            return ai[ k ].value;
                        if ( ai[ WILDCARD ] && is_type(ai[ WILDCARD ].value, T_FUNC) )
                            return ai[ WILDCARD ].value;
                    }
                }
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    ai = a[ i ];
                    if ( ai && is_type(ai.value, T_FUNC) )  return ai.value;
                }
            }
            return null;
        },
        
        walkadd = function( v, p, obj, MODELVIEW_COLLECTION_EACH ) {
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
                    if ( MODELVIEW_COLLECTION_EACH )
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
            var o = obj, a = [aux], k, to;
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
                        a = getNext( a, k );
                    }
                    else
                    {
                        a = getNext( a, k );
                        if ( !a ) return false;
                    }
                }
                else
                {
                    if ( getValue( a, k ) ) return true;
                    else if ( (to&T_ARRAY_OR_OBJ) && (k in o) ) return true;
                    else if ( T_OBJ === to && 'length' == k ) return true;
                    return false;
                }
            }
            return false;
        },
        
        walk2 = function( p, obj, aux, C ) {
            var o = obj, a = [aux], k, to;
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
                        a = getNext( a, k );
                    }
                    else
                    {
                        a = getNext( a, k );
                        if ( !a ) return false;
                    }
                }
                else
                {
                    if ( (a = getValue( a, k )) ) return [false, a];
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
        
        NOW = function( ) { return new Date( ).getTime( ); },
        
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
    /*PublishSubscribe.subscribe = PublishSubscribe.on;
    PublishSubscribe.unsubscribe = PublishSubscribe.off;
    PublishSubscribe.subscribeTo = PublishSubscribe.onTo;
    PublishSubscribe.unsubscribeFrom = PublishSubscribe.offFrom;*/
    
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
    
    
    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //
    // Main Framework
    //
    //
    ///////////////////////////////////////////////////////////////////////////////////////
    
    
    // the logic behind this:
    //
    // when, what, who, why, how
    //
    // when             -> event  (default "on model/dom change")
    // what             -> action  (default "update value")
    // who, why, how    -> additional conditions/parameters
    
    // TODO: implement more simpler/flexible/generic/faster mapping between model data and view dom elements and attributes (eg. micro templating)
    
        
    //
    // Data Types / Validators (Static)
    var 
        // Type Compositor
        TC = function( T ) {
            
            T.BEFORE = function( T2 ) {
                return TC(function( v ) { 
                    var self = this, args = slice( arguments );
                    args[ 0 ] = T.apply( self, args );
                    return T2.apply( self, args );
                }); 
            };
            T.AFTER = function( T2 ) {
                return TC(function( v ) { 
                    var self = this, args = slice( arguments );
                    args[ 0 ] = T2.apply( self, args );
                    return T.apply( self, args );
                }); 
            };
            
            return T;
        },
            
        // Validator Compositor
        VC = function( V ) {
            
            V.NOT = function( ) { 
                return VC(function( v ) { 
                    return !V.apply(this, arguments); 
                }); 
            };
            
            V.AND = function( V2 ) { 
                return VC(function( v ) { 
                    var self = this;
                    return !!(V.apply(self, arguments) && V2.apply(self, arguments));
                }); 
            };
            
            V.OR = function( V2 ) { 
                return VC(function( v ) { 
                    var self = this;
                    return !!(V.apply(self, arguments) || V2.apply(self, arguments));
                }); 
            };

            V.XOR = function( V2 ) { 
                return VC(function( v ) { 
                    var self = this,
                        r1 = V.apply(self, arguments)
                        r2 = V2.apply(self, arguments)
                    ;
                    return !!((r1 && !r2) || (r2 && !r1));
                }); 
            };
            
            return V;
        },
        
        Type = {
            
            TypeCaster: TC
            
            // default type casters
            ,Cast: {
                // collection for each item type caster
                EACH: function( eachItemTypeCaster ) {
                    var each = function( ) {
                        return eachItemTypeCaster;
                    };
                    each.MODELVIEW_COLLECTION_EACH = true;
                    return each;
                },
                
                // type caster for each specific field of an object
                FIELDS: function( fieldsTypesMap ) {
                    var notbinded = true;
                    fieldsTypesMap = extend( {}, fieldsTypesMap || {} );
                    return TC(function( v ) { 
                        var self = this, p, t, a, l, i;
                        if ( notbinded )
                        {
                            for ( p in fieldsTypesMap )
                            {
                                t = fieldsTypesMap[ p ];
                                if ( t.MODELVIEW_COLLECTION_EACH )
                                {
                                    fieldsTypesMap[ p ] = bindF( t( ), self );
                                    fieldsTypesMap[ p ].MODELVIEW_COLLECTION_EACH = true;
                                }
                                else
                                {
                                    fieldsTypesMap[ p ] = bindF( t, self );
                                }
                            }
                            notbinded = false;
                        }
                        for ( p in fieldsTypesMap )
                        {
                            t = fieldsTypesMap[ p ];
                            a = v[ p ];
                            if ( t.MODELVIEW_COLLECTION_EACH && is_type(a, T_ARRAY) )
                            {
                               l = a.length;
                               for (i=0; i<l; i++) a[ i ] = t( a[ i ] );
                               v[ p ] = a;
                            }
                            else
                            {
                                v[ p ] = t( a );
                            }
                        }
                        return v;
                    }); 
                },
                
                DEFAULT: function( defaultValue ) {  
                    return TC(function( v ) { 
                        var T = get_type( v );
                        if ( (T_UNDEF & T) || ((T_STR & T) && !v.tr().length)  ) v = defaultValue;
                        return v;
                    }); 
                },
                BOOLEAN: TC(function( v ) { 
                    return !!v; 
                }),
                CLAMP: function( m, M ) {  
                    // swap
                    if ( m > M ) { var tmp = M; M = m; m = tmp; }
                    return TC(function( v ) { 
                        if ( v < m ) v = m;
                        else if ( v > M ) v = M;
                        return v;
                    }); 
                },
                INTEGER: TC(function( v ) { 
                    return parse_int( v, 10 ); 
                }),
                FLOAT: TC(function( v ) { 
                    return parse_float( v, 10 ); 
                }),
                TRIMMED: TC(function( v ) { 
                    return Str(v).tr();
                }),
                LCASE: TC(function( v ) { 
                    return Str(v).toLowerCase( );
                }),
                UCASE: TC(function( v ) { 
                    return Str(v).toUpperCase( );
                }),
                STRING: TC(function( v ) { 
                    return Str(v); 
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
                EACH: function( eachItemValidator ) {
                    var each = function( ) {
                        return eachItemValidator;
                    };
                    each.MODELVIEW_COLLECTION_EACH = true;
                    return each;
                },
                
                // validator for each specific field of an object
                FIELDS: function( fieldsValidatorsMap ) {
                    var notbinded = true;
                    fieldsValidatorsMap = extend( {}, fieldsValidatorsMap || {} );
                    return VC(function( v ) { 
                        var self = this, p, t, a, l, i;
                        if ( notbinded )
                        {
                            for ( p in fieldsValidatorsMap )
                            {
                                t = fieldsValidatorsMap[ p ];
                                if ( t.MODELVIEW_COLLECTION_EACH )
                                {
                                    fieldsValidatorsMap[ p ] = bindF( t( ), self );
                                    fieldsValidatorsMap[ p ].MODELVIEW_COLLECTION_EACH = true;
                                }
                                else
                                {
                                    fieldsValidatorsMap[ p ] = bindF( t, self );
                                }
                            }
                            notbinded = false;
                        }
                        for ( p in fieldsValidatorsMap )
                        {
                            t = fieldsValidatorsMap[ p ];
                            a = v[ p ];
                            if ( t.MODELVIEW_COLLECTION_EACH && is_type(a, T_ARRAY) )
                            {
                               l = a.length;
                               for (i=0; i<l; i++) if ( !t( a[ i ] ) )  return false;
                            }
                            else
                            {
                                if ( !t( a ) ) return false;
                            }
                        }
                        return true;
                    }); 
                },

                NUMERIC: VC(function( v ) { 
                    return is_numeric( v ); 
                }),
                NOT_EMPTY: VC(function( v ) { 
                    return !!( v && (0 < Str(v).tr().length) ); 
                }),
                MAXLEN: function( len ) {
                    return VC(function( v ) { 
                        return v.length <= len; 
                    });
                },
                MINLEN: function( len ) {
                    return VC(function( v ) { 
                        return v.length >= len; 
                    });
                },
                EQUAL: function( val, strict ) { 
                    if ( false !== strict )
                    {
                        return VC(function( v ) { 
                            return ( val === v ); 
                        }); 
                    }
                    else
                    {
                        return VC(function( v ) { 
                            return ( val == v ); 
                        }); 
                    }
                },
                NOT_EQUAL: function( val, strict ) { 
                    if ( false !== strict )
                    {
                        return VC(function( v ) { 
                            return ( val !== v ); 
                        }); 
                    }
                    else
                    {
                        return VC(function( v ) { 
                            return ( val != v ); 
                        }); 
                    }
                },
                EQUALTO: function( model_field, strict ) { 
                    return VC(newFunc("v", "return this.$data."+model_field+" "+(false !== strict ? "===" : "==")+" v;")); 
                },
                NOT_EQUALTO: function( model_field, strict ) { 
                    return VC(newFunc("v", "return this.$data."+model_field+" "+(false !== strict ? "!==" : "!=")+" v;")); 
                },
                MATCH: function( regex_pattern ) { 
                    return VC(function( v ) { 
                        return regex_pattern.test( v ); 
                    }); 
                },
                NOT_MATCH: function( regex_pattern ) { 
                    return VC(function( v ) { 
                        return !regex_pattern.test( v ); 
                    }); 
                },
                GREATER_THAN: function( m, strict ) { 
                    if ( false !== strict )
                    {
                        return VC(function( v ) { 
                            return ( m < v ); 
                        }); 
                    }
                    else
                    {
                        return VC(function( v ) { 
                            return ( m <= v ); 
                        }); 
                    }
                },
                LESS_THAN: function( M, strict ) { 
                    if ( false !== strict )
                    {
                        return VC(function( v ) { 
                            return ( M > v ); 
                        }); 
                    }
                    else
                    {
                        return VC(function( v ) { 
                            return ( M >= v ); 
                        }); 
                    }
                },
                BETWEEN: function( m, M, strict ) {  
                    if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                    // swap
                    if ( m > M ) { var tmp = M; M = m; m = tmp; }
                    if ( false !== strict )
                    {
                        return VC(function( v ) { 
                            return ( ( m < v ) && ( M > v ) ); 
                        }); 
                    }
                    else
                    {
                        return VC(function( v ) { 
                            return ( ( m <= v ) && ( M >= v ) ); 
                        }); 
                    }
                },
                NOT_BETWEEN: function( m, M, strict ) {  
                    if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                    // swap
                    if ( m > M ) { var tmp = M; M = m; m = tmp; }
                    if ( false !== strict )
                    {
                        return VC(function( v ) { 
                            return ( ( m > v ) || ( M < v ) ); 
                        }); 
                    }
                    else
                    {
                        return VC(function( v ) { 
                            return ( ( m >= v ) || ( M <= v ) ); 
                        }); 
                    }
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
        
        addModelTypeValidator = function( model, key, typeOrValidator, modelTypesValidators ) {
            var k, t,
                MODELVIEW_COLLECTION_EACH = false
            ;
            if ( null == key ) return;
            key = parseKey( key ); t = get_type( typeOrValidator );
            if ( T_FUNC & t )
            {
                MODELVIEW_COLLECTION_EACH = typeOrValidator.MODELVIEW_COLLECTION_EACH;
                // each wrapper
                if ( MODELVIEW_COLLECTION_EACH ) typeOrValidator = bindF( typeOrValidator( ), model );
                else typeOrValidator = bindF( typeOrValidator, model );
                // bind the type caster handler to 'this model'
                walkadd( typeOrValidator, key.split('.'), modelTypesValidators, MODELVIEW_COLLECTION_EACH );
            }
            else if ( T_ARRAY_OR_OBJ & t )
            {
                // nested keys given, recurse
                for ( k in typeOrValidator ) addModelTypeValidator( model, key + '.' + k, typeOrValidator[ k ], modelTypesValidators );
            }
        },
        
        addModelGetterSetter = function( model, key, getterOrSetter, modelGettersSetters ) {
            var k, t;
            if ( null == key ) return;
            key = parseKey( key ); t = get_type( getterOrSetter );
            if ( T_FUNC & t )
            {
                // bind the getter handler to 'this model'
                walkadd( bindF( getterOrSetter, model ), key.split('.'), modelGettersSetters );
            }
            else if ( T_ARRAY_OR_OBJ & t )
            {
                // nested keys given, recurse
                for ( k in getterOrSetter ) addModelGetterSetter( model, key + '.' + k, getterOrSetter[ k ], modelGettersSetters );
            }
        }
    ;
    
    //
    // Model Class
    var Model = function( id, data, types, validators, getters, setters ) {
        var model = this;
        
        // constructor-factory pattern
        if ( !(model instanceof Model) ) return new Model( id, data, types, validators, getters, setters );
        
        model.id = id || uuid('Model');
        model.namespace = model.id;
        
        model.$view = null;
        
        model.$types = { };
        model.$validators = { };
        model.$getters = { };
        model.$setters = { };
        
        model
            .data( data || { } )
            
            .types( types )
            .validators( validators )
            
            .getters( getters )
            .setters( setters )
            
            .initPubSub( )
            .init( )
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
        ,_atomic: false
        ,$atom: null
        
        ,dispose: function( pub ) {
            var model = this;
            model.$view = null;
            model.$data = null;
            model.$types = null;
            model.$validators = null;
            model.$getters = null;
            model.$setters = null;
            model._atomic = false;
            model.$atom = null;
            if ( pub ) model.publish('dispose', { target: model } );
            model.disposePubSub( );
            return model;
        }
        
        ,init: function( pub ) {
            var model = this;
            model._atomic = false;
            model.$atom = null;
            if ( pub ) model.publish('init', { target: model } );
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
        ,serialize: function( data ) {
            var model = this, key, type, dat;
            
            while ( data instanceof Model ) { data = data.data( ); }
            
            type = get_type( data );
            
            if ( T_OBJ & type )  data = extend( {}, data );
            else if ( T_ARRAY & type ) data = data.slice( );
            
            if ( T_ARRAY_OR_OBJ & type )
            {
                for (key in data)
                {
                    type = get_type( data[ key ] );
                    
                    if ( data[ key ] instanceof Model )
                    {
                        data[ key ] = model.serialize( extend( {}, data[ key ].data( ) ) );
                    }
                    else if ( T_OBJ & type )
                    {
                        data[ key ] = model.serialize( extend( {}, data[ key ] ) );
                    }
                    else if ( T_ARRAY & type )
                    {
                        data[ key ] = model.serialize( data[ key ].slice( ) );
                    }
                }
            }
            
            return data;
        }
        
        ,toJSON: function( key ) {
            var model = this, json, data, T;
            
            if ( arguments.length ) data = model.get( key );
            else data = model.data( );
            
            try {
                
                json = toJSON( model.serialize( data ) );
            
            } catch( e ) {
                
                throw e;
                
                return;
            
            }
            
            return json;
        }
        
        ,fromJSON: function( dataJson, key ) {
            var model = this, data;
            if ( dataJson )
            {
                try {
                    
                    data = fromJSON( dataJson );
                
                } catch( e ) {
                    
                    throw e;
                    
                    return;
                
                }
                
                if ( key ) model.set( key, data );
                else model.data( data );
            }
            return model;
        }
        
        ,key: function( key, level ) {
            return key && (0 > level) ? key.split( '.' ).slice( 0, level ).join( '.' ) : key;
        }
        
        ,count: function( key, val ) {
            if ( !arguments.length ) return 0;
            var o = key ? this.get( key ) : val, T = get_type( o );
            
            if ( T_OBJ === T ) return Keys( o ).length;
            else if ( T_ARRAY === T ) return o.length;
            else if ( T_UNDEF !== T ) return 1; //  is scalar value, set count to 1
            return 0;
        }
        
        ,has: function( key ) {
            var model = this, r;
            if ( null == key ) return false;
            key = parseKey( key );
            if ( !key ) return false;
            r = walkcheck( key.split('.'), model.$data, model.$getters, Model );
            if ( r ) return (true === r) ? true : r[1].has(r[2].join('.'));
            return false;
        }
        
        ,get: function( key, RAW ) {
            var model = this, r;
            if ( null == key ) return undef;
            key = parseKey( key );
            if ( !key ) return undef;
            r = walk2( key.split('.'), model.$data, RAW ? null : model.$getters, Model );
            if ( r ) 
            {
                // nested sub-model
                if ( Model === r[ 0 ] ) return r[ 1 ].get(r[ 2 ].join('.'), RAW);
                // custom getter
                else if ( false === r[ 0 ] ) return r[ 1 ]( key );
                // model field
                return r[ 1 ];
            }
            return undef;
        }
        
        // it can add last node also if not there
        ,set: function ( key, val, pub, extra ) {
            var model = this, r, o, k,
                type, validator, setter,
                data, prevval
            ;
            if ( !key ) return model;
            key = parseKey( key );
            if ( !key || (model._atomic && key.sW( model.$atom )) ) return model;
            
            r = walk3( 
                key.split('.'), 
                model.$data, 
                model.$types, 
                model.$validators, 
                model.$setters, 
                Model 
            );
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
                    if ( prevval !== val ) o.set( k, val ); 
                    else  pub = false;
                }
                else 
                {
                    prevval = o.data( );
                    if ( prevval !== val ) o.data( val );
                    else  pub = false;
                }
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val, valuePrev: prevval};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('change', data);
                }
            }
            else if ( !setter  && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values
                return model;
            }
            else
            {
                if ( type ) val = type( val, key );
                if ( validator && !validator( val, key ) )
                {
                    if ( pub )
                    {
                        data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                        if ( extra ) 
                        {
                            // set model error flag
                            extra._error = true;
                            data = extend({}, extra, data); 
                        }
                        model.publish('error', data);
                    }
                    return model;
                }
                
                // custom setter
                if ( setter ) 
                {
                    if ( setter( key, val ) ) 
                    {
                        if ( pub )
                        {
                            data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                            if ( extra ) data = extend({}, extra, data); 
                            model.publish('change', data);
                        }
                        
                        if ( model.$atom && key === model.$atom ) model._atomic = true;
                    }
                    return model;
                }
                
                prevval = o[ k ];
                // update/set only if different
                if ( prevval !== val )
                {
                    // modify or add final node here
                    o[ k ] = val;
                
                    if ( pub )
                    {
                        data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val, valuePrev: prevval};
                        if ( extra ) data = extend({}, extra, data); 
                        model.publish('change', data);
                    }
                    
                    if ( model.$atom && key === model.$atom ) model._atomic = true;
                }
            }
            return model;
        }
        
        // append value (for arrays like structures)
        ,append: function ( key, val, pub, extra ) {
            var model = this, r, o, k,
                type, validator, setter,  data
            ;
            if ( !key ) return model;
            key = parseKey( key );
            if ( !key || (model._atomic && key.sW( model.$atom )) ) return model;
            
            r = walk3( 
                key.split('.'), 
                model.$data, 
                model.$types, 
                model.$validators, 
                model.$setters, 
                Model 
            );
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
                    o.append( k, val ); 
                }
                else 
                {
                    o.data( val );
                }
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('change', data);
                }
            }
            else if ( !setter && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values or not array
                return model;
            }
            else
            {
                if ( type ) val = type( val, key );
                if ( validator && !validator( val, key ) )
                {
                    if ( pub )
                    {
                        data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                        if ( extra ) 
                        {
                            // set model error flag
                            extra._error = true;
                            data = extend({}, extra, data); 
                        }
                        model.publish('error', data);
                    }
                    return model;
                }
                
                // custom setter
                if ( setter ) 
                {
                    if ( setter( key, val ) ) 
                    {
                        if ( pub )
                        {
                            data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                            if ( extra ) data = extend({}, extra, data); 
                            model.publish('change', data);
                        }
                        
                        if ( model.$atom && key === model.$atom ) model._atomic = true;
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
            
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('append', data);
                    model.publish('change', data);
                }
                
                if ( model.$atom && key === model.$atom ) model._atomic = true;
            }
            return model;
        }
        
        // delete, without re-arranging (array) indexes
        ,del: function( key, pub, extra ) {
            var model = this, r, o, k, data, val;
            
            if ( !key ) return model;
            key = parseKey( key );
            if ( !key || (model._atomic && key.sW( model.$atom )) ) return model;
            
            r = walk3( 
                key.split('.'), 
                model.$data, 
                model.$types, 
                model.$validators, 
                model.$setters, 
                Model, false 
            );
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ] && k.length ) 
            {
                // nested sub-model
                k = k.join('.');
                val = o.get( k );
                o.del( k ); 
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('remove', data);
                }
                
                if ( model.$atom && key === model.$atom ) model._atomic = true;
                
                return model;
            }
            else if ( r[ 3 ].length )
            {
                // cannot remove intermediate values
                return model;
            }
            else
            {
                val = o[ k ];
                delete o[ k ]; // not re-arrange indexes
                
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('remove', data);
                }
                
                if ( model.$atom && key === model.$atom ) model._atomic = true;
            }
            return model;
        }
        
        // remove, re-arranging (array) indexes
        ,rem: function( key, pub, extra ) {
            var model = this, r, o, k, data, val;
            
            if ( !key ) return model;
            key = parseKey( key );
            if ( !key || (model._atomic && key.sW( model.$atom )) ) return model;
            
            r = walk3( 
                key.split('.'), 
                model.$data, 
                model.$types, 
                model.$validators, 
                model.$setters, 
                Model, false 
            );
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ] && k.length ) 
            {
                // nested sub-model
                k = k.join('.');
                val = o.get( k );
                o.rem( k ); 
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('remove', data);
                }
                
                if ( model.$atom && key === model.$atom ) model._atomic = true;
                
                return model;
            }
            else if ( r[ 3 ].length )
            {
                // cannot remove intermediate values
                return model;
            }
            else
            {
                val = o[ k ];
                o[ k ] = undef;
                var T = get_type( o );
                if ( T_OBJ == T ) delete o[ p ];
                else if ( T_ARRAY == T  && is_array_index( k ) ) o.splice( +p, 1 );
                if ( pub )
                {
                    data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                    if ( extra ) data = extend({}, extra, data); 
                    model.publish('remove', data);
                }
                
                if ( model.$atom && key === model.$atom ) model._atomic = true;
            }
            return model;
        }
        
        // shortcut to trigger "model:change" per given key
        ,notify: function( key, evt ) {
            if ( key )
                this.publish(evt || 'change', {target: this, bracketkey: parseKey(key, 1), key: parseKey( key ), value: null});
            return this;
        }
        
        // atomic (update) operation(s) by key
        ,atom: function( key ) {
            var model = this;
            if ( undef !== key )
            {
                if ( false === key )
                {
                    model._atomic = false;
                    model.$atom = null;
                }
                else
                {
                    model._atomic = false;
                    model.$atom = parseKey( key );
                }
            }
            return model;
        }
        
        ,toString: function( ) {
            //return '[ModelView.Model id: '+this.id+']';
            return this.toJSON( );
        }
   });
    
    var
        getSelectors = function( bind, autobind ) {
            return [
                bind ? '[' + bind + ']' : null,
                autobind ? 'input[name^="' + autobind + '"],textarea[name^="' + autobind + '"],select[name^="' + autobind + '"]' : null
            ];
        },
        
        doAction = function( view, $elements, evt, data ) {
            var model = view.$model;
            
            $elements.each(function( ) {
                var $el = $(this), bind = view.attr($el, 'bind'),
                    eventAction, event, action, key, bindData, elName
                ;
                
                if ( !bind ) return;
                
                eventAction = view.eventaction(evt.type, bind);
                
                if ( !eventAction || !eventAction.action ) return;
                
                event = eventAction.event;
                action = 'do_'+eventAction.action;
                
                // during sync, dont do any actions based on (other) events
                if ( data.sync && 'change' != event ) return;
                
                if ( data.model )
                {
                    elName = $el.attr('name') || false;
                    key = (elName && $el.is('input,textarea,select')) ? removePrefix(model.id, elName) : eventAction.key;
                    
                    // "model:change" event and element does not reference the (nested) model key
                    if ( !key || (
                        ( !key.sW( data.model.bracketkey ) ) && 
                        ( !key.sW( data.model.key ) ) 
                    )) return;
                    
                    // atomic operation(s)
                    if ( model._atomic && key.sW( model.$atom ) ) return;
                }
                
                if ( /*action &&*/ is_type( view[action], T_FUNC ) )
                {
                    bindData = /*extend(true, {},*/ eventAction/*)*/;
                    view[action]( evt, $el, bindData );
                    
                    // allow post-action processing to take place if needed
                    if ( eventAction.complete && is_type( view['do_'+eventAction.complete], T_FUNC ) )
                    {
                        // add a small delay also
                        setTimeout(function(){
                            view['do_'+eventAction.complete]( evt, $el, bindData );
                        }, 20);
                    }
                }
            });
        },
        
        doAutoBindAction = function( view, $elements, evt, data ) {
            var model = view.$model, cached = { };
            
            if ( view.do_bind )
            {
                $elements.each(function( ) {
                    var $el = $( this ), name,
                        key, value;
                        
                    name = $el.attr('name') || false;
                    if ( /*!$el.is("input,textarea,select") ||*/ !name ) return;
                    
                    key = (data && data['key'])  ? data.key : removePrefix(model.id, name);
                    
                    if ( data && data['value'] ) // action is called from model, so key value are already there
                    {
                        value = data.value;
                    }
                    
                    else if ( key )
                    {
                        if ( cached[ key ] )
                        {
                            // use already cached key/value
                            value = cached[ key ][ 0 ];
                        }
                        else if ( model.has( key ) )
                        {
                            value = model.get( key );
                            cached[ key ] = [ value ];
                        }
                        else
                        {
                            return;  // nothing to do here
                        }
                    }
                    
                    else return;  // nothing to do here
                    
                    // call default action (eg: live update)
                    view.do_bind( evt, $el, { name: name, key: key, value: value } );
                });
            }
        }
    ;
    
    //
    // View Class
    var View = function( id, model, atts ) {
        var view = this;
        
        // constructor-factory pattern
        if ( !(view instanceof View) ) return new View( id, model, atts );
        
        view.id = id || uuid('View');
        view.namespace = view.id;
        view.$atts = atts || { "bind": "data-bind" };
        view
            .model( model || new Model( ) )
            .initPubSub( )
            .init( )
        ;
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
            view.unbind( );
            
            if ( view.$model )
            {
                view.$model.dispose( );
                view.$model = null;
            }
            view.$dom = null;
            view.$bind = null;
            view.$template = null;
            view.$atts = null;
            view.$memoize.dispose( );
            view.$memoize = null;
            view.$selectors.dispose( );
            view.$selectors = null;
            view.disposePubSub( );
            
            return view;
        }
        
        ,init: function( pub ) {
            var view = this;
            view.$bind = view.attribute( "bind" );
            view.$memoize = new Cache( View._CACHE_SIZE, View._REFRESH_INTERVAL );
            view.$selectors = new Cache( View._CACHE_SIZE, View._REFRESH_INTERVAL );
            
            if ( pub ) view.publish('init', { target: view });
            
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
            var view = this;
            if ( arguments.length > 1 )
            {
                view['do_'+name] = is_type( handler, T_FUNC ) ? handler : null;
                return view;
            }
            return name ? (view['do_'+name] || undef) : undef;
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
        
        // get a Universal Unique Identifier (UUID)
        ,uuid: function( namespace ) {
            return uuid( namespace );
        }
        
        // cache jquery selectors for even faster performance
        ,get: function( selector, $dom, bypass ) {
            var view = this, selectorsCache = view.$selectors, elements;
            
            $dom = $dom ? $($dom) : view.$dom;
            
            if ( bypass ) return $dom.find( selector );
            
            elements = selectorsCache.get( selector );
                
            if ( undef === elements )
                selectorsCache.set( selector, elements = $dom.find( selector ) );
            
            return elements;
        }
        
        // http://stackoverflow.com/questions/10892322/javascript-hashtable-use-object-key
        // http://stackoverflow.com/questions/2937120/how-to-get-javascript-object-references-or-reference-count
        ,attr: function( $el, att ) {
            var view = this, attr = view.$atts[ att ], 
                memoizeCache = view.$memoize, attribute
                /*, sep = "::"*/
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
                    if ( attribute.text )
                    {
                        attribute.change = {action: "set", prop: "text", key: attribute.text, domRef: attribute.domRef||null};
                        delete attribute.text;
                    }
                    else if ( attribute.html )
                    {
                        attribute.change = {action: "set", prop: "html", key: attribute.html, domRef: attribute.domRef||null};
                        delete attribute.html;
                    }
                    else if ( attribute.value )
                    {
                        attribute.change = {action: "set", prop: "value", key: attribute.value, domRef: attribute.domRef||null};
                        delete attribute.value;
                    }
                    else if ( attribute.options )
                    {
                        attribute.change = {action: "set", prop: "options", key: attribute.options, domRef: attribute.domRef||null};
                        delete attribute.options;
                    }
                    else if ( attribute['class'] )
                    {
                        attribute.change = {action: "set", prop: "class", key: attribute['class'], domRef: attribute.domRef||null};
                        delete attribute['class'];
                    }
                    else if ( attribute.checked )
                    {
                        attribute.change = {action: "set", prop: "checked", key: attribute.checked, domRef: attribute.domRef||null};
                        delete attribute.checked;
                    }
                    else if ( attribute.disabled )
                    {
                        attribute.change = {action: "set", prop: "disabled", key: attribute.disabled, domRef: attribute.domRef||null};
                        delete attribute.disabled;
                    }
                    else if ( attribute.show )
                    {
                        attribute.change = {action: "show", key: attribute.show, domRef: attribute.domRef||null};
                        delete attribute.show;
                    }
                    else if ( attribute.hide )
                    {
                        attribute.change = {action: "hide", key: attribute.hide, domRef: attribute.domRef||null};
                        delete attribute.hide;
                    }
                    else if ( attribute.css || attribute.attr  || attribute.prop )
                    {
                        attribute.change = {action: "set", key: attribute.key||null, domRef: attribute.domRef||null};
                        if ( attribute.css )
                        {
                            attribute.change.css = attribute.css;
                            delete attribute.css;
                        }
                        if ( attribute.attr )
                        {
                            attribute.change.attr = attribute.attr;
                            delete attribute.attr;
                        }
                        if ( attribute.prop )
                        {
                            attribute.change.prop = attribute.prop;
                            delete attribute.prop;
                        }
                    }
                    
                    if ( attribute.change && ("set" === attribute.change.action) &&
                        attribute.change.prop && (attribute.change.prop in PROPS)
                    )
                    {
                        attribute.change.prop = PROPS[attribute.change.prop];
                    }
                    
                    // parsing is expensive, use memoize cache
                    memoizeCache.set( attr, attribute );
                }
                
                return attribute;
            }
            
            return undef;
        }
        
        ,eventaction: function( evt, bind ) {
            if ( evt && bind && bind[evt] )
            {
                if ( is_type(bind[evt], T_STR) ) return {event: evt, action: bind[evt]};
                return extend( {event: evt}, bind[evt] );
            }
            return null;
        }
        
        ,getDomRef: function($el, ref) {
            // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
            return ( ref && ("$this::" == ref.slice(0, 7)) ) ? $( ref.slice( 7 ), $el ) : $( ref );
        }
        
        ,unbind: function( events, dom ) {
            var view = this, model = view.$model,
                sels = getSelectors( view.$bind, model.id+'[' ),
                bindSelector = sels[0], autobindSelector = sels[1],
                namespaced, $dom
            ;
            
            events = events || null;
            $dom = dom ? $(dom) : view.$dom;
             
            // view/dom change events
            if ( view['on_view_change'] )
            {
                namespaced = function( evt ) { 
                    return NSEvent(evt, view.namespace); 
                };
                
                $dom.off( 
                    
                    events && events.length ? events.map( namespaced ).join(' ') : NSEvent('', view.namespace), 
                    
                    [ autobindSelector, bindSelector ].join( ',' )
                );
            }
            
            // model events
            view.offFrom( model, '', null, view.namespace );
            
            return view;
        }
        
        ,uiEventHandler: function( evt, el ) {
            var view = this, model = view.$model,
                sels = getSelectors( view.$bind, model.id+'[' ),
                bindSelector = sels[0], autobindSelector = sels[1],
                isAutoBind = false, isBind = false, $el = $(el),
                bind = view.$bindbubble ? view.attr($el, 'bind') : null
            ;

            // avoid "ghosting" events on other elements which may be inside a bind element
            // Chrome issue on nested button clicked, when data-bind on original button
            // add "bubble" option in modelview data-bind params
            if ( (evt.target === el) || (view.$bindbubble && bind && bind.bubble) )
            {
                // view/dom change events
                isBind = view.$bindbubble ? !!bind : $el.is( bindSelector );
                // view change autobind events
                isAutoBind = ( view.$autobind && "change" == evt.type && $el.is( autobindSelector ) );
                
                if ( isBind || isAutoBind ) 
                    view.on_view_change( evt, { el: $el, _isBind: isBind, _isAutoBind: isAutoBind } );
            }
            return true;
        }
        
        ,bind: function( events, dom ) {
            var view = this, model = view.$model,
                sels = getSelectors( view.$bind, model.id+'[' ),
                bindSelector = sels[0], autobindSelector = sels[1],
                method, evt, namespaced
            ;
            
            events = events || ['change', 'click'];
            view.$dom = $(dom || window.document);
             
            // view/dom change events
            if ( view['on_view_change'] && events.length )
            {
                namespaced = function( evt ) { 
                    return NSEvent(evt, view.namespace); 
                };
                
                // use one event handler for bind and autobind
                // avoid running same (view) action twice on autobind and bind elements
                view.$dom.on( 
                    events.map( namespaced ).join( ' ' ), 
                    
                    [ autobindSelector, bindSelector ].join( ',' ),
                    
                    function( e ) {
                        view.uiEventHandler(e, this);
                        return true;
                    }
                );
            }
            
            // model events
            for (method in view)
            {
                if ( !is_type( view[ method ], T_FUNC ) || !/^on_model_/.test( method ) ) continue;
                
                evt = method.replace(/^on_model_/, '');
                evt.length && view.onTo( model, evt, view[ method ], view.namespace );
            }
            
            return view;
        }
        
        ,sync: function( $dom ) {
            var view = this, model = view.$model, 
                sels = getSelectors( view.$bind, model.id+'[' ),
                bindSelector = sels[0], autobindSelector = sels[1],
                bindElements, autoBindElements
            ;
            
            $dom = $dom ? $($dom) : view.$dom;
            
            bindElements = view.get( bindSelector, $dom, true );
            autoBindElements = view.get( autobindSelector, $dom, true );
            
            doAction( view, bindElements, Event('change'), {sync: true} );
            view.$autobind && doAutoBindAction( view, autoBindElements, Event('change'), {sync: true} );
            
            return view;
        }
        
        ,reset: function( ) {
            var view = this;
            // refresh caches
            view.$memoize.reset( );
            view.$selectors.reset( );
            return view;
        }
        
        ,refresh: function( events, $dom ) {
            var view = this;
            view.unbind( );
            // refresh caches
            view.$memoize.reset( );
            view.$selectors.reset( );
            view.bind( events, $dom );
            //view.sync( );
            return view;
        }
        
        //
        // view "on_event" methods
        //
        
        ,on_view_change: function( evt, data ) {
            var view = this, model = view.$model, 
                name, key, val, el = data.el, modeldata = { },
                isCheckbox, checkbox
            ;
            
            // update model and propagate to other elements of same view (via model publish hook)
            if ( data._isAutoBind && el.attr('name') )
            {
                name = el.attr('name');
                key = parseKey( removePrefix(model.id, name) ) || false;
                
                if ( key && model.has( key ) )
                {
                    isCheckbox = el.is(':checkbox');
                    if ( isCheckbox )
                    {
                        checkbox = view.get('input[type="checkbox"][name="'+name+'"]');
                        
                        if ( checkbox.length > 1 )
                        {
                            val = [ ];
                            checkbox.each(function( ) {
                                var $this = $(this), v;
                                
                                if ( $this.is(':checked') )
                                    v = $this.val();
                                else
                                    v = '';
                                    
                                val.push( v );
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
                        val = el.val( );
                    }
                    
                    modeldata._triggerElement = el;
                    model.set( key, val, 1, modeldata );
                }
            }
            
            // if not model update error and element is bind element
            if ( !modeldata._error && data._isBind )
            {
                // do view bind action
                doAction(view, el, evt, data);
            }
            
            // notify any 3rd-party also if needed
            view.publish('change', data);
        }
        
        ,on_model_error: function( evt, data ) {
            var view = this, model = view.$model, 
                name = model.id + data.bracketkey,
                sels = getSelectors( view.$bind, name ),
                bindSelector = sels[0], autobindSelector = sels[1],
                bindElements, autoBindElements
            ;

            bindElements = view.get( bindSelector );
            autoBindElements = view.get( autobindSelector );
            
            // bypass element that triggered the "model:change" event
            /*if ( data._triggerElement )
            {
                bindElements = bindElements.not( data._triggerElement );
                autoBindElements = autoBindElements.not( data._triggerElement );
            }*/
            
            // do actions ..
            
            // do view bind action first
            doAction( view, bindElements, evt, {model:data} );
            
            if ( view.$autobind )
            {
                // do view autobind action to bind input elements that map to the model, afterwards
                doAutoBindAction( view, autoBindElements, evt, {model:data} );
            }
        }
        
        ,on_model_change: function( evt, data ) {
            var view = this, model = view.$model, 
                name = model.id + data.bracketkey,
                sels = getSelectors( view.$bind, name ),
                bindSelector = sels[0], autobindSelector = sels[1],
                bindElements, autoBindElements
            ;

            bindElements = view.get( bindSelector );
            autoBindElements = view.get( autobindSelector );
            
            // bypass element that triggered the "model:change" event
            if ( data._triggerElement )
            {
                bindElements = bindElements.not( data._triggerElement );
                autoBindElements = autoBindElements.not( data._triggerElement );
            }
            
            // do actions ..
            
            // do view bind action first
            doAction( view, bindElements, evt, {model:data} );
            
            if ( view.$autobind )
            {
                // do view autobind action to bind input elements that map to the model, afterwards
                doAutoBindAction( view, autoBindElements, evt, {model:data} );
            }
        }

        //
        // view "do_action" methods
        //
        
        // NOP action
        ,do_NOP: null
        
        // render an element using a custom template and model data
        ,do_render: function( evt, $el, data ) {
            var view = this, model, 
                key = data['key'], tpl = data['tpl'],
                mode, html
            ;
            if ( !view.$template || !key || !tpl ) return;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
            
            model = view.$model;
            mode = data['mode'] || 'replace';
            
            key = removePrefix(model.id, key) || false;
            if ( !key || !model.has( key ) ) return;
            value = model.get( key );
            
            if ( 'replace' == mode ) $el.empty( );
            
            html = view.$template( tpl, value );
            if ( html ) $el.append( html );
        }
        
        // set element(s) attributes/properties according to binding
        ,do_set: function( evt, $el, data ) {
            if ( !data['key'] && !data['css'] && !data['attr'] ) return;
            
            var view = this, model = view.$model, 
                keyb = data['key'] || false, 
                hash, attr, p,
                key, value, isBool;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
                
            // css attributes
            if ( data['css'] )
            {
                hash = { };
                if ( is_type(data.css, T_OBJ) )
                {
                    for (p in data.css)
                    {
                        if ( model.has( data.css[p] ) )
                            hash[p] = model.get( data.css[p] );
                    }
                    $el.css( hash );
                }
            }
            
            // other attributes
            if ( data['attr'] )
            {
                hash = { };
                if ( is_type(data.attr, T_OBJ) )
                {
                    for (p in data.attr)
                    {
                        if ( model.has( data.attr[p] ) )
                            hash[p] = model.get( data.attr[p] );
                    }
                    $el.attr( hash );
                }
            }
            
            if ( !keyb ) return;
            key = removePrefix(model.id, keyb) || false;
            if ( !key || !model.has( key ) ) return;
            value = key ? model.get( key ) : '';
            isBool = is_type( value, T_BOOL );
            
            if ( data['prop'] )
            {
                attr = data['prop'];
                switch (attr)
                {
                    case PROPS['options']:
                        if ( $el.is('select') && is_type( value, T_ARRAY ) )
                        {
                            var group = $el.find('optgroup'), sel = $el.val(), _options = ''; // get selected value
                            if ( !group.length )  group = $el;
                            
                            group.find('option').remove();
                            
                            for (var ii=0; ii<value.length; ii++)
                            {
                                if ( value[ii] && value[ii].label )
                                    _options += '<option value="' + value[ii].value + '">' + value[ii].label + '</option>';
                                else
                                    _options += '<option value="' + value[ii] + '">' + value[ii] + '</option>';
                            }
                            group.append( _options );
                            $el.val( sel ); // select the appropriate option
                        }
                        break;
                    
                    case PROPS['html']:
                        $el.html( value );
                        break;
                    
                    case PROPS['text']:
                        $el.text( value );
                        break;
                    
                    case PROPS['class']:
                        if ( value && value.length )
                        {
                            var v0 = value.charAt(0);
                            if ( '-' == v0 )
                                $el.removeClass( value.slice(1) );
                            else if ( '+' == v0 )
                                $el.addClass( value.slice(1) );
                            else if ( !$el.hasClass( value ) )
                                $el.addClass( value );
                            else if ( $el.hasClass( value ) )
                                $el.removeClass( value );
                        }
                        break;
                    
                    case PROPS['value']:
                        $el.val( value );
                        break;
                    
                    default:
                        if ( PROPS['checked'] == attr )
                        {
                            if ( isBool )
                                $el.prop('checked', value);
                            else if ( value == $el.val() )
                                $el.prop('checked', true);
                            else
                                $el.prop('checked', false);
                        }
                        else if ( PROPS['disabled'] == attr )
                        {
                            if ( isBool )
                                $el.prop('disabled', value);
                            else if ( value == $el.val() )
                                $el.prop('disabled', true);
                            else
                                $el.prop('disabled', false);
                        }
                        else
                        {
                            //$el.prop(attr, value);
                            $el.attr(attr, value);
                        }
                        break;
                }
            }
        }
        
        // update a model field with a value
        ,do_update: function( evt, $el, data ) {
            if ( data['key'] && "value" in data ) 
            {
                this.$model.set( removePrefix( this.$model.id, data['key'] ), data['value'], true );
            }
        }
        
        // show/hide element(s) according to binding
        ,do_show: function( evt, $el, data ) {
            var view = this, model = view.$model, 
                key, val;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
                
            if ( data['key'] ) 
            {
                key = removePrefix(model.id, data['key']);
                if ( 'value' in data )
                {
                    // show if data[key] is value, else hide
                    if ( data['value'] === model.get(key) ) $el.show( );
                    else $el.hide( );
                }
                else
                {
                    // show if data[key] is true, else hide
                    if ( !!model.get(key) ) $el.show( );
                    else $el.hide( );
                }
            }
            else
            {
                // show unconditionally
                $el.show( );
            }
        }
        
        // hide/show element(s) according to binding
        ,do_hide: function( evt, $el, data ) {
            var view = this, model = view.$model, 
                key;
            
            if ( data['domRef'] ) $el = view.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
                
            if ( data['key'] ) 
            {
                key = removePrefix(model.id, data['key']);
                if ( 'value' in data )
                {
                    // hide if data[key] is value, else show
                    if ( data['value'] === model.get(key) ) $el.hide( );
                    else $el.show( );
                }
                else
                {
                    // hide if data[key] is true, else show
                    if ( !!model.get(key) ) $el.hide( );
                    else $el.show( );
                }
            }
            else
            {
                // hide unconditionally
                $el.hide( );
            }
        }
        
        // default bind/update element(s) values according to binding on model:change
        ,do_bind: function( evt, $el, data ) {
            var key, value, isBool, val, name, view = this, model = view.$model;
            
            /*if ( $el.is("input,textarea,select") ) 
            {*/
                name = data.name; //$el.attr('name') || false;
                /*if ( name )
                {*/
                    // use already computed/cached key/value from calling method passed in "data"
                    key = data.key /*removePrefix(model.id, name)*/ || false;
                    if ( !key ) return;
                    value = data.value; //model.get( key );
                    isBool = is_type( value, T_BOOL );
                    val = $el.val( );
                    
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
                        
                        if ( checkbox.length > 1 && is_type( value, T_ARRAY ) )
                        {
                            checkbox.each(function(i, v) {
                                var $this = $(this);
                                if ( $.inArray($this.val(), value) > -1 )
                                    $this.prop('checked', true);
                                else
                                    $this.prop('checked', false);
                            });
                        }
                        
                        else if ( isBool )
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
                /*}*/
            /*} */
        }
        
        ,toString: function( ) {
            return '[ModelView.View id: '+this.id+']';
        }
    });
    
    // main
    // export it
    exports.ModelView = {
    
        VERSION: "0.24"
        
        ,UUID: uuid
        
        ,Extend: Mixin
        
        ,Type: Type
        
        ,Validation: Validation
        
        ,Cache: Cache
        
        ,Model: Model
        
        ,View: View
    };
    
}(EXPORTS, jQuery);/**
*
*   ModelView.js (jQuery plugin, optional)
*   @version: 0.24
*   @dependencies: jQuery
*
*   A micro-MV* (MVVM) jQuery-based framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
!function( ModelView, $, undef ) {

    "use strict";
    
    var slice = Function.prototype.call.bind( Array.prototype.slice );
    
    var defaultOptions = {
        
        viewClass: ModelView.View
        ,modelClass: ModelView.Model
        
        ,id: 'view'
        
        ,autobind: false
        ,bindbubble: false
        ,bindAttribute: 'data-bind'
        
        ,model: {
            id: 'model'
            ,data: { }
            ,types: { }
            ,validators: { }
            ,getters: { }
            ,setters: { }
        }
        ,template: null
        ,events: null
        ,actions: { }
        ,handlers: { }
    };
    
    // add it to root jQuery object as a jQuery reference
    $.ModelView = ModelView;
    
    // modelview jQuery plugin
    $.fn.modelview = function( options ) {
        var args = slice( arguments ), 
            method = args.length ? args.shift( ) : null, 
            isInit = true, 
            optionsParsed = false,
            map = [ ]
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
                var data = null;
                
                if ( options.data )
                {
                    // not clone data, pass-by-reference
                    // so custom objects are not ruined
                    data = options.data;
                    delete options.data;
                }
                
                // parse options once
                options = $.extend( true, {}, defaultOptions, options );
                
                if ( data )
                {
                    options.data = data;
                }
                
                optionsParsed = true;
            }
            
            if ( !options.model ) return this;
            
            model = new options.modelClass(
                options.model.id, 
                options.model.data, 
                options.model.types, 
                options.model.validators, 
                options.model.getters, 
                options.model.setters
            );
            
            view = new options.viewClass(
                options.id, model, 
                { bind: options.bindAttribute || 'data-bind' }
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
                    if ( handler )
                        view.event( eventname, handler );
                }
            }
            // custom view actions
            if ( options.actions )
            {
                for (var action in options.actions)
                {
                    handler = options.actions[ action ];
                    if ( handler )
                        view.action( action, handler );
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

}(EXPORTS["ModelView"], jQuery);


    /* main code ends here */
    
    /* export the module "ModelView" */
    return EXPORTS["ModelView"];
});