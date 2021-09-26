/**
*
*   ModelView.js
*   @version: 3.0.0
*   @built on 2021-09-26 19:50:39
*
*   A simple, light-weight, versatile and fast MVVM framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/!function( root, name, factory ){
"use strict";
if ( ('object'===typeof module)&&module.exports ) /* CommonJS */
    (module.$deps = module.$deps||{}) && (module.exports = module.$deps[name] = factory.call(root));
else if ( ('function'===typeof define)&&define.amd&&('function'===typeof require)&&('function'===typeof require.specified)&&require.specified(name) /*&& !require.defined(name)*/ ) /* AMD */
    define(name,['module'],function(module){factory.moduleUri = module.uri; return factory.call(root);});
else if ( !(name in root) ) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root)||1)&&('function'===typeof(define))&&define.amd&&define(function(){return root[name];} );
}(  /* current root */          'undefined' !== typeof self ? self : this, 
    /* module name */           "ModelView",
    /* module factory */        function ModuleFactory__ModelView( ){
/* main code starts here */

/**
*
*   ModelView.js
*   @version: 3.0.0
*   @built on 2021-09-26 19:50:39
*
*   A simple, light-weight, versatile and fast MVVM framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/

"use strict";

var HASDOC = 'undefined' !== typeof (document);

/**[DOC_MARKDOWN]
### ModelView API

**Version 3.0.0**

### Contents

* [Types](#types)
* [Validators](#validators)
* [Model](#model)
* [View](#view)
* [Examples](#examples)

[/DOC_MARKDOWN]**/
///////////////////////////////////////////////////////////////////////////////////////
//
// utilities
//
///////////////////////////////////////////////////////////////////////////////////////

var undef = undefined, bindF = function(f, scope) {return f.bind(scope);},
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys, stdMath = Math,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto],
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    //FPCall = FP.call, hasProp = bindF(FPCall, OP.hasOwnProperty),
    toString = OP.toString, HAS = OP.hasOwnProperty, slice = AP.slice,
    tostr = function(s){return Str(s);},
    newFunc = function(args, code){return new Func(args, code);},
    is_instance = function(o, T){return o instanceof T;},

    err = function(msg, data) {
        var e = new Error(msg);
        if (null != data) e.data = data;
        return e;
    },

    INF = Infinity, rnd = stdMath.random,

    ESCAPED_RE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
    esc_re = function(s) {
        return s.replace(ESCAPED_RE, "\\$&");
    },

    del = function(o, k, soft) {
        o[k] = undef; if (!soft) delete o[k];
        return o;
    },

    // types
    T_UNKNOWN = 4, T_UNDEF = 8, T_NULL = 16,
    T_NUM = 32, T_INF = 33, T_NAN = 34, T_BOOL = 64,
    T_STR = 128, T_CHAR = 129,
    T_ARRAY = 256, T_OBJ = 512, T_FUNC = 1024, T_REGEX = 2048, T_DATE = 4096,
    T_BLOB = 8192, T_FILE = 8192,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    T_ARRAY_OR_STR = T_STR|T_ARRAY, T_ARRAY_OR_OBJ = T_OBJ|T_ARRAY,
    TYPE_STRING = {
    "[object Number]"   : T_NUM,
    "[object String]"   : T_STR,
    "[object Array]"    : T_ARRAY,
    "[object RegExp]"   : T_REGEX,
    "[object Date]"     : T_DATE,
    "[object Function]" : T_FUNC,
    "[object File]"     : T_FILE,
    "[object Blob]"     : T_BLOB,
    "[object Object]"   : T_OBJ
    },
    get_type = function(v) {
        var T = 0;
        if      (null === v)                T = T_NULL;
        else if (true === v || false === v || v instanceof Boolean) T = T_BOOL;
        else if (undef === v)               T = T_UNDEF;
        else
        {
        T = TYPE_STRING[toString.call(v)] || T_UNKNOWN;
        if      ((T_NUM === T)   || (v instanceof Number))   T = isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
        else if ((T_STR === T)   || (v instanceof String) || ('string' === typeof(v)))   T = 1 === v.length ? T_CHAR : T_STR;
        else if ((T_ARRAY === T) || (v instanceof Array))    T = T_ARRAY;
        else if ((T_REGEX === T) || (v instanceof RegExp))   T = T_REGEX;
        else if ((T_DATE === T)  || (v instanceof Date))     T = T_DATE;
        else if ((T_FILE === T)  || ('undefined' !== typeof(File) && (v instanceof File)))     T = T_FILE;
        else if ((T_BLOB === T)  || ('undefined' !== typeof(Blob) && (v instanceof Blob)))     T = T_BLOB;
        else if ((T_FUNC === T)  || (v instanceof Function) || ('function' === typeof(v))) T = T_FUNC;
        else if (T_OBJ === T)                            T = T_OBJ;
        else                                             T = T_UNKNOWN;
        }
        return T;
    },

    is_type = function(v, type) {return !!(type & get_type(v));},

    // http://stackoverflow.com/questions/6449611/how-to-check-whether-a-value-is-a-number-in-javascript-or-jquery
    is_numeric = function(n) {return !isNaN(parseFloat(n, 10)) && isFinite(n);},

    is_array_index = function(n) {
        if (is_numeric(n)) // is numeric
        {
            n = +n;  // make number if not already
            if ((0 === n % 1) && n >= 0) // and is positive integer
                return true;
        }
        return false
    },

    // http://jsperf.com/functional-loop-unrolling/2
    // http://jsperf.com/functional-loop-unrolling/3
    operate = function operate(a, f, f0) {
        var i, l=a.length, r=l&15, q=r&1, fv=q?f(f0,a[0]):f0;
        for (i=q; i<r; i+=2)  fv = f(f(fv,a[i]),a[i+1]);
        for (i=r; i<l; i+=16) fv = f(f(f(f(f(f(f(f(f(f(f(f(f(f(f(f(fv,a[i]),a[i+1]),a[i+2]),a[i+3]),a[i+4]),a[i+5]),a[i+6]),a[i+7]),a[i+8]),a[i+9]),a[i+10]),a[i+11]),a[i+12]),a[i+13]),a[i+14]),a[i+15]);
        return fv;
    },
    map = function map(a, f) {
        var i, l=a.length, r=l&15, q=r&1, fv=new Array(l);
        if (q) fv[0] = f(a[0]);
        for (i=q; i<r; i+=2)
        {
            fv[i  ] = f(a[i  ]);
            fv[i+1] = f(a[i+1]);
        }
        for (i=r; i<l; i+=16)
        {
            fv[i  ] = f(a[i  ]);
            fv[i+1] = f(a[i+1]);
            fv[i+2] = f(a[i+2]);
            fv[i+3] = f(a[i+3]);
            fv[i+4] = f(a[i+4]);
            fv[i+5] = f(a[i+5]);
            fv[i+6] = f(a[i+6]);
            fv[i+7] = f(a[i+7]);
            fv[i+8] = f(a[i+8]);
            fv[i+9] = f(a[i+9]);
            fv[i+10] = f(a[i+10]);
            fv[i+11] = f(a[i+11]);
            fv[i+12] = f(a[i+12]);
            fv[i+13] = f(a[i+13]);
            fv[i+14] = f(a[i+14]);
            fv[i+15] = f(a[i+15]);
        }
        return fv;
    },
    filter = function filter(a, f) {
        var i, l=a.length, r=l&15, q=r&1, fv=new Array(l), j=0;
        if (q && f(a[0])) fv[j++] = a[0];
        for (i=q; i<r; i+=2)
        {
            if (f(a[i  ])) fv[j++] = a[i  ];
            if (f(a[i+1])) fv[j++] = a[i+1];
        }
        for (i=r; i<l; i+=16)
        {
            if (f(a[i  ])) fv[j++] = a[i  ];
            if (f(a[i+1])) fv[j++] = a[i+1];
            if (f(a[i+2])) fv[j++] = a[i+2];
            if (f(a[i+3])) fv[j++] = a[i+3];
            if (f(a[i+4])) fv[j++] = a[i+4];
            if (f(a[i+5])) fv[j++] = a[i+5];
            if (f(a[i+6])) fv[j++] = a[i+6];
            if (f(a[i+7])) fv[j++] = a[i+7];
            if (f(a[i+8])) fv[j++] = a[i+8];
            if (f(a[i+9])) fv[j++] = a[i+9];
            if (f(a[i+10])) fv[j++] = a[i+10];
            if (f(a[i+11])) fv[j++] = a[i+11];
            if (f(a[i+12])) fv[j++] = a[i+12];
            if (f(a[i+13])) fv[j++] = a[i+13];
            if (f(a[i+14])) fv[j++] = a[i+14];
            if (f(a[i+15])) fv[j++] = a[i+15];
        }
        if (j < fv.length) fv.length = j;
        return fv;
    },
    each = function each(a, f) {
        var i, l=a.length, r=l&15, q=r&1;
        if (q) f(a[0]);
        for (i=q; i<r; i+=2)
        {
            f(a[i  ]);
            f(a[i+1]);
        }
        for (i=r; i<l; i+=16)
        {
            f(a[i  ]);
            f(a[i+1]);
            f(a[i+2]);
            f(a[i+3]);
            f(a[i+4]);
            f(a[i+5]);
            f(a[i+6]);
            f(a[i+7]);
            f(a[i+8]);
            f(a[i+9]);
            f(a[i+10]);
            f(a[i+11]);
            f(a[i+12]);
            f(a[i+13]);
            f(a[i+14]);
            f(a[i+15]);
        }
        return a;
    },
    iterate = function(F, i0, i1, F0) {
        if (i0 > i1) return F0;
        else if (i0 === i1) {F(i0, F0, i0, i1); return F0;}
        var l=i1-i0+1, i, k, r=l&15, q=r&1;
        if (q) F(i0, F0, i0, i1);
        for (i=q; i<r; i+=2)
        {
            k = i0+i;
            F(  k, F0, i0, i1);
            F(++k, F0, i0, i1);
        }
        for (i=r; i<l; i+=16)
        {
            k = i0+i;
            F(  k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
            F(++k, F0, i0, i1);
        }
        return F0;
    },

    Merge = function(/* var args here.. */) {
        var args = arguments, argslen,
            o1, o2, v, p, i, T ;
        o1 = args[0] || {};
        argslen = args.length;
        for (i=1; i<argslen; i++)
        {
            o2 = args[ i ];
            if (T_OBJ === get_type( o2 ))
            {
                for (p in o2)
                {
                    v = o2[ p ];
                    T = get_type( v );

                    if (T_NUM & T)
                        // shallow copy for numbers, better ??
                        o1[ p ] = 0 + v;

                    else if (T_ARRAY_OR_STR & T)
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

    notEmpty = function(s) {return 0 < s.length;}, SPACES = /\s+/g, NL = /\r\n|\r|\n/g,

    // adapted from jQuery
    getNS = function(evt) {
        var ns = evt.split('.'), e = ns[0];
        ns = filter(ns.slice(1), notEmpty);
        return [e, ns.sort()];
    },
    getNSMatcher = function(givenNamespaces) {
        return givenNamespaces.length
            ? new Regex( "(^|\\.)" + givenNamespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" )
            : false;
    },

    Node = function(val, next) {
        var self = this;
        self.v = val || null;
        self.n = next || {};
    },

    WILDCARD = "*", NAMESPACE = "modelview",

    ATTR = 'getAttribute', SET_ATTR = 'setAttribute', HAS_ATTR = 'hasAttribute', DEL_ATTR = 'removeAttribute',
    CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
    NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value',
    OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
    STYLE = 'style', CLASS = 'className', HTML = 'innerHTML', TEXT = 'innerText', TEXTC = 'textContent',

    // use native methods and abbreviation aliases if available
    fromJSON = JSON.parse, toJSON = JSON.stringify,

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    trim = SP.trim
            ? function(s) {return Str(s).trim();}
            : function(s) {return Str(s).replace(/^\s+|\s+$/g, '');},

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    startsWith = SP.startsWith
            ? function(str, pre, pos) {return Str(str).startsWith(pre, pos||0);}
            : function(str, pre, pos) {return pre === Str(str).slice(pos||0, pre.length);},

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
    NOW = Date.now ? Date.now : function() {return new Date().getTime();},

    // UUID counter for ModelViews
    _uuid = 0,

    // get a Universal Unique Identifier (UUID)
    uuid =  function(namespace) {
        return [namespace||'UUID', ++_uuid, NOW()].join('_');
    },

    // Array multi - sorter utility
    // returns a sorter that can (sub-)sort by multiple (nested) fields
    // each ascending or descending independantly
    sorter = function() {
        var arr = this, i, args = arguments, l = args.length,
            a, b, avar, bvar, variables, step, lt, gt,
            field, filter_args, sorter_args, desc, dir, sorter;
        // + or nothing before a (nested) field indicates ascending sorting (default),
        // example "+a.b.c", "a.b.c"
        // - before a (nested) field indicates descending sorting,
        // example "-b.c.d"
        if (l)
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
                dir = field.charAt(0);
                if ('-' === dir)
                {
                    desc = true;
                    field = field.slice(1);
                }
                else if ('+' === dir)
                {
                    desc = false;
                    field = field.slice(1);
                }
                else
                {
                    // default ASC
                    desc = false;
                }
                field = field.length ? '["' + field.split('.').join('"]["') + '"]' : '';
                a = "a"+field; b = "b"+field;
                if (sorter_args[0])
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

    // http://youmightnotneedjquery.com/
    $id = function(id) {
        if (HASDOC)
        {
            var found = document.getElementById(id);
            return found ? [found] : [];
        }
        return [];
    },
    $tag = function(tagname, el) {
        return HASDOC ? slice.call((el || document).getElementsByTagName(tagname), 0) : [];
    },
    $class = function(classname, el) {
        return HASDOC ? slice.call((el || document).getElementsByClassName(classname), 0) : [];
    },
    $closest = function(selector, el) {
        el = el || document;
        if (HASDOC && el.closest)
        {
            var found = el.closest(selector);
            return found ? [found] : [];
        }
        return [];
    },
    $sel = function(selector, el, single) {
        el = el || document;
        if (HASDOC && el.querySelector)
        {
            if (true === single)
            {
                var found = el.querySelector(selector);
                return found ? [found] : [];
            }
            return slice.call(el.querySelectorAll(selector), 0);
        }
        return [];
    },

    get_dom_ref = function(el, ref) {
        // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
        if (startsWith(ref, "$this::"))
        {
            return $sel(ref.slice(7), el, true);
        }
        // shortcut to get domRefs closest up the tree relative to current element $el, represented as "$closest::" in ref selector
        else if (startsWith(ref, "$closest::"))
        {
            return $closest(ref.slice(10), el);
        }
        else
        {
            return $sel(ref, null, true);
        }
    },

    // http://youmightnotneedjquery.com/
    MATCHES = (function(P) {
        if (!P || P.matches) return 'matches';
        else if (P.matchesSelector) return 'matchesSelector';
        else if (P.webkitMatchesSelector) return 'webkitMatchesSelector';
        else if (P.mozMatchesSelector) return 'mozMatchesSelector';
        else if (P.msMatchesSelector) return 'msMatchesSelector';
        else if (P.oMatchesSelector) return 'oMatchesSelector';
    }(HASDOC && window.Element ? window.Element[proto] : null)),

    // http://stackoverflow.com/a/2364000/3591273
    get_style = HASDOC && 'undefined' !== typeof window && window.getComputedStyle
        ? function(el){return window.getComputedStyle(el, null);}
        : function(el) {return el.currentStyle;},

    show = function(el) {
        if (!el._displayCached) el._displayCached = get_style(el).display || 'block';
        el[STYLE].display = 'none' !== el._displayCached ? el._displayCached : 'block';
        el._displayCached = undef;
    },

    hide = function(el) {
        if (!el._displayCached) el._displayCached = get_style(el).display || 'block';
        el[STYLE].display = 'none';
    },

    opt_val = function(o) {
        // attributes.value is undefined in Blackberry 4.7 but
        // uses .value. See #6932
        var val = o.attributes[VAL];
        return !val || val.specified ? o[VAL] : o.text;
    },

    // adapted from jQuery
    select_get = function(el) {
        var val, opt, options = el[OPTIONS], sel_index = el[SELECTED_INDEX],
            one = "select-one" === el[TYPE] || sel_index < 0,
            values = one ? null : [],
            max = one ? sel_index + 1 : options.length,
            i = sel_index < 0 ? max : (one ? sel_index : 0)
        ;

        // Loop through all the selected options
        for (; i<max; i++)
        {
            opt = options[ i ];

            // oldIE doesn't update selected after form reset (#2551)
            if (
                (opt[SELECTED] || i === sel_index) &&
                // Don't return options that are disabled or in a disabled optgroup
                (!opt[DISABLED]) &&
                (!opt[PARENT][DISABLED] || "OPTGROUP" !== opt[PARENT][TAG])
            )
            {
                // Get the specific value for the option
                val = opt_val(opt);
                // We don't need an array for one selects
                if (one) return val;
                // Multi-Selects return an array
                values.push(val);
            }
        }
        return values;
    },

    select_set = function(el, v) {
        var values = map([].concat(v), tostr),
            options = el[OPTIONS], selected,
            opt, i, sel_index = -1, ret = false
        ;

        for (i=0; i<options.length; i++ )
        {
            opt = options[i];
            selected = opt[SELECTED];
            opt[SELECTED] = -1 < values.indexOf(opt_val(opt));
            if (selected !== opt[SELECTED]) ret = true;
        }
        if (!values.length) el[SELECTED_INDEX] = -1;
        return ret;
    },

    get_val = function(el) {
        if (!el) return;
        var value_alt = null;
        if (el[HAS_ATTR]('data-alt-value')) value_alt = el[ATTR]('data-alt-value');
        switch((el[TAG]||'').toUpperCase())
        {
            case 'INPUT': return 'file' === (el.type||'').toLowerCase() ? ((!!value_alt) && (null!=el[value_alt]) && el[value_alt].length ?el[value_alt] : (el.files.length ? el.files : null)) : ((!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL]);
            case 'TEXTAREA':return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL];
            case 'SELECT': return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : select_get(el);
            default: return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : ((TEXTC in el) ? el[TEXTC] : el[TEXT]);
        }
    },

    set_val = function(el, v) {
        if (!el) return;
        var value_alt = null, sv = Str(v), ret = false;
        if (el[HAS_ATTR]('data-alt-value')) value_alt = el[ATTR]('data-alt-value');
        switch((el[TAG]||'').toUpperCase())
        {
            case 'INPUT':
                if ('file' === (el.type||'').toLowerCase())
                {
                }
                else
                {
                    ret = el[VAL] !== sv;
                    if (ret) el[VAL] = sv;
                    if (!!value_alt) el[value_alt] = null;
                }
                break;
            case 'TEXTAREA':
                ret = el[VAL] !== sv;
                if (ret) el[VAL] = sv;
                if (!!value_alt) el[value_alt] = null;
                break;
            case 'SELECT':
                ret = select_set(el, v);
                if (!!value_alt) el[value_alt] = null;
                break;
            default:
                if (TEXTC in el)
                {
                    ret = el[TEXTC] !== sv;
                    if (ret) el[TEXTC] = sv;
                }
                else
                {
                    ret = el[TEXT] !== sv;
                    if (ret) el[TEXT] = sv;
                }
                if (!!value_alt) el[value_alt] = null;
                break;
        }
        return ret;
    },

    is_child_of = function(el, node, finalNode) {
        var p = el;
        if (p && node)
        {
            if (node === p) return true;
            else if (node.contains) return node.contains(p);
            //else if (node.compareDocumentPosition) return !!(node.compareDocumentPosition(p) & 16);
            while (p)
            {
                if (p === node) return true;
                if (finalNode && (p === finalNode)) break;
                p = p.parentNode;
            }
        }
        return false;
    },

    insert_after = function(node, refNode, parentNode) {
        parentNode = parentNode || refNode.parentNode;
        if (refNode && parentNode)
        {
            if (refNode.nextSibling) parentNode.insertBefore(node, refNode.nextSibling);
            else parentNode.appendChild(node);
        }
    },

    debounce = function(callback, instance) {
        if ('undefined' !== typeof window && window.requestAnimationFrame)
        {
            // If there's a pending render, cancel it
            if (instance && instance._dbnc) window.cancelAnimationFrame(instance._dbnc);
            // Setup the new render to run at the next animation frame
            if (instance) instance._dbnc = window.requestAnimationFrame(callback);
            else window.requestAnimationFrame(callback);
        }
        else
        {
            callback();
        }
    },

    tpl2code = function tpl2code(tpl, args, scoped, type, opts, rootNodeType) {
        var p1, p2, c, code = '"use strict";'+"\n"+'var view = this;', state;
        if ('text' === type)
        {
            tpl = trim(tpl);
            args = 'MODEL';
            code += "\nvar _$$_ = '';\nMODEL = MODEL || function(key){return '{'+String(key)+'}';};";
            while (tpl && tpl.length)
            {
                p1 = tpl.indexOf('{');
                if (-1 === p1)
                {
                    code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                    break;
                }
                p2 = tpl.indexOf('}', p1+1);
                if (-1 === p2)
                {
                    code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                    break;
                }
                code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                code += "\n"+'_$$_ += String(MODEL(\''+trim(tpl.slice(p1+1, p2))+'\'));';
                tpl = tpl.slice(p2+1);
            }
            code += "\nreturn _$$_;";
        }
        else
        {
            args = (args || '') + '_$$_';
            if (scoped && scoped.length) code += "\n" + Str(scoped);
            code += "\nreturn " + to_code(parse(tpl, opts, rootNodeType || '', true)) + ";";
        }
        return newFunc(args, code);
    },

    htmlEntities = {
    "amp": "\u0026",
    "lt": "\u003C",
    "gt": "\u003E",
    "quot": "\u0022",
    "apos": "\u0027",
    "nbsp": "\u00A0"
    },
    autoclosedTags = {
    '<area>':1,
    '<base>':1,
    '<br>':1,
    '<col>':1,
    '<embed>':1,
    '<hr>':1,
    '<img>':1,
    '<input>':1,
    '<keygen>':1,
    '<link>':1,
    '<meta>':1,
    '<param>':1,
    '<source>':1,
    '<track>':1,
    '<wbr>':1
    },
    svgElements = {
    //'<a>'
    '<animate>':1,
    '<animateMotion>':1,
    '<animateTransform>':1,
    '<circle>':1,
    '<clipPath>':1,
    '<defs>':1,
    '<desc>':1,
    '<discard>':1,
    '<ellipse>':1,
    '<feBlend>':1,
    '<feColorMatrix>':1,
    '<feComponentTransfer>':1,
    '<feComposite>':1,
    '<feConvolveMatrix>':1,
    '<feDiffuseLighting>':1,
    '<feDisplacementMap>':1,
    '<feDistantLight>':1,
    '<feDropShadow>':1,
    '<feFlood>':1,
    '<feFuncA>':1,
    '<feFuncB>':1,
    '<feFuncG>':1,
    '<feFuncR>':1,
    '<feGaussianBlur>':1,
    '<feImage>':1,
    '<feMerge>':1,
    '<feMergeNode>':1,
    '<feMorphology>':1,
    '<feOffset>':1,
    '<fePointLight>':1,
    '<feSpecularLighting>':1,
    '<feSpotLight>':1,
    '<feTile>':1,
    '<feTurbulence>':1,
    '<filter>':1,
    '<foreignObject>':1,
    '<g>':1,
    '<hatch>':1,
    '<hatchpath>':1,
    '<image>':1,
    '<line>':1,
    '<linearGradient>':1,
    '<marker>':1,
    '<mask>':1,
    '<mesh>':1,
    '<meshgradient>':1,
    '<meshpatch>':1,
    '<meshrow>':1,
    '<metadata>':1,
    '<mpath>':1,
    '<path>':1,
    '<pattern>':1,
    '<polygon>':1,
    '<polyline>':1,
    '<radialGradient>':1,
    '<rect>':1,
    //'<script>'
    '<set>':1,
    '<stop>':1,
    //'<style>'
    '<svg>':1,
    '<switch>':1,
    '<symbol>':1,
    '<text>':1,
    '<textPath>':1,
    //'<title>'
    '<tspan>':1,
    '<unknown>':1,
    '<use>':1,
    '<view>':1
    },
    VNode = function VNode(nodeType, nodeValue, nodeValue2, parentNode, index) {
        var self = this;
        if (!(self instanceof VNode)) return new VNode(nodeType, nodeValue, nodeValue2, parentNode, index);
        self.nodeType = nodeType || '';
        self.nodeValue = nodeValue || '';
        self.nodeValue2 = nodeValue2 || '';
        self.parentNode = parentNode || null;
        self.index = index || 0;
        self.id = null;
        self.attributes = [];
        self.atts = null;//{};
        self.childNodes = [];
        self.componentNodes = 0;
        self.modified = null;
        self.mod = null;
        self.diff = null;
        self.changed = null;
    },
    initVNode = function(nodeType, nodeValue, nodeValue2, parentNode, index) {
        return new VNode(nodeType, nodeValue, nodeValue2, parentNode, index);
    },
    VCode = function VCode(code) {
        var self = this;
        if (!(self instanceof VCode)) return new VCode(code);
        self.code = code;
        self.mod = -1;
    },
    initState = function(opts, nodeType) {
        return {
            dom: new VNode(nodeType || '', '', '', null, 0),
            opts: opts || {},
            incomment: false,
            intag: false,
            inatt: false,
            closetag: false,
            tag: '',
            att: '',
            q: '',
            val: '',
            txt: '',
            txt2: ''
        };
    },
    finState = function(state) {
        if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt).length))
        {
            state.dom.childNodes.push(initVNode('text', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
        }
        state.txt = '';
        state.txt2 = '';
        return state;
    },
    getRoot = function(state) {
        if (!state.dom) throw err('No root node!');
        else if (state.dom.parentNode) throw err('Unclosed tag '+state.dom.parentNode.nodeType);
        //while (state.dom && state.dom.parentNode) state.dom = state.dom.parentNode;
        return state.dom;
    },
    parse = function(str, opts, rootNode, withJsCode) {
        return getRoot(finState(html2ast(trim(str), initState(opts, rootNode || ''), true === withJsCode)));
    },

    SPACE = /\s/,
    NUM = /^\d+$/,
    HEXNUM = /^[0-9a-fA-F]+$/,
    TAGCHAR = /[a-zA-Z0-9\-_:]/,
    ATTCHAR = TAGCHAR,

    attr = function(vnode, name) {
        if (!vnode.atts)
        {
            vnode.atts = vnode.attributes.reduce(function(atts, a){
                atts[a.name] = a.value;
                return atts;
            }, {});
        }
        return vnode.atts && HAS.call(vnode.atts, name) ? vnode.atts[name] : null;
    },
    jsx2code = function jsx2code(tpl, opts) {
        var i = 0, l = tpl.length, out = '', jsx = '', j = 0, injsx = false, instr = false, esc = false, q = '', c = '';
        while (i<l)
        {
            c = tpl.charAt(i++);
            if (instr && ('\\' === c))
            {
                esc = !esc;
                if (injsx) jsx += c;
                else out += c;
                continue;
            }
            else if ('"' === c || '\'' === c || '`' === c)
            {
                if (!instr)
                {
                    instr = true;
                    esc = false;
                    q = c;
                    if (injsx) jsx += c;
                    else out += c;
                }
                else if (!esc && (q === c))
                {
                    instr = false;
                    q = '';
                    if (injsx) jsx += c;
                    else out += c;
                }
                else
                {
                    if (injsx) jsx += c;
                    else out += c;
                }
            }
            else if (!instr && injsx && (')' === c))
            {
                j--;
                if (0 === j)
                {
                    injsx = false;
                    out += to_code(parse(jsx, opts, 'jsx', true));
                    jsx = '';
                }
                else
                {
                    jsx += c;
                }
            }
            else if (!instr && ('(' === c))
            {
                if (injsx)
                {
                    j++;
                    jsx += c;
                }
                else if ('<' === tpl.charAt(i))
                {
                    injsx = true;
                    jsx = '';
                    j = 1;
                }
                else
                {
                    out += c;
                }
            }
            else
            {
                if (injsx) jsx += c;
                else out += c;
            }
            if (instr) esc = false;
        }
        return out;
    },
    html2ast = function html2ast(html, state, jscode) {
        var c = '', l = html.length, i = 0, j, t, instr, esc, att;
        while (i<l)
        {
            if (state.inatt)
            {
                while(i<l && state.q !== (c=html.charAt(i)))
                {
                    state.val += c;
                    i++;
                }
                if (state.q === c)
                {
                    att = state.dom.attributes[state.dom.attributes.length-1];
                    if (true === att.value)
                    {
                        att.value = state.val;
                        //state.dom.atts[att.name] = state.val;
                    }
                    else if (att.value instanceof VCode)
                    {
                        if (state.val.length) att.value.code = '('+att.value.code+')+'+toJSON(state.val);
                        //state.dom.atts[att.name] = att.value;
                    }
                    else
                    {
                        att.value += state.val;
                        //state.dom.atts[att.name] += state.val;
                    }
                    if (state.opts.id === att.name) state.dom.id = att.value instanceof VCode ? 'String('+att.value.code+')' : toJSON(att.value);
                    state.inatt = false;
                    state.q = '';
                    state.val = '';
                    i++;
                }
                continue;
            }
            if (state.intag)
            {
                while (i<l && ('>' !== (c=html.charAt(i))))
                {
                    if (SPACE.test(c))
                    {
                        if (state.att.length)
                        {
                            state.dom.attributes.push({name: state.att, value: true});
                            //state.dom.atts[state.att] = true;
                            state.att = '';
                        }
                    }
                    else if (ATTCHAR.test(c))
                    {
                        state.att += c;
                    }
                    else if ('=' === c)
                    {
                        if (state.att.length)
                        {
                            state.dom.attributes.push({name: state.att, value: true});
                            //state.dom.atts[state.att] = true;
                            state.att = '';
                        }
                        if (state.dom.attributes.length && (true === state.dom.attributes[state.dom.attributes.length-1].value))
                        {
                            i++;
                            while(i<l && SPACE.test(c=html.charAt(i))) i++;
                            if ((true === jscode) && ('{' === c))
                            {
                                i++; state.inatt = true; j = 1; instr = false; esc = false; state.q = ''; state.val = '';
                                while(i<l)
                                {
                                    c = html.charAt(i++);
                                    if (instr && ('\\' === c))
                                    {
                                        esc = !esc;
                                        state.val += c;
                                        continue;
                                    }
                                    else if ('"' === c || '\'' === c || '`' === c)
                                    {
                                        if (instr && !esc && (state.q === c))
                                        {
                                            instr = false;
                                            state.q = '';
                                        }
                                        else if (!instr)
                                        {
                                            instr = true;
                                            esc = false;
                                            state.q = c;
                                        }
                                        state.val += c;
                                    }
                                    else if ('{' === c)
                                    {
                                        if (!instr) j++;
                                        state.val += c;
                                    }
                                    else if ('}' === c)
                                    {
                                        if (!instr)
                                        {
                                            j--;
                                            if (0 === j)
                                            {
                                                att = state.dom.attributes[state.dom.attributes.length-1];
                                                att.value = new VCode(state.val);
                                                if (state.opts.id === att.name) state.dom.id = 'String('+att.value.code+')';
                                                state.inatt = false;
                                                state.val = '';
                                                break;
                                            }
                                            else
                                            {
                                                state.val += c;
                                            }
                                        }
                                        else
                                        {
                                            state.val += c;
                                        }
                                    }
                                    else
                                    {
                                        state.val += c;
                                    }
                                    if (instr) esc = false;
                                }
                                break;
                            }
                            else if ('"' === c || '\'' === c)
                            {
                                i++; state.inatt = true; state.q = c; state.val = '';
                                break;
                            }
                            else
                            {
                                throw err('Invalid attribute value "'+c+'" in tag '+state.dom.nodeType+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                            }
                        }
                        else
                        {
                            throw err('Invalid "'+c+'" in tag '+state.dom.nodeType+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                        }
                    }
                    else if ('/' === c && '>' === html.charAt(i+1))
                    {
                    }
                    else
                    {
                        throw err('Invalid "'+c+'" in tag '+state.dom.nodeType+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                    }
                    i++;
                }
                if (state.inatt) continue;
                if ('>' === c)
                {
                    state.intag = false;
                    state.inatt = false;
                    if (state.att.length)
                    {
                        state.dom.attributes.push({name: state.att, value: true});
                        //state.dom.atts[state.att] = true;
                        state.att = '';
                    }
                    if ('/' === html.charAt(i-1) || (HAS.call(autoclosedTags, state.dom.nodeType)))
                    {
                        // closed
                        state.dom = state.dom.parentNode;
                    }
                    i++;
                }
                continue;
            }
            while (i<l && SPACE.test(c=html.charAt(i)))
            {
                state.txt += c;
                state.txt2 += c;
                i++;
            }
            if (i >= l) break;
            if (state.incomment && '-->' === html.slice(i, i+3))
            {
                // close comment
                state.incomment = false;
                i += 3;
                state.dom.childNodes.push(initVNode('comment', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                state.txt = '';
                state.txt2 = '';
                continue;
            }
            c = html.charAt(i++);
            if ('<' === c)
            {
                if (state.incomment)
                {
                    state.txt += c;
                    state.txt2 += c;
                    continue;
                }
                if ('<script>' === state.dom.nodeType)
                {
                    if ('/script>' === html.slice(i, i+8).toLowerCase())
                    {
                        state.dom.childNodes.push(initVNode('text', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                        state.txt = '';
                        state.txt2 = '';
                    }
                    else
                    {
                        state.txt += c;
                        state.txt2 += c;
                        continue;
                    }
                }
                if ('<style>' === state.dom.nodeType)
                {
                    if ('/style>' === html.slice(i, i+7).toLowerCase())
                    {
                        state.dom.childNodes.push(initVNode('text', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                        state.txt = '';
                        state.txt2 = '';
                    }
                    else
                    {
                        state.txt += c;
                        state.txt2 += c;
                        continue;
                    }
                }
                if ('<textarea>' === state.dom.nodeType)
                {
                    if ('/textarea>' === html.slice(i, i+10).toLowerCase())
                    {
                        state.dom.nodeValue = state.txt;
                        state.dom.childNodes.push(initVNode('text', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                        state.txt = '';
                        state.txt2 = '';
                    }
                    else
                    {
                        state.txt += c;
                        state.txt2 += c;
                        continue;
                    }
                }
                if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt).length))
                {
                    state.dom.childNodes.push(initVNode('text', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                }
                state.txt = '';
                state.txt2 = '';
                if ('!--' === html.slice(i, i+3))
                {
                    // open comment
                    state.incomment = true;
                    i += 3;
                    continue;
                }

                // open tag
                state.intag = true;
                state.inatt = false;
                state.tag = '';
                state.att = '';
                if ('/' === html.charAt(i))
                {
                    i++;
                    state.closetag = true;
                }
                else
                {
                    state.closetag = false;
                }
                while (i<l && TAGCHAR.test(c=html.charAt(i)))
                {
                    state.tag += c;
                    i++;
                }
                if (!state.tag.length)
                {
                    throw err('No tag name around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                }
                state.tag = '<'+state.tag.toLowerCase()+'>';
                if (state.closetag)
                {
                    while (i<l && '>' !== html.charAt(i)) i++;
                    if ('>' === html.charAt(i)) i++;

                    if (!HAS.call(autoclosedTags,state.tag))
                    {
                        if (state.dom.nodeType !== state.tag)
                        {
                            throw err('Close tag doesn\'t match open tag '+state.tag+','+state.dom.nodeType+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                        }
                        else
                        {
                            state.intag = false;
                            state.dom = state.dom.parentNode;
                        }
                    }
                    else
                    {
                        throw err('Closing self-closing tag '+state.tag+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                    }
                }
                else //if (!HAS.call(autoclosedTags,state.tag))
                {
                    state.dom.childNodes.push(initVNode(state.tag, '', '', state.dom, state.dom.childNodes.length));
                    state.dom = state.dom.childNodes[state.dom.childNodes.length-1];
                }
                continue;
            }
            if ((true === jscode) && !state.incomment && ('{' === c))
            {
                if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt).length))
                {
                    state.dom.childNodes.push(initVNode('text', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                }
                state.txt = '';
                state.txt2 = '';
                j = 1; instr = false; esc = false; state.q = '';
                while(i<l)
                {
                    c = html.charAt(i++);
                    if (instr && ('\\' === c))
                    {
                        esc = !esc;
                        state.txt += c;
                        continue;
                    }
                    else if ('"' === c || '\'' === c || '`' === c)
                    {
                        if (instr && !esc && (state.q === c))
                        {
                            instr = false;
                            state.q = '';
                        }
                        else if (!instr)
                        {
                            instr = true;
                            esc = false;
                            state.q = c;
                        }
                        state.txt += c;
                    }
                    else if ('{' === c)
                    {
                        if (!instr) j++;
                        state.txt += c;
                    }
                    else if ('}' === c)
                    {
                        if (!instr)
                        {
                            j--;
                            if (0 === j)
                            {
                                state.dom.childNodes.push(new VCode(jsx2code(state.txt, state.opts)));
                                state.txt = '';
                                break;
                            }
                            else
                            {
                                state.txt += c;
                            }
                        }
                        else
                        {
                            state.txt += c;
                        }
                    }
                    else
                    {
                        state.txt += c;
                    }
                    if (instr) esc = false;
                }
                continue;
            }
            if ('&' === c)
            {
                // support numeric html entities and some basic named html entities, out of the box
                j = html.indexOf(';', i);
                if (-1 !== j)
                {
                    t = html.slice(i, j);
                    if (('#' === t.charAt(0)) && ('x' === t.charAt(1)) && HEXNUM.test(t.slice(2)))
                    {
                        state.txt += c + t + ';';
                        state.txt2 += Str.fromCharCode(parseInt(t.slice(2), 16));
                        i = j+1;
                    }
                    else if (('#' === t.charAt(0)) && NUM.test(t.slice(1)))
                    {
                        state.txt += c + t + ';';
                        state.txt2 += Str.fromCharCode(parseInt(t.slice(1), 10));
                        i = j+1;
                    }
                    else if (HAS.call(htmlEntities, t))
                    {
                        state.txt += c + t + ';';
                        state.txt2 += htmlEntities[t];
                        i = j+1;
                    }
                    else
                    {
                        state.txt += c;
                        state.txt2 += c;
                    }
                }
                else
                {
                    state.txt += c;
                    state.txt2 += c;
                }
            }
            else
            {
                state.txt += c;
                state.txt2 += c;
            }
        }
        return state;
    },
    htmlNode = function(type, id, atts, children, value2, modified) {
        var node = initVNode(type, '', '', null, 0), index = 0;
        node.id = id || null;
        node.attributes = atts || [];
        if (modified && modified.atts && modified.atts.length)
        {
            if (!node.modified) node.modified = {atts:[], nodes:[]};
            node.modified.atts = modified.atts;
        }
        if ('text' === type || 'comment' === type)
        {
            node.nodeValue = children;
            node.nodeValue2 = value2 || children;
        }
        else
        {
            children = children || [];
            node.childNodes = children.reduce(function process(childNodes, n) {
                if (!(n instanceof VNode))
                {
                    if (is_type(n, T_ARRAY))
                    {
                        var i = index, a = n.reduce(process, []);
                        if (!node.modified) node.modified = {atts: [], nodes: []};
                        if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < i-1)
                            node.modified.nodes.push({from:i, to:i+a.length-1});
                        else
                            node.modified.nodes[node.modified.nodes.length-1].to = i+a.length-1;
                        return childNodes.concat(a);
                    }
                    else
                    {
                        var v = String(n);
                        if ('' === v)
                        {
                            if (!node.modified) node.modified = {atts: [], nodes: []};
                            if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < index-1)
                                node.modified.nodes.push({from:index, to:index-1});
                            else
                                node.modified.nodes[node.modified.nodes.length-1].to = index-1;
                            return childNodes;
                        }
                        n = initVNode('text', v, v, null, 0);
                        if (!node.modified) node.modified = {atts: [], nodes: []};
                        if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < index-1)
                            node.modified.nodes.push({from:index, to:index});
                        else
                            node.modified.nodes[node.modified.nodes.length-1].to = index;
                    }
                }
                else if ('<mv-component>' === n.nodeType)
                {
                    node.componentNodes += n.childNodes.length;
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < index-1)
                        node.modified.nodes.push({from:index, to:index+n.childNodes.length-1});
                    else
                        node.modified.nodes[node.modified.nodes.length-1].to = index+n.childNodes.length-1;
                    if (n.changed)
                    {
                        if (!node.diff)
                            node.diff = [[index, index+n.childNodes.length-1]];
                        else if (node.diff[node.diff.length-1][1] < index-1)
                            node.diff.push([index, index+n.childNodes.length-1]);
                        else
                            node.diff[node.diff.length-1][1] = index+n.childNodes.length-1;
                    }
                    if (n.diff)
                    {
                        if (!node.diff)
                        {
                            node.diff = n.diff.map(function(m){return [index+m[0], index+m[1]];});
                        }
                        else if (node.diff[node.diff.length-1][1] < index+n.diff[0][0]-1)
                        {
                            node.diff = node.diff.concat(n.diff.map(function(m){return [index+m[0], index+m[1]];}));
                        }
                        else
                        {
                            node.diff[node.diff.length-1][1] = index+n.diff[0][1];
                            node.diff = node.diff.concat(n.diff.slice(1).map(function(m){return [index+m[0], index+m[1]];}));
                        }
                    }
                    return childNodes.concat(n.childNodes/*.reduce(process, [])*/.map(function(nn){
                        nn.parentNode = node;
                        nn.index = index++;
                        nn.changed = n.changed;
                        return nn;
                    }));
                }
                else if (('dynamic' === n.nodeType) || ('jsx' === n.nodeType))
                {
                    var i = index, a = n.childNodes/*.reduce(process, [])*/.map(function(n){
                        n.parentNode = node;
                        n.index = index++;
                        return n;
                    });
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < i-1)
                        node.modified.nodes.push({from:i, to:i+a.length-1});
                    else
                        node.modified.nodes[node.modified.nodes.length-1].to = i+a.length-1;
                    return childNodes.concat(a);
                }
                else if (!n.nodeType || !n.nodeType.length)
                {
                    if (n.mod && n.mod.length)
                    {
                        if (!node.mod) node.mod = [];
                        if (!node.mod.length || node.mod[node.mod.length-1].to < index+n.mod[0].from-1)
                        {
                            node.mod = node.mod.concat(n.mod.map(function(m){return {from:index+m.from, to:index+m.to};}));
                        }
                        else
                        {
                            node.mod[node.mod.length-1].to = index+n.mod[0].to;
                            node.mod = nod.mod.concat(n.mod.slice(1).map(function(m){return {from:index+m.from, to:index+m.to};}));
                        }
                    }
                    if (n.modified && n.modified.nodes.length)
                    {
                        if (!node.modified) node.modified = {atts:[], nodes:[]};
                        if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < index+n.modified.nodes[0].from-1)
                        {
                            node.modified.nodes = node.modified.nodes.concat(n.modified.nodes.map(function(m){return {from:index+m.from, to:index+m.to};}));
                        }
                        else
                        {
                            node.modified.nodes[node.modified.nodes.length-1].to = index+n.modified.nodes[0].to;
                            node.modified.nodes = nod.modified.nodes.concat(n.modified.nodes.slice(1).map(function(m){return {from:index+m.from, to:index+m.to};}));
                        }
                    }
                    return childNodes.concat(n.childNodes/*.reduce(process, [])*/.map(function(n){
                        n.parentNode = node;
                        n.index = index++;
                        return n;
                    }));
                }
                if ((n.mod && n.mod.length) || (n.modified && (n.modified.atts.length || n.modified.nodes.length)))
                {
                    if (!node.mod) node.mod = [];
                    if (!node.mod.length || node.mod[node.mod.length-1].to < index-1)
                        node.mod.push({from:index, to:index});
                    else
                        node.mod[node.mod.length-1].to = index;
                }
                n.parentNode = node;
                n.index = index++;
                childNodes.push(n);
                return childNodes;
            }, []);
        }
        return node;
    },
    to_code = function to_code(vnode) {
        var out = '_$$_("", null, [], [])';
        if (vnode instanceof VCode)
        {
            out = vnode.code;
        }
        else if (vnode.nodeType && vnode.nodeType.length)
        {
            if ('text' === vnode.nodeType)
            {
                out = '_$$_("text", null, [], '+toJSON(vnode.nodeValue)+', '+toJSON(vnode.nodeValue2)+')';
            }
            else if ('comment' === vnode.nodeType)
            {
                out = '_$$_("comment", null, [], '+toJSON(vnode.nodeValue)+')';
            }
            else
            {
                var modified = {atts: []};
                out = '_$$_("'+vnode.nodeType+'", '+Str(vnode.id)+', ['+vnode.attributes.map(function(a, i){
                    if (a instanceof VCode)
                    {
                        if (!modified.atts.length || modified.atts[modified.atts.length-1].to < i-1)
                            modified.atts.push({from:i, to:i});
                        else
                            modified.atts[modified.atts.length-1].to = i;
                        return a.code;
                    }
                    else if (a.value instanceof VCode)
                    {
                        if (!modified.atts.length || modified.atts[modified.atts.length-1].to < i-1)
                            modified.atts.push({from:i, to:i});
                        else
                            modified.atts[modified.atts.length-1].to = i;
                        return '{name:"'+a.name+'",value:('+a.value.code+')}';
                    }
                    return '{name:"'+a.name+'",value:'+toJSON(a.value)+'}';
                }).join(',')+'], ['+vnode.childNodes.map(to_code).join(',')+'], null, '+toJSON(modified)+')';
            }
        }
        else if (vnode.childNodes.length)
        {
            out = '_$$_("", null, [], ['+vnode.childNodes.map(to_code).join(',')+'])';
        }
        return out;
    },
    to_string = function to_string(vnode) {
        var out = '', selfclosed = true;
        if (vnode.nodeType && vnode.nodeType.length)
        {
            if ('text' === vnode.nodeType)
            {
                out = vnode.nodeValue;
            }
            else if ('comment' === vnode.nodeType)
            {
                out = '<!--'+vnode.nodeValue+'-->';
            }
            else
            {
                selfclosed = HAS.call(autoclosedTags, vnode.nodeType);
                out = vnode.nodeType.slice(0, -1)+(vnode.attributes.length ? ' '+vnode.attributes.reduce(function(atts, att) {
                    if (false !== att.value) atts.push(true === att.value ? att.name : att.name+'="'+att.value+'"');
                    return atts;
                }, []).join(' ') : '')+(selfclosed ? '/>' : '>');
                if (!selfclosed) out += vnode.childNodes.map(to_string).join('')+'</'+vnode.nodeType.slice(1);
            }
        }
        else if (vnode.childNodes.length)
        {
            out = vnode.childNodes.map(to_string).join('');
        }
        return out;
    },
    to_node = function to_node(vnode, with_meta) {
        var rnode, i, l, a, v, n;
        if ('text' === vnode.nodeType)
        {
            rnode = document.createTextNode(vnode.nodeValue2);
        }
        else if ('comment' === vnode.nodeType)
        {
            rnode = document.createComment(vnode.nodeValue);
        }
        else
        {
            rnode = HAS.call(svgElements, vnode.nodeType) ? document.createElementNS('http://www.w3.org/2000/svg', vnode.nodeType.slice(1,-1)) : document.createElement(vnode.nodeType.slice(1,-1));
            if (vnode.attributes.length)
            {
                for (i=0,l=vnode.attributes.length; i<l; i++)
                {
                    a = vnode.attributes[i];
                    n = a.name; v = a.value;
                    if (false === v) continue;
                    if ('id' === n || 'style' === n)
                    {
                        rnode[n] = v;
                    }
                    else if ('class' === n)
                    {
                        rnode[CLASS] = v;
                    }
                    else if (n in rnode)
                    {
                        if (T_NUM === get_type(rnode[n])) rnode[n] = parseFloat(v);
                        else rnode[n] = v;
                    }
                    else
                    {
                        rnode[SET_ATTR](n, Str(true === v ? n : v));
                    }
                }
            }
            if (true === with_meta)
            {
                if (vnode.id)
                    rnode._mvId = vnode.id;
                if (vnode.modified && vnode.modified.nodes.length)
                    rnode._mvModified = vnode.modified.nodes;
            }
            if (vnode.childNodes.length)
            {
                if ('<textarea>' === vnode.nodeType)
                {
                    rnode.innerHTML = vnode.childNodes.map(to_string).join('');
                }
                else if ('<script>' === vnode.nodeType || '<style>' === vnode.nodeType)
                {
                    rnode.appendChild(document.createTextNode(vnode.childNodes.map(to_string).join('')));
                }
                else
                {
                    for (i=0,l=vnode.childNodes.length; i<l; i++)
                    {
                        rnode.appendChild(to_node(vnode.childNodes[i], with_meta));
                    }
                }
            }
        }
        return rnode;
    },
    del_att = function(r, n, T, TT) {
        if ('id' === n)
        {
            r[n] = '';
        }
        else if ('class' === n)
        {
            r[CLASS] = '';
        }
        else if ('style' === n)
        {
            r[n] = '';
        }
        else if ('selected' === n && 'OPTION' === T)
        {
            r[n] = false;
        }
        else if (('disabled' === n || 'required' === n) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
        {
            r[n] = false;
        }
        else if ('checked' === n && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
        {
            r[n] = false;
        }
        else if ('value' === n && 'INPUT' === T)
        {
            r[n] = '';
        }
        else
        {
            r[DEL_ATTR](n);
        }
        return r;
    },
    set_att = function(r, n, s, T, TT) {
        if ('id' === n)
        {
            r[n] = s;
        }
        else if ('class' === n)
        {
            r[CLASS] = s;
        }
        else if ('style' === n)
        {
            r[n] = s;
        }
        else if ('selected' === n && 'OPTION' === T)
        {
            r[n] = true;
        }
        else if (('disabled' === n || 'required' === n) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
        {
            r[n] = true;
        }
        else if ('checked' === n && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
        {
            r[n] = true;
        }
        else if ('value' === n && 'INPUT' === T)
        {
            if (r[n] !== s) r[n] = s;
        }
        else if (n in r)
        {
            if (T_NUM === get_type(r[n])) r[n] = parseFloat(s);
            else r[n] = s;
        }
        else
        {
            r[SET_ATTR](n, Str(true === s ? n : s));
        }
        return r;
    },
    nodeType = function(node) {
        return node.nodeType === 3 ? 'text' : (node.nodeType === 8 ? 'comment' : '<'+(node[TAG]||'').toLowerCase()+'>');
    },
    morphAtts = function morphAtts(r, v, with_meta, unconditionally) {
        var modifiedAttsPrev, modifiedAtts, T, TT, vAtts, prevAtts, rAtts,
            i, j, m, count = 0, ar, av, a, n;

        if ((true === unconditionally) || (v.modified && v.modified.atts.length))
        {
            T = (r[TAG] || '').toUpperCase();
            TT = (r[TYPE] || '').toLowerCase();
            vAtts = v.attributes;
            rAtts = r.attributes;
            // remove non-existent attributes
            for (i=rAtts.length-1; i>=0; i--)
            {
                a = rAtts[i]; n = a.name;
                if (!attr(v, n)) del_att(r, n, T, TT);
            }
            // add/update existent attributes
            for (i=vAtts.length-1; i>=0; i--)
            {
                a = vAtts[i];
                if (false === a.value) del_att(r, a.name, T, TT);
                else set_att(r, a.name, a.value, T, TT);
            }
            if ('OPTION' === T)
            {
                r.selected = !!attr(v, 'selected');
            }
            if ('INPUT' === T && ('checkbox' === TT || 'radio' === TT))
            {
                r.checked = !!attr(v, 'checked');
            }
            if ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T)
            {
                r.disabled = !!attr(v, 'disabled');
                r.required = !!attr(v, 'required');
            }
        }
        return r;
    },
    morph = function morph(r, v, ID) {
        // morph r (real) DOM to match v (virtual) DOM
        var vc = v.childNodes.length, count = 0, mi, mci, di, m, mc, d, tt, index, c, cc,
            vnode, rnode, lastnode, to_remove, T1, T2, rid, vid, val,
            modifiedNodesPrev = r._mvModified ? r._mvModified : [],
            modifiedNodes = v.modified ? v.modified.nodes : [],
            modChildren = v.mod ? v.mod : [];

        if (v.id) r._mvId = v.id;
        else if (r._mvId) r._mvId = undef;
        if (v.modified && v.modified.nodes.length) r._mvModified = v.modified.nodes;
        else if (r._mvModified) r._mvModified = undef;

        if (!r.childNodes.length)
        {
            for (index=0; index<vc; index++)
            {
                r.appendChild(to_node(v.childNodes[index], true));
            }
        }
        else if (modifiedNodes.length)
        {
            for (di=0,mci=0,mi=0,cc=modifiedNodes.length; mi<cc; mi++)
            {
                m = modifiedNodes[mi];
                while (mci < modChildren.length && modChildren[mci].from < m.from)
                {
                    tt = stdMath.min(modChildren[mci].to, m.from-1);
                    for (index=modChildren[mci].from; index<=tt; index++)
                    {
                        vnode = v.childNodes[index];
                        rnode = r.childNodes[index];
                        morphAtts(rnode, vnode);
                        morph(rnode, vnode, ID);
                    }
                    if (modChildren[mci].to <= m.from) mci++;
                    else break;
                }
                while (mci < modChildren.length && modChildren[mci].from >= m.from && modChildren[mci].to <= stdMath.max(m.from, m.to))
                    mci++;
                index = m.from;
                if (m.to < m.from)
                {
                    count = mi < modifiedNodesPrev.length ? (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1) : 0;
                    for (; (0 < count) && (index < r.childNodes.length); count--)
                    {
                        r.removeChild(r.childNodes[index/*modifiedNodesPrev[mi].from+count-1*/]);
                    }
                    continue;
                }
                else if (mi < modifiedNodesPrev.length && modifiedNodesPrev[mi].to < modifiedNodesPrev[mi].from)
                {
                    rnode = r.childNodes[index];
                    count = (m.to - m.from + 1);
                    for (; 0 < count; count--,index++)
                    {
                        r.insertBefore(to_node(v.childNodes[index], true), rnode);
                    }
                    continue;
                }
                else
                {
                    if (mi < modifiedNodesPrev.length)
                    {
                        count = (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1) - (m.to - m.from + 1);
                        lastnode = r.childNodes[modifiedNodesPrev[mi].to];
                    }
                    else
                    {
                        count = 0;
                        lastnode = null;
                    }
                    if (v.diff && (di < v.diff.length) && (v.componentNodes === v.childNodes.length) && (v.diff[di][0] >= m.from) && (v.diff[di][1] <= m.to) && (0 >= count))
                    {
                        for (c=v.diff.length; (di<c) && (v.diff[di][1]<=m.to); di++)
                        {
                            d = v.diff[di];
                            for (index=d[0],tt=d[1]; index<=tt; index++)
                            {
                                vnode = v.childNodes[index];
                                if (index >= r.childNodes.length)
                                {
                                    r.appendChild(to_node(vnode, true));
                                    if (0 > count) count++;
                                    continue;
                                }
                                rnode = r.childNodes[index];
                                T2 = vnode.nodeType;
                                T1 = nodeType(rnode);
                                vid = vnode.id;//attr(vnode,ID);
                                rid = rnode._mvId || null;//rnode[ATTR] ? rnode[ATTR](ID) : null;
                                if (
                                    (T2 !== T1)
                                    || ('<script>' === T1 || '<style>' === T1)
                                    || ('<input>' === T1 && (attr(vnode,TYPE)||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                    || ((0 === count) && (vid || rid) && (vid !== rid))
                                )
                                {
                                    r.replaceChild(to_node(vnode, true), rnode);
                                }
                                else if (0 > count)
                                {
                                    if (vid && rid)
                                    {
                                        if (vid === rid)
                                        {
                                            // morph attributes/properties
                                            morphAtts(rnode, vnode);
                                            // morph children
                                            morph(rnode, vnode, ID);
                                        }
                                        else
                                        {
                                            r.insertBefore(to_node(vnode, true), rnode);
                                            count++;
                                        }
                                    }
                                    else
                                    {
                                        if ((0 > count) && (index === m.to+count))
                                        {
                                            insert_after(to_node(vnode, true), rnode, r);
                                            count++;
                                        }
                                        else
                                        {
                                            // morph attributes/properties
                                            morphAtts(rnode, vnode, false, true);
                                            // morph children
                                            morph(rnode, vnode, ID);
                                        }
                                    }
                                }
                                else if ('<textarea>' === T1)
                                {
                                    // morph attributes/properties
                                    morphAtts(rnode, vnode, true, true);
                                    val = vnode.childNodes.map(to_string).join('');
                                    rnode.value = val;
                                    if (rnode.firstChild) rnode.firstChild.nodeValue = val;
                                }
                                else
                                {
                                    // morph attributes/properties
                                    morphAtts(rnode, vnode);
                                    // morph children
                                    morph(rnode, vnode, ID);
                                }
                            }
                        }
                    }
                    else
                    {
                        for (tt=m.to; index<=tt; index++)
                        {
                            vnode = v.childNodes[index];
                            if (index >= r.childNodes.length)
                            {
                                r.appendChild(to_node(vnode, true));
                                if (0 > count) count++;
                                continue;
                            }
                            rnode = r.childNodes[index];
                            T2 = vnode.nodeType;
                            T1 = nodeType(rnode);
                            vid = vnode.id;//attr(vnode,ID);
                            rid = rnode._mvId || null;//rnode[ATTR] ? rnode[ATTR](ID) : null;

                            if (
                                (T2 !== T1)
                                || ('<script>' === T1 || '<style>' === T1)
                                || ('<input>' === T1 && (attr(vnode,TYPE)||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                || ((0 === count) && (vid || rid) && (vid !== rid))
                            )
                            {
                                r.replaceChild(to_node(vnode, true), rnode);
                            }
                            else if (0 !== count)
                            {
                                if (vid && rid)
                                {
                                    if (vid === rid)
                                    {
                                        if (false !== vnode.changed)
                                        {
                                            // morph attributes/properties
                                            morphAtts(rnode, vnode);
                                            // morph children
                                            morph(rnode, vnode, ID);
                                        }
                                    }
                                    else
                                    {
                                        if (0 > count)
                                        {
                                            r.insertBefore(to_node(vnode, true), rnode);
                                            count++;
                                        }
                                        else
                                        {
                                            for (; 0 < count; )
                                            {
                                                r.removeChild(rnode); count--;
                                                if (index >= r.childNodes.length) break;
                                                rnode = r.childNodes[index];
                                                //if (!rnode[ATTR] || (vid === rnode[ATTR](ID))) break;
                                                if (!rnode._mvId || (vid === rnode._mvId)) break;
                                            }
                                            if (index >= r.childNodes.length)
                                            {
                                                r.appendChild(to_node(vnode, true));
                                            }
                                            else
                                            {
                                                T1 = nodeType(rnode);
                                                rid = rnode._mvId || null;//rnode[ATTR] ? rnode[ATTR](ID) : null;
                                                if (
                                                    (T2 !== T1)
                                                    || ('<input>' === T1 && (attr(vnode,TYPE)||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                                    || (!rid)
                                                    || (rid !== vid)
                                                )
                                                {
                                                    r.replaceChild(to_node(vnode, true), rnode);
                                                }
                                                else if (false !== vnode.changed)
                                                {
                                                    // morph attributes/properties
                                                    morphAtts(rnode, vnode);
                                                    // morph children
                                                    morph(rnode, vnode, ID);
                                                }
                                            }
                                        }
                                    }
                                }
                                else
                                {
                                    if ((0 > count) && (index ===tt+count))
                                    {
                                        insert_after(to_node(vnode, true), rnode, r);
                                        count++;
                                    }
                                    else if (false !== vnode.changed)
                                    {
                                        // morph attributes/properties
                                        morphAtts(rnode, vnode, false, true);
                                        // morph children
                                        morph(rnode, vnode, ID);
                                    }
                                }
                                if ((0 < count) && (index === tt))
                                {
                                    // finally remove any remaining nodes that need to be removed and haven't been already
                                    for (; (0 < count) && lastnode; count--)
                                    {
                                        if (1 === count)
                                        {
                                            to_remove = lastnode;
                                        }
                                        else
                                        {
                                            to_remove = lastnode;
                                            lastnode = lastnode.previousSibling;
                                        }
                                        r.removeChild(to_remove);
                                    }
                                }
                            }
                            else if ('text' === T1)
                            {
                                rnode.nodeValue = vnode.nodeValue2;
                            }
                            else if ('comment' === T1)
                            {
                                rnode.nodeValue = vnode.nodeValue;
                            }
                            else if ('<textarea>' === T1)
                            {
                                if (false !== vnode.changed)
                                {
                                    // morph attributes/properties
                                    morphAtts(rnode, vnode, true, true);
                                    val = vnode.childNodes.map(to_string).join('');
                                    rnode.value = val;
                                    if (rnode.firstChild) rnode.firstChild.nodeValue = val;
                                }
                            }
                            else if (false !== vnode.changed)
                            {
                                // morph attributes/properties
                                morphAtts(rnode, vnode, false, true);
                                // morph children
                                morph(rnode, vnode, ID);
                            }
                        }
                    }
                }
                if (mci < modChildren.length && (modChildren[mci].from <= m.from || modChildren[mci].from < m.to) && modChildren[mci].to > stdMath.max(m.from, m.to))
                {
                    for (index=stdMath.max(modChildren[mci].from, m.from, m.to)+1,tt=modChildren[mci].to; index<=tt; index++)
                    {
                        vnode = v.childNodes[index];
                        rnode = r.childNodes[index];
                        // morph attributes/properties
                        morphAtts(rnode, vnode);
                        // morph children
                        morph(rnode, vnode, ID);
                    }
                    mci++;
                }
            }
            for (c=modChildren.length; mci<c; mci++)
            {
                m = modChildren[mci];
                for (index=m.from,tt=m.to; index<=tt; index++)
                {
                    vnode = v.childNodes[index];
                    rnode = r.childNodes[index];
                    // morph attributes/properties
                    morphAtts(rnode, vnode);
                    // morph children
                    morph(rnode, vnode, ID);
                }
            }
        }
        else if (modChildren.length)
        {
            for (mci=0,c=modChildren.length; mci<c; mci++)
            {
                m = modChildren[mci];
                for (index=m.from,tt=m.to; index<=tt; index++)
                {
                    vnode = v.childNodes[index];
                    rnode = r.childNodes[index];
                    // morph attributes/properties
                    morphAtts(rnode, vnode);
                    // morph children
                    morph(rnode, vnode, ID);
                }
            }
        }
    },
    add_nodes = function(el, nodes, index, move) {
        var f, i, n, l = nodes.length,
            _mvModifiedNodes = el._mvModified ? el._mvModified : null;
        if (0 < l)
        {
            if (null == index)
            {
                index = el.childNodes.length;
                move = false;
            }
            if (0 <= index && index <= el.childNodes.length)
            {
                if (!move && _mvModifiedNodes)
                {
                    f = false;
                    for (i=0; i<_mvModifiedNodes.length; i++)
                    {
                        if (f)
                        {
                            _mvModifiedNodes[i].from += l;
                            _mvModifiedNodes[i].to += l;
                        }
                        else if (index >= _mvModifiedNodes[i].from && (index <= _mvModifiedNodes[i].to || _mvModifiedNodes[i].to < _mvModifiedNodes[i].from))
                        {
                            f = true;
                            _mvModifiedNodes[i].to += l;
                        }
                    }
                    if (!f && _mvModifiedNodes.length && (index === el.childNodes.length) && (el.childNodes.length-1 === _mvModifiedNodes[_mvModifiedNodes.length-1].to))
                    {
                        _mvModifiedNodes[_mvModifiedNodes.length-1].to += l;
                    }
                }
                if (index === el.childNodes.length)
                {
                    for (i=0; i<l; i++) el.appendChild(nodes[i]);
                }
                else
                {
                    n = el.childNodes[index];
                    for (i=0; i<l; i++) el.insertBefore(nodes[i], n);
                }
            }
        }
        return el;
    },
    remove_nodes = function(el, count, index) {
        var f, i, l,
            _mvModifiedNodes = el._mvModified ? el._mvModified : null;
        if (null == index) index = el.childNodes.length-1;
        if (0 < count && 0 <= index && index < el.childNodes.length)
        {
            l = stdMath.min(count, el.childNodes.length-index);
            if (0 < l)
            {
                if (_mvModifiedNodes)
                {
                    f = false;
                    for (i=0; i<_mvModifiedNodes.length; i++)
                    {
                        if (f)
                        {
                            _mvModifiedNodes[i].from -= l;
                            _mvModifiedNodes[i].to -= l;
                        }
                        else if (index >= _mvModifiedNodes[i].from && index <= _mvModifiedNodes[i].to)
                        {
                            f = true;
                            _mvModifiedNodes[i].to -= l;
                        }
                    }
                }
                for (; 0 < l; l--) el.removeChild(el.childNodes[index]);
            }
        }
    },

    insert_map = function(map, ks, v) {
        var m = map;
        ks.forEach(function(k, i){
            if (!HAS.call(m, 'c')) m.c = {};
            if (!HAS.call(m.c, k)) m.c[k] = {};
            m = m.c[k];
            if (ks.length-1 === i)
            {
                if (!HAS.call(m, 'v')) m.v = [];
                m.v.push(v);
            }
        });
    },
    del_map = function del_map(m, d) {
        if (!m) return;
        if (m.v)
        {
            d(m.v);
        }
        if (m.c)
        {
            Keys(m.c).forEach(function(k){
                if (m.c[k].c)
                {
                    del_map(m.c[k], d);
                    if ((!m.c[k].v || !m.c[k].v.length) && (!m.c[k].c || !Keys(m.c[k].c).length))
                    {
                        del(m.c, k);
                    }
                }
                else if (m.c[k].v)
                {
                    d(m.c[k].v);
                    if (!m.c[k].v.length)
                    {
                        del(m.c, k);
                    }
                }
            });
        }
    },
    walk_map = function walk_map(m, f, key) {
        if (!m) return;
        key = key || '';
        if (m.v)
        {
            f(m.v, key);
        }
        if (m.c)
        {
            Keys(m.c).forEach(function(k){
                var kk = key + (key.length ? '.' : '') + k;
                if (m.c[k].c) walk_map(m.c[k], f, kk);
                else if (m.c[k].v) f(m.c[k].v, kk);
            });
        }
    },
    placeholder_re = /\{([0-9a-zA-Z\.\-_\$]+)\}/,
    get_placeholders = function get_placeholders(node, map) {
        var m, k, t, s;
        if (node)
        {
            if (3 === node.nodeType)
            {
                s = n.nodeValue;
                while (s.length && (m = s.match(placeholder_re)))
                {
                    k = trim(m[1]);
                    if (k.length)
                    {
                        t = n.splitText(m.index);
                        n = t.splitText(m[0].length);
                        s = n.nodeValue;
                        insert_map(map.txt, k.split('.'), t);
                    }
                    else
                    {
                        s = s.slice(m.index+m[0].length);
                    }
                }
            }
            else
            {
                if (node.attributes && node.attributes.length)
                {
                    slice.call(node.attributes).forEach(function(a){
                        var m, k, s = a.value, index = 0, txt = [s], keys = [];
                        while (s.length && (m = s.match(placeholder_re)))
                        {
                            k = trim(m[1]);
                            if (k.length)
                            {
                                if (-1 === keys.indexOf(k)) keys.push(k);
                                txt.pop();
                                txt.push(a.value.slice(index, index+m.index));
                                txt.push({mvKey:k});
                                txt.push(a.value.slice(index+m.index+m[0].length));
                            }
                            s = s.slice(m.index+m[0].length);
                            index += m.index + m[0].length;
                        }
                        keys.forEach(function(k){
                            var t = {node:node, att:a.name, txt:txt.slice()};
                            insert_map(map.att, k.split('.'), t);
                        });
                    });
                }
                if (node.childNodes.length)
                {
                    slice.call(node.childNodes).forEach(function(n){
                        var m, k, t, s;
                        if (3 === n.nodeType)
                        {
                            s = n.nodeValue;
                            while (s.length && (m = s.match(placeholder_re)))
                            {
                                k = trim(m[1]);
                                if (k.length)
                                {
                                    t = n.splitText(m.index);
                                    n = t.splitText(m[0].length);
                                    s = n.nodeValue;
                                    insert_map(map.txt, k.split('.'), t);
                                }
                                else
                                {
                                    s = s.slice(m.index+m[0].length);
                                }
                            }
                        }
                        else
                        {
                            get_placeholders(n, map);
                        }
                    });
                }
            }
        }
        return node;
    },
    morphText = function morphText(map, model, keys) {
        if (!map || !map.txt || !map.att) return;
        if (keys)
        {
            keys.forEach(function(ks){
                var kk = ks.split('.'), mt = map.txt, ma = map.att;
                kk.forEach(function(k, i){
                    mt = mt && mt.c && HAS.call(mt.c, k) ? mt.c[k] : null;
                    ma = ma && ma.c && HAS.call(ma.c, k) ? ma.c[k] : null;
                    if (kk.length-1 === i)
                    {
                        walk_map(mt, function(list, k){
                            var v = Str(model.get(k));
                            list.forEach(function(t){
                                if (t.nodeValue !== v)
                                    t.nodeValue = v;
                            });
                        }, ks);
                        walk_map(ma, function(list){
                            list.forEach(function(a){
                                var v = a.txt.map(function(s){return s.mvKey ? Str(model.get(s.mvKey)) : s;}).join('');
                                if (a.node[ATTR](a.att) !== v)
                                    a.node[SET_ATTR](a.att, v);
                            });
                        }, ks);
                    }
                });
            });
        }
        else
        {
            walk_map(map.txt, function(list, k){
                var v = Str(model.get(k));
                list.forEach(function(t){
                    if (t.nodeValue !== v)
                        t.nodeValue = v;
                });
            }, '');
            walk_map(map.att, function(list){
                list.forEach(function(a){
                    var v = a.txt.map(function(s){return s.mvKey ? Str(model.get(s.mvKey)) : s;}).join('');
                    if (a.node[ATTR](a.att) !== v)
                        a.node[SET_ATTR](a.att, v);
                });
            }, '');
        }
    }
;


//
// DOM Events polyfils and delegation

// adapted from https://github.com/jonathantneal/EventListener
if (HASDOC && !HTMLElement.prototype.addEventListener) !function(){

    function addToPrototype(name, method)
    {
        Window.prototype[name] = HTMLDocument.prototype[name] = HTMLElement.prototype[name] = Element.prototype[name] = method;
    }

    // add
    addToPrototype("addEventListener", function (type, listener, capture) {
        var
        target = this,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        // if no events exist, attach the listener
        if (!typeListeners.length) {
            typeListeners.event = function (event) {
                var documentElement = target.document && target.document.documentElement || target.documentElement || { scrollLeft: 0, scrollTop: 0 };

                // polyfill w3c properties and methods
                event.currentTarget = target;
                event.pageX = event.clientX + documentElement.scrollLeft;
                event.pageY = event.clientY + documentElement.scrollTop;
                event.preventDefault = function () { event.returnValue = false };
                event.relatedTarget = event.fromElement || null;
                event.stopImmediatePropagation = function () { immediatePropagation = false; event.cancelBubble = true };
                event.stopPropagation = function () { event.cancelBubble = true };
                event.target = event.srcElement || target;
                event.timeStamp = +new Date;

                // create an cached list of the master events list (to protect this loop from breaking when an event is removed)
                for (var i = 0, typeListenersCache = [].concat(typeListeners), typeListenerCache, immediatePropagation = true; immediatePropagation && (typeListenerCache = typeListenersCache[i]); ++i) {
                    // check to see if the cached event still exists in the master events list
                    for (var ii = 0, typeListener; typeListener = typeListeners[ii]; ++ii) {
                        if (typeListener == typeListenerCache) {
                            typeListener.call(target, event);

                            break;
                        }
                    }
                }
            };
            if ( target.attachEvent ) target.attachEvent("on" + type, typeListeners.event);
            else target["on" + type] = typeListeners.event;
        }

        // add the event to the master event list
        typeListeners.push(listener);
    });

    // remove
    addToPrototype("removeEventListener", function (type, listener, capture) {
        var
        target = this,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        // remove the newest matching event from the master event list
        for (var i = typeListeners.length - 1, typeListener; typeListener = typeListeners[i]; --i) {
            if (typeListener == listener) {
                typeListeners.splice(i, 1);

                break;
            }
        }

        // if no events exist, detach the listener
        if (!typeListeners.length && typeListeners.event) {
            if ( target.detachEvent ) target.detachEvent("on" + type, typeListeners.event);
            else target["on" + type] = false;
        }
    });

    // dispatch
    addToPrototype("dispatchEvent", function (eventObject) {
        var
        target = this,
        type = eventObject.type,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        try {
            return target.fireEvent("on" + type, eventObject);
        } catch (error) {
            if (typeListeners.event) {
                typeListeners.event(eventObject);
            }

            return;
        }
    });
}( );

// namespaced events, play nice with possible others
function NSEvent(evt, namespace)
{
    var nsevent = [( evt || "" ), NAMESPACE];
    if (namespace) nsevent = nsevent.concat(namespace);
    return nsevent.join('.')
}

// adapted from https://github.com/ftlabs/ftdomdelegate
var EVENTSTOPPED = "DOMEVENT_STOPPED",
    captureEvts = ['blur', 'error', 'focus', 'focusin', 'focusout', 'load', 'resize', 'scroll']
;
function captureForType(eventType){ return -1 < captureEvts.indexOf(eventType); }
function matchesRoot(root, element){ return root === element; }
function matchesTag(tagName, element){ return tagName.toLowerCase() === element.tagName.toLowerCase(); }
function matchesId(id, element){ return id === element.id; }
function matchesSelector(selector, element){ return element[MATCHES](selector); }

function DOMEvent(el)
{
    var self = this;
    if (!(self instanceof DOMEvent)) return new DOMEvent(el);
    if (el) self.element(el);
    self.$handle = DOMEvent.Handler.bind(self);
}
DOMEvent.Handler = function(event) {
    if (event[EVENTSTOPPED]) return;

    var self = this, i, l, listeners,
        type = event.type, target = event.target/*?event.target:event.srcElement*/,
        root, phase, listener, returned, listenerList = [ ];

    // Hardcode value of Node.TEXT_NODE
    // as not defined in IE8
    if (target && 3 === target.nodeType) target = target.parentNode;

    root = self.$element;
    listeners = root.$listeners;
    phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);

    switch (phase)
    {
        case 1: //Event.CAPTURING_PHASE:
            listenerList = listeners[1][type];
            break;
        case 2: //Event.AT_TARGET:
            if (listeners[0] && listeners[0][type]) listenerList = listenerList.concat(listeners[0][type]);
            if (listeners[1] && listeners[1][type]) listenerList = listenerList.concat(listeners[1][type]);
            break;
        case 3: //Event.BUBBLING_PHASE:
            listenerList = listeners[0][type];
            break;
    }
    if (!listenerList) return;

    // Need to continuously check
    // that the specific list is
    // still populated in case one
    // of the callbacks actually
    // causes the list to be destroyed.
    l = listenerList.length;
    while (l && target)
    {
        for (i=0; i<l; i++)
        {
            if (!listenerList) return;
            listener = listenerList[i];
            if (!listener) break;

            if (listener.matcher(listener.matcherParam, target))
            {
                returned = listener.handler.call(target, event, target);
            }

            // Stop propagation to subsequent
            // callbacks if the callback returned
            // false
            if (false === returned || false === event.returnValue)
            {
                event[EVENTSTOPPED] = true;
                event.preventDefault();
                return;
            }
        }

        // TODO:MCG:20120117: Need a way to
        // check if event#stopPropagation
        // was called. If so, break looping
        // through the DOM. Stop if the
        // delegation root has been reached
        if (/*event.isPropagationStopped( ) ||*/ root === target)  break;
        l = listenerList.length;
        target = target.parentElement;
    }
};
DOMEvent.Dispatch = function(event, element, data) {
    var evt; // The custom event that will be created
    if (!HASDOC || !element) return;
    if (document.createEvent)
    {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        evt.eventName = event;
        if (null != data) evt.data = data;
        element.dispatchEvent(evt);
    }
    else
    {
        evt = document.createEventObject();
        evt.eventType = event;
        evt.eventName = event;
        if (null != data) evt.data = data;
        element.fireEvent("on" + event, evt);
    }
};

DOMEvent[proto] = {
    constructor: DOMEvent,

    $element: null,
    $handle: null,

    dispose: function() {
        var self = this;
        self.off().element();
        self.$element = null;
        self.$handle = null;
        return self;
    },

    element: function(el) {
        var self = this, listeners, element = self.$element,
            eventTypes, k;

        // Remove master event listeners
        if (element)
        {
            listeners = element.$listeners;
            eventTypes = Keys( listeners[1] );
            for (k=0; k<eventTypes.length; k++ )
                element.removeEventListener(eventTypes[k], self.$handle, true);
            eventTypes = Keys( listeners[0] );
            for (k=0; k<eventTypes.length; k++ )
                element.removeEventListener(eventTypes[k], self.$handle, false);
            element.$listeners = undef;
        }

        // If no root or root is not
        // a dom node, then remove internal
        // root reference and exit here
        if (!el || !el.addEventListener)
        {
            self.$element = null;
            return self;
        }

        self.$element = el;
        el.$listeners = el.$listeners || [{}, {}];

        return self;
    },

    on: function(eventType, selector, handler, useCapture) {
        var self = this, root, listeners, matcher, i, l, matcherParam, eventTypes, capture;

        root = self.$element; if (!root) return self;

        if (!eventType)
            throw new TypeError('Invalid event type: ' + eventType);

        eventTypes = eventType.split( SPACES ).map( getNS );
        if (!eventTypes.length) return self;

        // handler can be passed as
        // the second or third argument
        if ('function' === typeof selector)
        {
            useCapture = handler;
            handler = selector;
            selector = null;
        }

        if ('function' !== typeof handler)
            throw new TypeError('Handler must be a type of Function');

        // Add master handler for type if not created yet
        for (i=0,l=eventTypes.length; i<l; i++)
        {
            // Fallback to sensible defaults
            // if useCapture not set
            if (undef === useCapture)
                capture = captureForType( eventTypes[i][0] );
            else
                capture = !!useCapture;
            listeners = root.$listeners[capture ? 1 : 0];

            if (!listeners[eventTypes[i][0]])
            {
                listeners[ eventTypes[i][0] ] = [ ];
                root.addEventListener( eventTypes[i][0], self.$handle, capture );
            }

            if (!selector)
            {
                matcherParam = root;
                matcher = matchesRoot;
            }
            else if (/^[a-z]+$/i.test(selector))
            {
                // Compile a matcher for the given selector
                matcherParam = selector;
                matcher = matchesTag;
            }
            else if (/^#[a-z0-9\-_]+$/i.test(selector))
            {
                matcherParam = selector.slice(1);
                matcher = matchesId;
            }
            else
            {
                matcherParam = selector;
                matcher = matchesSelector;
            }

            // Add to the list of listeners
            listeners[ eventTypes[i][0] ].push({
                selector: selector,
                handler: handler,
                matcher: matcher,
                matcherParam: matcherParam,
                namespace: eventTypes[ i ][ 1 ].join('.')
            });
        }
        return self;
    },

    off: function(eventType, selector, handler, useCapture) {
        var self = this, i, listener, listeners, listenerList, e, c,
            root = self.$element,
            singleEventType, singleEventNS, nsMatcher, eventTypes, allCaptures = false;

        if (!root) return self;

        // Handler can be passed as
        // the second or third argument
        if ('function' === typeof selector)
        {
            useCapture = handler;
            handler = selector;
            selector = null;
        }

        // If useCapture not set, remove
        // all event listeners
        if (undef === useCapture) allCaptures = [0, 1];
        else allCaptures = useCapture ? [1] : [0];

        eventTypes = eventType ? eventType.split( /\s+/g ).map( getNS ) : [ ];

        if (!eventTypes.length)
        {
            for (c=0; c<allCaptures.length; c++)
            {
                listeners = root.$listeners[allCaptures[c]];
                for (singleEventType in listeners)
                {
                    listenerList = listeners[ singleEventType ];
                    if (!listenerList || !listenerList.length) continue;
                    // Remove only parameter matches
                    // if specified
                    for (i=listenerList.length-1; i>=0; i--)
                    {
                        listener = listenerList[ i ];
                        if ((!selector || selector === listener.selector) &&
                            (!handler || handler === listener.handler))
                            listenerList.splice( i, 1 );
                    }
                    // All listeners removed
                    if (!listenerList.length)
                    {
                        delete listeners[ singleEventType ];
                        // Remove the main handler
                        root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                    }
                }
            }
        }
        else
        {
            for (c=0; c<allCaptures.length; c++)
            {
                listeners = root.$listeners[ allCaptures[c] ];
                for (e=0; e<eventTypes.length; e++)
                {
                    singleEventNS = eventTypes[e][1];
                    singleEventType = eventTypes[e][0];
                    nsMatcher = getNSMatcher( singleEventNS );
                    if (singleEventType.length)
                    {
                        listenerList = listeners[ singleEventType ];
                        if (!listenerList || !listenerList.length) continue;
                        // Remove only parameter matches
                        // if specified
                        for (i=listenerList.length-1; i>=0; i--)
                        {
                            listener = listenerList[ i ];
                            if (
                                (!selector || selector === listener.selector) &&
                                (!handler || handler === listener.handler) &&
                                (!nsMatcher || nsMatcher.test(listener.namespace))
                            )
                                listenerList.splice( i, 1 );
                        }
                        // All listeners removed
                        if (!listenerList.length)
                        {
                            delete listeners[ singleEventType ];
                            // Remove the main handler
                            root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                        }
                    }
                    else
                    {
                        for (singleEventType in listeners)
                        {
                            listenerList = listeners[ singleEventType ];
                            if (!listenerList || !listenerList.length) continue;
                            // Remove only parameter matches
                            // if specified
                            for (i=listenerList.length-1; i>=0; i--)
                            {
                                listener = listenerList[ i ];
                                if (
                                    (!selector || selector === listener.selector) &&
                                    (!handler || handler === listener.handler) &&
                                    (!nsMatcher || nsMatcher.test(listener.namespace))
                                )
                                    listenerList.splice( i, 1 );
                            }
                            // All listeners removed
                            if (!listenerList.length)
                            {
                                delete listeners[ singleEventType ];
                                // Remove the main handler
                                root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                            }
                        }
                    }
                }
            }
        }
        return self;
    }
};

//
// PublishSubscribe (Interface)
var CAPTURING_PHASE = 1, AT_TARGET = 2, BUBBLING_PHASE = 3,

    PBEvent = function(evt, target, ns) {
        var self = this;
        if (!(self instanceof PBEvent)) return new PBEvent(evt, target, ns);
        // http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Event
        self.type = evt;
        self.target = target;
        self.currentTarget = target;
        self.timeStamp = NOW( );
        self.eventPhase = AT_TARGET;
        self.namespace = ns || null;
    }
;
PBEvent[proto] = {
    constructor: PBEvent

    ,type: null
    ,target: null
    ,currentTarget: null
    ,timeStamp: null
    ,eventPhase: AT_TARGET
    ,bubbles: false
    ,cancelable: false
    ,namespace: null

    ,stopPropagation: function() {
        this.bubbles = false;
    }
    ,preventDefault: function() {
    }
};
var PublishSubscribe = {

    $PB: null
    ,namespace: null

    ,initPubSub: function() {
        var self = this;
        self.$PB = {};
        return self;
    }

    ,disposePubSub: function() {
        var self = this;
        self.$PB = null;
        return self;
    }

    ,trigger: function(evt, data) {
        var self = this, PB = self.$PB, queue, q, qq, i, l, ns, ns_evt;
        ns = getNS( evt ); evt = ns[ 0 ]; ns_evt = 'evt_' + evt;
        if (HAS.call(PB,ns_evt) && (queue=PB[ns_evt]) && (l=queue.length))
        {
            q = queue.slice( 0 ); ns = ns[1].join('.');
            evt = new PBEvent(evt, self, ns);
            for (i=0; i<l; i++)
            {
                qq = q[ i ];
                // oneOff and already called
                if (qq[ 2 ] && qq[ 3 ]) continue;
                qq[ 3 ] = 1; // handler called
                if (false === qq[ 0 ]( evt, data )) break;
            }
            if (HAS.call(PB,ns_evt) && (queue=PB[ns_evt]) && (l=queue.length))
            {
                // remove any oneOffs that were called this time
                if (queue.oneOffs > 0)
                {
                    for (i=l-1; i>=0; i--)
                    {
                        q = queue[ i ];
                        if (q[2] && q[3])
                        {
                            queue.splice(i, 1);
                            queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                        }
                    }
                }
                else
                {
                    queue.oneOffs = 0;
                }
            }
        }
        return self;
    }

    ,on: function(evt, callback, oneOff/*, thisRef*/) {
        var self = this, PB = self.$PB, ns, evts, ns_evt, i, l;
        if (evt && evt.length && is_type(callback, T_FUNC))
        {
            oneOff = !!oneOff;
            evts = evt.split( SPACES ).map( getNS );
            if (!(l=evts.length)) return self;
            for (i=0; i<l; i++)
            {
                evt = evts[ i ][ 0 ]; ns = evts[ i ][ 1 ].join('.');
                ns_evt = 'evt_' + evt;
                if (!HAS.call(PB,ns_evt))
                {
                    PB[ns_evt] = [ ];
                    PB[ns_evt].oneOffs = 0;
                }
                PB[ns_evt].push( [callback, ns, oneOff, 0/*, thisRef||null*/] );
                if (oneOff) PB[ns_evt].oneOffs++;
            }
        }
        return self;
    }

    ,onTo: function(pubSub, evt, callback, oneOff) {
        var self = this;
        //if (is_type(callback, T_FUNC)) callback = bindF(callback, self);
        pubSub.on(evt, callback, oneOff);
        return self;
    }

    ,off: function(evt, callback) {
        var self = this, queue, e, i, l, q, PB = self.$PB, ns, isFunc, evts, j, jl, ns_evt;
        if (!evt || !evt.length)
        {
            for (e in PB)
            {
                if (HAS.call(PB,e)) delete PB[ e ];
            }
        }
        else
        {
            isFunc = is_type( callback, T_FUNC );
            evts = evt.split( SPACES ).map( getNS );
            for (j=0,jl=evts.length; j<jl; j++)
            {
                evt = evts[ j ][ 0 ]; ns = getNSMatcher( evts[ j ][ 1 ] );
                if (evt.length)
                {
                    ns_evt = 'evt_' + evt;
                    if (HAS.call(PB,ns_evt) && (queue=PB[ns_evt]) && (l=queue.length))
                    {
                        for (i=l-1; i>=0; i--)
                        {
                            q = queue[ i ];
                            if (
                                (!isFunc || callback === q[0]) &&
                                (!ns || ns.test(q[1]))
                            )
                            {
                                // oneOff
                                if (q[ 2 ]) queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                                queue.splice( i, 1 );
                            }
                        }
                    }
                }
                else if (isFunc || ns)
                {
                    for (e in PB)
                    {
                        if (HAS.call(PB,e))
                        {
                            queue = PB[ e ];
                            if (!queue || !(l=queue.length)) continue;
                            for (i=l-1; i>=0; i--)
                            {
                                q = queue[ i ];
                                if (
                                    (!isFunc || callback === q[0]) &&
                                    (!ns || ns.test(q[1]))
                                )
                                {
                                    // oneOff
                                    if (q[ 2 ]) queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                                    queue.splice( i, 1 );
                                }
                            }
                        }
                    }
                }
            }
        }
        return self;
    }

    ,offFrom: function(pubSub, evt, callback) {
        var self = this;
        //if (is_type(callback, T_FUNC)) callback = bindF(callback, self);
        pubSub.off(evt, callback);
        return self;
    }
};
// aliases
PublishSubscribe.publish = PublishSubscribe.trigger;

//
// Data Types / Validators for Models (Static)
var
    ModelField = function ModelField(modelField) {
        if (!is_instance(this, ModelField)) return new ModelField( modelField );
        this.f = modelField || null;
    },

    CollectionEach = function CollectionEach(f) {
        if (!is_instance(this, CollectionEach)) return new CollectionEach(f);
        this.f = f || null;
        this.fEach = 1;
    },

    floor = Math.floor, round = Math.round, abs = Math.abs,

    pad = function(s, len, ch) {
        var sp = String(s), n = len-sp.length;
        return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
    },

    tpl_$0_re = /\$0/g,

    // Validator Compositor
    VC = function VC(V) {

        V.NOT = function() {
            return VC(function(v, k) {
                return !V.call(this, v, k);
            });
        };

        V.AND = function(V2) {
            return VC(function(v, k) {
                var self = this;
                return V.call(self, v, k) && V2.call(self, v, k);
            });
        };

        V.OR = function(V2) {
            return VC(function(v, k) {
                var self = this;
                return V.call(self, v, k) || V2.call(self, v, k);
            });
        };

        V.XOR = function(V2) {
            return VC(function(v, k) {
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return (r1 && !r2) || (r2 && !r1);
            });
        };

        V.EQ = function(V2, strict) {
            return VC(false !== strict
            ? function(v, k) {
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 === r2;
            }
            : function(v, k) {
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 == r2;
            });
        };

        V.NEQ = function(V2, strict) {
            return VC(false !== strict
            ? function(v, k) {
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 !== r2;
            }
            : function(v, k) {
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 != r2;
            });
        };

        return V;
    },

/**[DOC_MARKDOWN]
#### Types
**(used with Models)**

```javascript
// modelview.js type casters

[/DOC_MARKDOWN]**/
    Type = {

        tpl_$0: tpl_$0_re,

        TypeCaster: function(typecaster){return typecaster;}

        // default type casters
        ,Cast: {
/**[DOC_MARKDOWN]
// functionaly compose typeCasters, i.e final TypeCaster = TypeCaster1(TypeCaster2(...(value)))
ModelView.Type.Cast.COMPOSITE( TypeCaster1, TypeCaster2 [, ...] );

[/DOC_MARKDOWN]**/
            // composite type caster
            COMPOSITE: function() {
                var args = arguments;
                if (is_type(args[ 0 ], T_ARRAY)) args = args[ 0 ];
                return function(v, k) {
                   var l = args.length;
                   while ( l-- ) v = args[l].call(this, v, k);
                   return v;
                };
            },

/**[DOC_MARKDOWN]
// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );

[/DOC_MARKDOWN]**/
            // collection for each item type caster
            EACH: CollectionEach,

/**[DOC_MARKDOWN]
// cast fields of an object with a FIELDS TypeCaster
ModelView.Type.Cast.FIELDS({
    'field1': ModelView.Type.Cast.STR,
    'field2': ModelView.Type.Cast.BOOL,
    'field3': ModelView.Type.TypeCaster(function(v) { return v; }) // a custom type caster
    // etc..
});

[/DOC_MARKDOWN]**/
            // type caster for each specific field of an object
            FIELDS: function(typesPerField) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                typesPerField = Merge({}, typesPerField || {});
                return function(v) {
                    var self = this, field, type, val;
                    for (field in typesPerField)
                    {
                        if (HAS.call(typesPerField,field))
                        {
                            type = typesPerField[ field ]; val = v[ field ];
                            if (type.fEach && is_type(val, T_ARRAY))
                            {
                               v[ field ] = iterate(function( i, val ) {
                                   val[ i ] = type.f.call( self, val[ i ] );
                               }, 0, val.length-1, val);
                            }
                            else
                            {
                                v[ field ] = type.call( self, val );
                            }
                        }
                    }
                    return v;
                };
            },

/**[DOC_MARKDOWN]
// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );

[/DOC_MARKDOWN]**/
            DEFAULT: function(defaultValue) {
                return function(v) {
                    var T = get_type(v);
                    if ((T_UNDEF & T) || ((T_STR & T) && !trim(v).length)) v = defaultValue;
                    return v;
                };
            },
/**[DOC_MARKDOWN]
// cast to boolean
ModelView.Type.Cast.BOOL;

[/DOC_MARKDOWN]**/
            BOOL: function(v) {
                // handle string representation of booleans as well
                if (is_type(v, T_STR) && v.length)
                {
                    var vs = v.toLowerCase( );
                    return "true" === vs || "yes" === vs || "on" === vs || "1" === vs;
                }
                return !!v;
            },
/**[DOC_MARKDOWN]
// cast to integer
ModelView.Type.Cast.INT;

[/DOC_MARKDOWN]**/
            INT: function(v) {
                // convert NaN to 0 if needed
                return parseInt(v, 10) || 0;
            },
/**[DOC_MARKDOWN]
// cast to float
ModelView.Type.Cast.FLOAT;

[/DOC_MARKDOWN]**/
            FLOAT: function(v) {
                // convert NaN to 0 if needed
                return parseFloat(v, 10) || 0;
            },
/**[DOC_MARKDOWN]
// min if value is less than
ModelView.Type.Cast.MIN( min );

[/DOC_MARKDOWN]**/
            MIN: function(m) {
                return function(v) {return v < m ? m : v;};
            },
/**[DOC_MARKDOWN]
// max if value is greater than
ModelView.Type.Cast.MAX( max );

[/DOC_MARKDOWN]**/
            MAX: function(M) {
                return function(v) {return v > M ? M : v;};
            },
/**[DOC_MARKDOWN]
// clamp between min-max (included)
ModelView.Type.Cast.CLAMP( min, max );

[/DOC_MARKDOWN]**/
            CLAMP: function(m, M) {
                // swap
                if (m > M) { var tmp = M; M = m; m = tmp; }
                return function(v) {return v < m ? m : (v > M ? M : v);};
            },
/**[DOC_MARKDOWN]
// cast to trimmed string of spaces
ModelView.Type.Cast.TRIM;

[/DOC_MARKDOWN]**/
            TRIM: function(v) {
                return trim(Str(v));
            },
/**[DOC_MARKDOWN]
// cast to string
ModelView.Type.Cast.STR;

[/DOC_MARKDOWN]**/
            STR: function(v) {
                return Str(v);
            }
        }

/**[DOC_MARKDOWN]
// add a custom typecaster
ModelView.Type.add( name, typeCaster );

[/DOC_MARKDOWN]**/
        ,add: function(type, handler) {
            if (is_type(type, T_STR) && is_type(handler, T_FUNC))
                Type.Cast[type] = handler;
            return Type;
        }

/**[DOC_MARKDOWN]
// delete custom typecaster
ModelView.Type.del( name );

[/DOC_MARKDOWN]**/
        ,del: function(type) {
            if (is_type(type, T_STR) && HAS.call(Type.Cast, type)) delete Type.Cast[type];
            return Type;
        }

        ,toString: function( ) {
            return '[ModelView.Type]';
        }
    },
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
#### Validators
**(used with Models)**

(extra validators are available in `modelview.validation.js`)

```javascript
// modelview.js validators
// (extra validators are available in `modelview.validation.js`)

[/DOC_MARKDOWN]**/
    Validation = {

        Validator: VC

        // default validators
        ,Validate: {
/**[DOC_MARKDOWN]
// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );

[/DOC_MARKDOWN]**/
            // collection for each item validator
            EACH: CollectionEach,

/**[DOC_MARKDOWN]
// validate fields of an object with a FIELDS Validator
ModelView.Validation.Validate.FIELDS({
    'field1': ModelView.Validation.Validate.GREATER_THAN( 0 ),
    'field2': ModelView.Validation.Validate.BETWEEN( v1, v2 ),
    'field3': ModelView.Validation.Validator(function(v) { return true; }) // a custom validator
    // etc..
});

[/DOC_MARKDOWN]**/
            // validator for each specific field of an object
            FIELDS: function(validatorsPerField) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                validatorsPerField = Merge({}, validatorsPerField || {});
                return VC(function(v) {
                    var self = this, field, validator, val, l, i;
                    for (field in validatorsPerField)
                    {
                        if (HAS.call(validatorsPerField,field))
                        {
                            validator = validatorsPerField[ field ]; val = v[ field ];
                            if (validator.fEach && is_type(val, T_ARRAY))
                            {
                               l = val.length;
                               for (i=0; i<l; i++) if (!validator.f.call(self, val[ i ])) return false;
                            }
                            else
                            {
                                if (!validator.call(self, val)) return false;
                            }
                        }
                    }
                    return true;
                });
            },

/**[DOC_MARKDOWN]
// validate (string) is numeric
ModelView.Validation.Validate.NUMERIC;

[/DOC_MARKDOWN]**/
            NUMERIC: VC(function(v) {
                return is_numeric(v);
            }),
/**[DOC_MARKDOWN]
// validate (string) empty (can be used as optional)
ModelView.Validation.Validate.EMPTY;

[/DOC_MARKDOWN]**/
            EMPTY: VC(function(v){
                return !v || !trim(Str(v)).length;
            }),
/**[DOC_MARKDOWN]
// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;

[/DOC_MARKDOWN]**/
            NOT_EMPTY: VC(function(v) {
                return !!(v && (0 < trim(Str(v)).length));
            }),
/**[DOC_MARKDOWN]
// validate (string) maximum length
ModelView.Validation.Validate.MAXLEN( len=0 );

[/DOC_MARKDOWN]**/
            MAXLEN: function(len) {
                return VC(newFunc("v", "return v.length <= "+(len||0)+";"));
            },
/**[DOC_MARKDOWN]
// validate (string) minimum length
ModelView.Validation.Validate.MINLEN( len=0 );

[/DOC_MARKDOWN]**/
            MINLEN: function(len) {
                return VC(newFunc("v", "return v.length >= "+(len||0)+";"));
            },
/**[DOC_MARKDOWN]
// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );

[/DOC_MARKDOWN]**/
            MATCH: function(regex_pattern) {
                return VC(function(v) {return regex_pattern.test( v );});
            },
/**[DOC_MARKDOWN]
// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );

[/DOC_MARKDOWN]**/
            NOT_MATCH: function(regex_pattern) {
                return VC(function(v) {return !regex_pattern.test( v );});
            },
/**[DOC_MARKDOWN]
// validate equal to value (or model field)
ModelView.Validation.Validate.EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            EQUAL: function(val, strict) {
                if (is_instance(val, ModelField))
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;"));
                return false !== strict
                    ? VC(function(v) {return val === v;})
                    : VC(function(v) {return val == v;})
                ;
            },
/**[DOC_MARKDOWN]
// validate not equal to value (or model field)
ModelView.Validation.Validate.NOT_EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            NOT_EQUAL: function(val, strict) {
                if (is_instance(val, ModelField))
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
                return false !== strict
                    ? VC(function(v) {return val !== v;})
                    : VC(function(v) {return val != v;})
                ;
            },
/**[DOC_MARKDOWN]
// validate greater than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.GREATER_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            GREATER_THAN: function(m, strict) {
                if (is_instance(m, ModelField)) m = "this.$data."+m.f;
                else if (is_type(m, T_STR)) m = '"' + m + '"';
                return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;"));
            },
/**[DOC_MARKDOWN]
// validate less than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.LESS_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            LESS_THAN: function(M, strict) {
                if (is_instance(M, ModelField)) M = "this.$data."+M.f;
                else if (is_type(M, T_STR)) M = '"' + M + '"';
                return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;"));
            },
/**[DOC_MARKDOWN]
// validate between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            BETWEEN: function(m, M, strict) {
                if (is_type(m, T_ARRAY)) {strict = M; M = m[1]; m=m[0];}

                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if (!is_m_field && !is_M_field && m > M) {tmp = M; M = m; m = tmp;}
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict
                    ? VC(newFunc("v", "return ( "+m+" < v ) && ( "+M+" > v );"))
                    : VC(newFunc("v", "return ( "+m+" <= v ) && ( "+M+" >= v );"))
                ;
            },
/**[DOC_MARKDOWN]
// validate not between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.NOT_BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            NOT_BETWEEN: function(m, M, strict) {
                if (is_type(m, T_ARRAY)) {strict = M; M = m[1]; m=m[0];}

                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if (!is_m_field && !is_M_field && m > M) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict
                    ? VC(newFunc("v", "return ( "+m+" > v ) || ( "+M+" < v );"))
                    : VC(newFunc("v", "return ( "+m+" >= v ) || ( "+M+" <= v );"))
                ;
            },
/**[DOC_MARKDOWN]
// validate value is one of value1, value2, ...
ModelView.Validation.Validate.IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
            IN: function(/* vals,.. */) {
                var vals = slice.call(arguments);
                if (is_type(vals[ 0 ], T_ARRAY)) vals = vals[ 0 ];
                return VC(function(v) {
                    return -1 < vals.indexOf(v);
                });
            },
/**[DOC_MARKDOWN]
// validate value is not one of value1, value2, ...
ModelView.Validation.Validate.NOT_IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
            NOT_IN: function(/* vals,.. */) {
                var vals = slice.call(arguments);
                if (is_type(vals[ 0 ], T_ARRAY)) vals = vals[ 0 ];
                return VC(function(v) {
                    return 0 > vals.indexOf(v);
                });
            }
        }
/**[DOC_MARKDOWN]
// add a custom validator
ModelView.Validation.add( name, validator );

[/DOC_MARKDOWN]**/
        ,add: function(type, handler) {
            if (is_type(type, T_STR) && is_type(handler, T_FUNC))
                Validation.Validate[ type ] = is_type(handler.XOR, T_FUNC) ? handler : VC(handler);
            return Validation;
        }

/**[DOC_MARKDOWN]
// delete custom validator
ModelView.Validation.del( name );

[/DOC_MARKDOWN]**/
        ,del: function(type) {
            if (is_type(type, T_STR) && HAS.call(Validation.Validate, type)) delete Validation.Validate[ type ];
            return Validation;
        }

        ,toString: function() {
            return '[ModelView.Validation]';
        }
    }
;
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
**example**
```javascript

// example

$dom.modelview({

    id: 'view',

    autobind: true,
    events: [ 'change', 'click' ],

    model: {

        id: 'model',

        data: {
            // model data here ..

            mode: 'all',
            user: 'foo',
            collection: [ ]
        },

        types: {
            // data type-casters here ..

            mode: $.ModelView.Type.Cast.STR,
            user: $.ModelView.Type.Cast.STR,

            // support wildcard assignment of typecasters
            'collection.*': $.ModelView.Type.Cast.FIELDS({
                // type casters can be composed in an algebraic/functional way..

                'field1': $.ModelView.Type.Cast.COMPOSITE($.ModelView.Type.Cast.DEFAULT( "default" ), $.ModelView.Type.Cast.STR),

                'field2': $.ModelView.Type.Cast.BOOL
            })
            // this is equivalent to:
            //'collection': $.ModelView.Type.Cast.EACH($.ModelView.Type.Cast.FIELDS( .. ))
        },

        validators: {
            // data validators here ..

            mode: $.ModelView.Validation.Validate.IN( 'all', 'active', 'completed' ),

            // support wildcard assignment of validators
            'collection.*': $.ModelView.Validation.Validate.FIELDS({
                // validators can be combined (using AND/OR/NOT/XOR) in an algebraic/functional way

                'field1': $.ModelView.Validation.Validate.NOT_EMPTY.AND( $.ModelView.Validation.Validate.MATCH( /item\d+/ ) ),

                'field2': $.ModelView.Validation.Validate.BETWEEN( v1, v2 ).OR( $.ModelView.Validation.Validate.GREATER_THAN( v3 ) )
            })
            // this is equivalent to:
            //'collection': $.ModelView.Validation.Validate.EACH($.ModelView.Validation.Validate.FIELDS( .. ))
        },

        dependencies: {
            // data inter-dependencies (if any) here..

            // 'mode' field value depends on 'user' field value, e.g by a custom getter
            mode: ['user']
        }
    },

    actions: {
        // custom view actions (if any) here ..
    }
});
```
[/DOC_MARKDOWN]**/

// Model utils
var
    get_next = function(a, k) {
        if (!a) return null;
        var b = iterate(function(i, b){
            var ai = a[ i ];
            if (ai)
            {
                if (HAS.call(ai, k)) b.push( ai[ k ].n );
                if (HAS.call(ai, WILDCARD)) b.push( ai[ WILDCARD ].n );
            }
        }, 0, a.length-1, []);
        return b.length ? b : null;
    },

    get_value = function(a, k) {
        if (!a) return null;
        var i, ai, l = a.length;
        if (undef !== k)
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if (ai)
                {
                    if (HAS.call(ai, k) && ai[ k ].v) return ai[ k ].v;
                    if (HAS.call(ai, WILDCARD) && ai[ WILDCARD ].v) return ai[ WILDCARD ].v;
                }
            }
        }
        else
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if (ai && ai.v) return ai.v;
            }
        }
        return null;
    },

    walk_and_add = function(v, p, obj, isCollectionEach) {
        var o = obj, k, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++];
            if (!HAS.call(o,k)) o[ k ] = new Node( );
            o = o[ k ];
            if (i < l)
            {
                o = o.n;
            }
            else
            {
                if (isCollectionEach)
                {
                    if (!HAS.call(o.n,WILDCARD) ) o.n[ WILDCARD ] = new Node( );
                    o.n[ WILDCARD ].v = v;
                }
                else
                {
                    o.v = v;
                }
            }
        }
        return obj;
    },

    walk_and_check = function(p, obj, aux, C) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++];
            to = get_type( o );
            if (i < l)
            {
                if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if (o instanceof C) return [C, o, p.slice(i)];
                    a && (a = get_next( a, k ));
                }
                else if (!a || !(a = get_next( a, k )))
                {
                    return false;
                }
            }
            else
            {
                if (a && get_value( a, k )) return true;
                else if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k)) return true;
                else if (T_OBJ === to && 'length' == k) return true;
                return false;
            }
        }
        return false;
    },

    walk_and_get2 = function(p, obj, aux, C) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++]; to = get_type( o );
            if (i < l)
            {
                if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if (o instanceof C) return [C, o, p.slice(i)];
                    a && (a = get_next( a, k ));
                }
                else if (!a || !(a = get_next( a, k )))
                {
                    return false;
                }
            }
            else
            {
                if (a && (a = get_value( a, k ))) return [false, a];
                else if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k)) return [true, o[k]];
                else if (T_OBJ === to && 'length' == k) return [true, Keys(o).length];
                return false;
            }
        }
        return false;
    },

    walk_and_get_value2 = function(p, obj, aux, C) {
        var o = obj, a = aux, k, to, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++]; to = get_type( o );
            if (i < l)
            {
                if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if (o instanceof C) return [C, o, p.slice(i)];
                    else if (!a || !(a = get_next( a, k ))) return false;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                // nested sub-composite class
                if (o[k] instanceof C) return [C, o[k], p.slice(i)];
                else if (a /*&& get_value( a, k )*/ && (to&T_ARRAY_OR_OBJ) && HAS.call(o,k)) return [true, o, k, a];
                return false;
            }
        }
        return false;
    },

    walk_and_get3 = function(p, obj, aux1, aux2, aux3, C, all3) {
        var o = obj, a1 = null, a2 = null, a3 = null,
            k, to, i = 0, l = p.length
        ;
        all3 = false !== all3;
        if (all3) { a1 = [aux1]; a2 = [aux2]; a3 = [aux3]; }

        while (i < l)
        {
            k = p[i++];
            to = get_type( o );
            if (i < l)
            {
                if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if (o instanceof C) return [C, o, p.slice(i), 0, null, null, null];
                    if (all3)
                    {
                        a1 = get_next( a1, k );
                        a2 = get_next( a2, k );
                        a3 = get_next( a3, k );
                    }
                }
                // fixed, it bypassed setters which had multiple virtual levels
                else if (all3 && a3 && (a3 = get_next( a3, k )))
                {
                    a1 = get_next( a1, k );
                    a2 = get_next( a2, k );
                }
                else
                {
                    return [false, o, k, p, null, null, null];
                }
            }
            else if (to & T_ARRAY_OR_OBJ)
            {

                // nested sub-composite class
                if (o[ k ] instanceof C)
                    return [C, o[k], p.slice(i), 0, null, null, null];
                else if (HAS.call(o,k) /*|| (to === T_OBJ && "length" === k)*/)
                    return [true, o, k, p.slice(i), a1, a2, a3];
                return [false, o, k, p.slice(i), a1, a2, a3];
            }
        }
        return [false, o, k, p.slice(i), null, null, null];
    },

    // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
    index_to_prop_re = /\[([^\]]*)\]/g, trailing_dots_re = /^\.+|\.+$/g,
    dotted = function(key) {
        //        convert indexes to properties     strip leading/trailing dots
        return key.replace(index_to_prop_re, '.$1').replace(trailing_dots_re, '');
    },
    bracketed = function(dottedKey) {
        return '['+dottedKey.split('.').join('][')+']';
    },

    removePrefix = function(prefix) {
        // strict mode (after prefix, a key follows)
        var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
        return function(key, to_dotted) {
            var k = key.replace(regex, '$1');
            return to_dotted ? dotted(k) : k;
        };
    },

    keyLevelUp = function(dottedKey, level) {
        return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
    },

    addModelTypeValidator = function addModelTypeValidator(model, dottedKey, typeOrValidator, modelTypesValidators) {
        var k, t, isCollectionEach = false;
        if (isCollectionEach=is_instance(typeOrValidator, CollectionEach))
        {
            // each wrapper
            typeOrValidator = typeOrValidator.f; //bindF( typeOrValidator.f, model );
            // bind the typeOrValidator handler to 'this model'
            walk_and_add(typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach);
        }
        else
        {
            t = get_type( typeOrValidator );
            if (T_FUNC & t)
            {
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                //typeOrValidator = bindF( typeOrValidator, model );
                // bind the typeOrValidator handler to 'this model'
                walk_and_add(typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach);
            }
            else if (T_ARRAY_OR_OBJ & t)
            {
                // nested keys given, recurse
                for (k in typeOrValidator)
                {
                    if (HAS.call(typeOrValidator,k))
                        addModelTypeValidator(model, dottedKey + '.' + k, typeOrValidator[ k ], modelTypesValidators);
                }
            }
        }
    },

    addModelGetterSetter = function addModelGetterSetter(model, dottedKey, getterOrSetter, modelGettersSetters) {
        var k, t;
        t = get_type( getterOrSetter );
        if (T_FUNC & t)
        {
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            // bind the getterOrSetter handler to 'this model'
            walk_and_add(getterOrSetter /*bindF( getterOrSetter, model )*/, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelGettersSetters);
        }
        else if (T_ARRAY_OR_OBJ & t)
        {
            // nested keys given, recurse
            for (k in getterOrSetter)
            {
                if (HAS.call(getterOrSetter,k))
                    addModelGetterSetter(model, dottedKey + '.' + k, getterOrSetter[ k ], modelGettersSetters);
            }
        }
    },

    modelDefaults = function modelDefaults(model, data, defaults) {
        var k, v;
        for (k in defaults)
        {
            if (HAS.call(defaults,k))
            {
                v = defaults[ k ];
                if (!HAS.call(data, k ))
                {
                    data[ k ] = v;
                }
                else if (is_type(data[k], T_ARRAY_OR_OBJ) && is_type(v, T_ARRAY_OR_OBJ))
                {
                    data[ k ] = modelDefaults(model, data[k], v);
                }
            }
        }
        return data;
    },

    // handle sub-composite models as data, via walking the data
    serializeModel = function serializeModel(model_instance, model_class, data, dataType) {
        var key, type;
        if (arguments.length < 3) data = model_instance.$data;

        while (data instanceof model_class) { data = data.data( ); }

        type = dataType || get_type( data );
        data = T_OBJ & type ? Merge({}, data) : (T_ARRAY & type ? data.slice(0) : data);

        if (T_ARRAY_OR_OBJ & type)
        {
            for (key in data)
            {
                if (HAS.call(data,key))
                {
                    if (data[ key ] instanceof model_class)
                        data[ key ] = serializeModel(data[ key ], model_class, Merge( {}, data[ key ].data( ) ));
                    else if (T_ARRAY_OR_OBJ & (type=get_type(data[ key ])))
                        data[ key ] = serializeModel( model_instance, model_class, data[ key ], type );
                }
            }
        }

        return data;
    },

    // handle sub-composite models via walking the data and any attached typecasters
    typecastModel = function typecastModel(model, modelClass, dottedKey, data, typecasters, prefixKey) {
        var o, key, val, typecaster, r, res, nestedKey, splitKey;
        prefixKey = !!prefixKey ? (prefixKey+'.') : '';
        data = data || model.$data;
        typecasters = typecasters || [model.$types];

        if (typecasters && typecasters.length)
        {
            if (!!dottedKey)
            {
                if ((r = walk_and_get_value2(splitKey=dottedKey.split('.'), o=data, typecasters, modelClass)))
                {
                    o = r[ 1 ]; key = r[ 2 ];

                    if (modelClass === r[ 0 ])
                    {
                        nestedKey = splitKey.slice(0, splitKey.length-key.length).join('.');
                        // nested sub-model
                        typecastModel(o, modelClass, key.length ? key.join('.') : null);
                    }
                    else
                    {
                        nestedKey = splitKey.slice(0, -1).join('.');
                        val = o[ key ]; typecaster = get_value( r[3], key );
                        if (typecaster)
                        {
                            o[ key ] = typecaster.call(model, val, prefixKey+dottedKey);
                        }
                        if ((T_ARRAY_OR_OBJ & get_type( val )) && (typecasters=get_next( r[3], key )) && typecasters.length)
                        {
                            nestedKey += !!nestedKey ? ('.' + key) : key;
                            nestedKey = prefixKey+nestedKey;
                            for (key in val)
                            {
                                if (HAS.call(val,key))
                                {
                                    typecastModel(model, modelClass, key, val, typecasters, nestedKey);
                                }
                            }
                        }
                    }
                }
            }
            else if (T_ARRAY_OR_OBJ & get_type(data))
            {
                for (key in data)
                {
                    if (HAS.call(data,key))
                    {
                        typecastModel(model, modelClass, key, data, typecasters);
                    }
                }
            }
        }
    },

    // handle sub-composite models via walking the data and any attached validators
    validateModel = function validateModel(model, modelClass, breakOnError, dottedKey, data, validators) {
        var o, key, val, validator, r, res, nestedKey, splitKey, fixKey,
            result = {isValid: true, errors: [ ]}
        ;
        //breakOnError = !!breakOnError;
        data = data || model.$data;
        validators = validators || [model.$validators];

        if (validators && validators.length)
        {
            if (!!dottedKey)
            {
                fixKey = function(k) {return !!nestedKey ? (nestedKey + '.' + k) : k;};

                if ((r = walk_and_get_value2( splitKey=dottedKey.split('.'), o=data, validators, modelClass )))
                {
                    o = r[ 1 ]; key = r[ 2 ];

                    if (modelClass === r[ 0 ])
                    {
                        nestedKey = splitKey.slice(0, splitKey.length-key.length).join('.');

                        // nested sub-model
                        res = validateModel(o, modelClass, breakOnError, key.length ? key.join('.') : null);
                        if (!res.isValid)
                        {
                            result.errors = result.errors.concat(map(res.errors, fixKey));
                            result.isValid = false;
                        }
                        if (!result.isValid && breakOnError) return result;
                    }
                    else
                    {
                        nestedKey = splitKey.slice(0, -1).join('.');

                        val = o[ key ]; validator = get_value( r[3], key );
                        if (validator && !validator.call(model, val, dottedKey))
                        {
                            result.errors.push(dottedKey/*fixKey( key )*/);
                            result.isValid = false;
                            if (breakOnError) return result;
                        }
                        if ((T_ARRAY_OR_OBJ & get_type( val )) && (validators=get_next( r[3], key )) && validators.length)
                        {
                            nestedKey += !!nestedKey ? ('.' + key) : key;

                            for (key in val)
                            {
                                if (HAS.call(val,key))
                                {
                                    res = validateModel(model, modelClass, breakOnError, key, val, validators);
                                    if (!res.isValid)
                                    {
                                        result.errors = result.errors.concat(map(res.errors, fixKey));
                                        result.isValid = false;
                                    }
                                    if (breakOnError && !result.isValid) return result;
                                }
                            }
                        }
                    }
                }
            }
            else if (T_ARRAY_OR_OBJ & get_type(data))
            {
                for (key in data)
                {
                    if (HAS.call(data,key))
                    {
                        res = validateModel(model, modelClass, breakOnError, key, data, validators);
                        if (!res.isValid)
                        {
                            result.errors = result.errors.concat(res.errors);
                            result.isValid = false;
                        }
                        if (breakOnError && !result.isValid) return result;
                    }
                }
            }
        }
        return result;
    },

    syncHandler = function(evt, data) {
        var model = evt.target, $syncTo = model.$syncTo,
            key = data.key, val, keyDot, allKeys, allKeyslen,
            otherkey, othermodel, callback, k, skey,
            syncedKeys, i, l, prev_atomic, prev_atom, __syncing
        ;
        if ( key )
        {
            // make this current key an atom, so as to avoid any circular-loop of updates on same keys
            keyDot = key + '.';
            allKeys = Keys($syncTo); allKeyslen = allKeys.length;
            prev_atomic = model.atomic; prev_atom = model.$atom;
            model.atomic = true; model.$atom = key;
            //val = HAS.call(data,'value') ? data.value : model.get( key );
            for (k=0; k<allKeyslen; k++)
            {
                skey = allKeys[ k ];
                if (skey === key || startsWith(skey, keyDot))
                {
                    syncedKeys = $syncTo[skey]; val = model.get( skey );
                    for (i=0,l=syncedKeys.length; i<l; i++)
                    {
                        othermodel = syncedKeys[i][0]; otherkey = syncedKeys[i][1];
                        // fixed, too much recursion, when keys notified other keys, which then were re-synced
                        model.__syncing[othermodel.$id] = model.__syncing[othermodel.$id] || [ ];
                        __syncing = model.__syncing[othermodel.$id];
                        if (0 > __syncing.indexOf(otherkey))
                        {
                            __syncing.push(otherkey);
                            if ((callback=syncedKeys[i][2])) callback.call(othermodel, otherkey, val, skey, model);
                            else othermodel.set(otherkey, val, 1);
                            __syncing.pop();
                        }
                        //model.__syncing[othermodel.$id].__syncing = null;
                    }
                }
            }
            model.$atom = prev_atom; model.atomic = prev_atomic;
        }
    }
;

/**[DOC_MARKDOWN]
#### Model

```javascript
// modelview.js model methods

var model = new ModelView.Model( [String id=UUID, Object data={}, Object types=null, Object validators=null, Object getters=null, Object setters=null, Object dependencies=null] );

[/DOC_MARKDOWN]**/
//
// Model Class
var Model = function Model(id, data, types, validators, getters, setters, dependencies) {
    var model = this;

    // constructor-factory pattern
    if (!(model instanceof Model)) return new Model(id, data, types, validators, getters, setters, dependencies);

    model.$id = uuid('Model');
    model.namespace = model.id = id || model.$id;
    model.key = removePrefix(model.id);

    model.$view = null;
    model.atomic = false;  model.$atom = null;
    model.$autovalidate = true;
    model.$types = { }; model.$validators = { }; model.$getters = { }; model.$setters = { };
    model.$idependencies = { }; model.$syncTo = { };
    model.data(data || { })
        .types(types).validators(validators)
        .getters(getters).setters(setters)
        .dependencies(dependencies)
        .initPubSub( )
    ;
};
// STATIC
Model.count = function(o) {
    if (!arguments.length) return 0;
    var T = get_type(o);

    if (T_OBJ === T) return Keys(o).length;
    else if (T_ARRAY === T) return o.length;
    else if (T_UNDEF !== T) return 1; //  is scalar value, set count to 1
    return 0;
};
// return a sorter to sort model data in custom ways, easily
Model.Sorter = sorter;
Model.Field = ModelField;

// Model implements PublishSubscribe pattern
Model[proto] = Merge(Create(Obj[proto]), PublishSubscribe, {

    constructor: Model

    ,id: null
    ,$id: null
    ,$data: null
    ,$types: null
    ,$idependencies: null
    ,$validators: null
    ,$getters: null
    ,$setters: null
    ,atomic: false
    ,$atom: null
    ,$autovalidate: true
    ,$syncTo: null
    ,$syncHandler: null
    ,__syncing: null

/**[DOC_MARKDOWN]
// dispose model
model.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var model = this;
        model.disposePubSub();
        model.$data = null;
        model.$types = null;
        model.$idependencies = null;
        model.$validators = null;
        model.$getters = null;
        model.$setters = null;
        model.atomic = false;
        model.$atom = null;
        model.key = null;
        model.$autovalidate = false;
        model.$syncTo = null;
        model.$syncHandler = null;
        model.__syncing = null;
        return model;
    }

/**[DOC_MARKDOWN]
// get / set model data
model.data( [Object data] );

[/DOC_MARKDOWN]**/
    ,data: function(d) {
        var model = this;
        if (arguments.length)
        {
            model.$data = d;
            return model;
        }
        return model.$data;
    }

/**[DOC_MARKDOWN]
// add model field (inter-)dependencies in {model.key: [array of model.keys it depends on]} format
// when a model.key (model field) changes or updates, it will notify any other fields that depend on it automaticaly
// NOTE: (inter-)dependencies can also be handled by custom model getters/setters as well
model.dependencies( Object dependencies );

[/DOC_MARKDOWN]**/
    ,dependencies: function(deps) {
        var model = this, k, dependencies = model.$idependencies, d, i, dk, kk, j;
        if (is_type(deps, T_OBJ))
        {
            for (k in deps)
            {
                if (HAS.call(deps,k))
                {
                    // inverse dependencies, used by model
                    d = deps[ k ] ? [].concat( deps[ k ] ) : [];
                    for (i=0; i<d.length; i++)
                    {
                        // add hierarchical/dotted key, all levels
                        kk = d[i].split('.');
                        dk = kk[0];
                        if (!HAS.call(dependencies,dk)) dependencies[ dk ] = [ ];
                        if (0 > dependencies[ dk ].indexOf( k )) dependencies[ dk ].push( k );
                        for (j=1; j<kk.length; j++)
                        {
                            dk += '.' + kk[j];
                            if (!HAS.call(dependencies,dk)) dependencies[ dk ] = [ ];
                            if (0 > dependencies[ dk ].indexOf( k )) dependencies[ dk ].push( k );
                        }
                    }
                }
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// add default values given in {key: defaults} format
model.defaults( Object defaults );

[/DOC_MARKDOWN]**/
    ,defaults: function(defaults) {
        var model = this, k, v, data = model.$data;
        if (is_type(defaults, T_OBJ))
        {
            for (k in defaults)
            {
                if (HAS.call(defaults,k))
                {
                    v = defaults[ k ];
                    if (!HAS.call(data, k))
                    {
                        data[ k ] = v;
                    }
                    else if (is_type( data[k], T_ARRAY_OR_OBJ ) && is_type( v, T_ARRAY_OR_OBJ ))
                    {
                        data[ k ] = modelDefaults(model, data[k], v);
                    }
                }
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// add typecasters given in {dottedKey: typecaster} format
model.types( Object typeCasters );

[/DOC_MARKDOWN]**/
    ,types: function(types) {
        var model = this, k;
        if (is_type(types, T_OBJ))
        {
            for (k in types)
            {
                if (HAS.call(types,k))
                    addModelTypeValidator(model, k, types[ k ], model.$types);
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// add validators given in {dottedKey: validator} format
model.validators( Object validators );

[/DOC_MARKDOWN]**/
    ,validators: function(validators) {
        var model = this, k;
        if (is_type(validators, T_OBJ))
        {
            for (k in validators)
            {
                if (HAS.call(validators,k))
                    addModelTypeValidator(model, k, validators[ k ], model.$validators);
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// add custom getters (i.e computed/virtual observables) given in {dottedKey: getter} format
model.getters( Object getters );

[/DOC_MARKDOWN]**/
    ,getters: function(getters) {
        var model = this, k;
        if (is_type(getters, T_OBJ))
        {
            for (k in getters)
            {
                if (HAS.call(getters,k))
                    addModelGetterSetter(model, k, getters[ k ], model.$getters);
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// add custom setters given in {dottedKey: setter} format
model.setters( Object setters );

[/DOC_MARKDOWN]**/
    ,setters: function(setters) {
        var model = this, k;
        if (is_type(setters, T_OBJ))
        {
            for (k in setters)
            {
                if (HAS.call(setters,k))
                    addModelGetterSetter(model, k, setters[ k ], model.$setters);
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// get model data in plain JS Object format
// handles nested composite models automaticaly
model.serialize( );

[/DOC_MARKDOWN]**/
    // handle sub-composite models as data, via walking the data
    ,serialize: function() {
        return serializeModel(this, Model);
    }

/**[DOC_MARKDOWN]
// typecast model for given key or all data with any attached model typecasters
// handles nested composite models automaticaly
model.typecast( [String dottedKey=undefined] );

[/DOC_MARKDOWN]**/
    // handle sub-composite models via walking the data and any attached typecasters
    ,typecast: function(dottedKey) {
        typecastModel(this, Model, dottedKey);
        return this;
    }

/**[DOC_MARKDOWN]
// validate model for given key or all data with any attached model validators
// (return on first not valid value if  breakOnFirstError is true )
// handles nested composite models automaticaly
// returns: { isValid: [true|false], errors:[Array of (nested) model keys which are not valid] }
model.validate( [Boolean breakOnFirstError=false, String dottedKey=undefined] );

[/DOC_MARKDOWN]**/
    // handle sub-composite models via walking the data and any attached validators
    ,validate: function(breakOnFirstError, dottedKey) {
        return validateModel(this, Model, !!breakOnFirstError, dottedKey);
    }

/**[DOC_MARKDOWN]
// get/set model auto-validate flag, if TRUE validates each field that has attached validators live as it changes
model.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function(enabled) {
        var model = this;
        if (arguments.length)
        {
            model.$autovalidate = !!enabled;
            return model;
        }
        return model.$autovalidate;
    }

/**[DOC_MARKDOWN]
// whether model has given key (bypass custom model getters if RAW is true)
model.has( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,has: function(dottedKey, RAW) {
        var model = this, data = model.$data, getters = model.$getters, r;

        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.') && (HAS.call(data,dottedKey) || (!RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v)))
        {
            // handle single key fast
            return true;
        }
        else if ((r = walk_and_check(dottedKey.split('.'), data, RAW ? null : getters, Model)))
        {
            return true === r ? true : r[1].has(r[2].join('.'));
        }
        return false;
    }

/**[DOC_MARKDOWN]
// model get given key (bypass custom model getters if RAW is true)
model.get( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,get: function(dottedKey, RAW) {
        var model = this, data = model.$data, getters = model.$getters, r;

        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.'))
        {
            // handle single key fast
            if (!RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v) return r.v.call(model, dottedKey);
            return data[ dottedKey ];
        }
        else if ((r = walk_and_get2( dottedKey.split('.'), data, RAW ? null : getters, Model )))
        {
            // nested sub-model
            if (Model === r[ 0 ]) return r[ 1 ].get(r[ 2 ].join('.'), RAW);
            // custom getter
            else if (false === r[ 0 ]) return r[ 1 ].call(model, dottedKey);
            // model field
            return r[ 1 ];
        }
        return undef;
    }

/**[DOC_MARKDOWN]
// model get all matching keys including wildcards (bypass custom model getters if RAW is true)
model.getAll( Array dottedKeys [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,getAll: function(fields, RAW) {
        var model = this, keys, kk, k,
            f, fl, p, l, i, o, t, getters, g, getter,
            data, stack, to_get, dottedKey, results = [];

        if (!fields || !fields.length) return results;
        if (fields.substr) fields = [fields];
        RAW = true === RAW;
        data = model.$data;
        getters = RAW ? null : [model.$getters];
        for (f=0,fl=fields.length; f<fl; f++)
        {
            dottedKey = fields[f];
            stack = [[data, dottedKey, getters]];
            while (stack.length)
            {
                to_get = stack.pop( );
                o = to_get[0];
                dottedKey = to_get[1];
                g = to_get[2];
                p = dottedKey.split('.');
                i = 0; l = p.length;
                while (i < l)
                {
                    k = p[i++];
                    if (i < l)
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                    stack.push([o, keys[kk] + '.' + k, get_next(g, keys[kk])]);
                                break;
                            }
                            else if (HAS.call(o,k))
                            {
                                o = o[k];
                                g = get_next(g, k);
                            }
                        }
                        else if (t & T_ARRAY)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                for (kk=0; kk<o.length; kk++)
                                    stack.push([o, '' + kk + '.' + k, get_next(g, ''+kk)]);
                                break;
                            }
                            else if (HAS.call(o,k))
                            {
                                o = o[k];
                                g = get_next(g, k);
                            }
                        }
                        else break; // key does not exist
                    }
                    else
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                {
                                    if (RAW)
                                    {
                                        results.push(o[keys[kk]]);
                                    }
                                    else
                                    {
                                        if ((getter=get_value(g, keys[kk])) || (getter=get_value(g, k)))
                                            results.push(getter.call(model, o[keys[kk]]));
                                        else
                                            results.push(o[keys[kk]]);
                                    }
                                }
                            }
                            else if (!RAW && (getter=get_value(g, k)))
                            {
                                results.push(getter.call(model, o[k]));
                            }
                            else if (HAS.call(o,k))
                            {
                                results.push(o[k]);
                            }
                        }
                        else if (t & T_ARRAY)
                        {
                            if (WILDCARD === k)
                            {
                                for (kk=0; kk<o.length; kk++)
                                {
                                    if (RAW)
                                    {
                                        results.push(o[kk]);
                                    }
                                    else
                                    {
                                        if ((getter=get_value(g, kk)) || (getter=get_value(g, k)))
                                            results.push(getter.call(model, o[kk]));
                                        else
                                            results.push(o[kk]);
                                    }
                                }
                            }
                            else if (!RAW && (getter=get_value(g, k)))
                            {
                                results.push(getter.call(model, o[k]));
                            }
                            else if (HAS.call(o,k))
                            {
                                results.push(o[k]);
                            }
                        }
                    }
                }
            }
        }
        return results;
    }

/**[DOC_MARKDOWN]
// model set key to val
model.set( String dottedKey, * val [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // set/add, it can add last node also if not there
    ,set: function (dottedKey, val, pub, callData) {
        var model = this, r, cr, o, k, p, i, l,
            type, validator, setter,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            prevval, canSet = false, validated,
            autovalidate = model.$autovalidate
        ;

        if (model.atomic && startsWith(dottedKey, model.$atom)) return model;

        o = model.$data;
        types = model.$types;
        validators = model.$validators;
        setters = model.$setters;
        ideps = model.$idependencies;
        is_collection = T_ARRAY & get_type( val );

        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.'))
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) ? r.v : null;
            type = (r=types[k] || types[WILDCARD]) ? r.v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) ? r.v : null;
            if (is_collection)
            {
                if (!type)
                    collection_type = (cr=types[k] || types[WILDCARD]) && cr.n[WILDCARD] ? cr.n[WILDCARD].v : null;
                if (autovalidate && !validator)
                    collection_validator = (cr=validators[k] || validators[WILDCARD]) && cr.n[WILDCARD] ? cr.n[WILDCARD].v : null;
            }
            canSet = true;
        }
        else if ((r = walk_and_get3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    prevval = o.get(k);
                    if (prevval !== val) o.set(k, val, pub, callData);
                    else pub = false;
                }
                else
                {
                    prevval = o.data( );
                    if (prevval !== val) o.data(val);
                    else pub = false;
                }

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'set',
                        valuePrev: prevval,
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                }
                return model;
            }

            setter = get_value(r[6], k);
            if (!setter  && (false === r[0] && r[3].length))
            {
                // cannot add intermediate values
                return model;
            }

            type = get_value(r[4], k);
            validator = get_value(r[5], k);
            if (is_collection)
            {
                if (!type)
                    collection_type = get_value(get_next( r[4], k ), WILDCARD);
                if (autovalidate && !validator)
                    collection_validator = get_value(get_next( r[5], k ), WILDCARD);
            }
            canSet = true;
        }

        if (canSet)
        {
            if (type)
            {
                val = type.call(model, val, dottedKey);
            }
            else if (collection_type)
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if (collection_validator)
            {
                for (i=0,l=val.length; i<l; i++)
                    if (!collection_validator.call( model, val[i], dottedKey ))
                    {
                        validated = false;
                        break;
                    }
            }
            if (!validated)
            {
                if (pub)
                {
                    if (callData) callData.error = true;
                    model.publish('error', {
                        key: dottedKey,
                        value: o[k],
                        action: 'set',
                        $callData: callData
                    });
                }
                return model;
            }

            // custom setter
            if (setter)
            {
                if (false !== setter.call(model, dottedKey, val, pub))
                {
                    if (pub)
                    {
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: 'set',
                            $callData: callData
                        });

                        // notify any dependencies as well
                        if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                    }
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }

            prevval = o[ k ];
            // update/set only if different
            if (prevval !== val)
            {
                // modify or add final node here
                o[ k ] = val;

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        valuePrev: prevval,
                        action: 'set',
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                }

                if (model.$atom && dottedKey === model.$atom) model.atomic = true;
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// model add/append val to key (if key is array-like)
model.[add|append]( String dottedKey, * val [, Boolean prepend=False, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // add/append/prepend value (for arrays like structures)
    ,add: function (dottedKey, val, prepend, pub, callData) {
        var model = this, r, cr, o, k, p, i, l, index = -1,
            type, validator, setter,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            canSet = false, validated,
            autovalidate = model.$autovalidate
        ;

        if (model.atomic && startsWith(dottedKey, model.$atom)) return model;

        o = model.$data;
        types = model.$types;
        validators = model.$validators;
        setters = model.$setters;
        ideps = model.$idependencies;
        is_collection = T_ARRAY & get_type( val );

        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.'))
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            type = (r=types[k] || types[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            if (is_collection)
            {
                if (!type)
                    collection_type = get_value(get_next(get_next([types[k] || types[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
                if (autovalidate && !validator)
                    collection_validator = get_value(get_next(get_next([validators[k] || validators[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
            }
            canSet = true;
        }
        else if ((r = walk_and_get3(dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    o.add(k, val, prepend, pub, callData);
                }
                else
                {
                    index = 0;
                    o.data(val);
                }

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: prepend ? 'prepend' : 'append',
                        index: index,
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                }
                return model;
            }

            setter = get_value(get_next( r[6], k ), WILDCARD);
            if (!setter && (false === r[0] && r[3].length))
            {
                // cannot add intermediate values or not array
                return model;
            }

            type = get_value(get_next( r[4], k ), WILDCARD);
            validator = get_value(get_next( r[5], k ), WILDCARD);
            if (is_collection)
            {
                if (!type)
                    collection_type = get_value(get_next(get_next( r[4], k ), WILDCARD), WILDCARD);
                if (autovalidate && !validator)
                    collection_validator = get_value(get_next(get_next( r[5], k ), WILDCARD), WILDCARD);
            }
            canSet = true;
        }

        if (canSet)
        {
            if (type)
            {
                val = type.call(model, val, dottedKey);
            }
            else if (collection_type)
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if ( collection_validator )
            {
                for (i=0,l=val.length; i<l; i++)
                    if (!collection_validator.call(model, val[i], dottedKey))
                    {
                        validated = false;
                        break;
                    }
            }
            if (!validated)
            {
                if (pub)
                {
                    if (callData) callData.error = true;
                    model.publish('error', {
                        key: dottedKey,
                        value: /*val*/undef,
                        action: prepend ? 'prepend' : 'append',
                        index: -1,
                        $callData: callData
                    });
                }
                return model;
            }

            // custom setter
            if (setter)
            {
                if (false !== setter.call(model, dottedKey, val, pub))
                {
                    if (pub)
                    {
                        if (T_ARRAY === get_type(o[ k ]))
                        {
                            index = prepend ? 0 : o[k].length;
                        }
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: prepend ? 'prepend' : 'append',
                            index: index,
                            $callData: callData
                        });

                        // notify any dependencies as well
                        if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            if (T_ARRAY === get_type(o[ k ]))
            {
                if (prepend)
                {
                    // prepend node here
                    index = 0;
                    o[ k ].unshift(val);
                }
                else
                {
                    // append node here
                    index = o[ k ].length;
                    o[ k ].push(val);
                }
            }
            else
            {
                // not array-like, do a set operation, in case
                index = -1;
                o[ k ] = val;
            }

            if (pub)
            {
                model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'append',
                    index: index,
                    $callData: callData
                });

                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
            }
            if (model.$atom && dottedKey === model.$atom) model.atomic = true;
        }
        return model;
    }

/**[DOC_MARKDOWN]
// model insert val to key (if key is array-like) at specified position/index
model.[ins|insert]( String dottedKey, * val, Number index [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // insert value at index (for arrays like structures)
    ,ins: function (dottedKey, val, index, pub, callData) {
        var model = this, r, cr, o, k, p, i, l,
            type, validator, setter,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            canSet = false, validated,
            autovalidate = model.$autovalidate
        ;

        if (model.atomic && startsWith(dottedKey, model.$atom)) return model;

        o = model.$data;
        types = model.$types;
        validators = model.$validators;
        setters = model.$setters;
        ideps = model.$idependencies;
        is_collection = T_ARRAY & get_type( val );

        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.'))
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            type = (r=types[k] || types[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            canSet = true;
            if (is_collection)
            {
                if (!type)
                    collection_type = get_value(get_next(get_next([types[k] || types[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
                if (autovalidate && !validator)
                    collection_validator = get_value(get_next(get_next([validators[k] || validators[WILDCARD]], WILDCARD), WILDCARD), WILDCARD);
            }
        }
        else if ((r = walk_and_get3(dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    o.ins(k, val, index, pub, callData);
                }
                else
                {
                    //index = 0;
                    o.data(val);
                }

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'insert',
                        index: index,
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                }
                return model;
            }

            setter = get_value(get_next( r[6], k ), WILDCARD);
            if (!setter && (false === r[0] && r[3].length))
            {
                // cannot add intermediate values or not array
                return model;
            }

            type = get_value(get_next( r[4], k ), WILDCARD);
            validator = get_value(get_next( r[5], k ), WILDCARD);
            if (is_collection)
            {
                if (!type)
                    collection_type = get_value(get_next(get_next( r[4], k ), WILDCARD), WILDCARD);
                if (autovalidate && !validator)
                    collection_validator = get_value(get_next(get_next( r[5], k ), WILDCARD), WILDCARD);
            }
            canSet = true;
        }

        if (canSet)
        {
            if (type)
            {
                val = type.call(model, val, dottedKey);
            }
            else if (collection_type)
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if (collection_validator)
            {
                for (i=0,l=val.length; i<l; i++)
                    if (!collection_validator.call(model, val[i], dottedKey))
                    {
                        validated = false;
                        break;
                    }
            }
            if (!validated)
            {
                if (pub)
                {
                    if (callData) callData.error = true;
                    model.publish('error', {
                        key: dottedKey,
                        value: /*val*/undef,
                        action: 'insert',
                        index: -1,
                        $callData: callData
                    });
                }
                return model;
            }

            // custom setter
            if (setter)
            {
                if (false !== setter.call(model, dottedKey, val, pub))
                {
                    if (pub)
                    {
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: 'insert',
                            index: index,
                            $callData: callData
                        });

                        // notify any dependencies as well
                        if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            if (T_ARRAY === get_type(o[ k ]))
            {
                // insert node here
                o[ k ].splice(index, 0, val);
            }
            else
            {
                // not array-like, do a set operation, in case
                index = -1;
                o[ k ] = val;
            }

            if (pub)
            {
                model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'insert',
                    index: index,
                    $callData: callData
                });

                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
            }
            if (model.$atom && dottedKey === model.$atom) model.atomic = true;
        }
        return model;
    }

/**[DOC_MARKDOWN]
// model delete/remove key (with or without re-arranging array indexes)
model.[del|delete|remove]( String dottedKey [, Boolean publish=false, Boolean reArrangeIndexes=true] );

[/DOC_MARKDOWN]**/
    // delete/remove, with or without re-arranging (array) indexes
    ,del: function(dottedKey, pub, reArrangeIndexes, callData) {
        var model = this, r, o, k, p, val, index = -1, canDel = false;

        if (model.atomic && startsWith(dottedKey, model.$atom)) return model;

        reArrangeIndexes = false !== reArrangeIndexes;
        o = model.$data;

        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.'))
        {
            // handle single key fast
            k = dottedKey;
            canDel = true;
        }
        else if ((r = walk_and_get3(dottedKey.split('.'), o, null, null, null, Model, false)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ] && k.length)
            {
                // nested sub-model
                k = k.join('.');
                val = o.get(k);
                o.del(k, reArrangeIndexes, pub, callData);
                pub && model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'delete',
                        index: index,
                        rearrange: reArrangeIndexes,
                        $callData: callData
                    });

                if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                return model;
            }
            else if (r[ 3 ].length)
            {
                // cannot remove intermediate values
                return model;
            }
            canDel = true;
        }

        if (canDel)
        {
            val = o[ k ]; o[ k ] = undef;
            if (reArrangeIndexes)
            {
                T = get_type( o );
                 // re-arrange indexes
                if (T_ARRAY == T && is_array_index( k )) {index = +k; o.splice(index, 1);}
                else if (T_OBJ == T) delete o[ k ];
            }
            else
            {
                delete o[ k ]; // not re-arrange indexes
            }
            pub && model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'delete',
                    index: index,
                    rearrange: reArrangeIndexes,
                    $callData: callData
                });

            if (model.$atom && dottedKey === model.$atom) model.atomic = true;
        }
        return model;
    }

/**[DOC_MARKDOWN]
// model delete all matching keys (with or without re-arranging array indexes) including wildcards
model.[delAll|deleteAll]( Array dottedKeys [, Boolean reArrangeIndexes=true] );

[/DOC_MARKDOWN]**/
    ,delAll: function(fields, reArrangeIndexes) {
        var model = this, keys, kk, k,
            f, fl, p, l, i, o, t,
            data, stack, to_remove, dottedKey;

        if (!fields || !fields.length) return model;
        if (fields.substr) fields = [fields];
        reArrangeIndexes = false !== reArrangeIndexes;
        data = model.$data;
        for (f=0,fl=fields.length; f<fl; f++)
        {
            dottedKey = fields[f];
            stack = [[data, dottedKey]];
            while (stack.length)
            {
                to_remove = stack.pop( );
                o = to_remove[0];
                dottedKey = to_remove[1];
                p = dottedKey.split('.');
                i = 0; l = p.length;
                while (i < l)
                {
                    k = p[i++];
                    if (i < l)
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                    stack.push([o, keys[kk] + '.' + k]);
                                break;
                            }
                            else if (HAS.call(o,k))
                            {
                                o = o[k];
                            }
                        }
                        else if (t & T_ARRAY)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                for (kk=0; kk<o.length; kk++)
                                    stack.push([o, '' + kk + '.' + k]);
                                break;
                            }
                            else if (HAS.call(o,k))
                            {
                                o = o[k];
                            }
                        }
                        else break; // key does not exist
                    }
                    else
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
                                    delete o[keys[kk]];
                            }
                            else if (HAS.call(o,k))
                            {
                                delete o[k];
                            }
                        }
                        else if (t & T_ARRAY)
                        {
                            if (WILDCARD === k)
                            {
                                for (kk=o.length-1; kk>=0; kk--)
                                {
                                    if ( reArrangeIndexes )
                                    {
                                         // re-arrange indexes
                                        o.splice(kk, 1);
                                    }
                                    else
                                    {
                                        delete o[kk]; // not re-arrange indexes
                                    }
                                }
                            }
                            else if (HAS.call(o,k))
                            {
                                if (reArrangeIndexes && is_array_index(k))
                                {
                                     // re-arrange indexes
                                    o.splice(+k, 1);
                                }
                                else
                                {
                                    delete o[k]; // not re-arrange indexes
                                }
                            }
                        }
                    }
                }
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// shortcut to synchronise specific fields of this model to other fields of another model
model.sync( Model otherModel, Object fieldsMap );

[/DOC_MARKDOWN]**/
    // synchronize fields to other model(s)
    ,sync: function(otherModel, fieldsMap) {
        var model = this, key, otherKey, callback, list, i, l, addIt;
        for (key in fieldsMap)
        {
            if (HAS.call(fieldsMap,key))
            {
                otherKey = fieldsMap[key]; model.$syncTo[key] = model.$syncTo[key] || [];
                callback = null;
                if (T_ARRAY === get_type(otherKey))
                {
                    callback = otherKey[1] || null;
                    otherKey = otherKey[0];
                }
                list = model.$syncTo[key]; addIt = 1;
                for (i=list.length-1; i>=0; i--)
                {
                    if (otherModel === list[i][0] && otherKey === list[i][1])
                    {
                        list[i][2] = callback;
                        addIt = 0;
                        break;
                    }
                }
                // add it if not already added
                if (addIt) list.push([otherModel, otherKey, callback]);
            }
        }
        if (!model.$syncHandler) // lazy, only if needed
        {
            // fixed, too much recursion, when keys notified other keys, which then were re-synced
            model.__syncing = model.__syncing || { };
            model.on('change', model.$syncHandler = syncHandler/*.bind( model )*/);
        }
        return model;
    }

/**[DOC_MARKDOWN]
// shortcut to un-synchronise any fields of this model to other fields of another model
model.unsync( Model otherModel );

[/DOC_MARKDOWN]**/
    // un-synchronize fields off other model(s)
    ,unsync: function(otherModel) {
        var model = this, key, syncTo = model.$syncTo, list, i;
        for (key in syncTo)
        {
            if (HAS.call(syncTo,key))
            {
                if (!(list=syncTo[ key ]) || !list.length) continue;
                for (i=list.length-1; i>=0; i--)
                {
                    if (otherModel === list[i][0])
                    {
                        if (model.__syncing && model.__syncing[otherModel.$id]) del(model.__syncing, otherModel.$id);
                        list.splice(i, 1);
                    }
                }
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// shortcut to model publich change event for key(s) (and nested keys)
model.notify( String | Array dottedKeys [, String event="change", Object calldata=null] );

[/DOC_MARKDOWN]**/
    // shortcut to trigger "model:change" per given key(s) (given as string or array)
    ,notify: function(dottedKey, evt, data) {
        var model = this, ideps = model.$idependencies,
            k, l, d, dk, t, deps = [], deps2, keys = {};
        if (dottedKey)
        {
            t = get_type(dottedKey);
            evt = evt || 'change';
            d = {key: '', action: 'set'};
            if (data)
            {
                if (HAS.call(data,'value')) d.value = data.value;
                if (HAS.call(data,'action')) d.action = data.action;
                if (HAS.call(data,'index')) d.index = data.index;
                if (HAS.call(data,'rearrange')) d.rearrange = data.rearrange;
                if (HAS.call(data,'$callData')) d.$callData = data.$callData;
            }

            if (T_STR === t)
            {
                d.key = dottedKey;
                // notify any dependencies as well
                keys['_'+dottedKey] = 1;
                if (HAS.call(ideps,dottedKey)) deps = deps.concat(ideps[dottedKey]);
                model.publish(evt, d);
            }
            else if (T_ARRAY === t)
            {
                // notify multiple keys
                l = dottedKey.length;
                for (k=0; k<l; k++)
                {
                    d.key = dk = dottedKey[ k ];
                    if (HAS.call(keys,'_'+dk)) continue;
                    // notify any dependencies as well
                    keys['_'+dk] = 1;
                    if (HAS.call(ideps,dk)) deps = deps.concat(ideps[dk]);
                    model.publish(evt, d);
                }
            }

            while (l = deps.length)
            {
                // notify any dependencies as well
                deps2 = [];
                d = {key: '', action: 'set'};
                for (k=0; k<l; k++)
                {
                    dk = deps[ k ];
                    // avoid already notified keys previously
                    if (HAS.call(keys,'_'+dk)) continue;
                    keys['_'+dk] = 1;
                    if (HAS.call(ideps,dk)) deps2 = deps2.concat(ideps[dk]);
                    d.key = dk;
                    model.publish("change", d);
                }
                deps = deps2;
            }
        }
        return model;
    }

/**[DOC_MARKDOWN]
// model enable / disable atomic operations, do next update operations on key (and nested keys) as one atom
model.atom( String dottedKey | Boolean false );

[/DOC_MARKDOWN]**/
    // atomic (update) operation(s) by key
    ,atom: function(dottedKey) {
        var model = this;
        if (undef !== dottedKey)
        {
            if (false === dottedKey)
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

    ,toString: function() {
        return '[ModelView.Model id: '+this.id+']';
    }
});
// aliases
Model[proto].append = Model[proto].add;
Model[proto].insert = Model[proto].ins;
Model[proto].remove = Model[proto]['delete'] = Model[proto].del;
Model[proto].deleteAll = Model[proto].delAll;
Model[proto].dotKey = dotted;
Model[proto].bracketKey = bracketed;
/**[DOC_MARKDOWN]
```
[/DOC_MARKDOWN]**/

// View utils
var namedKeyProp = "mv_namedkey",

    contains_non_strict = function(collection, value) {
        if (collection)
        {
            for (var i=0,l=collection.length; i<l; i++)
                if (value == Str(collection[i])) return true;
        }
        return false;
    },

    numeric_re = /^\d+$/,
    empty_brackets_re = /\[\s*\]$/,

    fields2model = function(view, elements) {
        var model = view.$model,
            model_prefix = model.id + '.',
            checkboxes_done = { }
        ;

        iterate(function(i) {
            var el, name, key, k, j, o, alternative,
            val, input_type, is_dynamic_array, checkboxes;
            el = elements[i]; name = el[ATTR]("name");
            if (!name) return;

            input_type = (el[TYPE]||'').toLowerCase( );

            key = dotted(name);
            if (startsWith(key, model_prefix)) key = key.slice(model_prefix.length);

            k = key.split('.'); o = model.$data;
            while (k.length)
            {
                j = k.shift( );
                if (k.length)
                {
                    if (!HAS.call(o, j)) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                    o = o[ j ];
                }
                else
                {
                    if ('radio' === input_type)
                    {
                        if (!checkboxes_done[name])
                        {
                            val = '';
                            checkboxes = $sel('input[type="radio"][name="'+name+'"]', view.$dom);
                            if (checkboxes.length > 1)
                            {
                                each(checkboxes, function(c){
                                   if (el[CHECKED]) val = el[VAL];
                                });
                            }
                            else if (el[CHECKED])
                            {
                                val = el[VAL];
                            }
                            checkboxes_done[name] = 1;
                            model.set(key, val);
                        }
                    }
                    else if ('checkbox' === input_type)
                    {
                        if (!checkboxes_done[name])
                        {
                            is_dynamic_array = empty_brackets_re.test(name);
                            checkboxes = $sel('input[type="checkbox"][name="'+name+'"]', view.$dom);

                            if (is_dynamic_array)
                            {
                                // multiple checkboxes [name="model[key][]"] dynamic array
                                // only checked items are in the list
                                val = [ ];
                                each(checkboxes, function(c) {
                                    if (c[CHECKED]) val.push(c[VAL]);
                                });
                            }
                            else if (checkboxes.length > 1)
                            {
                                // multiple checkboxes [name="model[key]"] static array
                                // all items are in the list either with values or defaults
                                val = [ ];
                                each(checkboxes, function(c) {
                                    if (c[CHECKED]) val.push( c[VAL] );
                                    else val.push(!!(alternative=c[ATTR]('data-else')) ? alternative : '');
                                });
                            }
                            else if (el[CHECKED])
                            {
                                // single checkbox, checked
                                val = el[VAL];
                            }
                            else
                            {
                                // single checkbox, un-checked
                                // use alternative value in [data-else] attribute, if needed, else empty
                                val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                            }
                            checkboxes_done[name] = 1;
                            model.set(key, val);
                        }
                    }
                    else
                    {
                        val = get_val(el);
                        model.set(key, val);
                    }
                }
            }
        }, 0, elements.length-1);
    },

    serialize_fields = function(node, name_prefix) {
        var data = { },
            model_prefix = name_prefix&&name_prefix.length ? name_prefix + '.' : null,
            elements = $sel('input,textarea,select', node), checkboxes_done = { }
        ;

        iterate(function(i) {
            var el, name, key, k, j, o,
            val, input_type, is_dynamic_array, checkboxes;
            el = elements[i]; name = el[ATTR]("name");
            if (!name) return;

            input_type = (el[TYPE]||'').toLowerCase( );

            key = dotted( name );
            if (model_prefix)
            {
                if (!startsWith(key, model_prefix)) return;
                key = key.slice(model_prefix.length);
            }

            k = key.split('.'); o = data;
            while (k.length)
            {
                j = k.shift( );
                if (k.length)
                {
                    if (!HAS.call(o, j)) o[ j ] = numeric_re.test( k[0] ) ? [ ] : { };
                    o = o[ j ];
                }
                else
                {
                    if (!HAS.call(o, j)) o[ j ] = '';

                    if ('radio' === input_type)
                    {
                        if (!checkboxes_done[name])
                        {
                            val = '';
                            checkboxes = $sel('input[type="radio"][name="'+name+'"]', node);
                            if (checkboxes.length > 1)
                            {
                                each(checkboxes, function(c){
                                   if (el[CHECKED]) val = el[VAL];
                                });
                            }
                            else if (el[CHECKED])
                            {
                                val = el[VAL];
                            }
                            checkboxes_done[name] = 1;
                            o[ j ] = val;
                        }
                    }
                    else if ('checkbox' === input_type)
                    {
                        if (!checkboxes_done[name])
                        {
                            is_dynamic_array = empty_brackets_re.test( name );
                            checkboxes = $sel('input[type="radio"][name="'+name+'"]', node);

                            if (is_dynamic_array)
                            {
                                // multiple checkboxes [name="model[key][]"] dynamic array
                                // only checked items are in the list
                                val = [ ];
                                each(checkboxes, function(c) {
                                    if (c[CHECKED]) val.push(c[VAL]);
                                });
                            }
                            else if (checkboxes.length > 1)
                            {
                                // multiple checkboxes [name="model[key]"] static array
                                // all items are in the list either with values or defaults
                                val = [ ];
                                each(checkboxes, function(c) {
                                    if (c[CHECKED]) val.push(c[VAL]);
                                    else val.push(!!(alternative=c[ATTR]('data-else')) ? alternative : '');
                                });
                            }
                            else if (el[CHECKED])
                            {
                                // single checkbox, checked
                                val = el[VAL];
                            }
                            else
                            {
                                // single checkbox, un-checked
                                // use alternative value in [data-else] attribute, if needed, else empty
                                val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                            }
                            checkboxes_done[name] = 1;
                            o[ j ] = val;
                        }
                    }
                    else
                    {
                        val = get_val(el);
                        o[ j ] = val;
                    }
                }
            }
        }, 0, elements.length-1);
        return data;
    },

    do_bind_action = function(view, evt, elements, fromModel) {
        var model = view.$model, event = evt.type;

        if ('sync' === event) event = 'change';
        iterate(function(i) {
            var el, do_action, name, key, data = {};
            el = elements[i]; if (!el) return;
            do_action = el[ATTR](view.attr('mv-on-'+(fromModel ? 'model-' : '')+event));
            if (!do_action) return;
            if ('text' === do_action)
            {
                do_action = 'html';
                data.text = true;
            }

            do_action = 'do_' + do_action;
            if (!is_type(view[do_action], T_FUNC)) return;

            view[do_action](evt, el, data);
        }, 0, elements.length-1);
    },

    do_auto_bind_action = function(view, evt, elements, fromModel) {
        var model = view.$model, cached = { };

        iterate(function(i) {
            var el, name, key, ns_key, value;
            el = elements[i];  if (!el) return;
            name = el[NAME]; key = 0;
            if (!el[namedKeyProp] && !!name) el[namedKeyProp] = model.key(name, 1);
            key = el[namedKeyProp]; if (!key) return;

            // use already cached key/value
            ns_key = '_'+key;
            if (HAS.call(cached, ns_key))  value = cached[ ns_key ][ 0 ];
            else if (model.has(key)) cached[ ns_key ] = [ value=model.get( key ) ];
            else return;  // nothing to do here

            // call default action (ie: live update)
            view.do_bind(evt, el, {name:name, key:key, value:value});
        }, 0, elements.length-1);
    },

    //Work around for stupid Shift key bug created by using lowercase - as a result the shift+num combination was broken
    shift_nums = {
     "~" : "`"
    ,"!" : "1"
    ,"@" : "2"
    ,"#" : "3"
    ,"$" : "4"
    ,"%" : "5"
    ,"^" : "6"
    ,"&" : "7"
    ,"*" : "8"
    ,"(" : "9"
    ,")" : "0"
    ,"_" : "-"
    ,"+" : "="
    ,":" : ";"
    ,"\"": "'"
    ,"<" : ","
    ,">" : "."
    ,"?" : "/"
    ,"|" : "\\"
    },
    //Special Keys - and their codes
    special_keys = {
     27 : 'escape'
    ,9  : 'tab'
    ,32 : 'space'
    ,13 : 'enter'
    ,8  : 'backspace'

    ,145 : 'scrolllock'
    ,20  : 'capslock'
    ,144 : 'numlock'

    ,19 : 'pause'
    //,19 : 'break'

    ,45 : 'insert'
    ,36 : 'home'
    ,46 : 'delete'
    ,35 : 'end'

    ,33 : 'pageup'
    ,34 : 'pagedown'

    ,37 : 'left'
    ,38 : 'up'
    ,39 : 'right'
    ,40 : 'down'

    ,112 : 'f1'
    ,113 : 'f2'
    ,114 : 'f3'
    ,115 : 'f4'
    ,116 : 'f5'
    ,117 : 'f6'
    ,118 : 'f7'
    ,119 : 'f8'
    ,120 : 'f9'
    ,121 : 'f10'
    ,122 : 'f11'
    ,123 : 'f12'
    },

    viewHandler = function(view, method) {
        return function(evt){return view[method](evt, {el:this});};
    },

    getCtxScoped = function(view, viewvar) {
        var k, code = '';
        viewvar = viewvar || 'this';
        for (k in view.$ctx)
        {
            if (HAS.call(view.$ctx,k))
                code += 'var '+k+'='+viewvar+'.$ctx["'+k+'"];'
        }
        return code;
    }
;

/**[DOC_MARKDOWN]
#### View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID] );

[/DOC_MARKDOWN]**/
//
// View Class
var View = function View(id) {
    var view = this;

    // constructor-factory pattern
    if (!(view instanceof View)) return new View(id);

    view.namespace = view.id = id || uuid('View');
    view.$shortcuts = {};
    view.$num_shortcuts = 0;
    view.$components = {};
    view.$ctx = {};
    view.$upds = [];
    view.$cache = {};
    view.$cache2 = {};
    view.$cnt = {};
    view.initPubSub();
};
// STATIC
View.serialize = serialize_fields;
// View implements PublishSubscribe pattern
View[proto] = Merge(Create(Obj[proto]), PublishSubscribe, {

    constructor: View

    ,id: null
    ,$dom: null
    ,$renderdom: null
    ,$model: null
    ,$tpl: ''
    ,$out: null
    ,$map: null
    ,$livebind: true
    ,$autobind: true
    ,$shortcuts: null
    ,$num_shortcuts: null
    ,$components: null
    ,$ctx: null
    ,$upds: null
    ,$cache: null
    ,$cache2: null
    ,$cnt: null
    ,$prat: ''
    ,_dbnc: null

/**[DOC_MARKDOWN]
// dispose view
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function() {
        var view = this;
        view.unbind().disposePubSub();
        view.$dom = null;
        view.$renderdom = null;
        view.$model = null;
        view.$tpl = null;
        view.$out = null;
        view.$map = null;
        view.$shortcuts = null;
        view.$num_shortcuts = null;
        view.$components = null;
        view.$ctx = null;
        view.$cache = null;
        view.$cache2 = null;
        view.$cnt = null;
        view.$upds = null;
        return view;
    }

/**[DOC_MARKDOWN]
// get / set view model
view.model( [Model model] );

[/DOC_MARKDOWN]**/
    ,model: function(model) {
        var view = this;
        if (arguments.length)
        {
            view.$model = model;
            return view;
        }
        return view.$model;
    }

/**[DOC_MARKDOWN]
// get / set the template of the view as HTML string
view.template( [String html] );

[/DOC_MARKDOWN]**/
    ,template: function(html) {
        var view = this;
        if (arguments.length)
        {
            view.$tpl = trim(html);
            view.$out = null;
            return view;
        }
        return view.$tpl;
    }

/**[DOC_MARKDOWN]
// register a view context (eg global functions and variables) which can be used in templates in {name: value} format
view.context( Object ctx );

[/DOC_MARKDOWN]**/
    ,context: function(ctx) {
        var view = this, k;
        if (is_type(ctx, T_OBJ))
        {
            for (k in ctx)
                if (HAS.call(ctx,k))
                    view.$ctx[k] = ctx[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add custom view event handlers for model/view/dom/document targets in {"target:eventName": handler} format
view.events( Object events );

[/DOC_MARKDOWN]**/
    ,events: function(events) {
        var view = this, k;
        if (is_type(events, T_OBJ))
        {
            for (k in events)
                if (HAS.call(events,k) && is_type(events[k], T_FUNC))
                    view['on_' + k.split(':').join('_')] = events[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );

[/DOC_MARKDOWN]**/
    ,shortcuts: function(shortcuts) {
        var view = this, k, key, keys, modifiers, i, view_shortcuts = view.$shortcuts;
        if (is_type(shortcuts, T_OBJ))
        {
            for (k in shortcuts)
            {
                if (HAS.call(shortcuts,k))
                {
                    modifiers = [];
                    keys = k.toLowerCase().split('+').map(trim);
                    for (i=keys.length-1; i>=0; i--)
                    {
                        key = keys[ i ];
                        if ('alt' === key || 'ctrl' === key || 'shift' === key || 'meta' === key)
                        {
                            modifiers.push(key);
                            keys.splice(i, 1);
                        }
                    }
                    key = modifiers.sort().concat(keys).join('+');

                    if (false === shortcuts[k])
                    {
                        if (HAS.call(view_shortcuts,key))
                        {
                            del(view_shortcuts, key);
                            view.$num_shortcuts--;
                        }
                    }
                    else
                    {
                        if (!HAS.call(view_shortcuts,key)) view.$num_shortcuts++;
                        view_shortcuts[ key ] = shortcuts[ k ];
                    }
                }
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add custom view named actions in {actionName: handler} format
view.actions( Object actions );

[/DOC_MARKDOWN]**/
    ,actions: function(actions) {
        var view = this, k;
        if (is_type(actions, T_OBJ))
        {
            for (k in actions)
                if (HAS.call(actions,k) && is_type(actions[k], T_FUNC))
                    view['do_' + k] = actions[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// add custom view named components which render output in {componentName: componentInstance} format
view.components( Object components );

[/DOC_MARKDOWN]**/
    ,components: function(components) {
        var view = this, k;
        if (is_type(components, T_OBJ))
        {
            for (k in components)
                if (HAS.call(components,k) && is_instance(components[k], View.Component))
                    view.$components[k] = components[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render a custom view named component
view.component( String componentName, uniqueComponentInstanceId || null, Object props );

[/DOC_MARKDOWN]**/
    ,component: function(name, id, props) {
        var view = this, out, c, propsKey, prevProps, changed;
        if (name && HAS.call(view.$components, name))
        {
            c = view.$components[name];
            if (c.tpl && !c.out)
            {
                c.out = tpl2code(c.tpl, 'props,', getCtxScoped(view, 'this'), true, {trim:true, id:view.attr('mv-id')}, '<mv-component>');
            }
            if (c.out)
            {
                if (!HAS.call(view.$cnt, name)) view.$cnt[name] = 0;
                view.$cnt[name]++;
                if ((null == props) && is_type(id, T_OBJ))
                {
                    props = id;
                    id = null;
                }
                propsKey = null != id ? name+'_id_'+Str(id) : name+'_#'+Str(view.$cnt[name]);
                changed = true;
                prevProps = view.$cache2[propsKey];
                if (prevProps && props && c.opts && c.opts.changed)
                    changed = c.opts.changed(prevProps[0], props, prevProps[1], view.$cnt[name]);
                view.$cache[propsKey] = [props, view.$cnt[name]];
                out = c.out.call(view, props, htmlNode);
                out.changed = changed;
                return out;
            }
        }
        return '';
    }

    // can integrate with HtmlWidget
    ,widget: function(/*args*/) {
        var HtmlWidget = View.HtmlWidget;
        return HtmlWidget && ("function" === typeof(HtmlWidget.widget)) ? this.html(HtmlWidget.widget.apply(HtmlWidget, arguments)) : '';
    }

    // dynamically parse html string to html virtual dom
    ,html: function(str) {
        return parse(str, {trim:true, id:this.attr('mv-id')}, 'dynamic');
    }

/**[DOC_MARKDOWN]
// get / set custom prefix for ModelView specific attributes, eg 'data-', so [mv-evt] becomes [data-mv-evt] and so on..
view.attribute( [String prefix] );

[/DOC_MARKDOWN]**/
    ,attribute: function(prefix) {
        if (arguments.length)
        {
            this.$prat = trim(prefix);
            return this;
        }
        return this.$prat;
    }

    ,attr: function(attr) {
        return this.$prat + Str(attr);
    }

/**[DOC_MARKDOWN]
// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function(enable) {
        if (arguments.length)
        {
            this.$model.autovalidate(enable);
            return this;
        }
        return this.$model.autovalidate();
    }

/**[DOC_MARKDOWN]
// get / set livebind,
// livebind automatically updates dom when model changes, DEFAULT TRUE
view.livebind( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,livebind: function(enable) {
        var view = this;
        if (arguments.length)
        {
            view.$livebind = 'text' === enable ? 'text' : !!enable;
            return view;
        }
        return view.$livebind;
    }

/**[DOC_MARKDOWN]
// get / set autobind,
// autobind automatically binds (2-way) input elements to model keys via name attribute, DEFAULT TRUE
view.autobind( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autobind: function(enable) {
        var view = this;
        if (arguments.length)
        {
            view.$autobind = !!enable;
            return view;
        }
        return view.$autobind;
    }

/**[DOC_MARKDOWN]
// bind view to dom listening given DOM events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom, renderdom) {
        var view = this, model = view.$model,
            method, evt, namespaced, autobindSelector, bindSelector,
            autobind = view.$autobind, livebind = view.$livebind
        ;

        view.$dom = dom || (HASDOC ? document.body : null);
        view.$renderdom = renderdom || view.$dom;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};

        // default view/dom binding events
        events = events || ['change', 'click'];
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '['+view.attr('mv-evt')+']';

        if (HASDOC && view.$dom && view.on_view_change && events.length)
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent(view.$dom).on(
                map(events, namespaced).join(' '),

                autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,

                function(evt) {
                    // event triggered by view itself, ignore
                    if (evt.data && (view === evt.data.trigger)) return;
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when bind on original button
                    // add "bubble" option in modelview bind params
                    var el = this, isAutoBind = false, isBind = false;
                    // view/dom change events
                    isBind = el[MATCHES]('['+view.attr('mv-evt')+']') && el[ATTR](view.attr('mv-on-'+evt.type));
                    // view change autobind events
                    isAutoBind = autobind && ("change" == evt.type) && el[MATCHES](autobindSelector);
                    if (isBind || isAutoBind) view.on_view_change(evt, {el:el, isBind:isBind, isAutoBind:isAutoBind});
                    return true;
                },

                true
            );
        }

        // bind model/view/dom/document (custom) event handlers
        for (method in view)
        {
            if (!is_type(view[method], T_FUNC)) continue;

            if (view.$dom && startsWith(method, 'on_model_'))
            {
                evt = method.slice(9);
                evt.length && view.onTo(model, evt, bindF(view[method], view));
            }
            else if (HASDOC)
            {
                if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && DOMEvent(document.body).on(
                        namespaced(evt),
                        viewHandler(view, method)
                    );
                }
                else if (view.$dom && startsWith(method, 'on_view_') && 'on_view_change' !== method)
                {
                    evt = method.slice(8);
                    evt.length && DOMEvent(view.$dom).on(
                        namespaced(evt),
                        autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,
                        viewHandler(view, method),
                        true
                    );
                }
                else if (view.$dom && startsWith(method, 'on_dom_'))
                {
                    evt = method.slice(7);
                    evt.length && DOMEvent(view.$dom).on(
                        namespaced(evt),
                        viewHandler(view, method)
                    );
                }
            }
        }

        return view;
    }

/**[DOC_MARKDOWN]
// unbind view from underlying dom
view.unbind( );

[/DOC_MARKDOWN]**/
    ,unbind: function() {
        var view = this, model = view.$model,
            autobindSelector, bindSelector,
            namespaced, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind
        ;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '['+view.attr('mv-evt')+']';

        // view/dom change events
        if (HASDOC && view.$dom && view.on_view_change)
        {
            DOMEvent(view.$dom).off(
                viewEvent,
                autobind ? [autobindSelector, bindSelector].join( ',' ) : bindSelector
            );
        }

        // model events
        if (model) view.offFrom(model);
        if (HASDOC && view.$dom)
        {
            DOMEvent(view.$dom).off(viewEvent);
            DOMEvent(document.body).off(viewEvent);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render view on actual DOM (immediately or deferred)
// .render is also called internally by view auto-update methods
view.render( [Boolean immediate=false] );

[/DOC_MARKDOWN]**/
    ,render: function(immediate) {
        var self = this, out = '', callback;
        if (!self.$out && self.$tpl) self.$out = tpl2code(self.$tpl, '', getCtxScoped(self, 'this'), self.$livebind, {trim:true, id:self.attr('mv-id')});
        if ('text' === self.$livebind)
        {
            if (!self.$renderdom)
            {
                self.$upds = [];
                if (self.$out) out = self.$out.call(self, function(key){return Str(self.model().get(key));}); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            else
            {
                if (!self.$map)
                {
                    if (self.$out) self.$renderdom.innerHTML = self.$out.call(self, function(key){return '{'+Str(key)+'}';});
                    self.add(self.$renderdom);
                }
                callback = function() {
                    var upds = self.$upds;
                    self.$upds = [];
                    morphText(self.$map, self.model(), 'sync' === immediate ? null : upds);
                    // notify any 3rd-party also if needed
                    self.publish('render', {});
                };
                if (true === immediate || 'sync' === immediate)
                {
                    callback();
                }
                else
                {
                    debounce(callback, self);
                }
            }
        }
        else if (self.$out)
        {
            if (!self.$renderdom)
            {
                self.$upds = []; self.$cache2 = {}; self.$cache = {}; self.$cnt = {};
                var out = to_string(self.$out.call(self, htmlNode)); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            callback = function() {
                self.$upds = []; self.$cache2 = self.$cache; self.$cache = {}; self.$cnt = {};
                var vdom = self.$out.call(self, htmlNode);
                morph(self.$renderdom, vdom, self.attr('mv-id'));
                vdom = null;
                // notify any 3rd-party also if needed
                self.publish('render', {});
            };
            if (true === immediate || 'sync' === immediate)
            {
                callback();
            }
            else
            {
                debounce(callback, self);
            }
        }
        else
        {
            self.$upds = [];
        }
        return self;
    }

    ,add: function(node) {
        var view = this;
        if (view.$dom && node)
        {
            if (!view.$map) view.$map = {att:{}, txt:{}};
            get_placeholders(node, view.$map);
        }
        return node;
    }
    ,remove: function(node) {
        var view = this, map = view.$map;
        if (view.$dom && node && map)
        {
            del_map(map.txt, function(v){
                v.reduce(function(rem, t, i){
                    if (is_child_of(t, node, view.$dom)) rem.push(i);
                    return rem;
                }, [])
                .reverse()
                .forEach(function(i){
                    v.splice(i, 1);
                });
            });
            del_map(map.att, function(v){
                v.reduce(function(rem, a, i){
                    if (is_child_of(a.node, node, view.$dom)) rem.push(i);
                    return rem;
                }, [])
                .reverse()
                .forEach(function(i){
                    v.splice(i, 1);
                });
            });
        }
        return node;
    }

    ,addNode: function(el, node, index) {
        if (el && node)
            add_nodes(el, [node], index);
        return this;
    }
    ,moveNode: function(el, node, index) {
        if (el && node)
            add_nodes(el, [node], index, true);
        return this;
    }
    ,removeNode: function(node) {
        if (node && node.parentNode)
            remove_nodes(node.parentNode, 1, AP.indexOf.call(node.parentNode.childNodes, node));
        return this;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, els;

        if (HASDOC && view.$dom)
        {
            view.render('sync');
            if (true !== view.$livebind) do_bind_action(view, {type:'sync'}, $sel('['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']', view.$dom), {});
            if (view.$autobind && (true !== view.$livebind || view.$dom !== view.$renderdom))
            {
                els = $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom);
                //if (view.$livebind) els = els.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
                do_auto_bind_action(view, {type:'change'}, els, null);
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// synchronize model to underlying dom
view.sync_model();

[/DOC_MARKDOWN]**/
    ,sync_model: function() {
        var view = this, model = view.$model,
            autobind = view.$autobind, autobinds
        ;

        if (HASDOC && view.$dom && autobind)
        {
            autobinds = $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom);
            if (autobinds.length) fields2model(view, autobinds);
        }
        return view;
    }

    //
    // view "on_event" methods
    //

    ,on_view_change: function(evt, data) {
        var view = this, model = view.$model,
            el = data.el, name, key, val,
            checkboxes, is_dynamic_array, input_type, alternative,
            modeldata = { }
        ;

        // evt triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;

        // update model and propagate to other elements of same view (via model publish hook)
        if (data.isAutoBind && !!(name=el[NAME]))
        {
            if (!el[namedKeyProp]) el[namedKeyProp] = model.key(name, 1);
            key = el[namedKeyProp];

            if (key /*&& model.has( key )*/)
            {
                input_type = (el[TYPE]||'').toLowerCase();

                if ('checkbox' === input_type)
                {
                    is_dynamic_array = empty_brackets_re.test(name);
                    checkboxes = $sel('input[type="checkbox"][name="'+name+'"]', view.$dom);

                    if (is_dynamic_array)
                    {
                        // multiple checkboxes [name="model[key][]"] dynamic array
                        // only checked items are in the list
                        val = [];
                        each(checkboxes, function(c) {
                            if (c[CHECKED]) val.push(c[VAL]);
                        });
                    }
                    else if (checkboxes.length > 1)
                    {
                        // multiple checkboxes [name="model[key]"] static array
                        // all items are in the list either with values or defaults
                        val = [];
                        each(checkboxes, function(c) {
                            if (c[CHECKED]) val.push(c[VAL]);
                            else val.push(!!(alternative=c[ATTR]('data-else')) ? alternative : '');
                        });
                    }
                    else if (el[CHECKED])
                    {
                        // single checkbox, checked
                        val = el[VAL];
                    }
                    else
                    {
                        // single checkbox, un-checked
                        // use alternative value in [data-else] attribute, if needed, else empty
                        val = !!(alternative=el[ATTR]('data-else')) ? alternative : '';
                    }
                }
                else
                {
                    val = get_val(el);
                }

                modeldata.$trigger = el;
                model.set(key, val, 1, modeldata);
            }
        }

        // if not model update error and element is bind element
        // do view action
        if (!modeldata.error && data.isBind) do_bind_action(view, evt, [el]/*, data*/);

        // notify any 3rd-party also if needed
        view.publish('change', data);
    }

    ,on_document_keydown: function(evt, data) {
        var view = this, view_shortcuts = view.$shortcuts,
            el = data.el, callback, ret, input_type,
            key, code, character, modifiers;

        // evt triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;
        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        input_type = 'TEXTAREA' === el[TAG].toUpperCase() ? 'text' : ('INPUT' === el[TAG].toUpperCase() ? (el[TYPE]||'').toLowerCase() : '');
        // no hotkeys assigned or text input element is the target, bypass
        if (!view.$num_shortcuts || 'text' === input_type || 'email' === input_type || 'url' === input_type || 'number' === input_type) return;

        // find which key is pressed
        code = evt.keyCode || evt.which;

        // key modifiers (in alphabetical order)
        modifiers = [];
        if (!!evt.altKey) modifiers.push('alt');
        if (!!evt.ctrlKey) modifiers.push('ctrl');
        if (!!evt.metaKey) modifiers.push('meta');	// meta is Mac specific
        if (!!evt.shiftKey) modifiers.push('shift');

        // if it is a special key
        if (HAS.call(special_keys, code))
        {
            key = special_keys[ code ];
        }
        else
        {
            if ( 188 === code )         character = ","; //If the user presses , when the type is onkeydown
            else if ( 190 === code )    character = "."; //If the user presses , when the type is onkeydown
            else                        character = Str.fromCharCode(code).toLowerCase( );
            // stupid Shift key bug created by using lowercase
            if (!!evt.shiftKey && HAS.call(shift_nums,character)) character = shift_nums[character];
            key = character;
            //if ( '+' === key ) key = 'plus';
        }
        key = modifiers.concat(key).join('+');
        if (!!key && HAS.call(view_shortcuts,key) && view_shortcuts[key])
        {
            callback = view_shortcuts[key]; ret = true;
            if (callback.substr)
            {
                // view action id given
                if (is_type(view['do_' + callback], T_FUNC))
                {
                    /*ret = */view['do_' + callback](evt, el, {});
                    ret = false;
                }
            }
            else
            {
                // actual function handler given
                ret = callback.call(view, evt, el, {});
            }
            if (false === ret)
            {
                // stop the event
                evt.stopPropagation();
                evt.preventDefault();
                return false;
            }
        }
    }

    ,on_model_change: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = view.$livebind,
            key, autobindSelector, bindSelector,
            bindElements = [], autoBindElements = [], notTriggerElem
        ;

        if (HASDOC && view.$dom)
        {
            key = model.id + bracketed(data.key);
            autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
            bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']';

            bindElements = true !== livebind ? $sel(bindSelector, view.$dom) : [];
            if (autobind) autoBindElements = (true !== livebind || view.$dom !== view.$renderdom) ? $sel(autobindSelector, view.$dom) : [];

            // bypass element that triggered the "model:change" event
            if (data.$callData && data.$callData.$trigger)
            {
                notTriggerElem = function(ele) {return ele !== data.$callData.$trigger;};
                bindElements = filter(bindElements, notTriggerElem);
                if (autobind) autoBindElements = filter(autoBindElements, notTriggerElem);
                data.$callData = null;
            }
            // do actions ..

            // do view action first
            if (bindElements.length)
            {
                do_bind_action(view, evt, bindElements, data);
            }
            // do view autobind action to bind input elements that map to the model, afterwards
            if (autobind && autoBindElements.length)
            {
                //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
                do_auto_bind_action(view, evt, autoBindElements, data);
            }
            // do view live DOM update action
            if (livebind)
            {
                if (-1 === view.$upds.indexOf(data.key)) view.$upds.push(data.key);
                view.render();
            }
        }
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.$autobind, livebind = view.$livebind,
            key, autobindSelector, bindSelector,
            bindElements, autoBindElements
        ;

        if (HASDOC && view.$dom)
        {
            key = model.id + bracketed(data.key);
            autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
            bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-error')+']';
            // do actions ..

            // do view bind action first
            if ((true !== livebind) && (bindElements=$sel(bindSelector, view.$dom)).length)
            {
                do_bind_action(view, evt, bindElements, data);
            }
            // do view autobind action to bind input elements that map to the model, afterwards
            if (autobind && (true !== livebind || view.$dom !== view.$renderdom))
            {
                autoBindElements = $sel(autobindSelector, view.$dom);
                //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
                do_auto_bind_action(view, evt, autoBindElements, data);
            }
            // do view live DOM bindings update action
            if (livebind)
            {
                view.render();
            }
        }
    }

    //
    // view "do_action" methods
    //

    // NOP action
    ,do_nop: null

    // set element(s) html/text prop based on model key value
    ,do_html: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var html = Str(model.get(key));
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                var val = el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML];
                if (val !== html) el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = html;
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // set element(s) css props based on model key value
    ,do_css: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var style = model.get(key);
            if (!is_type(style, T_OBJ)) return;
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                // css attributes
                for (var p in style)
                {
                    if (HAS.call(style, p))
                    {
                        if (el.style[p] != style[p])
                            el.style[p] = style[p];
                    }
                }
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // show/hide element(s) according to binding
    ,do_show: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var modelkey = model.get(key);
            // show if data[key] is value, else hide
            // show if data[key] is true, else hide
            var enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) show(el);
                else hide(el);
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // hide/show element(s) according to binding
    ,do_hide: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR](view.attr('mv-model')) || data.key, domref, callback;

        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var modelkey = model.get(key);
            // hide if data[key] is value, else show
            // hide if data[key] is true, else show
            var enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el){
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) hide(el);
                else show(el);
            });
        };
        if (true !== view.$livebind)
        {
            if (!view.$livebind || ('sync' === evt.type)) callback();
            else if ('text' === view.$livebind) view.on('render', callback, true);
        }
    }

    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function(evt, el, data) {
        var view = this, model = view.$model, trigger = DOMEvent.Dispatch,
            name = data.name, key = data.key,
            input_type = (el[TYPE]||'').toLowerCase(),
            value, value_type, checked, checkboxes, is_dynamic_array
        ;

        // if should be updated via new live render, ignore
        if (true===view.$livebind && (view.$dom===view.$renderdom || is_child_of(el, view.$renderdom, view.$dom))) return;

        // use already computed/cached key/value from calling method passed in "data"
        //if (!key) return;
        value = data.value; value_type = get_type(value);

        if ('radio' === input_type)
        {
            if (Str(value) == el[VAL])
            {
                each($sel('input[name="'+name+'"]', view.$dom), function(ele) {
                    if (el !== ele) ele[CHECKED] = false;
                });
                checked = el[CHECKED];
                el[CHECKED] = true;
                if (checked !== el[CHECKED])
                    trigger('change', el, {trigger:view});
            }
        }

        else if ('checkbox' === input_type)
        {
            is_dynamic_array = empty_brackets_re.test(name);

            if (is_dynamic_array)
            {
                value = T_ARRAY === value_type ? value : [value];
                checked = el[CHECKED];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                if (checked !== el[CHECKED])
                    trigger('change', el, {trigger:view});
            }
            else if (/*checkboxes.length > 1 &&*/ (T_ARRAY === value_type))
            {
                checked = el[CHECKED];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                if (checked !== el[CHECKED])
                    trigger('change', el, {trigger:view});
            }

            else
            {
                checked = el[CHECKED];
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
                if (checked !== el[CHECKED])
                    trigger('change', el, {trigger:view});
            }
        }
        else
        {
            if (set_val(el, value))
                trigger('change', el, {trigger:view});
        }
    }

    ,toString: function( ) {
        return '[ModelView.View id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
#### View.Component

```javascript
// **Note** that component instances are attached to each view separately, if used in another view, a new instance should be used!
var MyComponent = new ModelView.View.Component(String name, String htmlTpl [, Object options={changed:function(oldProps,newProps){return true}}]);
MyComponent.dispose(); // dispose

```
[/DOC_MARKDOWN]**/
View.Component = function Component(name, tpl, opts) {
  var self = this;
  if (!(self instanceof Component)) return new Component(name, tpl, opts);
  self.name = trim(name);
  self.tpl = trim(tpl);
  self.out = null;
  self.opts = opts || {};
};
View.Component[proto] = {
    constructor: View.Component
    ,name: ''
    ,opts: null
    ,tpl: ''
    ,out: null

    ,dispose: function() {
        var self = this;
        self.opts = null;
        self.tpl = null;
        self.out = null;
        return self;
    }
};
// can integrate with HtmlWidget by setting the lib via this static property
View.HtmlWidget = null;
/**[DOC_MARKDOWN]
#### Examples 

[See it](https://foo123.github.io/examples/modelview/)


```html
<script id="content" type="text/x-template">
    <b>Note:</b> Arbitrary JavaScript Expressions can be run inside &#123; and &#125; template placeholders
    <br /><br />
    <b>Hello {this.model().get('msg')}</b> &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value={this.model().get('msg')} />
    <button class="button" title={this.model().get('msg')} mv-evt mv-on-click="alert">Hello</button>
    <button class="button" mv-evt mv-on-click="hello_world">Hello World</button>
</script>
<div id="app"></div>
```

```javascript
// standalone
new ModelView.View('view')
.model(
    new ModelView.Model(
        'model',
        // model data here ..
        {msg: 'Earth!'}
    )
    // model data type-casters (if any) here ..
    .types({msg: ModelView.Type.Cast.STR})
    // model data validators (if any) here ..
    .validators({msg: ModelView.Validation.Validate.NOT_EMPTY})
)
.template(
    document.getElementById('content').innerHTML
)
.actions({
    // custom view actions (if any) here ..
    alert: function(evt, el) {
        alert(this.model().get('msg'));
    },
    hello_world: function(evt, el) {
        this.model().set('msg', "World", true);
    }
})
.shortcuts({
    'alt+h': 'alert'
})
.autovalidate(true)
.autobind(true) // default
.livebind(true) // default
.bind(['click', 'change'], document.getElementById('app'))
.sync()
;
```

**Server-Side Rendering**

```javascript
var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
    'hello': new ModelView.View.Component('hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().get('msg')}</div>`)
    })
    .template(`{view.component('hello')}`)
    .livebind(true)
;

var viewText = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .template(`<div title="Hello {msg}">Hello {msg}</div>`)
    .livebind('text')
;

console.log(view.render());
console.log(viewText.render());
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
```
[/DOC_MARKDOWN]**/

// main
// export it
var ModelView = {

    VERSION: "3.0.0"
    
    ,UUID: uuid
    
    ,Extend: Merge
    
    //,Field: ModelField // transfered to Model.Field
    ,Event: DOMEvent
    
    ,Type: Type
    
    ,Validation: Validation
    
    ,PublishSubscribeInterface: PublishSubscribe
    
    ,Model: Model
    
    ,View: View
};
/**
*
*   ModelView.js (jQuery plugin, jQueryUI widget optional)
*   @version: 3.0.0
*
*   A micro-MV* (MVVM) framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
!function(ModelView, window, undef) {
"use strict";
ModelView.jquery = function($) {
    "use strict";

    if (!$.ModelView)
    {
        // add it to root jQuery object as a jQuery reference
        $.ModelView = ModelView;

        var slice = Function.prototype.call.bind(Array.prototype.slice),
            extend = $.extend, View = ModelView.View, Model = ModelView.Model;

        // modelview jQuery plugin
        $.fn.modelview = function(arg0, arg1, arg2) {
            var argslen = arguments.length,
                method = argslen ? arg0 : null, options = arg0,
                isInit = true, optionsParsed = false,  map = []
            ;

            // apply for each matched element (better use one element per time)
            this.each(function() {

                var $dom = $(this), model, view, defaultModel, defaultOptions;

                // modelview already set on element
                if ($dom.data('modelview'))
                {
                    isInit = false;

                    view = $dom.data('modelview');
                    model = view.model();

                    // methods
                    if ('view' === method)
                    {
                        map.push(view);
                    }
                    else if ('model' === method)
                    {
                        if (argslen > 1)
                        {
                            view.model(arg1);
                            return this;
                        }
                        map.push(model);
                    }
                    else if ('data' === method)
                    {
                        if (argslen > 1)
                        {
                            model.data(arg1);
                            return this;
                        }
                        map.push(model.data());
                    }
                    else if ('sync' === method)
                    {
                        view.sync();
                    }
                    else if ('dispose' === method)
                    {
                        $dom.data('modelview', null);
                        view.dispose();
                    }
                    return this;
                }

                if (!optionsParsed)
                {
                    defaultModel = {
                        id: 'model'
                        ,data: { }
                        ,types: { }
                        ,validators: { }
                        ,getters: { }
                        ,setters: { }
                        ,dependencies: { }
                    };
                    defaultOptions = {

                        viewClass: View
                        ,modelClass: Model

                        ,id: 'view'
                        ,livebind: false
                        ,autobind: false
                        ,autovalidate: true
                        ,events: null
                        ,autoSync: true

                        ,model: null
                        ,template: null
                        ,attribute: ''
                        ,actions: { }
                        ,context: { }
                        ,handlers: { }
                        ,shortcuts: { }
                        ,components: { }
                    };
                    // parse options once
                    options = extend({}, defaultOptions, options);

                    if (options.model && !(options.model instanceof Model))
                    {
                        options.model = extend({}, defaultModel, options.model);
                    }

                    optionsParsed = true;
                }

                if (!options.model) return this;

                model = (options.model instanceof Model)
                        ? options.model
                        : new options.modelClass(
                            options.model.id,
                            options.model.data,
                            options.model.types,
                            options.model.validators,
                            options.model.getters,
                            options.model.setters,
                            options.model.dependencies
                        )
                    ;

                view = new options.viewClass(options.id)
                    .model(model)
                    // custom view event handlers
                    .events(options.handlers)
                    // custom view hotkeys/keyboard shortcuts
                    .shortcuts(options.shortcuts)
                    // custom view actions
                    .actions(options.actions)
                    // custom view global context (eg funcs and vars)
                    .context(options.context)
                    // custom view components
                    .components(options.components)
                    .attribute(options.attribute||'')
                    // init view
                    .livebind(options.livebind)
                    .autobind(options.autobind)
                    .autovalidate(options.autovalidate)
                    .bind(options.events, $dom[0])
                ;
                // custom view template renderer
                if (null != options.template) view.template(options.template);
                $dom.data('modelview', view);
                if (options.autoSync) view.sync();
            });

            // chainable or values return
            return !isInit && map.length ? (1 == this.length ? map[0] : map) : this;
        };
    }

    // add modelview as a jQueryUI widget as well if jQueryuI is loaded
    // to create state-full, self-contained, full-MVVM widgets (e.g calendars, grids, etc..)
    if ($.widget && (!$.mvvm || !$.mvvm.ModelViewWidget))
    {
        $.widget('mvvm.ModelViewWidget', {

            options: {},
            $view: null,

            _create: function() {
                var self = this;
                self.$view = self.element.modelview(self.options).modelview('view');
            },

            value: function(k, v) {
                var self = this;
                if (1 < arguments.length)
                {
                    self.$view.model().set(k, v, 1);
                    return self.element;
                }
                return self.$view.model().get(k);
            },

            view: function() {
                return this.$view;
            },

            model: function() {
                return this.$view.model();
            },

            _destroy: function() {
                var self = this.
                self.$view = null;
                self.element.modelview('dispose');
            }
        });
    }
};

// add to jQuery if available/accesible now
if ('undefined' !== typeof window.jQuery) ModelView.jquery(window.jQuery);
}(ModelView, this);

/* main code ends here */
/* export the module */
return ModelView;
});