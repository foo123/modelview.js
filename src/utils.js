
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
    trim_re = /^\s+|\s+$/g,
    trim = SP.trim
            ? function(s) {return Str(s).trim();}
            : function(s) {return Str(s).replace(trim_re, '');},

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

    /*insert_after = function(node, refNode, parentNode) {
        parentNode = parentNode || refNode.parentNode;
        if (refNode && parentNode)
        {
            if (refNode.nextSibling) parentNode.insertBefore(node, refNode.nextSibling);
            else parentNode.appendChild(node);
        }
    },*/

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

    tpl2code = function tpl2code(view, tpl, args, scoped, type, opts, rootNodeType) {
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
            code += "\nreturn " + to_code(parse(view, tpl, opts, rootNodeType || '', true)) + ";";
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
        self.cnodeType = nodeType || '';
        self.nodeValue = nodeValue || '';
        self.nodeValue2 = nodeValue2 || '';
        self.parentNode = parentNode || null;
        self.index = index || 0;
        self.component = null;
        self.id = null;
        self.type = null;
        self.attributes = [];
        self.atts = null;//{};
        self.childNodes = [];
        self.componentNodes = 0;
        self.modified = null;
        self.diff = null;
        self.changed = null;
        self.unit = false;
    },
    initVNode = function(nodeType, nodeValue, nodeValue2, parentNode, index) {
        return new VNode(nodeType, nodeValue, nodeValue2, parentNode, index);
    },
    VCode = function VCode(code) {
        var self = this;
        if (!(self instanceof VCode)) return new VCode(code);
        self.code = code;
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
    parse = function(view, str, opts, rootNode, withJsCode) {
        return getRoot(finState(html2ast(view, trim(str), initState(opts, rootNode || ''), true === withJsCode)));
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
    jsx2code = function jsx2code(view, tpl, opts) {
        var i = 0, l = tpl.length, out = '', jsx = '', j = 0, k, injsx = false, instr = false, esc = false, q = '', c = '';
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
                    jsx = trim(jsx);
                    if (jsx.length) out += to_code(parse(view, jsx, opts, 'jsx', true));
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
            else if (!instr && ('/' === c) && ('*' === tpl.charAt(i)))
            {
                k = tpl.indexOf('*/', i+1);
                if (-1 === k)
                {
                    throw err('Invalid comment at "'+tpl+'"');
                }
                else
                {
                    i = k+2;
                }
            }
            else
            {
                if (injsx) jsx += c;
                else out += c;
            }
            if (instr) esc = false;
        }
        if (jsx.length || (0 !== j)) throw err('Malformed HTML/JSX at "'+tpl+'"');
        return trim(out);
    },
    html2ast = function html2ast(view, html, state, jscode) {
        var c = '', l = html.length, i = 0, j, t, instr, esc, att, component;
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
                    if ('type' === att.name) state.dom.type = att.value instanceof VCode ? 'String('+att.value.code+')' : toJSON(att.value);
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
                                                state.val = trim(state.val);
                                                if (state.val.length)
                                                {
                                                    att.value = new VCode(state.val);
                                                    if (state.opts.id === att.name) state.dom.id = 'String('+att.value.code+')';
                                                    if ('type' === att.name) state.dom.type = 'String('+att.value.code+')';
                                                }
                                                else
                                                {
                                                    state.dom.attributes.pop();
                                                }
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
                    if ('/' === html.charAt(i-1) || (HAS.call(autoclosedTags, state.dom.cnodeType)))
                    {
                        // closed
                        if ((true === jscode) && view.hasComponent(state.dom.nodeType.slice(1,-1)))
                        {
                            // capital 1st letter signifies custom component
                            component = state.dom;
                            state.dom = component.parentNode;
                            component.parentNode = null;
                            state.dom.childNodes[state.dom.childNodes.length-1] = new VCode('view.component("'+component.nodeType.slice(1,-1)+'",'+(attr(component, 'id') instanceof VCode ? attr(component, 'id').code : toJSON(attr(component, 'id')))+','+(attr(component, 'props') instanceof VCode ? attr(component, 'props').code : toJSON(attr(component, 'props')))+',[])');
                            component = null;
                        }
                        else
                        {
                            state.dom = state.dom.parentNode;
                        }
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
                if ('<script>' === state.dom.cnodeType)
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
                if ('<style>' === state.dom.cnodeType)
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
                if ('<textarea>' === state.dom.cnodeType)
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
                state.tag = '<'+state.tag+'>';
                if (state.closetag)
                {
                    while (i<l && '>' !== html.charAt(i)) i++;
                    if ('>' === html.charAt(i)) i++;

                    if (!HAS.call(autoclosedTags, state.tag.toLowerCase()))
                    {
                        if (state.dom.cnodeType !== state.tag.toLowerCase())
                        {
                            throw err('Close tag doesn\'t match open tag '+state.tag+','+state.dom.nodeType+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                        }
                        else
                        {
                            state.intag = false;
                            if ((true === jscode) && view.hasComponent(state.dom.nodeType.slice(1,-1)))
                            {
                                // capital 1st letter signifies custom component
                                component = state.dom;
                                state.dom = component.parentNode;
                                component.parentNode = null;
                                state.dom.childNodes[state.dom.childNodes.length-1] = new VCode('view.component("'+component.nodeType.slice(1,-1)+'",'+(attr(component, 'id') instanceof VCode ? attr(component, 'id').code : toJSON(attr(component, 'id')))+','+(attr(component, 'props') instanceof VCode ? attr(component, 'props').code : toJSON(attr(component, 'props')))+','+(component.childNodes.length ? to_code(component)+'.childNodes' : '[]')+')');
                                component = null;
                            }
                            else
                            {
                                state.dom = state.dom.parentNode;
                            }
                        }
                    }
                    else
                    {
                        throw err('Closing self-closing tag '+state.tag+' around .. '+html.slice(stdMath.max(0, i-50),i+50)+' ..');
                    }
                }
                else //if (!HAS.call(autoclosedTags, state.tag.toLowerCase()))
                {
                    state.dom.childNodes.push(initVNode(state.tag, '', '', state.dom, state.dom.childNodes.length));
                    state.dom = state.dom.childNodes[state.dom.childNodes.length-1];
                    state.dom.cnodeType = state.dom.nodeType.toLowerCase();
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
                                state.txt = jsx2code(view, state.txt, state.opts);
                                if (state.txt.length)
                                {
                                    state.dom.childNodes.push(new VCode(state.txt));
                                }
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
    htmlNode = function(nodeType, id, type, atts, children, value2, modified) {
        var node = initVNode(nodeType, '', '', null, 0), index = 0;
        node.id = id || null;
        node.type = type || null;
        node.attributes = atts || [];
        if (modified && modified.atts && modified.atts.length)
        {
            if (!node.modified) node.modified = {atts:[], nodes:[]};
            node.modified.atts = modified.atts;
        }
        if ('text' === nodeType || 'comment' === nodeType)
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
                    return childNodes.concat(n.childNodes/*.reduce(process, [])*/.map(function(nn, i){
                        nn.parentNode = node;
                        nn.index = index++;
                        nn.changed = n.changed;
                        nn.component = nn.component || n.component;
                        nn.unit = nn.unit || n.unit;
                        return nn;
                    }));
                }
                else if (('dynamic' === n.nodeType) || ('jsx' === n.nodeType))
                {
                    var i = index, a = n.childNodes/*.reduce(process, [])*/.map(function(nn){
                        nn.parentNode = node;
                        nn.index = index++;
                        nn.unit = nn.unit || n.unit;
                        return nn;
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
                    return childNodes.concat(n.childNodes/*.reduce(process, [])*/.map(function(nn){
                        nn.parentNode = node;
                        nn.index = index++;
                        nn.unit = nn.unit || n.unit;
                        return nn;
                    }));
                }
                if (n.modified && (n.modified.atts.length || n.modified.nodes.length))
                {
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    if (!node.modified.nodes.length || node.modified.nodes[node.modified.nodes.length-1].to < index-1)
                        node.modified.nodes.push({from:index, to:index});
                    else
                        node.modified.nodes[node.modified.nodes.length-1].to = index;
                }
                n.parentNode = node;
                n.index = index++;
                childNodes.push(n);
                return childNodes;
            }, []);
        }
        return node;
    },
    as_unit = function as_unit(node) {
        if (node instanceof VNode)
        {
            node.unit = true;
            return node;
        }
        return is_type(node, T_ARRAY) ? node.map(as_unit) : node;
    },
    to_code = function to_code(vnode) {
        var out = '_$$_("", null, null, [], [])';
        if (vnode instanceof VCode)
        {
            out = vnode.code;
        }
        else if (vnode.nodeType && vnode.nodeType.length)
        {
            if ('text' === vnode.nodeType)
            {
                out = '_$$_("text", null, null, [], '+toJSON(vnode.nodeValue)+', '+toJSON(vnode.nodeValue2)+')';
            }
            else if ('comment' === vnode.nodeType)
            {
                out = '_$$_("comment", null, null, [], '+toJSON(vnode.nodeValue)+')';
            }
            else
            {
                var modified = {atts: []};
                out = '_$$_("'+(HAS.call(svgElements, vnode.nodeType) ? vnode.nodeType : vnode.nodeType.toLowerCase())+'", '+Str(vnode.id)+', '+Str(vnode.type)+', ['+vnode.attributes.map(function(a, i){
                    if (a.value instanceof VCode)
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
            out = '_$$_("", null, null, [], ['+vnode.childNodes.map(to_code).join(',')+'])';
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
                //vnode.nodeType = vnode.nodeType.toLowerCase();
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
        var rnode, i, l, a, v, n, t;
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
            //vnode.nodeType = vnode.nodeType.toLowerCase();
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
                        rnode[n] = Str(v);
                    }
                    else if ('class' === n)
                    {
                        rnode[CLASS] = Str(v);
                    }
                    else if (n in rnode)
                    {
                        t = get_type(rnode[n]);
                        rnode[n] = T_NUM === t ? parseFloat(v) : (T_BOOL === t ? !!v : v);
                    }
                    else
                    {
                        rnode[SET_ATTR](n, Str(true === v ? n : v));
                    }
                }
            }
            if (true === with_meta)
            {
                if (vnode.component)
                    rnode._mvComponent = vnode.component;
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
            //r[n] = '';
            r[DEL_ATTR](n);
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
        else if ((n in r) && (T_BOOL === get_type(r[n])))
        {
            r[n] = false;
        }
        else
        {
            r[DEL_ATTR](n);
        }
        return r;
    },
    set_att = function(r, n, s, T, TT) {
        var t;
        if ('id' === n)
        {
            s = Str(s);
            /*if (r[n] !== s)*/ r[n] = s;
        }
        else if ('class' === n)
        {
            s = Str(s);
            r[CLASS] = s;
        }
        else if ('style' === n)
        {
            s = Str(s);
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
            t = get_type(r[n]);
            s = T_NUM === t ? parseFloat(s) : (T_BOOL === t ? !!s : s);
            /*if (r[n] !== s)*/ r[n] = s;
        }
        else
        {
            s = Str(true === s ? n : s);
            /*if (s !== r[ATTR](n))*/ r[SET_ATTR](n, s);
        }
        return r;
    },
    nodeType = function(node) {
        var tagName = '<'+(node[TAG] || '')+'>';
        return node.nodeType === 3 ? 'text' : (node.nodeType === 8 ? 'comment' : (HAS.call(svgElements,tagName) ? tagName : tagName.toLowerCase()));
    },
    morphAtts = function morphAtts(r, v, unconditionally) {
        var T, TT, vAtts, rAtts, i, a, n;

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
                if (null === attr(v, n)) del_att(r, n, T, TT);
            }
            // add/update existent attributes
            for (i=vAtts.length-1; i>=0; i--)
            {
                a = vAtts[i]; n = a.name
                if (false === a.value) del_att(r, n, T, TT);
                else set_att(r, n, a.value, T, TT);
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
    morph = function morph(r, v, unconditionally) {
        // morph r (real) DOM to match v (virtual) DOM
        var vc = v.childNodes.length, count = 0, offset = 0, matched, mi, di, m, mc, d, tt, index, c, cc,
            vnode, rnode, lastnode, to_remove, T1, T2, rid, vid, rcomponent, vcomponent, val,
            modifiedNodesPrev = r._mvModified, modifiedNodes;

        if (v.component) r._mvComponent = v.component;
        else if (r._mvComponent) r._mvComponent = undef;
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
        else
        {
            modifiedNodesPrev = modifiedNodesPrev || [];
            modifiedNodes = v.modified ? v.modified.nodes : [];
            count = 0; offset = 0;
            matched = (modifiedNodes.length === modifiedNodesPrev.length) && (modifiedNodes.length === modifiedNodes.reduce(function(matched, m, i){
                var match = (m.from == offset + modifiedNodesPrev[i].from);
                offset += (m.to - m.from + 1) - (modifiedNodesPrev[i].to - modifiedNodesPrev[i].from + 1);
                return matched + match;
            }, 0)) && (offset+r.childNodes.length === v.childNodes.length);

            if (matched && modifiedNodes.length)
            {
                for (di=0,mi=0,cc=modifiedNodes.length; mi<cc; mi++)
                {
                    m = modifiedNodes[mi];
                    index = m.from;
                    if (m.to < m.from)
                    {
                        count = (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1);
                        for (; (0 < count) && (index < r.childNodes.length); count--)
                        {
                            r.removeChild(r.childNodes[index]);
                        }
                        continue;
                    }
                    else if (modifiedNodesPrev[mi].to < modifiedNodesPrev[mi].from)
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
                        count = (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1) - (m.to - m.from + 1);
                        if (v.diff && (0 >= count) && (di < v.diff.length) && (v.componentNodes === v.childNodes.length) && (v.diff[di][0] >= m.from) && (v.diff[di][1] <= m.to))
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
                                    vcomponent = vnode.component;
                                    rcomponent = rnode._mvComponent || null;
                                    vid = vnode.id;
                                    rid = rnode._mvId || null;
                                    if (
                                        (T2 !== T1)
                                        || ('<script>' === T1 || '<style>' === T1)
                                        || ('<input>' === T1 && (vnode[TYPE]||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                        || ((0 === count) && (vcomponent !== rcomponent))
                                        || ((0 === count) && (vid !== rid))
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
                                                morph(rnode, vnode, true);
                                            }
                                            else
                                            {
                                                r.insertBefore(to_node(vnode, true), rnode);
                                                count++;
                                            }
                                        }
                                        else
                                        {
                                            if ((0 > count) && (index > m.to+count))
                                            {
                                                r.insertBefore(to_node(vnode, true), rnode);
                                                count++;
                                            }
                                            else if ((vcomponent !== rcomponent) || (vid !== rid))
                                            {
                                                r.replaceChild(to_node(vnode, true), rnode);
                                            }
                                            else
                                            {
                                                if (vnode.unit)
                                                {
                                                    r.replaceChild(to_node(vnode, true), rnode);
                                                }
                                                else
                                                {
                                                    // morph attributes/properties
                                                    morphAtts(rnode, vnode);
                                                    // morph children
                                                    morph(rnode, vnode, true);
                                                }
                                            }
                                        }
                                    }
                                    else if ('<textarea>' === T1)
                                    {
                                        // morph attributes/properties
                                        morphAtts(rnode, vnode);
                                        val = vnode.childNodes.map(to_string).join('');
                                        if (rnode.value !== val)
                                        {
                                            rnode.value = val;
                                            if (rnode.firstChild) rnode.firstChild.nodeValue = val;
                                        }
                                    }
                                    else if (vnode.unit || (vcomponent !== rcomponent) || (vid !== rid))
                                    {
                                        r.replaceChild(to_node(vnode, true), rnode);
                                    }
                                    else
                                    {
                                        // morph attributes/properties
                                        morphAtts(rnode, vnode);
                                        // morph children
                                        morph(rnode, vnode, true);
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
                                vcomponent = vnode.component;
                                rcomponent = rnode._mvComponent || null;
                                vid = vnode.id;
                                rid = rnode._mvId || null;
                                if (
                                    (T2 !== T1)
                                    || ('<script>' === T1 || '<style>' === T1)
                                    || ('<input>' === T1 && (vnode[TYPE]||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                    || ((0 === count) && (vcomponent !== rcomponent))
                                    || ((0 === count) && (vid !== rid))
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
                                                morph(rnode, vnode, true);
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
                                                    if (!rnode._mvId || (vid === rnode._mvId)) break;
                                                }
                                                if (index >= r.childNodes.length)
                                                {
                                                    r.appendChild(to_node(vnode, true));
                                                }
                                                else
                                                {
                                                    T1 = nodeType(rnode);
                                                    rcomponent = rnode._mvComponent || null;
                                                    rid = rnode._mvId || null;
                                                    if (
                                                        (T2 !== T1)
                                                        || ('<input>' === T1 && (attr(vnode,TYPE)||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                                        || (!rid)
                                                        || (rid !== vid)
                                                        || (rcomponent !== vcomponent)
                                                    )
                                                    {
                                                        r.replaceChild(to_node(vnode, true), rnode);
                                                    }
                                                    else if (false !== vnode.changed)
                                                    {
                                                        if (vnode.unit)
                                                        {
                                                            r.replaceChild(to_node(vnode, true), rnode);
                                                        }
                                                        else
                                                        {
                                                            // morph attributes/properties
                                                            morphAtts(rnode, vnode);
                                                            // morph children
                                                            morph(rnode, vnode, true);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        if ((0 > count) && (index > tt+count))
                                        {
                                            r.insertBefore(to_node(vnode, true), rnode);
                                            count++;
                                        }
                                        else if (false !== vnode.changed)
                                        {
                                            if (vnode.unit)
                                            {
                                                r.replaceChild(to_node(vnode, true), rnode);
                                            }
                                            else
                                            {
                                                // morph attributes/properties
                                                morphAtts(rnode, vnode, true);
                                                // morph children
                                                morph(rnode, vnode, true);
                                            }
                                        }
                                    }
                                }
                                else if ('text' === T1)
                                {
                                    /*if (rnode.nodeValue !== vnode.nodeValue2)
                                    {*/
                                        rnode.nodeValue = vnode.nodeValue2;
                                    /*}*/
                                }
                                else if ('comment' === T1)
                                {
                                    /*if (rnode.nodeValue !== vnode.nodeValue)
                                    {*/
                                        rnode.nodeValue = vnode.nodeValue;
                                    /*}*/
                                }
                                else if ('<textarea>' === T1)
                                {
                                    if (false !== vnode.changed)
                                    {
                                        // morph attributes/properties
                                        morphAtts(rnode, vnode, true);
                                        val = vnode.childNodes.map(to_string).join('');
                                        /*if (rnode.value !== val)
                                        {*/
                                            rnode.value = val;
                                            if (rnode.firstChild) rnode.firstChild.nodeValue = val;
                                        /*}*/
                                    }
                                }
                                else if (false !== vnode.changed)
                                {
                                    if (vnode.unit)
                                    {
                                        r.replaceChild(to_node(vnode, true), rnode);
                                    }
                                    else
                                    {
                                        // morph attributes/properties
                                        morphAtts(rnode, vnode, true);
                                        // morph children
                                        morph(rnode, vnode, true);
                                    }
                                }
                            }
                            if (0 < count)
                            {
                                // finally remove any remaining nodes that need to be removed and haven't been already
                                lastnode = r.childNodes[index/*+1*/];
                                for (; (0 < count) && lastnode; count--)
                                {
                                    if (1 === count)
                                    {
                                        to_remove = lastnode;
                                    }
                                    else
                                    {
                                        to_remove = lastnode;
                                        lastnode = lastnode.nextSibling;
                                    }
                                    r.removeChild(to_remove);
                                }
                            }
                        }
                    }
                }
            }
            else if (!matched || (true === unconditionally))
            {
                count = r.childNodes.length - vc;
                for (index=0; index<vc; index++)
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
                    vcomponent = vnode.component;
                    rcomponent = rnode._mvComponent || null;
                    vid = vnode.id;
                    rid = rnode._mvId || null;
                    if (
                        (T2 !== T1)
                        || ('<script>' === T1 || '<style>' === T1)
                        || ('<input>' === T1 && (vnode[TYPE]||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                        || ((0 === count) && (vcomponent !== rcomponent))
                        || ((0 === count) && (vid !== rid))
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
                                    morphAtts(rnode, vnode, true);
                                    // morph children
                                    morph(rnode, vnode, unconditionally);
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
                                        if (!rnode._mvId || (vid === rnode._mvId)) break;
                                    }
                                    if (index >= r.childNodes.length)
                                    {
                                        r.appendChild(to_node(vnode, true));
                                    }
                                    else
                                    {
                                        T1 = nodeType(rnode);
                                        rcomponent = rnode._mvComponent || null;
                                        rid = rnode._mvId || null;
                                        if (
                                            (T2 !== T1)
                                            || ('<input>' === T1 && (attr(vnode,TYPE)||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                            || (!rid)
                                            || (rid !== vid)
                                            || (rcomponent !== vcomponent)
                                        )
                                        {
                                            r.replaceChild(to_node(vnode, true), rnode);
                                        }
                                        else if (false !== vnode.changed)
                                        {
                                            if (vnode.unit)
                                            {
                                                r.replaceChild(to_node(vnode, true), rnode);
                                            }
                                            else
                                            {
                                                // morph attributes/properties
                                                morphAtts(rnode, vnode, true);
                                                // morph children
                                                morph(rnode, vnode, unconditionally);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        else
                        {
                            if ((0 > count) && (index > tt+count))
                            {
                                r.insertBefore(to_node(vnode, true), rnode);
                                count++;
                            }
                            else if ((vcomponent !== rcomponent) || (vid !== rid))
                            {
                                r.replaceChild(to_node(vnode, true), rnode);
                            }
                            else if (false !== vnode.changed)
                            {
                                if (vnode.unit)
                                {
                                    r.replaceChild(to_node(vnode, true), rnode);
                                }
                                else
                                {
                                    // morph attributes/properties
                                    morphAtts(rnode, vnode, true);
                                    // morph children
                                    morph(rnode, vnode, unconditionally);
                                }
                            }
                        }
                    }
                    else if ('text' === T1)
                    {
                        /*if (rnode.nodeValue !== vnode.nodeValue2)
                        {*/
                            rnode.nodeValue = vnode.nodeValue2;
                        /*}*/
                    }
                    else if ('comment' === T1)
                    {
                        /*if (rnode.nodeValue !== vnode.nodeValue)
                        {*/
                            rnode.nodeValue = vnode.nodeValue;
                        /*}*/
                    }
                    else if ('<textarea>' === T1)
                    {
                        if (false !== vnode.changed)
                        {
                            // morph attributes/properties
                            morphAtts(rnode, vnode, true);
                            val = vnode.childNodes.map(to_string).join('');
                            /*if (rnode.value !== val)
                            {*/
                                rnode.value = val;
                                if (rnode.firstChild) rnode.firstChild.nodeValue = val;
                            /*}*/
                        }
                    }
                    else if (false !== vnode.changed)
                    {
                        if (vnode.unit)
                        {
                            r.replaceChild(to_node(vnode, true), rnode);
                        }
                        else
                        {
                            // morph attributes/properties
                            morphAtts(rnode, vnode, true);
                            // morph children
                            morph(rnode, vnode, unconditionally);
                        }
                    }
                }
                for (; 0 < count; count--) r.removeChild(r.lastChild);
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

