    
///////////////////////////////////////////////////////////////////////////////////////
//
//
// utilities
//
//
///////////////////////////////////////////////////////////////////////////////////////

var undef = undefined, bindF = function( f, scope ) { return f.bind(scope); },
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto], FPCall = FP.call,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    /*hasProp = bindF(FPCall, OP.hasOwnProperty),*/ toStr = bindF(FPCall, OP.toString), slice = bindF(FPCall, AP.slice),
    newFunc = function( args, code ){ return new Func(args, code); },
    is_instance = function( o, T ){ return o instanceof T; },
    
    tostr = function( s ){ return Str(s); },
    INF = Infinity, rnd = Math.random, 
    
    esc_re = function( s ) { return s.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&"); },
    
    del = function( o, k, soft ) { 
        o[k] = undef; if ( !soft ) delete o[k];
        return o;
    },
    
    // types
    T_NUM = 2, T_NAN = 3, /*T_INF = 3,*/ T_BOOL = 4, T_STR = 8, T_CHAR = 9,
    T_ARRAY = 16, T_OBJ = 32, T_FUNC = 64, T_REGEX = 128,  
    T_NULL = 256, T_UNDEF = 512, T_UNKNOWN = 1024, 
    T_ARRAY_OR_OBJ = T_ARRAY | T_OBJ, T_ARRAY_OR_STR = T_ARRAY | T_STR,
    TO_STRING = {
        "[object Array]"    : T_ARRAY,
        "[object RegExp]"   : T_REGEX,
        "[object Number]"   : T_NUM,
        "[object String]"   : T_STR,
        "[object Function]" : T_FUNC,
        "[object Object]"   : T_OBJ
    },
    get_type = function( v ) {
        var /*type_of,*/ to_string;
        
        if (null === v)  return T_NULL;
        else if (true === v || false === v)  return T_BOOL;
        else if (undef === v /*|| "undefined" === type_of*/)  return T_UNDEF;
        
        //type_of = typeOf(v);
        to_string = toString.call( v );
        //to_string = TO_STRING[HAS](to_string) ? TO_STRING[to_string] : T_UNKNOWN;
        to_string = TO_STRING[to_string] || T_UNKNOWN;
        
        //if (undef === v /*|| "undefined" === type_of*/)  return T_UNDEF;
        if (T_NUM === to_string || v instanceof Num)  return isNaN(v) ? T_NAN : T_NUM;
        else if (T_STR === to_string || v instanceof Str) return (1 === v.length) ? T_CHAR : T_STR;
        else if (T_ARRAY === to_string || v instanceof Arr)  return T_ARRAY;
        else if (T_REGEX === to_string || v instanceof Regex)  return T_REGEX;
        else if (T_FUNC === to_string || v instanceof Func)  return T_FUNC;
        else if (T_OBJ === to_string)  return T_OBJ;
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

    HAS = 'hasOwnProperty',
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
    MATCHES = (function( P ) {
        if ( !P || P.matches ) return 'matches';
        else if ( P.matchesSelector ) return 'matchesSelector';
        else if ( P.webkitMatchesSelector ) return 'webkitMatchesSelector';
        else if ( P.mozMatchesSelector ) return 'mozMatchesSelector';
        else if ( P.msMatchesSelector ) return 'msMatchesSelector';
        else if ( P.oMatchesSelector ) return 'oMatchesSelector';
    }(this.Element ? this.Element[proto] : null)),

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
    
    notEmpty = function( s ){ return s.length > 0; }, SPACES = /\s+/g,
    
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
    
    // use native methods and abbreviation aliases if available
    fromJSON = JSON.parse, toJSON = JSON.stringify, 
    
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    trim = SP.trim 
            ? function( s ){ return s.trim( ); } 
            : function( s ){ return s.replace(/^\s+|\s+$/g, ''); }, 
    
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    startsWith = SP.startsWith 
            ? function( str, pre, pos ){ return str.startsWith(pre, pos||0); } 
            : function( str, pre, pos ){ return ( pre === str.slice(pos||0, pre.length) ); },
    
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
    NOW = Date.now ? Date.now : function( ) { return new Date( ).getTime( ); },
    
    Node = function( val, next ) {
        this.v = val || null;
        this.n = next || {};
    },
    
    WILDCARD = "*", NAMESPACE = "modelview",
    
    // UUID counter for Modelviews
    _uuid = 0,
        
    // get a Universal Unique Identifier (UUID)
    uuid =  function( namespace ) {
        return [ namespace||'UUID', ++_uuid, NOW( ) ].join( '_' );
    }
;

