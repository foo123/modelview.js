    
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
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto],
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    //FPCall = FP.call, hasProp = bindF(FPCall, OP.hasOwnProperty),
    toString = OP.toString, slice = AP.slice,
    tostr = function( s ){ return Str(s); },
    newFunc = function( args, code ){ return new Func(args, code); },
    is_instance = function( o, T ){ return o instanceof T; },
    
    INF = Infinity, rnd = Math.random, 
    
    ESCAPED_RE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    esc_re = function( s ) { 
        return s.replace(ESCAPED_RE, "\\$&"); 
    },
    
    del = function( o, k, soft ) { 
        o[k] = undef; if ( !soft ) delete o[k];
        return o;
    },
    
    // types
    T_NUM = 4, T_INF = 5, T_NAN = 6, T_BOOL = 8,
    T_STR = 16, T_CHAR = 17, T_CHARLIST = 18,
    T_ARRAY = 32, T_OBJ = 64, T_FUNC = 128,  T_REGEX = 256, T_DATE = 512,
    T_NULL = 1024, T_UNDEF = 2048, T_UNKNOWN = 4096,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    T_ARRAY_OR_STR = T_STR|T_ARRAY, T_ARRAY_OR_OBJ = T_OBJ|T_ARRAY,
    STRING_TYPE = {
        "[object Number]"   : T_NUM,
        "[object String]"   : T_STR,
        "[object Array]"    : T_ARRAY,
        "[object RegExp]"   : T_REGEX,
        "[object Date]"     : T_DATE,
        "[object Function]" : T_FUNC,
        "[object Object]"   : T_OBJ
    },
    get_type = function( v ) {
        if      ( null === v )                return T_NULL;
        else if ( true === v || false === v || 
                       v instanceof Boolean ) return T_BOOL;
        else if ( undef === v )               return T_UNDEF;
        var TYPE = STRING_TYPE[ toString.call( v ) ] || T_UNKNOWN;
        if      ( T_NUM === TYPE   || v instanceof Number )   return isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
        else if ( T_STR === TYPE   || v instanceof String )   return 1 === v.length ? T_CHAR : T_STR;
        else if ( T_ARRAY === TYPE || v instanceof Array )    return T_ARRAY;
        else if ( T_REGEX === TYPE || v instanceof RegExp )   return T_REGEX;
        else if ( T_DATE === TYPE  || v instanceof Date )     return T_DATE;
        else if ( T_FUNC === TYPE  || v instanceof Function ) return T_FUNC;
        else if ( T_OBJ === TYPE )                            return T_OBJ;
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
    
    // Array multi - sorter utility
    // returns a sorter that can (sub-)sort by multiple (nested) fields 
    // each ascending or descending independantly
    sorter = function( ) {
        var arr = this, i, args = arguments, l = args.length,
            a, b, avar, bvar, variables, step, lt, gt,
            field, filter_args, sorter_args, desc, dir, sorter,
            ASC = '|^', DESC = '|v';
        // |^ after a (nested) field indicates ascending sorting (default), 
        // example "a.b.c|^"
        // |v after a (nested) field indicates descending sorting, 
        // example "b.c.d|v"
        if ( l )
        {
            step = 1;
            sorter = [];
            variables = [];
            sorter_args = [];
            filter_args = []; 
            for (i=l-1; i>=0; i--)
            {
                field = args[i];
                // if is array, it contains a filter function as well
                filter_args.unshift('f'+i);
                if ( field.push )
                {
                    sorter_args.unshift(field[1]);
                    field = field[0];
                }
                else
                {
                    sorter_args.unshift(null);
                }
                dir = field.slice(-2);
                if ( DESC === dir ) 
                {
                    desc = true;
                    field = field.slice(0,-2);
                }
                else if ( ASC === dir )
                {
                    desc = false;
                    field = field.slice(0,-2);
                }
                else
                {
                    // default ASC
                    desc = false;
                }
                field = field.length ? '["' + field.split('.').join('"]["') + '"]' : '';
                a = "a"+field; b = "b"+field;
                if ( sorter_args[0] ) 
                {
                    a = filter_args[0] + '(' + a + ')';
                    b = filter_args[0] + '(' + b + ')';
                }
                avar = 'a_'+i; bvar = 'b_'+i;
                variables.unshift(''+avar+'='+a+','+bvar+'='+b+'');
                lt = desc ?(''+step):('-'+step); gt = desc ?('-'+step):(''+step);
                sorter.unshift("("+avar+" < "+bvar+" ? "+lt+" : ("+avar+" > "+bvar+" ? "+gt+" : 0))");
                step <<= 1;
            }
            // use optional custom filters as well
            return (newFunc(
                    filter_args.join(','), 
                    ['return function(a,b) {',
                     '  var '+variables.join(',')+';',
                     '  return '+sorter.join('+')+';',
                     '};'].join("\n")
                    ))
                    .apply(null, sorter_args);
        }
        else
        {
            a = "a"; b = "b"; lt = '-1'; gt = '1';
            sorter = ""+a+" < "+b+" ? "+lt+" : ("+a+" > "+b+" ? "+gt+" : 0)";
            return newFunc("a,b", 'return '+sorter+';');
        }
    },
    
    // http://stackoverflow.com/a/11762728/3591273
    node_index = function( node ) {
        var index = 0;
        while ( (node=node.previousSibling) ) index++;
        return index;
    },
    
    node_closest_index = function( node, root ) {
        var closest = node;
        if ( root ) while ( closest[PARENT] && closest[PARENT] !== root ) closest = closest[PARENT];
        return node_index( closest );
    },
    
    find_node = function( root, node_type, node_index ) {
        var ndList = root.childNodes, len = ndList.length, 
            n, node = null, i = 0, node_ith = 0;
        node_index = node_index || 1;
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        // TEXT_NODE = 3, COMMENT_NODE = 8
        // return node.nodeValue
        while ( i < len )
        {
            n = ndList[i++];
            if ( node_type === n.nodeType )
            {
                node = n;
                if (++node_ith === node_index) break;
            }
        }
        return node;
    },
    
    join_text_nodes = function( nodes ) {
        var i, l = nodes.length, txt = l ? nodes[0].nodeValue : '';
        if ( l > 1 ) for (i=1; i<l; i++) txt += nodes[i].nodeValue;
        return txt;
    },
    
    // http://youmightnotneedjquery.com/
    $id = function( id, el ) {
        return [ (el || document).getElementById( id ) ];
    },
    $tag = function( tagname, el ) {
        return slice.call( (el || document).getElementsByTagName( tagname ), 0 );
    },
    $sel = function( selector, el, single ) {
        return true === single 
            ? [ (el || document).querySelector( selector ) ]
            : slice.call( (el || document).querySelectorAll( selector ), 0 )
        ;
    },
    
    get_dom_ref = function( el, ref ) {
        // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
        return ( /*ref &&*/ startsWith(ref, "$this::") ) ? $sel( ref.slice( 7 ), el/*, true*/ ) : $sel( ref, null/*, true*/ );
    },
    
    // http://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
    str2dom = function( str ) {
        var d = document, n, 
            a = d.createElement("div"),
            b = d.createDocumentFragment();
        a.innerHTML = str;
        while ( n = a.firstChild ) b.appendChild( n );
        return b;
    },
    
    // http://stackoverflow.com/questions/1750815/get-the-string-representation-of-a-dom-node
    dom2str = (function() {
        var DIV = document.createElement("div");

        if ( 'outerHTML' in DIV )
            return function(node) { return node.outerHTML; };

        return function(node) {
            var div = DIV.cloneNode();
            div.appendChild( node.cloneNode(true) );
            return div.innerHTML;
        };

    })(),
    
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
    get_style = 'undefined' !== typeof window && window.getComputedStyle 
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
                ( !opt[PARENT][DISABLED] || "OPTGROUP" !== opt[PARENT][TAG] ) 
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
        switch( el[TAG] )
        {
            case 'TEXTAREA':case 'INPUT': return el[VAL];
            case 'SELECT': return select_get( el );
            default: return (TEXTC in el) ? el[TEXTC] : el[TEXT];
        }
    },
    
    set_val = function( el, v ) {
        if ( !el ) return;
        switch( el[TAG] )
        {
            case 'TEXTAREA':case 'INPUT': el[VAL] = Str(v); break;
            case 'SELECT': select_set( el, v ); break;
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
    
    Node = function( val, next ) {
        var self = this;
        self.v = val || null;
        self.n = next || {};
    },
    
    WILDCARD = "*", NAMESPACE = "modelview",
    
    // UUID counter for ModelViews
    _uuid = 0,
        
    // get a Universal Unique Identifier (UUID)
    uuid =  function( namespace ) {
        return [ namespace||'UUID', ++_uuid, NOW( ) ].join( '_' );
    }
;

