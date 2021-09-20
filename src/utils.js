
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

    tpl2code = function tpl2code(tpl, args, scoped, textOnly) {
        var p1, p2, code = 'var view = this;', echo = 0, codefrag = '', marker = 0;
        tpl = trim(tpl);
        if (true === textOnly)
        {
            args = 'MODEL';
            code += "\n var _$$_ = '';\n MODEL = MODEL || function(key){return '{%='+String(key)+'%}';};";
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
            args = (args || '') + '_$$_';
            if (scoped && scoped.length) code += "\n" + Str(scoped);
            while (tpl && tpl.length)
            {
                p1 = tpl.indexOf('{%');
                if (-1 === p1)
                {
                    code += "\n"+'_$$_.parse(this, \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\', _$$_);';
                    break;
                }
                else
                {
                    echo = '=' === tpl.charAt(p1+2) ? 1 : 0;
                    p2 = tpl.indexOf('%}', p1+2+echo);
                    if (-1 === p2)
                    {
                        code += "\n"+'_$$_.parse(this, \''+tpl.replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\', _$$_);';
                        break;
                    }

                    code += "\n"+'_$$_.parse(this, \''+tpl.slice(0, p1).replace('\\', '\\\\').replace('\'','\\\'').replace(NL, '\'+"\\n"+\'')+'\', _$$_);';
                    if (echo)
                    {
                        code += "\n_$$_.s(_$$_);";
                        code += "\n"+'_$$_.parse(this, String('+trim(tpl.slice(p1+3, p2))+'), _$$_);';
                        code += "\n_$$_.e(_$$_);";
                    }
                    else
                    {
                        codefrag = trim(tpl.slice(p1+2, p2));
                        if (('{' !== codefrag) && ('{' === codefrag.charAt(codefrag.length-1)) && ('}' !== codefrag.charAt(0)))
                        {
                            if (0 === marker) code += "\n_$$_.s(_$$_);";
                            marker++;
                        }
                        code += "\n"+codefrag;
                        if ((0 < marker) && ('}' === codefrag))
                        {
                            marker--;
                            if (0 === marker) code += "\n_$$_.e(_$$_);";
                        }
                    }
                    tpl = tpl.slice(p2+2);
                }
            }
            if (0 < marker) code += "\n_$$_.e(_$$_);";
        }
        code += "\nreturn _$$_;";
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
    initVNode = function(nodeType, nodeValue, nodeValue2, parentNode, index) {
        return {nodeType: nodeType, nodeValue: nodeValue || '', nodeValue2: nodeValue2 || '', parentNode: parentNode || null, index: index || 0, modified: null, mod: null, diff: null, changed: null, attributes: [], atts: {}, childNodes: [], componentNodes: 0};
    },
    initState = function(opts) {
        return {
            dom: {parentNode: null, modified: null, mod: null, diff: null, childNodes: [], componentNodes: 0},
            opts: opts || {},
            parse: html2ast,
            s: startMod,
            e: endMod,
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

    SPACE = /\s/,
    NUM = /^\d+$/,
    HEXNUM = /^[0-9a-fA-F]+$/,
    TAGCHAR = /[a-zA-Z0-9\-_:]/,
    ATTCHAR = TAGCHAR,

    attr = function(vnode, name) {
        return vnode.atts && HAS.call(vnode.atts, name) ? vnode.atts[name] : null;
    },
    startMod = function(state) {
        if (state.dom)
        {
            if (!state.dom.modified) state.dom.modified = {atts: [], nodes: []};
            if (state.intag)
            {
                if (!state.dom.modified.atts.length || (null !== state.dom.modified.atts[state.dom.modified.atts.length-1].to))
                {
                    if (state.dom.modified.atts.length && (state.dom.attributes.length-1 <= state.dom.modified.atts[state.dom.modified.atts.length-1].to))
                        state.dom.modified.atts[state.dom.modified.atts.length-1].to = null; // extends previous modification
                    else
                        state.dom.modified.atts.push({from: state.dom.attributes.length-(state.inatt ? 1 : 0), to: null});
                }
            }
            else
            {
                if (!state.dom.modified.nodes.length || (null !== state.dom.modified.nodes[state.dom.modified.nodes.length-1].to))
                {
                    if (state.dom.modified.nodes.length && (state.dom.childNodes.length-1 <= state.dom.modified.nodes[state.dom.modified.nodes.length-1].to))
                        state.dom.modified.nodes[state.dom.modified.nodes.length-1].to = null; // extends previous modification
                    else
                        state.dom.modified.nodes.push({from: state.dom.childNodes.length, to: null});
                }
            }
        }
        return state;
    },
    parentMod = function parentMod(node) {
        if (node && node.parentNode)
        {
            var index = node.index || 0, parent = node.parentNode, to;
            if (!parent.mod) parent.mod = [];
            if (!parent.mod.length)
            {
                parent.mod.push({from:index, to:index});
            }
            else
            {
                to = parent.mod[parent.mod.length-1].to;
                if (index <= to)
                {
                    // do nothing
                }
                else if (index-1 === to)
                {
                    parent.mod[parent.mod.length-1].to = index; // continue
                }
                else
                {
                    parent.mod.push({from:index, to:index});
                }
            }
            parentMod(parent);
        }
    },
    endMod = function(state) {
        if (state.dom && state.dom.modified)
        {
            if (state.intag)
            {
                if (state.dom.modified.atts.length && (null === state.dom.modified.atts[state.dom.modified.atts.length-1].to))
                {
                    state.dom.modified.atts[state.dom.modified.atts.length-1].to = state.dom.attributes.length-1;
                    parentMod(state.dom);
                }
            }
            else
            {
                if (state.dom.modified.nodes.length && (null === state.dom.modified.nodes[state.dom.modified.nodes.length-1].to))
                {
                    if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt).length))
                        state.dom.modified.nodes[state.dom.modified.nodes.length-1].to = state.dom.childNodes.length;
                    else
                        state.dom.modified.nodes[state.dom.modified.nodes.length-1].to = state.dom.childNodes.length-1;
                    parentMod(state.dom);
                }
            }
        }
        return state;
    },
    html2ast = function html2ast(view, html, state) {
        var c = '', l = html.length, i = 0, j, t, dom, att, currdom, changed;
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
                        state.dom.atts[att.name] = state.val;
                    }
                    else
                    {
                        att.value += state.val;
                        state.dom.atts[att.name] += state.val;
                    }
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
                            state.dom.atts[state.att] = true;
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
                            state.dom.atts[state.att] = true;
                            state.att = '';
                        }
                        if (state.dom.attributes.length && (true === state.dom.attributes[state.dom.attributes.length-1].value))
                        {
                            i++;
                            while(i<l && SPACE.test(c=html.charAt(i))) i++;
                            if ('"' === c || '\'' === c)
                            {
                                i++; state.inatt = true; state.q = c; state.val = '';
                                break;
                            }
                            else
                            {
                                throw err('Invalid attribute value "'+c+'" in tag '+state.dom.nodeType+' around .. '+html.slice(i-20,i+50)+' ..');
                            }
                        }
                        else
                        {
                            throw err('Invalid "'+c+'" in tag '+state.dom.nodeType+' around .. '+html.slice(i-20,i+50)+' ..');
                        }
                    }
                    else if ('/' === c && '>' === html.charAt(i+1))
                    {
                    }
                    else
                    {
                        throw err('Invalid "'+c+'" in tag '+state.dom.nodeType+' around .. '+html.slice(i-20,i+50)+' ..');
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
                        state.dom.atts[state.att] = true;
                        state.att = '';
                    }
                    if ('/' === html.charAt(i-1) || (HAS.call(autoclosedTags,state.dom.nodeType)))
                    {
                        // closed
                        if ('<mv-component>' === state.dom.nodeType)
                        {
                            // special handling
                            currdom = state.dom;
                            dom = getRoot(finState(view.$component(attr(currdom, 'name'), attr(currdom, 'props'), initState(state.opts))));
                            state.dom = currdom.parentNode;
                            changed = !!attr(currdom, 'changed');
                            state.dom.childNodes.splice.apply(state.dom.childNodes, [currdom.index, 1].concat(dom.childNodes.map(function(n){n.parentNode = state.dom; n.index += currdom.index; n.changed = changed; return n;})));
                            state.dom.componentNodes += dom.childNodes.length;
                            if (dom.modified && dom.modified.nodes)
                            {
                                if (!state.dom.modified)
                                {
                                    state.dom.modified = {atts:[], nodes:dom.modified.nodes.map(function(m){return {from:currdom.index+m.from, to:currdom.index+m.to};})};
                                }
                                else if (null === state.dom.modified.nodes[state.dom.modified.nodes.length-1].to)
                                {
                                    /* do nothing */
                                }
                                else if (state.dom.modified.nodes[state.dom.modified.nodes.length-1].to < currdom.index+dom.modified.nodes[0].from-1)
                                {
                                    state.dom.modified.nodes = state.dom.modified.nodes.concat(dom.modified.nodes.map(function(m){return {from:currdom.index+m.from, to:currdom.index+m.to};}));
                                }
                                else
                                {
                                    state.dom.modified.nodes[state.dom.modified.nodes.length-1].to = currdom.index+dom.modified.nodes[0].to;
                                    state.dom.modified.nodes = state.dom.modified.nodes.concat(dom.modified.nodes.slice(1).map(function(m){return {from:currdom.index+m.from, to:currdom.index+m.to};}));
                                }
                            }
                            if (dom.mod)
                            {
                                if (!state.dom.mod)
                                {
                                    state.dom.mod = dom.mod.map(function(m){return {from:currdom.index+m.from, to:currdom.index+m.to};});
                                }
                                else if (state.dom.mod[state.dom.mod.length-1].to < currdom.index+dom.mod[0].from-1)
                                {
                                    state.dom.mod = state.dom.mod.concat(dom.mod.map(function(m){return {from:currdom.index+m.from, to:currdom.index+m.to};}));
                                }
                                else
                                {
                                    state.dom.mod[state.dom.mod.length-1].to = currdom.index+dom.mod[0].to;
                                    state.dom.mod = state.dom.mod.concat(dom.mod.slice(1).map(function(m){return {from:currdom.index+m.from, to:currdom.index+m.to};}));
                                }
                                parentMod(state.dom);
                            }
                            if (changed)
                            {
                                if (!state.dom.diff)
                                {
                                    state.dom.diff = [[currdom.index, currdom.index+dom.childNodes.length-1]];
                                }
                                else if (state.dom.diff[state.dom.diff.length-1][1] < currdom.index-1)
                                {
                                    state.dom.diff.push([currdom.index, currdom.index+dom.childNodes.length-1]);
                                }
                                else
                                {
                                    state.dom.diff[state.dom.diff.length-1][1] = currdom.index+dom.childNodes.length-1;
                                }
                            }
                            if (dom.diff)
                            {
                                if (!state.dom.diff)
                                {
                                    state.dom.diff = dom.diff.map(function(m){return [currdom.index+m[0], currdom.index+m[1]];});
                                }
                                else if (state.dom.diff[state.dom.diff.length-1][1] < currdom.index+dom.diff[0][0]-1)
                                {
                                    state.dom.diff = state.dom.diff.concat(dom.diff.map(function(m){return [currdom.index+m[0], currdom.index+m[1]];}));
                                }
                                else
                                {
                                    state.dom.diff[state.dom.diff.length-1][1] = currdom.index+dom.diff[0][1];
                                    state.dom.diff = state.dom.diff.concat(dom.diff.slice(1).map(function(m){return [currdom.index+m[0], currdom.index+m[1]];}));
                                }
                            }
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
                if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt2).length))
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
                    throw err('No tag name around .. '+html.slice(i-20,i+50)+' ..');
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
                            throw err('Close tag doesn\'t match open tag '+state.tag+','+state.dom.nodeType+' around .. '+html.slice(i-20,i+50)+' ..');
                        }
                        else
                        {
                            state.intag = false;
                            state.dom = state.dom.parentNode;
                        }
                    }
                    else
                    {
                        throw err('Closing self-closing tag '+state.tag+' around .. '+html.slice(i-20,i+50)+' ..');
                    }
                }
                else //if (!HAS.call(autoclosedTags,state.tag))
                {
                    state.dom.childNodes.push(initVNode(state.tag, '', '', state.dom, state.dom.childNodes.length));
                    state.dom = state.dom.childNodes[state.dom.childNodes.length-1];
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
    nodeType = function(node) {
        return node.nodeType === 3 ? 'text' : (node.nodeType === 8 ? 'comment' : '<'+(node[TAG]||'').toLowerCase()+'>');
    },
    to_string = function to_string(vnode) {
        var out = '', selfclosed = true;
        if (vnode.nodeType)
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
                out = vnode.nodeType.slice(0, -1)+(vnode.attributes.length ? ' '+vnode.attributes.map(function(att) {return true === att.value ? att.name : att.name+'="'+att.value+'"';}).join(' ') : '')+(selfclosed ? '/>' : '>');
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
                        rnode[n] = v;
                    }
                    else
                    {
                        rnode[SET_ATTR](n, true === v ? n : v);
                    }
                }
            }
            if ((true === with_meta) && vnode.modified && vnode.modified.nodes.length)
            {
                rnode._mvModified = /*{atts: vnode.modified.atts, nodes:*/ vnode.modified.nodes/*, attributes: vnode.attributes}*/;
            }
            if (vnode.childNodes.length)
            {
                if ('<textarea>' === vnode.nodeType)
                {
                    rnode.innerHTML = vnode.childNodes[0].nodeValue;
                }
                else if ('<script>' === vnode.nodeType || '<style>' === vnode.nodeType)
                {
                    rnode.appendChild(document.createTextNode(vnode.childNodes[0].nodeValue));
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
    /*morphStyles = function(r, v) {
        var vstyleMap = trim(attr(v,'style')).split(';').reduce(function(map, style) {
                style = Str(style);
                var col = style.indexOf(':');
                if (0 < col) map[trim(style.slice(0, col))] = trim(style.slice(col + 1));
                return map;
            }, {}),
            rstyleMap = /*e.style* /trim(e.style.cssText).split(';').reduce(function(map, style) {
                style = Str(style);
                var col = style.indexOf(':');
                if (0 < col) map[trim(style.slice(0, col))] = trim(style.slice(col + 1));
                return map;
            }, {})
        ;

        Keys(rstyleMap)
        .reduce(function(rem, s) {
            if (!HAS.call(vstyleMap, s)) rem.push(s);
            return rem;
        }, [])
        .forEach(function(s) {
            r.style[s] = '';
        });

        Keys(vstyleMap)
        .forEach(function(s){
            var st = vstyleMap[s];
            if (r.style[s] !== st)
                r.style[s] = st;
        });
    },*/
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
            //morphStyles(r, v);
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
        else //if (!r[HAS_ATTR](n) || (r[ATTR](n) !== ss))
        {
            if (n in r) r[n] = s;
            else r[SET_ATTR](n, true === s ? n : s);
        }
        return r;
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
                set_att(r, a.name, a.value, T, TT);
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
        /*else if (v.modified && v.modified.atts.length)
        {
            T = (r[TAG] || '').toUpperCase();
            TT = (r[TYPE] || '').toLowerCase();
            modifiedAtts = v.modified.atts;
            modifiedAttsPrev = r._mvModified ? r._mvModified.atts : [];
            prevAtts = r._mvModified ? r._mvModified.attributes : [];
            vAtts = v.attributes;
            rAtts = r.attributes;
            for (j=0; j<modifiedAtts.length; j++)
            {
                m = modifiedAtts[j];
                i = m.from;
                if (m.to < m.from)
                {
                    count = (modifiedAttsPrev[j].to - modifiedAttsPrev[j].from + 1);
                    for (; 0 < count; count--)
                    {
                        a = prevAtts[modifiedAttsPrev[j].from+count-1];
                        prevAtts.splice(modifiedAttsPrev[j].from+count-1, 1);
                        del_att(r, a.name, T, TT);
                    }
                    continue;
                }
                else if (modifiedAttsPrev[j].to < modifiedAttsPrev[j].from)
                {
                    count = (m.to - m.from + 1);
                    for (; 0 < count; count--,i++)
                    {
                        prevAtts.splice(modifiedAttsPrev[j].from, 0, vAtts[i]);
                        set_att(r, vAtts[i].name, vAtts[i].value, T, TT);
                    }
                    continue;
                }
                else
                {
                    count = (modifiedAttsPrev[j].to - modifiedAttsPrev[j].from + 1) - (m.to - m.from + 1);
                    for (; i<=m.to; i++)
                    {
                        av = vAtts[i];
                        if (i > prevAtts.length)
                        {
                            prevAtts.push(av);
                            set_att(r, av.name, av.value, T, TT);
                            count++;
                            continue;
                        }
                        ar = prevAtts[i];
                        if (av.name !== ar.name) del_att(r, ar.name, T, TT);
                        set_att(r, av.name, av.value, T, TT);
                    }
                    for (; 0 < count; count--)
                    {
                        del_att(r, prevAtts[modifiedAttsPrev[j].to-count-1].name, T, TT);
                    }
                }
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
        }*/
        /*if (true === with_meta)
        {
            if (v.modified)
                r._mvModified = {atts: v.modified.atts, nodes: v.modified.nodes, attributes: v.attributes};
            else
                r._mvModified = undef;
        }*/

        return r;
    },
    morph = function morph(r, v, ID) {
        // morph r (real) DOM to match v (virtual) DOM
        var vc = v.childNodes.length, count = 0, mi, mci, di, m, mc, d, tt, index, c, cc,
            vnode, rnode, lastnode, to_remove, T1, T2, rid, vid,
            modifiedNodesPrev = r._mvModified ? r._mvModified/*.nodes*/ : [],
            modifiedNodes = v.modified ? v.modified.nodes : [],
            modChildren = v.mod ? v.mod : [];

        if (v.modified && v.modified.nodes.length) r._mvModified = /*{atts: v.modified.atts, nodes:*/ v.modified.nodes/*, attributes: v.attributes}*/;
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
            for (mci=0,mi=0,cc=modifiedNodes.length; mi<cc; mi++)
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
                    if (v.diff && (v.componentNodes === v.childNodes.length) && (0 === count))
                    {
                        for (di=0,c=v.diff.length; di<c; di++)
                        {
                            d = v.diff[di];
                            for (index=d[0],tt=d[1]; index<=tt; index++)
                            {
                                vnode = v.childNodes[index];
                                if (index >= r.childNodes.length)
                                {
                                    r.appendChild(to_node(vnode, true));
                                    continue;
                                }
                                rnode = r.childNodes[index];
                                T2 = vnode.nodeType;
                                T1 = nodeType(rnode);
                                vid = attr(vnode,ID);
                                rid = rnode[ATTR] ? rnode[ATTR](ID) : null;
                                if (
                                    (T2 !== T1)
                                    || ('<script>' === T1 || '<style>' === T1)
                                    || ('<input>' === T1 && (attr(vnode,TYPE)||'').toLowerCase() !== (rnode[TYPE]||'').toLowerCase())
                                    || ((vid || rid) && (vid !== rid))
                                )
                                {
                                    r.replaceChild(to_node(vnode, true), rnode);
                                }
                                else if ('<textarea>' === T1)
                                {
                                    // morph attributes/properties
                                    morphAtts(rnode, vnode, true, true);
                                    rnode.value = vnode.nodeValue;
                                    if (rnode.firstChild) rnode.firstChild.nodeValue = vnode.nodeValue;
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
                                continue;
                            }
                            rnode = r.childNodes[index];
                            T2 = vnode.nodeType;
                            T1 = nodeType(rnode);
                            vid = attr(vnode,ID);
                            rid = rnode[ATTR] ? rnode[ATTR](ID) : null;

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
                                                if (!rnode[ATTR] || (vid === rnode[ATTR](ID))) break;
                                            }
                                            if (index >= r.childNodes.length)
                                            {
                                                r.appendChild(to_node(vnode, true));
                                            }
                                            else
                                            {
                                                T1 = nodeType(rnode);
                                                rid = rnode[ATTR] ? rnode[ATTR](ID) : null;
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
                                    if (0 > count)
                                    {
                                        r.insertBefore(to_node(vnode, true), rnode);
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
                                // morph attributes/properties
                                morphAtts(rnode, vnode, true, true);
                                rnode.value = vnode.nodeValue;
                                if (rnode.firstChild) rnode.firstChild.nodeValue = vnode.nodeValue;
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
            _mvModifiedNodes = el._mvModified ? el._mvModified.nodes : null;
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
            _mvModifiedNodes = el._mvModified ? el._mvModified.nodes : null;
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

