
///////////////////////////////////////////////////////////////////////////////////////
//
// utilities
//
///////////////////////////////////////////////////////////////////////////////////////

var undef = undefined, bindF = function(f, scope) {return f.bind(scope);},
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
        else if (T_FILE === T  || ('undefined' !== typeof(File) && (v instanceof File)))     T = T_FILE;
        else if (T_BLOB === T  || ('undefined' !== typeof(Blob) && (v instanceof Blob)))     T = T_BLOB;
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
        return HASDOC ? [document.getElementById(id)] : [];
    },
    $tag = function(tagname, el) {
        return HASDOC ? slice.call((el || document).getElementsByTagName(tagname), 0) : [];
    },
    $class = function(classname, el) {
        return HASDOC ? slice.call((el || document).getElementsByClassName(classname), 0) : [];
    },
    $sel = function(selector, el, single) {
        el = el || document;
        return HASDOC && el.querySelector ? (true === single
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
        if (!HASDOC) return null;
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
        if (!HASDOC) return function(){return '';};
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
        var T = (e[TAG] || '').toUpperCase(), TT = (e[TYPE] || '').toLowerCase(),
            tAtts = t.attributes, eAtts = e.attributes, i, a, n, v, NS;

        // remove non-existent attributes
        for (i=eAtts.length-1; i>=0; i--)
        {
            a = eAtts[i]; n = a.name; NS = a.namespaceURI;
            if (NS)
            {
                n = a.localName || n;
                if (!t.hasAttributeNS(NS, n))
                    e.removeAttributeNS(NS, n);
            }
            else if (!t[HAS_ATTR](n))
            {
                if ('class' === n)
                {
                    e.className = '';
                }
                else if ('style' === n)
                {
                    e[n] = '';
                }
                else if ('selected' === n && 'OPTION' === T)
                {
                    e[n] = false;
                }
                else if (('disabled' === n || 'required' === n) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
                {
                    e[n] = false;
                }
                else if ('checked' === n && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
                {
                    e[n] = false;
                }
                else if ('value' === n && 'INPUT' === T)
                {
                    e[n] = '';
                }
                else
                {
                    e[DEL_ATTR](n);
                }
            }
        }
        if ('OPTION' === T)
        {
            e.selected = t.selected;
        }
        if ('INPUT' === T && ('checkbox' === TT || 'radio' === TT))
        {
            e.checked = t.checked;
        }
        if ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T)
        {
            e.disabled = t.disabled;
            e.required = t.required;
        }
        // add/update existent attributes
        for (i=tAtts.length-1; i>=0; i--)
        {
            a = tAtts[i]; n = a.name; v = a.value; NS = a.namespaceURI;
            if (NS)
            {
                n = a.localName || n;
                if (!e.hasAttributeNS(NS, n) || (e.getAttributeNS(NS, n) !== v))
                    e.setAttributeNS(NS, n, v);
            }
            else
            {
                if ('class' === n)
                {
                    e.className = v;
                }
                else if ('style' === n)
                {
                    morphStyles(e, t);
                }
                else if ('selected' === n && 'OPTION' === T)
                {
                    if (!e[n]) e[n] = true;
                }
                else if (('disabled' === n || 'required' === n) && ('SELECT' === T || 'INPUT' === T || 'TEXTAREA' === T))
                {
                    if (!e[n]) e[n] = true;
                }
                else if ('checked' === n && 'INPUT' === T && ('checkbox' === TT || 'radio' === TT))
                {
                    if (!e[n]) e[n] = true;
                }
                else if ('value' === n && 'INPUT' === T)
                {
                    if (e[n] !== v) e[n] = v;
                }
                else if (!e[HAS_ATTR](n) || (e[ATTR](n) !== v))
                {
                    e[SET_ATTR](n, v);
                }
            }
        }
    },
    morph = function morph(e, t, view) {
        // morph e DOM to match t DOM
        // take care of frozen elements
        var tc = t.childNodes.length, count = e.childNodes.length - tc,
            index, offset, tnode, enode, T1, T2,
            frozen = filter(e.childNodes, function(n) {return n[HAS_ATTR] && n[HAS_ATTR]('mv-frozen');});
        frozen.forEach(function(n) {e.removeChild(n);});
        for (offset=0,index=0; index<tc; index++)
        {
            tnode = t.childNodes[index-offset];
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
                    offset++;
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
                enode = e.childNodes[index];
                T2 = nodeType(tnode);
                T1 = nodeType(enode);

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
                    continue;
                }
                if (T2 !== T1 || ('input' === T1 && (tnode[TYPE]||'').toLowerCase() !== (enode[TYPE]||'').toLowerCase()))
                {
                    if (view)
                    {
                        // lifecycle hooks
                        (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                            view.$detachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                    e.replaceChild(tnode, enode);
                    offset++;
                    if (view)
                    {
                        // lifecycle hooks
                        (tnode[HAS_ATTR] && tnode[HAS_ATTR]('mv-component') ? [tnode] : []).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                            view.$attachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                }
                else if ('text' === T1 || 'comment' === T1)
                {
                    if (enode.nodeValue !== tnode.nodeValue)
                        enode.nodeValue = tnode.nodeValue;
                }
                else if ('script' === T1 || 'style' === T1)
                {
                    /*morphAtts(enode, tnode);
                    if (enode.textContent !== tnode.textContent)
                        enode.textContent = tnode.textContent;*/
                    e.replaceChild(tnode, enode);
                    offset++;
                }
                else if ('textarea' === T1)
                {
                    morphAtts(enode, tnode);
                    if (enode.value !== tnode.value)
                        enode.value = tnode.value;
                    if (enode.firstChild && (enode.firstChild.nodeValue !== tnode.value))
                        enode.firstChild.nodeValue = tnode.value;
                }
                else if ((0 !== count) && tnode[HAS_ATTR]('mv-key') && enode[HAS_ATTR]('mv-key') && (tnode[ATTR]('mv-key') !== enode[ATTR]('mv-key')))
                {
                    if (0 > count)
                    {
                        e.insertBefore(tnode, enode);
                        offset++;
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
                                offset++;
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
                            T1 = nodeType(enode);
                            if (T2 !== T1 || ('input' === T1 && (tnode[TYPE]||'').toLowerCase() !== (enode[TYPE]||'').toLowerCase()))
                            {
                                if (view)
                                {
                                    // lifecycle hooks
                                    (enode[HAS_ATTR] && enode[HAS_ATTR]('mv-component') ? [enode] : []).concat($sel('[mv-component]', enode)).forEach(function(el) {
                                        view.$detachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                                e.replaceChild(tnode, enode);
                                offset++;
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
                                    offset++;
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
                                    offset++;
                                }
                                else if (view && tnode[HAS_ATTR]('mv-component') && enode[HAS_ATTR]('mv-component') && tnode[ATTR]('mv-component') !== enode[ATTR]('mv-component'))
                                {
                                    // lifecycle hooks
                                    ([enode]).concat($sel('[mv-component]', enode)).forEach(function(el) {
                                        view.$detachComponent(el[ATTR]('mv-component'), el);
                                    });
                                    e.replaceChild(tnode, enode);
                                    offset++;
                                    ([tnode]).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                                        view.$attachComponent(el[ATTR]('mv-component'), el);
                                    });
                                }
                                else
                                {
                                    // morph attributes/properties
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
                        offset++;
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
                        offset++;
                    }
                    else if (view && tnode[HAS_ATTR]('mv-component') && enode[HAS_ATTR]('mv-component') && tnode[ATTR]('mv-component') !== enode[ATTR]('mv-component'))
                    {
                        // lifecycle hooks
                        ([enode]).concat($sel('[mv-component]', enode)).forEach(function(el) {
                            view.$detachComponent(el[ATTR]('mv-component'), el);
                        });
                        e.replaceChild(tnode, enode);
                        offset++;
                        ([tnode]).concat($sel('[mv-component]', tnode)).forEach(function(el) {
                            view.$attachComponent(el[ATTR]('mv-component'), el);
                        });
                    }
                    else
                    {
                        // morph attributes/properties
                        morphAtts(enode, tnode);
                        // morph children
                        morph(enode, tnode, view);
                    }
                }
            }
        }
        // If extra elements, remove them
        count = e.childNodes.length - tc;
        for (; 0<count; count--)
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
                    if (t.nodeValue !== v)
                        t.nodeValue = v;
                });
            }
        });
        Keys(map.att).forEach(function(k){
            if ((null == key) || (key === k) || startsWith(k, key+'.'))
            {
                //var v = Str(model.get(k));
                map.att[k].forEach(function(a){
                    var v = a.txt.map(function(s){return s.mvKey ? Str(model.get(s.mvKey)) : s;}).join('');
                    if (a.node[ATTR](a.att) !== v)
                        a.node[SET_ATTR](a.att, v);
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

