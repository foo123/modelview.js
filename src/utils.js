    var
        WILDCARD = "*", NAMESPACE = "modelview",
        
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
