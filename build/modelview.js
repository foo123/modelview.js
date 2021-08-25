/**
*
*   ModelView.js
*   @version: 1.3.0
*   @built on 2021-08-25 20:09:49
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
*   @version: 1.3.0
*   @built on 2021-08-25 20:09:49
*
*   A simple, light-weight, versatile and fast MVVM framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/

"use strict";

/**[DOC_MARKDOWN]
### ModelView API

**Version 1.3.0**

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

var undef = undefined, bindF = function( f, scope ) { return f.bind(scope); },
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto],
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    //FPCall = FP.call, hasProp = bindF(FPCall, OP.hasOwnProperty),
    toString = OP.toString, HAS = OP.hasOwnProperty, slice = AP.slice,
    tostr = function(s){return Str(s);},
    newFunc = function(args, code){return new Func(args, code);},
    is_instance = function(o, T){return o instanceof T;},

    INF = Infinity, rnd = Math.random,

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
        if      (T_NUM === T   || v instanceof Number)   T = isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
        else if (T_STR === T   || v instanceof String)   T = 1 === v.length ? T_CHAR : T_STR;
        else if (T_ARRAY === T || v instanceof Array)    T = T_ARRAY;
        else if (T_REGEX === T || v instanceof RegExp)   T = T_REGEX;
        else if (T_DATE === T  || v instanceof Date)     T = T_DATE;
        else if (T_FILE === T  || v instanceof File)     T = T_FILE;
        else if (T_BLOB === T  || v instanceof Blob)     T = T_BLOB;
        else if (T_FUNC === T  || v instanceof Function) T = T_FUNC;
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

    ATTR = 'getAttribute', SET_ATTR = 'setAttribute', HAS_ATTR = 'hasAttribute', DEL_ATTR = 'removeAttribute',
    CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
    NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value',
    OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
    STYLE = 'style', CLASS = 'className', HTML = 'innerHTML', TEXT = 'innerText', TEXTC = 'textContent',

    // use native methods and abbreviation aliases if available
    fromJSON = JSON.parse, toJSON = JSON.stringify,

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    trim = SP.trim
            ? function(s){ return Str(s).trim(); }
            : function(s){ return Str(s).replace(/^\s+|\s+$/g, ''); },

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    startsWith = SP.startsWith
            ? function(str, pre, pos){ return Str(str).startsWith(pre, pos||0); }
            : function(str, pre, pos){ return pre === Str(str).slice(pos||0, pre.length); },

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now
    NOW = Date.now ? Date.now : function() {return new Date().getTime();},

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

    // http://stackoverflow.com/a/11762728/3591273
    node_index = function(node) {
        var index = 0;
        while ((node=node.previousSibling)) index++;
        return index;
    },

    node_closest_index = function(node, root) {
        var closest = node;
        if (root) while (closest[PARENT] && closest[PARENT] !== root) closest = closest[PARENT];
        return node_index(closest);
    },

    find_node = function(root, node_type, node_index) {
        var ndList = root.childNodes, len = ndList.length,
            n, node = null, i = 0, node_ith = 0;
        node_index = node_index || 1;
        // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
        // TEXT_NODE = 3, COMMENT_NODE = 8
        // return node.nodeValue
        while (i < len)
        {
            n = ndList[i++];
            if (node_type === n.nodeType)
            {
                node = n;
                if (++node_ith === node_index) break;
            }
        }
        return node;
    },

    // https://stackoverflow.com/questions/7048102/check-if-html-element-is-supported
    is_element_supported = function is_element_supported(tag) {
        // Return undefined if `HTMLUnknownElement` interface
        // doesn't exist
        if (!window.HTMLUnknownElement) return undefined;
        // Create a test element for the tag
        var element = document.createElement(tag);
        // Check for support of custom elements registered via
        // `document.registerElement`
        if (tag.indexOf('-') > -1)
        {
            // Registered elements have their own constructor, while unregistered
            // ones use the `HTMLElement` or `HTMLUnknownElement` (if invalid name)
            // constructor (http://stackoverflow.com/a/28210364/1070244)
            return (
                element.constructor !== window.HTMLUnknownElement &&
                element.constructor !== window.HTMLElement
            ) ? element : null;
        }
        // Obtain the element's internal [[Class]] property, if it doesn't
        // match the `HTMLUnknownElement` interface than it must be supported
        return OP.toString.call(element) !== '[object HTMLUnknownElement]' ? element : null;
    },

    // http://youmightnotneedjquery.com/
    $id = function(id) {
        return [document.getElementById(id)];
    },
    $tag = function(tagname, el) {
        return slice.call((el || document).getElementsByTagName(tagname), 0);
    },
    $class = function(classname, el) {
        return slice.call((el || document).getElementsByClassName(classname), 0);
    },
    $sel = function(selector, el, single) {
        el = el || document;
        return el.querySelector ? (true === single
            ? [el.querySelector(selector)]
            : slice.call(el.querySelectorAll(selector), 0))
            : []
        ;
    },

    get_dom_ref = function(el, ref) {
        // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
        return (/*ref &&*/ startsWith(ref, "$this::")) ? $sel(ref.slice(7), el/*, true*/) : $sel(ref, null/*, true*/);
    },

    remove_empty_spaces = function remove_empty_spaces(node) {
        if (1 < node.childNodes.length)
        {
            slice.call(node.childNodes).forEach(function(n) {
                if ((3 === n.nodeType) && !trim(n.nodeValue).length)
                {
                    node.removeChild(n);
                }
                else if (1 < n.childNodes.length)
                {
                    remove_empty_spaces(n);
                }
            });
        }
        return node;
    },

    // http://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
    str2dom = function(html, without_empty_spaces) {
        var el, frg, i, ret;
        if (el = is_element_supported('template'))
        {
            el.innerHTML = trim(html);
            ret = el.content;
        }
        else
        {
            el = document.createElement('div');
            frg = 'function' === typeof(document.createDocumentFragment) ? document.createDocumentFragment() : null;
            el.innerHTML = trim(html);
            if (!frg)
            {
                ret = el;
            }
            else
            {
                while (i=el.firstChild) frg.appendChild(i);
                ret = frg;
            }
        }
        return true === without_empty_spaces ? remove_empty_spaces(ret) : ret;
    },

    // http://stackoverflow.com/questions/1750815/get-the-string-representation-of-a-dom-node
    dom2str = (function() {
        var DIV = document.createElement("div");
        return 'outerHTML' in DIV
            ? function(node) {
                return trim(node.outerHTML);
            }
            : function(node) {
                var div = DIV.cloneNode();
                div.appendChild(node.cloneNode(true));
                return trim(div.innerHTML);
            }
        ;
    })(),

    // http://youmightnotneedjquery.com/
    MATCHES = (function(P) {
        if (!P || P.matches) return 'matches';
        else if (P.matchesSelector) return 'matchesSelector';
        else if (P.webkitMatchesSelector) return 'webkitMatchesSelector';
        else if (P.mozMatchesSelector) return 'mozMatchesSelector';
        else if (P.msMatchesSelector) return 'msMatchesSelector';
        else if (P.oMatchesSelector) return 'oMatchesSelector';
    }(this.Element ? this.Element[proto] : null)),

    // http://stackoverflow.com/a/2364000/3591273
    get_style = 'undefined' !== typeof window && window.getComputedStyle
        ? function(el){return window.getComputedStyle(el, null);}
        : function(el) {return el.currentStyle;},

    show = function(el) {
        if (!el._displayCached) el._displayCached = /*get_style(el).display*/el[STYLE].display || '';
        el[STYLE].display = 'none' !== el._displayCached ? el._displayCached : '';
        el._displayCached = undef;
    },

    hide = function(el) {
        if (!el._displayCached) el._displayCached = /*get_style(el).display*/el[STYLE].display || '';
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
            options = el[OPTIONS],
            opt, i, sel_index = -1
        ;

        for (i=0; i<options.length; i++ )
        {
            opt = options[ i ];
            opt[SELECTED] = -1 < values.indexOf( opt_val( opt ) );
        }
        if (!values.length) el[SELECTED_INDEX] = -1;
    },

    get_val = function(el) {
        if (!el) return;
        var value_alt = null;
        if (el[HAS_ATTR]('data-alt-value')) value_alt = el[ATTR]('data-alt-value');
        switch(el[TAG])
        {
            case 'INPUT': return 'file' === el.type.toLowerCase() ? ((!!value_alt) && (null!=el[value_alt]) && el[value_alt].length ?el[value_alt] : (el.files.length ? el.files : null)) : ((!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL]);
            case 'TEXTAREA':return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL];
            case 'SELECT': return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : select_get(el);
            default: return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : ((TEXTC in el) ? el[TEXTC] : el[TEXT]);
        }
    },

    set_val = function(el, v) {
        if (!el) return;
        var value_alt = null;
        if (el[HAS_ATTR]('data-alt-value')) value_alt = el[ATTR]('data-alt-value');
        switch(el[TAG])
        {
            case 'INPUT': if ('file' === el.type.toLowerCase( )) {} else { el[VAL] = Str(v); if (!!value_alt) el[value_alt] = null; } break;
            case 'TEXTAREA': el[VAL] = Str(v);  if (!!value_alt) el[value_alt] = null; break;
            case 'SELECT': select_set(el, v);  if (!!value_alt) el[value_alt] = null; break;
            default:
                if (TEXTC in el) el[TEXTC] = Str(v);
                else el[TEXT] = Str(v);
                 if (!!value_alt) el[value_alt] = null;
                break;
        }
    },

    is_child_of = function(el, node, finalNode) {
        var p = el;
        if (p)
        {
            if (node === p) return true;
            if (node.contains) return node.contains(p);
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

    debounce = function(callback, instance) {
        // If there's a pending render, cancel it
        if (instance && instance._dbnc) window.cancelAnimationFrame(instance._dbnc);
        // Setup the new render to run at the next animation frame
        if (instance) instance._dbnc = window.requestAnimationFrame(callback);
        else window.requestAnimationFrame(callback);
    },
    nodeType = function(node) {
        return node.nodeType === 3 ? 'text' : (node.nodeType === 8 ? 'comment' : (node[TAG]||'').toLowerCase());
    },
    morphStyles = function(e, t) {
        var tstyleMap = /*t.style*/trim(t.style.cssText).split(';').reduce(function(map, style) {
                style = Str(style);
                var col = style.indexOf(':');
                if (0 < col) map[trim(style.slice(0, col))] = trim(style.slice(col + 1));
                return map;
            }, {}),
            estyleMap = /*e.style*/trim(e.style.cssText).split(';').reduce(function(map, style) {
                style = Str(style);
                var col = style.indexOf(':');
                if (0 < col) map[trim(style.slice(0, col))] = trim(style.slice(col + 1));
                return map;
            }, {})
        ;

        Keys(estyleMap)
        .reduce(function(rem, s) {
            if (!HAS.call(tstyleMap, s)) rem.push(s);
            return rem;
        }, [])
        .forEach(function(s) {
            e.style[s] = '';
        });

        Keys(tstyleMap)
        .forEach(function(s){
            var st = tstyleMap[s];
            if (e.style[s] !== st)
                e.style[s] = st;
        });
    },
    morphAtts = function morphAtts(e, t) {
        var T = (e[TAG] || '').toUpperCase(), TT = (e[TYPE] || '').toLowerCase();
        if (t.hasAttributes())
        {
            var atts = AP.reduce.call(t.attributes, function(atts, a) {atts[a.name] = a.value; return atts;}, {}),
                atts2 = AP.reduce.call(e.attributes, function(atts, a) {atts[a.name] = a.value; return atts;}, {});

            Keys(atts2)
                .reduce(function(rem, a) {
                    if (!HAS.call(atts, a)) rem.push(a);
                    return rem;
                }, [])
                .concat('OPTION' === T && e.selected && !atts2['selected'] && !atts['selected'] ? ['selected'] : [])
                .concat(('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T) && e.disabled && !atts2['disabled'] && !atts['disabled'] ? ['disabled'] : [])
                .concat(('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T) && e.required && !atts2['required'] && !atts['required'] ? ['required'] : [])
                .concat('INPUT' === T && ('checkbox' === TT || 'radio' === TT) && e.checked && !atts2['checked'] && !atts['checked'] ? ['checked'] : [])
                .concat('INPUT' === T && !atts2['value'] && !atts['value'] ? ['value'] : [])
                .forEach(function(a) {
                    if ('class' === a)
                    {
                        e.className = '';
                    }
                    else if ('style' === a)
                    {
                        e[a] = '';
                    }
                    else if ('selected' === a && 'OPTION' === T)
                    {
                        if (e[a]) e[a] = false;
                    }
                    else if (('disabled' === a || 'required' === a) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
                    {
                        if (e[a]) e[a] = false;
                    }
                    else if ('checked' === a && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
                    {
                        if (e[a]) e[a] = false;
                    }
                    else if ('value' === a && 'INPUT' === T)
                    {
                        if (e[a] !== '') e[a] = '';
                    }
                    else
                    {
                        e[DEL_ATTR](a);
                    }
                })
            ;
            if (atts.type && atts.type !== TT)
            {
                TT = (atts.type || '').toLowerCase();
                e.type = TT;
            }
            Keys(atts).forEach(function(a) {
                    if ('type' === a) return;
                    var v = atts[a];
                    if ('class' === a)
                    {
                        e.className = v;
                    }
                    else if ('style' === a)
                    {
                        morphStyles(e, t);
                    }
                    else if ('selected' === a && 'OPTION' === T)
                    {
                        if (!e[a]) e[a] = true;
                    }
                    else if (('disabled' === a || 'required' === a) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
                    {
                        if (!e[a]) e[a] = true;
                    }
                    else if ('checked' === a && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
                    {
                        if (!e[a]) e[a] = true;
                    }
                    else if ('value' === a && 'INPUT' === T)
                    {
                        if (e[a] !== v) e[a] = v;
                    }
                    else
                    {
                        /*if (a in e)
                        {
                            if (v != e[a])
                            {
                                try {
                                    e[a] = v;
                                    if (e[a]) e[a] = true;
                                } catch (err) {}
                            }
                        }
                        else*/ if (!e[HAS_ATTR](a) || v !== e[ATTR](a))
                        {
                            e[SET_ATTR](a, v);
                        }
                    }
            });
        }
        else if (e.hasAttributes())
        {
            for (var a,atts2=e.attributes,i=0; i<atts2.length; i++)
            {
                a = atts2[i].name;
                if ('class' === a)
                {
                    e.className = '';
                }
                else if ('style' === a)
                {
                    e[a] = '';
                }
                else if ('selected' === a && 'OPTION' === T)
                {
                    e[a] = false;
                }
                else if (('disabled' === a || 'required' === a) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
                {
                    e[a] = false;
                }
                else if ('checked' === a && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
                {
                    e[a] = false;
                }
                else if ('value' === a && 'INPUT' === T)
                {
                    e[a] = '';
                }
                else
                {
                    e[DEL_ATTR](a);
                }
            }
            if ('OPTION' === T) e.selected = false;
            if ('INPUT' === T) e.value = '';
            if ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T) {e.disabled = false; e.required = false;}
            if ('INPUT' === T && ('checkbox' === TT || 'radio' === TT)) e.checked = false;
        }
    },
    morph = function morph(e, t, view) {
        // morph e DOM to match t DOM
        // take care of frozen elements
        var tc = t.childNodes.length, count = e.childNodes.length - tc,
            frozen = filter(e.childNodes, function(n) {return n[HAS_ATTR] && n[HAS_ATTR]('mv-frozen');});
        frozen.forEach(function(n) {e.removeChild(n);});
        slice.call(t.childNodes).forEach(function(tnode, index) {
            if (index >= e.childNodes.length)
            {
                if (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-frozen') && frozen.length)
                {
                    // use original frozen
                    e.appendChild(frozen.shift());
                }
                else
                {
                    e.appendChild(tnode);
                    if (view)
                    {
                        // lifecycle hooks
                        (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-component') ? [tnode] : []).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                            view.$attachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                }
            }
            else
            {
                var enode = e.childNodes[index], tt = nodeType(tnode), t = nodeType(enode), k, j, jj;

                if (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-frozen') && frozen.length)
                {
                    if (view)
                    {
                        // lifecycle hooks
                        (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                            view.$detachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                    // use original frozen
                    e.replaceChild(frozen.shift(), enode);
                    return;
                }
                if (tt !== t)
                {
                    if (view)
                    {
                        // lifecycle hooks
                        (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                            view.$detachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                    e.replaceChild(tnode, enode);
                    if (view)
                    {
                        // lifecycle hooks
                        (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-component') ? [tnode] : []).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                            view.$attachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                }
                else if ('text' === t || 'comment' === t)
                {
                    if (enode.textContent !== tnode.textContent)
                        enode.textContent = tnode.textContent;
                }
                else if ('textarea' === t)
                {
                    morphAtts(enode, tnode);
                    if (enode.value !== tnode.value)
                        enode.value = tnode.value;
                }
                else if ((0 !== count) && tnode[HAS_ATTR]('mv-key') && enode[HAS_ATTR]('mv-key') && (tnode[ATTR]('mv-key') !== enode[ATTR]('mv-key')))
                {
                    if (0 > count)
                    {
                        e.insertBefore(tnode, enode);
                        count++;
                        if (view)
                        {
                            // lifecycle hooks
                            (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-component') ? [tnode] : []).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                                view.$attachComponent(el[ATTR]('mv-component'), el);
                            });
                        }
                    }
                    else
                    {
                        while (0 < count)
                        {
                            if (view)
                            {
                                // lifecycle hooks
                                (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                                    view.$detachComponent(el[ATTR]('mv-component'), el);
                                });
                            }
                            e.removeChild(enode);
                            count--;
                            if (index >= e.childNodes.length) break;
                            enode = e.childNodes[index];
                            if (!enode[HAS_ATTR] || !enode[HAS_ATTR]('mv-key') || (tnode[ATTR]('mv-key') === enode[ATTR]('mv-key'))) break;
                        }
                        if (index >= e.childNodes.length)
                        {
                            if (tnode[HAS_ATTR]('mv-frozen') && frozen.length)
                            {
                                // use original frozen
                                e.appendChild(frozen.shift());
                            }
                            else
                            {
                                e.appendChild(tnode);
                                if (view)
                                {
                                    // lifecycle hooks
                                    (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-component') ? [tnode] : []).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                                        view.$attachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                            }
                        }
                        else
                        {
                            t = nodeType(enode);
                            if (tt !== t)
                            {
                                if (view)
                                {
                                    // lifecycle hooks
                                    (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                                        view.$detachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                                e.replaceChild(tnode, enode);
                                if (view)
                                {
                                    // lifecycle hooks
                                    (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-component') ? [tnode] : []).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                                        view.$attachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                            }
                            else
                            {
                                if (view && tnode[HAS_ATTR]('mv-component') && !enode[HAS_ATTR]('mv-component'))
                                {
                                    e.replaceChild(tnode, enode);
                                    // lifecycle hooks
                                    ([tnode]).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                                        view.$attachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                                else if (view && !tnode[HAS_ATTR]('mv-component') && enode[HAS_ATTR]('mv-component'))
                                {
                                    // lifecycle hooks
                                    ([enode]).concat($sel('[mv-component]', enode)).forEach(function(el) {
                                        view.$detachComponent(el[ATTR]('mv-component'), el);
                                    });
                                    e.replaceChild(tnode, enode);
                                }
                                else if (view && tnode[HAS_ATTR]('mv-component') && enode[HAS_ATTR]('mv-component') && tnode[ATTR]('mv-component') !== enode[ATTR]('mv-component'))
                                {
                                    // lifecycle hooks
                                    ([enode]).concat($sel('[mv-component]', enode)).forEach(function(el) {
                                        view.$detachComponent(el[ATTR]('mv-component'), el);
                                    });
                                    e.replaceChild(tnode, enode);
                                    ([tnode]).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                                        view.$attachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                                else
                                {
                                    // moprh attributes/properties
                                    morphAtts(enode, tnode);
                                    // morph children
                                    morph(enode, tnode, view);
                                }
                            }
                        }
                    }
                }
                else
                {
                    if (view && tnode[HAS_ATTR]('mv-component') && !enode[HAS_ATTR]('mv-component'))
                    {
                        e.replaceChild(tnode, enode);
                        // lifecycle hooks
                        ([tnode]).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                            view.$attachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                    else if (view && !tnode[HAS_ATTR]('mv-component') && enode[HAS_ATTR]('mv-component'))
                    {
                        // lifecycle hooks
                        ([enode]).concat($sel('[mv-component]', enode)).forEach(function(el) {
                            view.$detachComponent(el[ATTR]('mv-component'), el);
                        });
                        e.replaceChild(tnode, enode);
                    }
                    else if (view && tnode[HAS_ATTR]('mv-component') && enode[HAS_ATTR]('mv-component') && tnode[ATTR]('mv-component') !== enode[ATTR]('mv-component'))
                    {
                        // lifecycle hooks
                        ([enode]).concat($sel('[mv-component]', enode)).forEach(function(el) {
                            view.$detachComponent(el[ATTR]('mv-component'), el);
                        });
                        e.replaceChild(tnode, enode);
                        ([tnode]).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                            view.$attachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                    else
                    {
                        // moprh attributes/properties
                        morphAtts(enode, tnode);
                        // morph children
                        morph(enode, tnode, view);
                    }
                }
            }
        });
        // If extra elements, remove them
        count = e.childNodes.length - tc;
        for (; 0 < count; count--)
        {
            var enode = e.childNodes[e.childNodes.length - count];
            if (view)
            {
                // lifecycle hooks
                (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                    view.$detachComponent(el[ATTR]('mv-component'), el);
                });
            }
            e.removeChild(enode);
        }
    },

    placeholder_re = /\{%=([^%]+)%\}/,
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
                        if (!HAS.call(map.txt, k)) map.txt[k] = [];
                        map.txt[k].push(t);
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
                            if (!HAS.call(map.att, k)) map.att[k] = [];
                            map.att[k].push(t);
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
                                    if (!HAS.call(map.txt, k)) map.txt[k] = [];
                                    map.txt[k].push(t);
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
    morphText = function morphText(map, model, key) {
        if (!map) return;
        Keys(map.txt).forEach(function(k){
            if ((null == key) || (key === k) || startsWith(k, key+'.'))
            {
                var v = Str(model.get(k));
                map.txt[k].forEach(function(t){
                    t.nodeValue = v;
                });
            }
        });
        Keys(map.att).forEach(function(k){
            if ((null == key) || (key === k) || startsWith(k, key+'.'))
            {
                //var v = Str(model.get(k));
                map.att[k].forEach(function(a){
                    a.node[SET_ATTR](a.att, a.txt.map(function(s){return s.mvKey ? Str(model.get(s.mvKey)) : s;}).join(''));
                });
            }
        });
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

    // UUID counter for ModelViews
    _uuid = 0,

    // get a Universal Unique Identifier (UUID)
    uuid =  function(namespace) {
        return [namespace||'UUID', ++_uuid, NOW()].join('_');
    }
;


//
// DOM Events polyfils and delegation

// adapted from https://github.com/jonathantneal/EventListener
if (!HTMLElement.prototype.addEventListener) !function(){

    function addToPrototype(name, method)
    {
        Window.prototype[name] = HTMLDocument.prototype[name] = HTMLElement.prototype[name] = Element.prototype[name] = method;
    }

    // add
    addToPrototype("addEventListener", function (type, listener) {
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
    addToPrototype("removeEventListener", function (type, listener) {
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
function captureForType(eventType){ return -1 < captureEvts.indexOf( eventType ); }
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
        element.fireEvent("on" + evt.eventType, evt);
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
    if ( !arguments.length ) return 0;
    var T = get_type( o );

    if (T_OBJ === T) return Keys( o ).length;
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
    ,$view: null
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
        model.disposePubSub( ).$view = null;
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

    ,view: function(v) {
        var model = this;
        if (arguments.length)
        {
            model.$view = v;
            return model;
        }
        return model.$view;
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

        iterate(function(i) {
            var el, do_action, name, key;
            el = elements[i]; if (!el) return;
            do_action = el[ATTR]('mv-on-'+event);
            if (!do_action) return;

            do_action = 'do_' + do_action;
            if (!is_type(view[do_action], T_FUNC)) return;

            view[do_action](evt, el);
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

    getFuncsScoped = function(view, viewvar) {
        var code = '';
        viewvar = viewvar || 'view';
        for (var k in view.$funcs)
        {
            if (HAS.call(view.$funcs,k))
                code += 'var '+k+'='+viewvar+'.$funcs["'+k+'"];'
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
    view.$funcs = {};
    view.initPubSub();
};
// STATIC
View.node = find_node;
View.index = node_index;
View.indexClosest = node_closest_index;
View.getDomRef = get_dom_ref;
View.serialize = serialize_fields;
View.parse = function(str, args, scoped, textOnly) {
    // supports 2 types of template separators 1. {% %} and 2. <script> </script>
    // both can be used simultaneously
    var tpl = Str(str), p1, p2, ps1, code = 'var view = this, _$$_ = \'\';', echo = 0;
    if (scoped && scoped.length) code += "\n" + String(scoped);
    if (true === textOnly)
    {
        args = 'MODEL';
        code += "\n MODEL = MODEL || function(key){return '{%='+String(key)+'%}';};";
        while (tpl && tpl.length)
        {
            p1 = tpl.indexOf('{%=');
            if (-1 === p1)
            {
                code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                break;
            }
            p2 = tpl.indexOf('%}', p1+3);
            if (-1 === p2)
            {
                code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                break;
            }
            code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
            code += "\n"+'_$$_ += String(MODEL(\''+trim(tpl.slice(p1+3, p2))+'\'));';
            tpl = tpl.slice(p2+2);
        }
    }
    else
    {
        while (tpl && tpl.length)
        {
            p1 = tpl.indexOf('<script>');
            ps1 = tpl.indexOf('{%');
            if (-1 === p1 && -1 === ps1)
            {
                code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                break;
            }
            else if (-1 !== ps1 && (-1 === p1 || ps1 < p1))
            {
                echo = '=' === tpl.charAt(ps1+2) ? 1 : 0;
                p2 = tpl.indexOf('%}', ps1+2+echo);
                if (-1 === p2)
                {
                    if (-1 === p1)
                    {
                        code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                        break;
                    }
                    else
                    {
                        code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                        tpl = tpl.slice(p1);
                        continue;
                    }
                }
                code += "\n"+'_$$_ += \''+tpl.slice(0, ps1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                if (echo)
                {
                    code += "\n"+'_$$_ += String('+trim(tpl.slice(ps1+3, p2))+');';
                }
                else
                {
                    code += "\n"+trim(tpl.slice(ps1+2, p2));
                }
                tpl = tpl.slice(p2+2);
            }
            else
            {
                echo = '=' === tpl.charAt(p1+8) ? 1 : 0;
                p2 = tpl.indexOf('</script>', p1+8+echo);
                if (-1 === p2)
                {
                    code += "\n"+'_$$_ += \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                    break;
                }

                code += "\n"+'_$$_ += \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\';';
                if (echo)
                {
                    code += "\n"+'_$$_ += String('+trim(tpl.slice(p1+9, p2))+');';
                }
                else
                {
                    code += "\n"+trim(tpl.slice(p1+8, p2));
                }
                tpl = tpl.slice(p2+9);
            }
        }
    }
    code += "\n"+'return _$$_;';
    return newFunc(Str(args||''), code);
};
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
    ,$funcs: null
    ,_dbnc: null

/**[DOC_MARKDOWN]
// dispose view (and model)
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
        view.$funcs = null;
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
            view.$model = model.view(view);
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
            view.$tpl = trim(Str(html));
            view.$out = null;
            return view;
        }
        return view.$tpl;
    }

/**[DOC_MARKDOWN]
// add custom view event handlers for model/view/dom/document in {"target:eventName": handler} format
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
// add custom view named components which render output in {componentName: componentInstance} format
view.components( Object components );

[/DOC_MARKDOWN]**/
    ,components: function(components) {
        var view = this, k;
        if (is_type(components, T_OBJ))
        {
            for (k in components)
                if (HAS.call(components,k) && is_instance(components[k], View.Component))
                    view.$components[k] = {c:components[k], o:null};
        }
        return view;
    }

/**[DOC_MARKDOWN]
// register custom view functions (which can be used in templates) in {funcName: function} format
view.funcs( Object funcs );

[/DOC_MARKDOWN]**/
    ,funcs: function(funcs) {
        var view = this, k;
        if (is_type(funcs, T_OBJ))
        {
            for (k in funcs)
                if (HAS.call(funcs,k) && ('function' === typeof(funcs[k])))
                    view.$funcs[k] = funcs[k];
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render a custom view named component
view.component( String componentName, Object props );

[/DOC_MARKDOWN]**/
    ,component: function(name, props) {
        var view = this, c;
        if (HAS.call(view.$components,name))
        {
            c = view.$components[name];
            if (!c.o && c.c.tpl) c.o = View.parse(c.c.tpl, 'props,component', getFuncsScoped(view, 'this'));
            return c.o ? c.o.call(view, props || {}, c.c) : '';
        }
        return '';
    }

    // can integrate with HtmlWidget
    ,widget: function(/*args*/) {
        var HtmlWidget = View.HtmlWidget;
        return HtmlWidget && ("function" === typeof(HtmlWidget.widget)) ? HtmlWidget.widget.apply(HtmlWidget, arguments) : '';
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
// bind view to dom listening given events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom, renderdom) {
        var view = this, model = view.$model,
            method, evt, namespaced, autobindSelector, bindSelector,
            autobind = view.$autobind, livebind = view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;

        view.$dom = dom || (hasDocument ? document.body : null);
        view.$renderdom = renderdom || view.$dom;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};

        // default view/dom binding events
        events = events || ['change', 'click'];
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '[mv-evt]';

        if (hasDocument && view.on_view_change && events.length)
        {
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent(view.$dom).on(
                map(events, namespaced).join(' '),

                autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,

                function(evt) {
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when bind on original button
                    // add "bubble" option in modelview bind params
                    var el = this, isAutoBind = false, isBind = false;
                    // view/dom change events
                    isBind = el[MATCHES]('[mv-evt]') && el[ATTR]('mv-on-'+evt.type);
                    // view change autobind events
                    isAutoBind = autobind && "change" == evt.type && el[MATCHES](autobindSelector);
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

            if (startsWith(method, 'on_model_'))
            {
                evt = method.slice(9);
                evt.length && view.onTo(model, evt, bindF(view[method], view));
            }
            else if (hasDocument)
            {
                if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && DOMEvent(document.body).on(
                        namespaced(evt),
                        viewHandler(view, method)
                    );
                }
                else if (startsWith(method, 'on_view_') && 'on_view_change' !== method)
                {
                    evt = method.slice(8);
                    evt.length && DOMEvent(view.$dom).on(
                        namespaced(evt),
                        autobind ? [autobindSelector, bindSelector].join(',') : bindSelector,
                        viewHandler(view, method),
                        true
                    );
                }
                else if (startsWith(method, 'on_dom_'))
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
// unbind view from dom listening to events or all events (if no events given)
view.unbind( [Array events=null, DOMNode dom=view.$dom] );

[/DOC_MARKDOWN]**/
    ,unbind: function() {
        var view = this, model = view.$model,
            autobindSelector, bindSelector,
            namespaced, viewEvent = NSEvent('', view.namespace),
            autobind = view.$autobind, livebind = !!view.$livebind,
            hasDocument = 'undefined' !== typeof document
        ;

        namespaced = function(evt) {return NSEvent(evt, view.namespace);};
        autobindSelector = 'input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]';
        bindSelector = '[mv-evt]';

        // view/dom change events
        if (hasDocument && view.$dom && view.on_view_change)
        {
            DOMEvent(view.$dom).off(
                viewEvent,
                autobind ? [autobindSelector, bindSelector].join( ',' ) : bindSelector
            );
        }

        // model events
        if (model) view.offFrom(model);
        if (hasDocument && view.$dom)
        {
            DOMEvent(view.$dom).off(viewEvent);
            DOMEvent(document.body).off(viewEvent);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render view on actual DOM (immediately or deferred)
// .render is called internally by view auto-update methods
view.render( [Boolean immediate=false] );

[/DOC_MARKDOWN]**/
    ,render: function(immediate) {
        var self = this, out;
        if (!self.$out && self.$tpl) self.$out = View.parse(self.$tpl, '', getFuncsScoped(self, 'this'), 'text'===self.$livebind);
        if ('text' === self.$livebind)
        {
            if (!self.$renderdom)
            {
                out = self.$out.call(self, function(key){return Str(self.model().get(key));}); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            else
            {
                if (!self.$map)
                {
                    if (self.$out) self.$renderdom.innerHTML = self.$out.call(self, function(key){return '{%=' + Str(key) + '%}';});
                    self.add(self.$renderdom);
                }
                if (true === immediate)
                {
                    morphText(self.$map, self.model());
                    // notify any 3rd-party also if needed
                    self.publish('render', {});
                }
                else
                {
                    debounce(function() {
                        morphText(self.$map, self.model());
                        // notify any 3rd-party also if needed
                        self.publish('render', {});
                    }, self);
                }
            }
        }
        else if (self.$out)
        {
            if (!self.$renderdom)
            {
                out = self.$out.call(self); // return the rendered string
                // notify any 3rd-party also if needed
                self.publish('render', {});
                return out;
            }
            else if (true === immediate)
            {
                morph(self.$renderdom, str2dom(self.$out.call(self), true), Keys(self.$components||{}).filter(function(comp){return self.$components[comp].c.opts.attach || self.$components[comp].c.opts.detach;}).length ? self : null);
                // notify any 3rd-party also if needed
                self.publish('render', {});
            }
            else
            {
                debounce(function() {
                    morph(self.$renderdom, str2dom(self.$out.call(self), true), Keys(self.$components||{}).filter(function(comp){return self.$components[comp].c.opts.attach || self.$components[comp].c.opts.detach;}).length ? self : null);
                    // notify any 3rd-party also if needed
                    self.publish('render', {});
                }, self);
            }
        }
        return self;
    }

    ,add: function(node) {
        var view = this;
        if (node)
        {
            if (!view.$map) view.$map = {att:{}, txt:{}};
            get_placeholders(node, view.$map);
        }
        return node;
    }

    ,remove: function(node) {
        var map = this.$map;
        if (node && map)
        {
            Keys(map.att).forEach(function(k){
                var rem = [];
                map.att[k].forEach(function(a, i){if (is_child_of(a.node, node)) rem.push(i);});
                rem.reverse().forEach(function(i){map.att[k].splice(i, 1);});
                if (!map.att[k].length) delete map.att[k];
            });
            Keys(map.txt).forEach(function(k){
                var rem = [];
                map.txt[k].forEach(function(t, i){if (is_child_of(t, node)) rem.push(i);});
                rem.reverse().forEach(function(i){map.txt[k].splice(i, 1);});
                if (!map.txt[k].length) delete map.txt[k];
            });
        }
        return node;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, hasDocument = 'undefined' !== typeof document, els;

        if (hasDocument && view.$dom)
        {
            view.render(true);
            if (view.$autobind && (!view.$livebind || 'text'===view.$livebind || view.$dom!==view.$renderdom))
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
            autobind = view.$autobind,
            autobinds, hasDocument = 'undefined' !== typeof document
        ;

        if (hasDocument && view.$dom && autobind)
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

        // adapted from shortcuts.js, http://www.openjs.com/scripts/events/keyboard_shortcuts/
        //
        input_type = 'TEXTAREA' === el.tagName ? 'text' : ('INPUT' === el.tagName ? el[TYPE].toLowerCase( ) : '');
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
        var view = this, model = view.$model, key = model.id + bracketed(data.key),
            autobind = view.$autobind, livebind = view.$livebind,
            autobindSelector = 'input[name="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]',
            bindSelector = '[mv-evt]', bindElements, autoBindElements,
            hasDocument = 'undefined' !== typeof document,
            notTriggerElem
        ;

        if (hasDocument)
        {
            //bindElements = $sel(bindSelector, view.$dom);
            if (autobind) autoBindElements = $sel(autobindSelector, view.$dom);

            // bypass element that triggered the "model:change" event
            if (data.$callData && data.$callData.$trigger)
            {
                notTriggerElem = function(ele) {return ele !== data.$callData.$trigger;};
                //bindElements = filter(bindElements, notTriggerElem);
                if (autobind) autoBindElements = filter(autoBindElements, notTriggerElem);
                data.$callData = null;
            }
        }

        // do actions ..

        // do view action first
        //if (hasDocument && bindElements.length) do_bind_action(view, evt, bindElements, data);
        // do view autobind action to bind input elements that map to the model, afterwards
        if (hasDocument && autobind && autoBindElements.length && (!livebind || 'text'===livebind || view.$dom!==view.$renderdom))
        {
            //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
            do_auto_bind_action(view, evt, autoBindElements, data);
        }
        // do view live DOM update action
        if (livebind) view.render();
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model, key = model.id + bracketed(data.key),
            autobind = view.$autobind, livebind = view.$livebind,
            autobindSelector = 'input[name="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]',
            bindSelector = '[mv-evt]',
            hasDocument = 'undefined' !== typeof document,
            bindElements, autoBindElements
        ;

        // do actions ..

        // do view bind action first
        //if (hasDocument && (bindElements=$sel(bindSelector, view.$dom)).length) do_bind_action(view, evt, bindElements, data);
        // do view autobind action to bind input elements that map to the model, afterwards
        if (hasDocument && autobind && (!livebind || 'text'===livebind || view.$dom!==view.$renderdom))
        {
            autoBindElements = $sel(autobindSelector, view.$dom);
            //if (livebind) autoBindElements = autoBindElements.filter(function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
            do_auto_bind_action(view, evt, autoBindElements, data);
        }
        // do view live DOM bindings update action
        if (livebind) view.render();
    }

    // component lifecycle hooks
    ,$attachComponent: function(name, el) {
        var view = this;
        if (name && view.$components && HAS.call(view.$components,name)) view.$components[name].c.onAttach(el, view);
        return view;
    }
    ,$detachComponent: function(name, el) {
        var view = this;
        if (name && view.$components && HAS.call(view.$components,name)) view.$components[name].c.onDetach(el, view);
        return view;
    }

    //
    // view "do_action" methods
    //

    // NOP action
    ,do_nop: null

    // show/hide element(s) according to binding
    ,do_show: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-model') || data.key,
            modelkey, domref, enabled;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        modelkey = model.get(key);
        // show if data[key] is value, else hide
        // show if data[key] is true, else hide
        enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
        each(el, function(el){
            if (!el) return;
            if (enabled) show(el);
            else hide(el);
        });
    }

    // hide/show element(s) according to binding
    ,do_hide: function(evt, el, data) {
        var view = this, model = view.$model, key = el[ATTR]('mv-model') || data.key,
            modelkey, domref, enabled;

        if (!key) return;
        if (!!(domref=el[ATTR]('mv-domref'))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        modelkey = model.get(key);
        // hide if data[key] is value, else show
        // hide if data[key] is true, else show
        enabled = HAS.call(data,'value') ? data.value === modelkey : !!modelkey;
        each(el, function(el){
            if (!el) return;
            if (enabled) hide(el);
            else show(el);
        });
    }

    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function(evt, el, data) {
        var view = this, model = view.$model,
            name = data.name, key = data.key,
            input_type = el[TYPE].toLowerCase(),
            value, value_type, checkboxes, is_dynamic_array
        ;

        if (true===view.$livebind && (view.$dom===view.$renderdom || is_child_of(el, view.$renderdom, view.$dom))) return; // should be updated via new live render

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
                el[CHECKED] = true;
            }
        }

        else if ('checkbox' === input_type)
        {
            is_dynamic_array = empty_brackets_re.test(name);

            if (is_dynamic_array)
            {
                value = T_ARRAY === value_type ? value : [value];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
            }
            else if (/*checkboxes.length > 1 &&*/ (T_ARRAY === value_type))
            {
                el[CHECKED] = contains_non_strict(value, el[VAL]);
            }

            else
            {
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
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
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
#### View.Component

```javascript

var MyComponent = new ModelView.View.Component(String html [, Object options={attach:function(element, view), detach:function(element, view)}]);
MyComponent.render(Object props={} [, View view=null]); // render
MyComponent.dispose(); // dispose

```
[/DOC_MARKDOWN]**/
View.Component = function Component(tpl, opts) {
  var self = this;
  if (!(self instanceof Component)) return new Component(tpl, opts);
  self.tpl = trim(Str(tpl));
  self.opts = opts || {};
};
View.Component[proto] = {
    constructor: View.Component
    ,tpl: ''
    ,opts: null
    ,model: null
    ,renderer: null
    ,dispose: function() {
        var self = this;
        self.tpl = null;
        self.opts = null;
        self.renderer = null;
        return self;
    }
    ,render: function(props, view) {
        var self = this;
        if (!self.renderer && self.tpl) self.renderer = View.parse(self.tpl, 'props,component', getFuncsScoped(view, 'this'));
        return self.renderer ? self.renderer.call(view || self, props || {}, self) : '';
    }
    // component lifecycle hooks
    ,onAttach: function(el, view) {
        var self = this;
        if (self.opts && is_type(self.opts.attach, T_FUNC)) self.opts.attach.call(self, el, view);
        return self;
    }
    ,onDetach: function(el, view) {
        var self = this;
        if (self.opts && is_type(self.opts.detach, T_FUNC)) self.opts.detach.call(self, el, view);
        return self;
    }
};
// can integrate with HtmlWidget by setting the lib via this static property
View.HtmlWidget = null;
/**[DOC_MARKDOWN]
#### Examples 

[See it](https://foo123.github.io/examples/modelview/)


**markup**

```html
<template id="content">
    <b>Hello {%= this.model().get('msg') %}</b> &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value="{%= this.model().get('msg') %}" />
    <button class="button" title="{%= this.model().get('msg') %}" mv-evt mv-on-click="alert">Hello</button>
    <button class="button" mv-evt mv-on-click="hello_world">Hello World</button>
</template>
<div id="app"></div>
```

**javascript** (*standalone*)
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
[/DOC_MARKDOWN]**/

// main
// export it
var ModelView = {

    VERSION: "1.3.0"
    
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
*   @version: 1.3.0
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
                        ,actions: { }
                        ,funcs: { }
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
                    // custom view template renderer
                    .template(options.template)
                    // custom view event handlers
                    .events(options.handlers)
                    // custom view hotkeys/keyboard shortcuts
                    .shortcuts(options.shortcuts)
                    // custom view actions
                    .actions(options.actions)
                    // custom view functions
                    .funcs(options.funcs)
                    // custom view components
                    .components(options.components)
                    // init view
                    .livebind(options.livebind)
                    .autobind(options.autobind)
                    .autovalidate(options.autovalidate)
                    .bind(options.events, $dom[0])
                ;
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