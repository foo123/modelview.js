/**
*
*   ModelView.js
*   @version: @@VERSION@@
*   @@DEPENDENCIES@@
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
    
    var AP = Array.prototype, OP = Object.prototype, FP = Function.prototype,
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
        hasProp = FP.call.bind(OP.hasOwnProperty), toStr = FP.call.bind(OP.toString), slice = FP.call.bind(AP.slice),
        keys = Object.keys, rnd = Math.random,
    
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
        
        PROPS = {
            options : 1, 
            html : 2, 
            text : 3,
            class : 4,
            value : 5,
            checked : 6,
            disabled : 7
        },
        
        get_type = function( v ) {
            var type_of = typeof(v), to_string = toStr(v);
            
            if (undef === v || "undefined" === type_of)  return T_UNDEF;
            
            else if ("number" === type_of || v instanceof Number)  return isNaN(v) ? T_NAN : T_NUM;
            
            else if (null === v)  return T_NULL;
            
            else if (true === v || false === v)  return T_BOOL;
            
            else if ("string" === type_of || v instanceof String) return (1 === v.length) ? T_CHAR : T_STR;
            
            else if ("[object Array]" === to_string || v instanceof Array)  return T_ARRAY;
            
            else if ("[object RegExp]" === to_string || v instanceof RegExp)  return T_REGEX;
            
            else if (("function" === type_of && "[object Function]" === to_string) || v instanceof Function)  return T_FUNC;
            
            else if ("[object Object]" === to_string)  return T_OBJ;
            
            // unkown type
            return T_UNKNOWN;
        },
        
        Create = Object.create,
        
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
                        
                        else if ( (T_STR | T_ARRAY) & T )
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

        isType = function( v, type ) { 
            return !!( type & get_type( v ) );
        },

        // http://stackoverflow.com/questions/6449611/how-to-check-whether-a-value-is-a-number-in-javascript-or-jquery
        isNumeric = function( n ) { 
            return !isNaN( parseFloat( n ) ) && isFinite( n );
        },
    
        isArrayIndex = function( n ) {
            if ( isNumeric( n ) ) // is numeric
            {
                n = +n;  // make number if not already
                if ( (0 === n % 1) && n >= 0 ) // and is positive integer
                    return true;
            }
            return false
        },
    
        hasAtt = function( $el, att ) { 
            return ( undef !== $el.attr( att ) ); 
        },
    
        hasNamespace = function( evt, namespace ) { 
            return !!evt.namespace && new RegExp( "\\b" + namespace + "\\b" ).test( evt.namespace || '' ); 
        },
        
        startsWith = function( str, prefix ) {  
            return ( prefix === str.substr(0, prefix.length) ); 
        },
        
        trim = function( str ) {  
            return str.replace(/^\s+/, '').replace(/\s+$/, ''); 
        },
        
        removePrefix = function( prefix, key ) {
            // strict mode (after prefix, a key follows)
            return key.replace( new RegExp( '^' + prefix + '([\\.|\\[])' ), '$1' );
        },
    
        addBracket = function( k ) {
            return "[" + k + "]";
        },
        
        // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
        parseKey = function( key, bracketed ) {
            if ( null == key ) return undef;
            
            key = '' + key;
            
            if ( bracketed )
                return key
                        .replace( /\.+$/, '' )                       // strip trailing dots
                        .replace( /^\./, '' )                     // strip a leading dot
                        .split( '.' ).map( addBracket ).join( '' )  // convert properties to bracketed props
                ;
            
            return key
                    .replace( /\[([^\]]*)\]/g, '.$1' )         // convert indexes to properties
                    .replace( /^\./, '' )                       // strip a leading dot
                    .replace( /\.+$/, '' )                       // strip trailing dots
            ;
        },

        fromJSON = JSON.parse,
        
        toJSON = JSON.stringify,
        
        extend = $.extend,
        
        extendObj = function( obj, key, val ) {
            if ( '' == key )
            {
                return obj = val;
            }
            key = parseKey( key );
            if ( !key )  return obj;
            var path = key.split('.'), p, o = obj, pnext;
            
            if ( !path )  return obj;
            
            while ( path && path.length ) 
            {
                p = path.shift();
                if ( isType( o, T_OBJ | T_ARRAY ) && hasProp(o, p) && path.length > 0 ) 
                {
                    pnext = path[ 0 ];
                    if ( !isType( o[ p ], T_OBJ | T_ARRAY ) )
                    {
                        // removes previous "scalar" value
                        if ( isArrayIndex( pnext ) ) // add as array
                        {
                            o[ p ] = [];
                        }
                        else // add as object
                        {
                            o[ p ] = {};
                        }
                    }
                } 
                else if ( path.length > 0 ) // construct
                {
                    pnext = path[ 0 ];
                    if ( !isType( o, T_OBJ | T_ARRAY ) )
                    {
                        if ( isArrayIndex( p ) ) // add as array
                        {
                            o = [ ];
                        }
                        else // add as object
                        {
                            o = { };
                        }
                    }
                    if ( isArrayIndex( pnext ) ) // add as array
                    {
                        o[ p ] = [ ];
                    }
                    else// add as object
                    {
                        o[ p ] = { };
                    }
                }
                
                if ( isType( val, T_OBJ | T_ARRAY ) && hasProp(val, p) )
                {
                    val = val[ p ];
                }
                if ( path.length > 0 )
                {
                    o = o[ p ];
                }
            }
            o[ p ] = val;
            
            return obj;
        },
        
        NOW = function( ) { return new Date( ).getTime( ); },
        
        walkadd = function( v, p, obj ) {
            var o = obj, k;
            while ( p.length )
            {
                k = p.shift( );
                if ( !(k in o) ) o[ k ] = { value: null, next: {} };
                if ( p.length ) o = o[ k ].next;
                else o[ k ].value = v;
            }
            return obj;
        },
        
        getNext = function( a, k ) {
            if ( !a ) return null;
            var b = [ ], i, l = a.length;
            for (i=0; i<l; i++)
            {
                if ( a[i] )
                {
                    if ( a[i][k] ) b.push( a[i][k].next );
                    if ( a[i]['*'] ) b.push( a[i]['*'].next );
                }
            }
            return b.length ? b : null;
        },
        
        getValue = function( a, k ) {
            if ( !a ) return null;
            var i, l = a.length;
            if ( k )
            {
                for (i=0; i<l; i++)
                {
                    if ( a[i] )
                    {
                        if ( a[i][k] && isType(a[i][k].value, T_FUNC) )
                            return a[i][k].value;
                        if ( a[i]['*'] && isType(a[i]['*'].value, T_FUNC) )
                            return a[i]['*'].value;
                    }
                }
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    if ( a[i] && isType(a[i].value, T_FUNC) )
                        return a[i].value;
                }
            }
            return null;
        },
        
        walkcheck = function( p, obj, aux, C ) {
            var o = obj, a = [aux], k, to;
            while ( p.length ) 
            {
                k = p.shift( );
                to = get_type( o );
                if ( p.length )
                {
                    if ( (to&( T_OBJ | T_ARRAY )) && (k in o) )
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
                    else if ( (to&( T_OBJ | T_ARRAY )) && (k in o) ) return true;
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
                    if ( (to&( T_OBJ | T_ARRAY )) && (k in o) )
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
                    else if ( (to&( T_OBJ | T_ARRAY )) && (k in o) ) return [true, o[k]];
                    else if ( T_OBJ === to && 'length' == k ) return [true, keys(o).length];
                    return false;
                }
            }
            return false;
        },
        
        walk3 = function( p, obj, aux1, aux2, aux3, C ) {
            var o = obj, a1 = [aux1], a2 = [aux2], a3 = [aux3], 
                k, to
            ;
            while ( p.length ) 
            {
                k = p.shift( );
                to = get_type( o );
                if ( p.length )
                {
                    if ( (to&( T_OBJ | T_ARRAY )) && (k in o) )
                    {
                        o = o[ k ];
                        // nested sub-composite class
                        if ( o instanceof C ) return [C, o, p, 0, null, null, null];
                        a1 = getNext( a1, k );
                        a2 = getNext( a2, k );
                        a3 = getNext( a3, k );
                    }
                    else
                    {
                        return [false, o, k, p, null, null, null];
                    }
                }
                else if ( (to&( T_OBJ | T_ARRAY )) ) 
                {
                    
                    // nested sub-composite class
                    if ( o[ k ] instanceof C )
                        return [C, o[k], p, 0, null, null, null];
                    else if ((k in o) || (to === T_OBJ && "length" === k)) 
                        return [true, o, k, p, a1, a2, a3];
                    return [false, o, k, p, a1, a2, a3];
                }
            }
            return [false, o, k, p, null, null, null];
        }
    ;
    
    //
    // Cache with max duration and max size conditions
    var Cache = function( cacheSize, refreshInterval ) {
        var self = this, argslen = arguments.length;
        self.$store = { };
        self.$size = Infinity;
        self.$interval = Infinity;
        
        if ( argslen > 0 && cacheSize > 0 ) self.$size = cacheSize;
        if ( argslen > 1 && refreshInterval > 0 ) self.$interval = refreshInterval;
    };
    Cache.prototype = {
        
        constructor: Cache,
        
        $store: null,
        $size: null,
        $interval: null,
        
        dispose: function( ) {
            var self = this;
            self.$store = null;
            self.$size = null;
            self.$interval = null;
            return self;
        },

        reset: function( ) {
            this.$store = { };
            return this;
        },
        
        size: function( size ) {
            if ( arguments.length )
            {
                if ( size > 0 ) this.$size = size;
                return this;
            }
            return this.$size;
        },
        
        interval: function( interval ) {
            if ( arguments.length )
            {
                if ( interval > 0 ) this.$interval = interval;
                return this;
            }
            return this.$interval;
        },
        
        has: function( key ) {
            var self = this, sk = key ? self.$store[ key ] : null;
            return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
        },
        
        get: function( key ) {
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
        },
        
        set: function( key, val ) {
            var self = this, store, size, storekeys;
            if ( key )
            {
                store = self.$store; size = self.$size; storekeys = keys( store );
                // assuming js hash-keys maintain order in which they were added
                // then this same order is also chronological
                // and can remove top-k elements which should be the k-outdated also
                while ( storekeys.length >= size ) delete store[ storekeys.shift( ) ];
                store[ key ] = { data: val, time: NOW( ) };
            }
            return self;
        },
        
        del: function( key ) {
            if ( key && this.$store[ key ] ) delete this.$store[ key ];
            return this;
        },
    
        toString: function( ) {
            return '[ModelView.Cache]';
        }
    };
    
    // UUID counter for Modelviews
    var _uuidCnt = 0, NAMESPACE = "modelview",
        
        // get a Universal Unique Identifier (UUID)
        uuid =  function( namespace ) {
            return [ namespace||'UUID', ++_uuidCnt, new Date( ).getTime( ) ].join( '_' );
        },
        
        Event = $.Event,
        
        // namespaced events, play nice with possible others
        NSEvent = function( evt, namespace ) { 
            var nsevent = [
                
                ( evt || "" ),
                
                NAMESPACE
            ]; 
            
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
            // use a jQuery object as simple PubSub
            this.$PB = $( {} );
            return this;
        }
        
        ,disposePubSub: function( ) {
            // unbind all namespaced events on this pubsub
            this.$PB.off( NSEvent('') ); 
            this.$PB = null;
            return this;
        }
        
        ,trigger: function( message, data, namespace ) {
            if ( this.namespace )
                namespace = namespace ? [this.namespace].concat(namespace) : [this.namespace];
            
            this.$PB.trigger( NSEvent(message, namespace), data );
            return this;
        }
        
        ,on: function( message, callback, namespace ) {
            if ( isType( callback, T_FUNC ) )
            {
                if ( this.namespace )
                    namespace = namespace ? [this.namespace].concat(namespace) : [this.namespace];
            
                this.$PB.on( NSEvent(message, namespace), callback );
            }
            return this;
        }
        
        ,onTo: function( pubSub, message, callback, namespace ) {
            if ( isType( callback, T_FUNC ) ) callback = callback.bind( this );
            pubSub.on( message, callback, namespace );
            return this;
        }
        
        ,off: function( message, callback, namespace ) {
            if ( this.namespace )
                namespace = namespace ? [this.namespace].concat(namespace) : [this.namespace];
            
            if ( isType( callback, T_FUNC ) ) 
                this.$PB.off( NSEvent(message, namespace), callback );
            else 
                this.$PB.off( NSEvent(message, namespace) );
            return this;
        }
        
        ,offFrom: function( pubSub, message, callback, namespace ) {
            if ( isType( callback, T_FUNC ) ) callback = callback.bind( this );
            pubSub.off( message, callback, namespace );
            return this;
        }
    };
    // aliases
    PublishSubscribe.publish = PublishSubscribe.trigger;
    PublishSubscribe.subscribe = PublishSubscribe.on;
    PublishSubscribe.unsubscribe = PublishSubscribe.off;
    PublishSubscribe.subscribeTo = PublishSubscribe.onTo;
    PublishSubscribe.unsubscribeFrom = PublishSubscribe.offFrom;
    
    
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
    
    // TODO: make composite models/views more generic/simple/flexible/intuitive
    // TODO: implement more simpler/flexible/generic/faster mapping between model data and view dom elements and attributes (eg. micro templating)
    
        
    //
    // Data Types / Validators (Static)
    var 
        // Type Compositor
        TC = function( T ) {
            
            T.BEFORE = function( T2 ) {
                return TC(function( v ) { 
                    var args = slice( arguments );
                    args[ 0 ] = T.apply( this, args );
                    return T2.apply( this, args );
                }); 
            };
            T.AFTER = function( T2 ) {
                return TC(function( v ) { 
                    var args = slice( arguments );
                    args[ 0 ] = T2.apply( this, args );
                    return T.apply( this, args );
                }); 
            };
            
            return T;
        },
            
        // Validator Compositor
        VC = function( V ) {
            
            V.NOT = function( ) { 
                return VC(function( v ) { 
                    return !V.apply(this, slice( arguments )); 
                }); 
            };
            
            V.AND = function( V2 ) { 
                return VC(function( v ) { 
                    var args = slice( arguments );
                    return !!(V.apply(this, args) && V2.apply(this, args));
                }); 
            };
            
            V.OR = function( V2 ) { 
                return VC(function( v ) { 
                    var args = slice( arguments );
                    return !!(V.apply(this, args) || V2.apply(this, args));
                }); 
            };

            V.XOR = function( V2 ) { 
                return VC(function( v ) { 
                    var args = slice( arguments ),
                        r1 = V.apply(this, args)
                        r2 = V2.apply(this, args)
                    ;
                    return !!((r1 && !r2) || (r2 && !r1));
                }); 
            };
            
            return V;
        },
        
        Type = {
            
            TypeCaster: TC,
            
            // default type casters
            Cast: {
                // collection for each item type caster
                EACH: function( eachItemTypeCaster ) {
                    var each = function( ) {
                        return eachItemTypeCaster;
                    };
                    each.MODELVIEW_COLLECTION_EACH = true;
                    return each;
                },
                
                // type caster for each specific field of an object
                FIELD: function( fieldsTypesMap ) {
                    var notbinded = true;
                    fieldsTypesMap = extend( {}, fieldsTypesMap || {} );
                    return TC(function( v ) { 
                        var p, t, a, l, i;
                        if ( notbinded )
                        {
                            for ( p in fieldsTypesMap )
                            {
                                t = fieldsTypesMap[ p ];
                                if ( t.MODELVIEW_COLLECTION_EACH )
                                {
                                    fieldsTypesMap[ p ] = t( ).bind( this );
                                    fieldsTypesMap[ p ].MODELVIEW_COLLECTION_EACH = true;
                                }
                                else
                                {
                                    fieldsTypesMap[ p ] = t.bind( this );
                                }
                            }
                            notbinded = false;
                        }
                        for ( p in fieldsTypesMap )
                        {
                            t = fieldsTypesMap[ p ];
                            a = v[ p ];
                            if ( t.MODELVIEW_COLLECTION_EACH && isType(a, T_ARRAY) )
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
                        if ( (T_UNDEF & T) || ((T_STR & T) && !trim(v).length)  ) v = defaultValue;
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
                    return parseInt( v, 10 ); 
                }),
                FLOAT: TC(function( v ) { 
                    return parseFloat( v, 10 ); 
                }),
                TRIMMED: TC(function( v ) { 
                    return trim( String(v) );
                }),
                LCASE: TC(function( v ) { 
                    return String(v).toLowerCase( );
                }),
                UCASE: TC(function( v ) { 
                    return String(v).toUpperCase( );
                }),
                STRING: TC(function( v ) { 
                    return String(v); 
                })
            },
            
            add: function( type, handler ) {
                if ( isType( type, T_STR ) && isType( handler, T_FUNC ) ) Type.Cast[ type ] = TC( handler );
                return Type;
            },
            
            del: function( type ) {
                if ( isType( type, T_STR ) && Type.Cast[ type ] ) delete Type.Cast[ type ];
                return Type;
            },
        
            toString: function( ) {
                return '[ModelView.Type]';
            }
        },
        
        Validation = {
            
            Validator: VC,
            
            // default validators
            Validate: {
                // collection for each item validator
                EACH: function( eachItemValidator ) {
                    var each = function( ) {
                        return eachItemValidator;
                    };
                    each.MODELVIEW_COLLECTION_EACH = true;
                    return each;
                },
                
                // validator for each specific field of an object
                FIELD: function( fieldsValidatorsMap ) {
                    var notbinded = true;
                    fieldsValidatorsMap = extend( {}, fieldsValidatorsMap || {} );
                    return VC(function( v ) { 
                        var p, t, a, l, i;
                        if ( notbinded )
                        {
                            for ( p in fieldsValidatorsMap )
                            {
                                t = fieldsValidatorsMap[ p ];
                                if ( t.MODELVIEW_COLLECTION_EACH )
                                {
                                    fieldsValidatorsMap[ p ] = t( ).bind( this );
                                    fieldsValidatorsMap[ p ].MODELVIEW_COLLECTION_EACH = true;
                                }
                                else
                                {
                                    fieldsValidatorsMap[ p ] = t.bind( this );
                                }
                            }
                            notbinded = false;
                        }
                        for ( p in fieldsValidatorsMap )
                        {
                            t = fieldsValidatorsMap[ p ];
                            a = v[ p ];
                            if ( t.MODELVIEW_COLLECTION_EACH && isType(a, T_ARRAY) )
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
                    return isNumeric( v ); 
                }),
                NOT_EMPTY: VC(function( v ) { 
                    return !!( v && (0 < trim( String(v) ).length) ); 
                }),
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
                    model_field = 'this.get("' + model_field +'", true)';
                    if ( false !== strict )
                    {
                        return VC(new Function("v", "return ( "+model_field+" === v );")); 
                    }
                    else
                    {
                        return VC(new Function("v", "return ( "+model_field+" == v );")); 
                    }
                },
                NOT_EQUALTO: function( model_field, strict ) { 
                    model_field = 'this.get("' + model_field +'", true)';
                    if ( false !== strict )
                    {
                        return VC(new Function("v", "return ( "+model_field+" !== v );")); 
                    }
                    else
                    {
                        return VC(new Function("v", "return ( "+model_field+" != v );")); 
                    }
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
                    if ( isType(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                    return VC(function( v ) { 
                        return ( -1 < vals.indexOf( v ) ); 
                    }); 
                },
                NOT_IN: function( /* vals,.. */ ) { 
                    var vals = slice( arguments ); 
                    if ( isType(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                    return VC(function( v ) { 
                        return ( 0 > vals.indexOf( v ) ); 
                    }); 
                }
            },
            
            add: function( type, handler ) {
                if ( isType( type, T_STR ) && isType( handler, T_FUNC ) ) Validation.Validate[ type ] = VC( handler );
                return Validation;
            },
            
            del: function( type ) {
                if ( isType( type, T_STR ) && Validation.Validate[ type ] ) delete Validation.Validate[ type ];
                return Validation;
            },
        
            toString: function( ) {
                return '[ModelView.Validation]';
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
    Model.prototype = Mixin( Create( Object.prototype ), PublishSubscribe, {
        
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
        
        ,type: function( key, type ) {
            var model = this, k, t,
                MODELVIEW_COLLECTION_EACH = false
            ;
            if ( null == key ) return model;
            key = parseKey( key ); t = get_type( type );
            if ( T_FUNC & t )
            {
                MODELVIEW_COLLECTION_EACH = type.MODELVIEW_COLLECTION_EACH;
                // bind the type caster handler to 'this model'
                if ( MODELVIEW_COLLECTION_EACH )
                {
                    // each wrapper
                    type = type( ).bind( model );
                    type.MODELVIEW_COLLECTION_EACH = MODELVIEW_COLLECTION_EACH;
                }
                else
                {
                    type = type.bind( model );
                }
                walkadd( type, key.split('.'), model.$types );
            }
            else if ( ( T_OBJ | T_ARRAY ) & t )
            {
                for ( k in type )
                    // nested keys given, recurse
                    model.type( key + '.' + k, type[ k ] );
            }
            return model;
        }
        
        ,types: function( types ) {
            var model = this;
            if ( types && isType(types, T_OBJ) )
            {
                for (var k in types)
                    model.type( k, types[ k ] );
            }
            return model;
        }
        
        ,validator: function( key, validator ) {
            var model = this, k, t,
                MODELVIEW_COLLECTION_EACH = false
            ;
            if ( null == key ) return model;
            key = parseKey( key ); t = get_type( validator );
            if ( T_FUNC & t )
            {
                MODELVIEW_COLLECTION_EACH = validator.MODELVIEW_COLLECTION_EACH;
                // bind the validator handler to 'this model'
                if ( MODELVIEW_COLLECTION_EACH )
                {
                    // each wrapper
                    validator = validator( ).bind( model );
                    validator.MODELVIEW_COLLECTION_EACH = MODELVIEW_COLLECTION_EACH;
                }
                else
                {
                    validator = validator.bind( model );
                }
                walkadd( validator, key.split('.'), model.$validators );
            }
            else if ( ( T_OBJ | T_ARRAY ) & t )
            {
                for ( k in validator )
                    // nested keys given, recurse
                    model.validator( key + '.' + k, validator[ k ] );
            }
            return model;
        }
        
        ,validators: function( validators ) {
            var model = this;
            if ( validators && isType(validators, T_OBJ) )
            {
                for (var k in validators)
                    model.validator( k, validators[ k ] );
            }
            return model;
        }
        
        ,getter: function( key, getter ) {
            var model = this, k, t;
            if ( null == key ) return model;
            key = parseKey( key );
            t = get_type( getter );
            if ( T_FUNC & t )
            {
                // bind the getter handler to 'this model'
                walkadd( getter.bind( model ), key.split('.'), model.$getters );
            }
            else if ( ( T_OBJ | T_ARRAY ) & t )
            {
                for ( k in getter )
                    // nested keys given, recurse
                    model.getter( key + '.' + k, getter[ k ] );
            }
            return model;
        }
        
        ,getters: function( getters ) {
            var model = this;
            if ( getters && isType(getters, T_OBJ) )
            {
                for (var k in getters)
                    model.getter( k, getters[ k ] );
            }
            return model;
        }
        
        ,setter: function( key, setter ) {
            var model = this, k, t;
            if ( null == key ) return model;
            key = parseKey( key );
            t = get_type( setter );
            if ( T_FUNC & t )
            {
                // bind the setter handler to 'this model'
                walkadd( setter.bind( model ), key.split('.'), model.$setters );
            }
            else if ( ( T_OBJ | T_ARRAY ) & t )
            {
                for ( k in setter )
                    // nested keys given, recurse
                    model.setter( key + '.' + k, setter[ k ] );
            }
            return model;
        }
        
        ,setters: function( setters ) {
            var model = this;
            if ( setters && isType(setters, T_OBJ) )
            {
                for (var k in setters)
                    model.setter( k, setters[ k ] );
            }
            return model;
        }
        
        // handle sub-composite models as data, via walking the data
        ,serialize: function( data ) {
            var model = this, key, type, dat;
            
            while ( data && data instanceof Model )
            {
                data = data.data( );
            }
            
            type = get_type( data );
            
            if ( T_OBJ & type )
                data = extend( {}, data );
            else if ( T_ARRAY & type )
                data = data.slice( );
            
            if ( ( T_ARRAY | T_OBJ ) & type )
            {
                for (key in data)
                {
                    type = get_type( data[ key ] );
                    
                    if ( data[ key ] && data[ key ] instanceof Model )
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
            
            if ( T_OBJ === T ) return keys( o ).length;
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
            if ( !key || (model._atomic && startsWith( key, model.$atom )) ) return model;
            
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
                type, validator, setter,
                data, prevval
            ;
            if ( !key ) return model;
            key = parseKey( key );
            if ( !key || (model._atomic && startsWith( key, model.$atom )) ) return model;
            
            r = walk3( 
                key.split('.'), 
                model.$data, 
                model.$types, 
                model.$validators, 
                model.$setters, 
                Model 
            );
            o = r[ 1 ]; k = r[ 2 ];
            type = getValue( getNext( r[4], k ), '*' );
            validator = getValue( getNext( r[5], k ), '*' );
            setter = getValue( getNext( r[6], k ), '*' );
            
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
            else if ( !setter && ((false === r[0] && r[3].length) || !isType( o[k], T_ARRAY )) )
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
                
                // append node here
                o[ k ].push( val );
            
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
            var model = this, path, p, 
                o, val, data
            ;
            if ( null == key ) return model;
            key = parseKey( key );
            if ( model._atomic && startsWith( key, model.$atom ) ) return model;
            
            path = key.split('.');
            if ( !path ) return model;
            o = model.$data;
            
            while ( path.length ) 
            {
                p = path.shift();
                // nested sub-composite model
                if ( o[ p ] && o[ p ] instanceof Model && path.length > 0 )
                {
                    var mkey = path.join('.');
                    val = o[ p ].get( mkey );
                    o[ p ].del( mkey ); 
                    if ( pub )
                    {
                        data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                        if ( extra ) data = extend({}, extra, data); 
                        model.publish('remove', data);
                    }
                    
                    if ( model.$atom && key === model.$atom ) model._atomic = true;
                    
                    return model;
                }
                else if ( isType( o, T_OBJ | T_ARRAY ) && hasProp(o, p) && path.length > 0 ) 
                    o = o[ p ];
                else if ( path.length > 0 )
                    // do not remove intermediate keys/values
                    return model;
            }
            val = o[ p ];
            delete o[ p ]; // not re-arrange indexes
            
            if ( pub )
            {
                data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                if ( extra ) data = extend({}, extra, data); 
                model.publish('remove', data);
            }
            
            if ( model.$atom && key === model.$atom ) model._atomic = true;
                
            return model;
        }
        
        // remove, re-arranging (array) indexes
        ,rem: function( key, pub, extra ) {
            var model = this, path, 
                p, o, val, data, T
            ;
            if ( null == key ) return model;
            key = parseKey( key );
            if ( model._atomic && startsWith( key, model.$atom ) ) return model;
            
            path = key.split('.');
            if ( !path ) return model;
            o = model.$data;
            
            while ( path.length ) 
            {
                p = path.shift();
                T = get_type( o );
                // nested sub-composite model
                if ( o[ p ] && o[ p ] instanceof Model && path.length > 0 )
                {
                    var mkey = path.join('.');
                    val = o[ p ].get( mkey );
                    o[ p ].rem( mkey ); 
                    if ( pub )
                    {
                        data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                        if ( extra ) data = extend({}, extra, data); 
                        model.publish('remove', data);
                    }
                    
                    if ( model.$atom && key === model.$atom ) model._atomic = true;
                    
                    return model;
                }
                else if ( (T&( T_OBJ | T_ARRAY )) && hasProp(o, p) && path.length > 0 ) 
                    o = o[ p ];
                else if ( path.length > 0 )
                    // do not remove intermediate keys/values
                    return model;
            }
            if ( undef !== o[ p ] )
            {
                o[ p ] = undef;
                val = o[ p ];
                if ( T_OBJ == T ) delete o[ p ];
                else if ( T_ARRAY == T  && isArrayIndex( p ) ) o.splice( +p, 1 );
            }
            if ( pub )
            {
                data = {target: model, bracketkey: parseKey(key, 1), key: key, value: val};
                if ( extra ) data = extend({}, extra, data); 
                model.publish('remove', data);
            }
            
            if ( model.$atom && key === model.$atom ) model._atomic = true;
                
            return model;
        }
        
        // shortcut to trigger "model:change" per given key
        ,notify: function( key, evt ) {
            if ( undef !== key )
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
    View._REFRESH_INTERVAL = Infinity; // refresh cache interval
    View.prototype = Mixin( Create( Object.prototype ), PublishSubscribe, {
        
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
                if ( isType( renderer, T_FUNC ) ) view.$template = renderer;
                return view;
            }
            return view.$template;
        }
        
        ,event: function( name, handler ) {
            var view = this,
                evt = name ? ('on_' + name.split(':').join('_')) : null;
            if ( evt && undef !== handler )
            {
                view[ evt ] = isType( handler, T_FUNC ) ? handler : null;
                return view;
            }
            return evt ? view[ evt ] : undef;
        }
        
        ,action: function( name, handler ) {
            var view = this;
            if ( arguments.length > 1 )
            {
                view['do_'+name] = isType( handler, T_FUNC ) ? handler : null;
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
                if ( isType(bind[evt], T_STR) ) return {event: evt, action: bind[evt]};
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
                bindSelector = '[' + view.$bind + ']',
                autobindSelector = 'input[name^="' + model.id + '["],textarea[name^="' + model.id + '["],select[name^="' + model.id + '["]',
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
                bindSelector = '[' + view.$bind + ']',
                autobindSelector = 'input[name^="' + model.id + '["],textarea[name^="' + model.id + '["],select[name^="' + model.id + '["]', isAutoBind = false, isBind = false, $el = $(el),
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
                bindSelector = '[' + view.$bind + ']',
                autobindSelector = 'input[name^="' + model.id + '["],textarea[name^="' + model.id + '["],select[name^="' + model.id + '["]', method, evt,
                namespaced
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
                if ( !isType( view[ method ], T_FUNC ) || !/^on_model_/.test( method ) ) continue;
                
                evt = method.replace(/^on_model_/, '');
                evt.length && view.onTo( model, evt, view[ method ], view.namespace );
            }
            
            return view;
        }
        
        ,sync: function( $dom ) {
            var view = this, model = view.$model, 
                bindSelector = '[' + view.$bind + ']',
                autobindSelector = 'input[name^="' + model.id + '["],textarea[name^="' + model.id + '["],select[name^="' + model.id + '["]',
                bindElements, autoBindElements
            ;
            
            $dom = $dom ? $($dom) : view.$dom;
            
            bindElements = view.get( bindSelector, $dom, true );
            autoBindElements = view.get( autobindSelector, $dom, true );
            
            view.doAction( bindElements, Event('change'), {sync: true} );
            view.$autobind && view.doAutoBindAction( autoBindElements, Event('change'), {sync: true} );
            
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
                view.doAction(el, evt, data);
            }
            
            // notify any 3rd-party also if needed
            view.publish('change', data);
        }
        
        ,on_model_error: function( evt, data ) {
            var view = this, model = view.$model, 
                name = model.id + data.bracketkey,
                bindSelector = '[' + view.$bind + ']',
                autobindSelector = 'input[name^="' +name+ '"],textarea[name^="' +name+ '"],select[name^="' +name+ '"]',
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
            view.doAction( bindElements, evt, {model:data} );
            
            if ( view.$autobind )
            {
                // do view autobind action to bind input elements that map to the model, afterwards
                view.doAutoBindAction( autoBindElements, evt, {model:data} );
            }
        }
        
        ,on_model_change: function( evt, data ) {
            var view = this, model = view.$model, 
                name = model.id + data.bracketkey,
                bindSelector = '[' + view.$bind + ']',
                autobindSelector = 'input[name^="' +name+ '"],textarea[name^="' +name+ '"],select[name^="' +name+ '"]',
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
            view.doAction( bindElements, evt, {model:data} );
            
            if ( view.$autobind )
            {
                // do view autobind action to bind input elements that map to the model, afterwards
                view.doAutoBindAction( autoBindElements, evt, {model:data} );
            }
        }

        //
        // view "do_action" methods
        //
        
        // NOP action
        ,do_NOP: null
        
        // render an element using a custom template and model data
        ,do_render: function( evt, $el, data ) {
            if ( !this.$template || !data['key'] || !data['tpl'] ) return;
            
            if ( data['domRef'] )
                $el = this.getDomRef( $el, data['domRef'] );
            
            if ( !$el.length ) return;
            
            var view = this, model = view.$model, 
                key = data['key'], tpl = data['tpl'],
                mode = data['mode'] || 'replace', html
            ;
            
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
            
            if ( data['domRef'] )
                $el = this.getDomRef( $el, data['domRef'] );
            if ( !$el.length ) return;
                
            // css attributes
            if ( data['css'] )
            {
                hash = { };
                if ( isType(data.css, T_OBJ) )
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
                if ( isType(data.attr, T_OBJ) )
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
            isBool = isType( value, T_BOOL );
            
            if ( data['prop'] )
            {
                attr = data['prop'];
                switch (attr)
                {
                    case PROPS['options']:
                        if ( $el.is('select') && isType( value, T_ARRAY ) )
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
            
            if ( data['domRef'] )
                $el = this.getDomRef( $el, data['domRef'] );
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
            
            if ( data['domRef'] )
                $el = this.getDomRef( $el, data['domRef'] );
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
            
            if ( $el.is("input,textarea,select") ) 
            {
                name = $el.attr('name') || false;
                if ( name )
                {
                    // use already computed/cached key/value from calling method passed in "data"
                    key = data.key /*removePrefix(model.id, name)*/ || false;
                    if ( !key ) return;
                    value = data.value; //model.get( key );
                    isBool = isType( value, T_BOOL );
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
                        
                        if ( checkbox.length > 1 && isType( value, T_ARRAY ) )
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
                }
            } 
        }
        
        ,doAction: function( $elements, evt, data ) {
            var view = this, model = view.$model;
            
            $elements.each(function( ) {
                var $el = $(this), bind = view.attr($el, 'bind'),
                    eventAction, event, action, key, bindData, elName
                ;
                
                if ( !bind ) return;
                
                eventAction = view.eventaction(evt.type, bind);
                
                if ( !eventAction || !eventAction.action ) return;
                
                event = eventAction.event;
                action = eventAction.action;
                
                // during sync, dont do any actions based on (other) events
                if ( data.sync && 'change' != event ) return;
                
                if ( data.model )
                {
                    elName = $el.attr('name') || false;
                    key = (elName && $el.is('input,textarea,select')) ? removePrefix(model.id, elName) : eventAction.key;
                    
                    // "model:change" event and element does not reference the (nested) model key
                    if ( !key || (
                        ( !startsWith( key, data.model.bracketkey ) ) && 
                        ( !startsWith( key, data.model.key ) ) 
                    )) return;
                    
                    // atomic operation(s)
                    if ( model._atomic && startsWith( key, model.$atom ) ) return;
                }
                
                if ( action && isType( view['do_'+action], T_FUNC ) )
                {
                    bindData = extend(true, {}, eventAction);
                    view['do_'+action]( evt, $el, bindData );
                    
                    // allow post-action processing to take place if needed
                    if ( eventAction.complete && isType( view['do_'+eventAction.complete], T_FUNC ) )
                    {
                        // add a small delay also
                        setTimeout(function(){
                            view['do_'+eventAction.complete]( evt, $el, bindData );
                        }, 20);
                    }
                }
            });
            
            return this;
        }
        
        ,doAutoBindAction: function( $elements, evt, data ) {
            var view = this, model = view.$model, cached = { };
            
            if ( view['do_bind'] )
            {
                $elements.each(function( ) {
                    var $el = $( this ), 
                        name = $el.attr('name') || '',
                        key = (data && data['key'])  ? data.key : removePrefix(model.id, name),
                        value;
                        
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
                    view.do_bind( evt, $el, { key: key, value: value } );
                });
            }
            return this;
        }
        
        ,toString: function( ) {
            return '[ModelView.View id: '+this.id+']';
        }
    });
    
    // main
    // export it
    exports.ModelView = {
    
        VERSION: "@@VERSION@@"
        
        ,UUID: uuid
        
        ,Extend: Mixin
        
        ,Type: Type
        
        ,Validation: Validation
        
        ,Cache: Cache
        
        ,Model: Model
        
        ,View: View
    };
    
}(@@EXPORTS@@, jQuery);