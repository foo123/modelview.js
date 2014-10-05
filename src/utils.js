    
///////////////////////////////////////////////////////////////////////////////////////
//
//
// utility functions
//
//
///////////////////////////////////////////////////////////////////////////////////////

var undef = undefined, bindF = function( f, scope ) { return f.bind(scope); },
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto], FPCall = FP.call,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    hasProp = bindF(FPCall, OP.hasOwnProperty), toStr = bindF(FPCall, OP.toString), slice = bindF(FPCall, AP.slice),
    newFunc = function( args, code ){ return new Func(args, code); },
    is_instance = function( o, T ){ return o instanceof T; },
    
    tostr = function( s ){ return Str(s); },
    INF = Infinity, rnd = Math.random, 
    
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
        
        else if (v instanceof Num || "number" === type_of)  return isNaN(v) ? T_NAN : T_NUM;
        
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
    is_numeric = function( n ) { return !isNaN( parseFloat( n, 10 ) ) && isFinite( n ); },

    is_array_index = function( n ) {
        if ( is_numeric( n ) ) // is numeric
        {
            n = +n;  // make number if not already
            if ( (0 === n % 1) && n >= 0 ) // and is positive integer
                return true;
        }
        return false
    },

    ATTR = 'getAttribute', SET_ATTR = 'setAttribute', 
    CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
    NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value', 
    OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
    STYLE = 'style', CLASS = 'className', HTML = 'innerHTML', TEXT = 'innerText', TEXTC = 'textContent',
    
    // http://youmightnotneedjquery.com/
    $id = function( id, el ) {
        return [ (el || document).getElementById( id ) ];
    },
    $tag = function( tagname, el ) {
        return AP.slice.call( (el || document).getElementsByTagName( tagname ), 0 );
    },
    $sel = function( selector, el, single ) {
        return true === single 
            ? [ (el || document).querySelector( selector ) ]
            : AP.slice.call( (el || document).querySelectorAll( selector ), 0 )
        ;
    },
    
    // http://youmightnotneedjquery.com/
    matches = (function( P ) {
        if ( !P ) return;
        return (
            P.matches || 
            P.matchesSelector || 
            P.webkitMatchesSelector || 
            P.mozMatchesSelector || 
            P.msMatchesSelector || 
            P.oMatchesSelector
        );
    }(Element ? Element[proto] : null)),

    get_textnode = function( txt ) { return document.createTextNode(txt||''); },
    
    // http://stackoverflow.com/a/2364000/3591273
    get_style = window.getComputedStyle 
        ? function( el ){ return window.getComputedStyle(el, null); } 
        : function( el ) { return el.currentStyle; },
    
    show = function( el ) {
        if ( !el._displayCached ) el._displayCached = get_style( el ).display || 'block';
        el[STYLE].display = 'none' !== el._displayCached ? el._displayCached : 'block';
        el._displayCached = undef;
    },
    
    hide = function( el ) {
        if ( !el._displayCached ) el._displayCached = get_style( el ).display || 'block';
        el[STYLE].display = 'none';
    },
    
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
        var values = [ ].concat( v ).map( tostr ), 
            options = el[OPTIONS],
            opt, i, sel_index = -1
        ;
        
        for (i=0; i<options.length; i++ )
        {
            opt = options[ i ];
            opt[SELECTED] = -1 < values.indexOf( opt_val( opt ) );
        }
        if ( !values.length ) el[SELECTED_INDEX] = -1;
    },
    
    get_val = function( el ) {
        if ( !el ) return;
        switch( el[TAG].toLowerCase( ) )
        {
            case 'textarea':case 'input': return el[VAL];
            case 'select': return select_get( el );
            default: return (TEXTC in el) ? el[TEXTC] : el[TEXT];
        }
    },
    
    set_val = function( el, v ) {
        if ( !el ) return;
        switch( el[TAG].toLowerCase( ) )
        {
            case 'textarea':case 'input': el[VAL] = Str(v); break;
            case 'select': select_set( el, v ); break;
            default: 
                if ( TEXTC in el ) el[TEXTC] = Str(v); 
                else el[TEXT] = Str(v);
                break;
        }
    },
    
    notEmpty = function( s ){ return s.length > 0; },
    
    // adapted from jQuery
    getNS = function( evt ) {
        var ns = evt.split('.'), e = ns[ 0 ];
        ns = ns.slice( 1 ).filter( notEmpty );
        return [e, ns.sort( )];
    },
    getNSMatcher = function( givenNamespaces ) {
        return givenNamespaces.length 
            ? new Regex( "(^|\\.)" + givenNamespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" ) 
            : false;
    },
    
    fromJSON = JSON.parse, toJSON = JSON.stringify,
    
    NOW = function( ) { return new Date( ).getTime( ); }
;

// use native methods and abbreviation aliases if available
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
if ( !SP.trim ) SP.trim = function( ) { return this.replace(/^\s+|\s+$/g, ''); };
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
if ( !SP.startsWith ) SP.startsWith = function( prefix, pos ) { pos=pos||0; return ( prefix === this.substr(pos, prefix.length+pos) ); };
SP.tR = SP.trim; SP.sW = SP.startsWith;

var
    WILDCARD = "*", NAMESPACE = "modelview",
    
    Merge = function(/* var args here.. */) { 
        var args = arguments, argslen, 
            o1, o2, v, p, i, T ;
        o1 = args[0] || {}; 
        argslen = args.length;
        for (i=1; i<argslen; i++)
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

    Node = function( val, next ) {
        this.val = val || null;
        this.next = next || {};
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
                    if ( ai[ k ] && ai[ k ].val ) return ai[ k ].val;
                    if ( ai[ WILDCARD ] && ai[ WILDCARD ].val ) return ai[ WILDCARD ].val;
                }
            }
        }
        else
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai && ai.val )  return ai.val;
            }
        }
        return null;
    },
    
    walkadd = function( v, p, obj, isCollectionEach ) {
        var o = obj, k;
        while ( p.length )
        {
            k = p.shift( );
            if ( !(k in o) ) o[ k ] = new Node( );
            o = o[ k ];
            if ( p.length ) 
            {
                o = o.next;
            }
            else 
            {
                if ( isCollectionEach )
                {
                    if ( !(WILDCARD in o.next) ) o.next[ WILDCARD ] = new Node( );
                    o.next[ WILDCARD ].val = v;
                }
                else
                {
                    o.val = v;
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
    }
;
