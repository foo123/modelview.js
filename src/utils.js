
///////////////////////////////////////////////////////////////////////////////////////
//
// utilities
//
///////////////////////////////////////////////////////////////////////////////////////
var undef = undefined, bindF = function(f, scope) {return f.bind(scope);},
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys, stdMath = Math,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto],
    MV = '$MV', MV0 = function(){return {mod:null,id:null,comp:null,key:null};},
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    //FPCall = FP.call, hasProp = bindF(FPCall, OP.hasOwnProperty),
    toString = OP.toString, HAS = OP.hasOwnProperty, slice = AP.slice,
    newFunc = function(args, code){return new Func(args, code);},
    is_instance = function(o, T){return o instanceof T;},
    nextTick = 'undefined' !== typeof Promise
        ? Promise.resolve().then.bind(Promise.resolve())
        : function(cb) {setTimeout(cb, 0);}
;

function Node(val, next)
{
    var self = this;
    self.v = val || null;
    self.n = next || {};
}
Node[proto] = {
    constructor: Node
    ,v: null
    ,n: null
};
function VNode(nodeType, nodeValue, nodeValue2, parentNode, index)
{
    var self = this;
    if (!is_instance(self, VNode)) return new VNode(nodeType, nodeValue, nodeValue2, parentNode, index);
    self.nodeType = nodeType || '';
    self.cnodeType = nodeType || '';
    self.nodeValue = nodeValue || '';
    self.nodeValue2 = nodeValue2 || '';
    self.parentNode = parentNode || null;
    self.index = index || 0;
    self.attributes = [];
    self.childNodes = [];
}
VNode[proto] = {
    constructor: VNode
    ,nodeType: ''
    ,cnodeType: ''
    ,nodeValue: ''
    ,nodeValue2: ''
    ,parentNode: null
    ,index: 0
    ,component: null
    ,id: null
    ,type: null
    ,attributes: null
    ,atts: null
    ,childNodes: null
    ,componentNodes: 0
    ,potentialChildNodes: 0
    ,modified: null
    ,diff: null
    ,changed: false
    ,achanged: false
    ,unit: false
};
function VCode(code)
{
    var self = this;
    if (!is_instance(self, VCode)) return new VCode(code);
    self.code = code;
}
VCode[proto] = {
    constructor: VCode
    ,code: ''
};

var
    tostr = function(s) {return Str(s);},
    lower = function(s) {return s.toLowerCase();},
    upper = function(s) {return s.toUpperCase();},

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
    T_NUM = 32, T_BIGINT = 33, T_INF = 34, T_NAN = 35, T_BOOL = 64,
    T_STR = 128, T_CHAR = 129,
    T_ARRAY = 256, T_OBJ = 512, T_FUNC = 1024, T_REGEX = 2048, T_DATE = 4096,
    T_BLOB = 8192, T_FILE = 8192,
    T_STR_OR_ARRAY = T_STR|T_ARRAY, T_OBJ_OR_ARRAY = T_OBJ|T_ARRAY,
    T_ARRAY_OR_STR = T_STR|T_ARRAY, T_ARRAY_OR_OBJ = T_OBJ|T_ARRAY,
    TYPE_STRING = {
    "[object Number]"   : T_NUM,
    "[object BigInt]"   : T_BIGINT,
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
        else if (true === v || false === v || is_instance(v, Boolean)) T = T_BOOL;
        else if (undef === v)               T = T_UNDEF;
        else
        {
        T = TYPE_STRING[toString.call(v)] || T_UNKNOWN;
        if      ((T_NUM === T)   || is_instance(v, Num))   T = isNaN(v) ? T_NAN : (isFinite(v) ? T_NUM : T_INF);
        else if ((T_STR === T)   || is_instance(v, Str) || ('string' === typeof(v)))   T = 1 === v.length ? T_CHAR : T_STR;
        else if (T_UNKNOWN !== T)                          {/*T = T;*/}
        else if ((T_ARRAY === T) || is_instance(v, Arr))    T = T_ARRAY;
        else if ((T_REGEX === T) || is_instance(v, Regex))   T = T_REGEX;
        else if ((T_DATE === T)  || is_instance(v, Date))     T = T_DATE;
        else if ((T_FILE === T)  || ('undefined' !== typeof(File) && is_instance(v, File)))     T = T_FILE;
        else if ((T_BLOB === T)  || ('undefined' !== typeof(Blob) && is_instance(v, Blob)))     T = T_BLOB;
        else if ((T_FUNC === T)  || is_instance(v, Function) || ('function' === typeof(v))) T = T_FUNC;
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

    filter = function(a, f) {
        return [].filter.call(a, f);
    },
    each = function(a, f) {
        [].forEach.call(a, f);
        return a;
    },
    iterate = function(F, i0, i1, F0) {
        for (var i=i0; i<=i1; i++) F(i, F0, i0, i1);
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
    get_style = HASDOC && window.getComputedStyle
        ? function(el) {return window.getComputedStyle(el, null);}
        : function(el) {return el.currentStyle;},
    $style = function(el, prop, val) {
        if (null == val)
        {
            return el[STYLE].getPropertyValue(prop);
        }
        else
        {
            if ('' === val)
                el[STYLE].removeProperty(prop);
            else
                el[STYLE].setProperty(prop, Str(val));
            return el;
        }
    },
    show = function(el) {
        if ('' === $style(el, '--mvDisplay')) $style(el,'--mvDisplay', get_style(el).display || 'block');
        el[STYLE].display = 'none' !== $style(el, '--mvDisplay') ? $style(el, '--mvDisplay') : 'block';
        $style(el, '--mvDisplay', '');
    },

    hide = function(el) {
        if ('' === $style(el, '--mvDisplay')) $style(el,'--mvDisplay', get_style(el).display || 'block');
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
        var values = [].concat(v).map(tostr),
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
        switch(upper(el[TAG]||''))
        {
            case 'INPUT': return 'file' === lower(el.type||'') ? ((!!value_alt) && (null!=el[value_alt]) && el[value_alt].length ?el[value_alt] : (el.files.length ? el.files : null)) : ((!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL]);
            case 'TEXTAREA':return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : el[VAL];
            case 'SELECT': return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : select_get(el);
            default: return (!!value_alt) && (null!=el[value_alt]) ? el[value_alt] : ((TEXTC in el) ? el[TEXTC] : el[TEXT]);
        }
    },

    set_val = function(el, v) {
        if (!el) return;
        var value_alt = null, sv = Str(v), ret = false;
        if (el[HAS_ATTR]('data-alt-value')) value_alt = el[ATTR]('data-alt-value');
        switch(upper(el[TAG]||''))
        {
            case 'INPUT':
                if ('file' === lower(el.type||''))
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
                if (p === finalNode) break;
                p = p.parentNode;
            }
        }
        return false;
    },

    Fragment = function() {
        return document.createDocumentFragment();
    },
    Range = function() {
        var range = null;
        try {
            range = document.createRange();
        } catch(e) {
            range = null;
        }
        return range;
    },
    Text = function(val) {
        return document.createTextNode(val);
    },

    debounce = function(callback, instance) {
        if (HASDOC && window.requestAnimationFrame)
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

    tpl2code = function tpl2code(view, tpl, args, scoped, type, opts, rootNodeType, viewInstance) {
        var p1, p2, c, code = '"use strict";'+"\n"+'var view = '+(viewInstance||'this')+';', state;
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
            state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
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
                    out += '('+(jsx.length ? to_code(parse(view, jsx, opts, '', true)) : '')+')';
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
                while (i<l && state.q !== (c=html.charAt(i)))
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
                    else if (is_instance(att.value, VCode))
                    {
                        if (state.val.length) att.value.code = '('+att.value.code+')+'+toJSON(state.val);
                        //state.dom.atts[att.name] = att.value;
                    }
                    else
                    {
                        att.value += state.val;
                        //state.dom.atts[att.name] += state.val;
                    }
                    if (state.opts.id === att.name) state.dom.id = is_instance(att.value, VCode) ? '('+att.value.code+')' : toJSON(att.value);
                    if ('type' === att.name) state.dom.type = is_instance(att.value, VCode) ? '('+att.value.code+')' : toJSON(att.value);
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
                            while (i<l && SPACE.test(c=html.charAt(i))) i++;
                            if ((true === jscode) && ('{' === c))
                            {
                                i++; state.inatt = true; j = 1; instr = false; esc = false; state.q = ''; state.val = '';
                                while (i<l)
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
                                                    if (state.opts.id === att.name) state.dom.id = '('+att.value.code+')';
                                                    if ('type' === att.name) state.dom.type = '('+att.value.code+')';
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
                            state.dom.childNodes[state.dom.childNodes.length-1] = new VCode('view.component("'+component.nodeType.slice(1,-1)+'",'+(is_instance(attr(component, 'id'), VCode) ? attr(component, 'id').code : toJSON(attr(component, 'id')))+','+(is_instance(attr(component, 'props'), VCode) ? attr(component, 'props').code : toJSON(attr(component, 'props')))+',[])');
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
                state.dom.childNodes.push(VNode('c', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
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
                    if ('/script>' === lower(html.slice(i, i+8)))
                    {
                        state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
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
                    if ('/style>' === lower(html.slice(i, i+7)))
                    {
                        state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
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
                    if ('/textarea>' === lower(html.slice(i, i+10)))
                    {
                        state.dom.nodeValue = state.txt;
                        state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
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
                    state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
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

                    if (!HAS.call(autoclosedTags, lower(state.tag)))
                    {
                        if (state.dom.cnodeType !== lower(state.tag))
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
                                state.dom.childNodes[state.dom.childNodes.length-1] = new VCode('view.component("'+component.nodeType.slice(1,-1)+'",'+(is_instance(attr(component, 'id'), VCode) ? attr(component, 'id').code : toJSON(attr(component, 'id')))+','+(is_instance(attr(component, 'props'), VCode) ? attr(component, 'props').code : toJSON(attr(component, 'props')))+','+(component.childNodes.length ? to_code(component)+'.childNodes' : '[]')+')');
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
                else //if (!HAS.call(autoclosedTags, lower(state.tag)))
                {
                    state.dom.childNodes.push(VNode(state.tag, '', '', state.dom, state.dom.childNodes.length));
                    state.dom = state.dom.childNodes[state.dom.childNodes.length-1];
                    state.dom.cnodeType = lower(state.dom.nodeType);
                }
                continue;
            }
            if ((true === jscode) && !state.incomment && ('{' === c))
            {
                if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt).length))
                {
                    state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
                }
                state.txt = '';
                state.txt2 = '';
                j = 1; instr = false; esc = false; state.q = '';
                while (i<l)
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
            if (('&' === c) /*&& ('<script>' !== state.dom.cnodeType) && ('<style>' !== state.dom.cnodeType)*/)
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
    insMod = function(nodes, start, end, new_mod) {
        var to, last = nodes.length ? nodes[nodes.length-1] : null;
        if (end.map)
        {
            if (!last || last.to < start+end[0].from-1)
            {
                AP.push.apply(nodes, end.map(function(m){return {from:start+m.from, to:start+m.to};}));
            }
            else
            {
                last.to = start+end[0].to;
                AP.push.apply(nodes, end.slice(1).map(function(m){return {from:start+m.from, to:start+m.to};}));
            }
        }
        else if (last && last.from === start && last.to === end)
        {
            if (new_mod) new_mod = false;
        }
        else if (new_mod)
        {
            new_mod = false;
            if (last)
            {
                to = last.to;
                if (to >= end)
                {
                    if (last.from < start)
                    {
                        last.to = start-1;
                        nodes.push({from:start, to:end});
                        if (to > end) nodes.push({from:end+1, to:to});
                    }
                    else if (last.from > start)
                    {
                        nodes[nodes.length-1] = {from:start, to:end};
                        last.from = stdMath.max(last.from, end+1);
                        nodes.push(last);
                    }
                    else
                    {
                        last.to = end;
                        if (to > end) nodes.push({from:end+1, to:to});
                    }
                }
                else if (to >= start)
                {
                    last.to = start-1;
                    nodes.push({from:start, to:end});
                }
                else
                {
                    nodes.push({from:start, to:end});
                }
            }
            else
            {
                nodes.push({from:start, to:end});
            }
        }
        else if (!last || last.to < start-1)
        {
            nodes.push({from:start, to:end});
        }
        /*else if (last.from >= end)
        {
            // cannot happen as mods are added sequentially
        }*/
        else
        {
            last.to = stdMath.max(last.to, end);
        }
        return new_mod;
    },
    insDiff = function(node, start, end, new_diff) {
        if (end.map)
        {
            if (!node.diff)
            {
                if (new_diff) new_diff = false;
                node.diff = end.map(function(m){return [start+m[0], start+m[1]];});
            }
            else if (new_diff || node.diff[node.diff.length-1][1] < start+end[0][0]-1)
            {
                if (new_diff) new_diff = false;
                AP.push.apply(node.diff, end.map(function(m){return [start+m[0], start+m[1]];}));
            }
            else
            {
                node.diff[node.diff.length-1][1] = start+end[0][1];
                AP.push.apply(node.diff, end.slice(1).map(function(m){return [start+m[0], start+m[1]];}));
            }
        }
        else if (new_diff)
        {
            new_diff = false;
            if (!node.diff)
                node.diff = [[start, end]];
            else
                node.diff.push([start, end]);
        }
        else
        {
            if (!node.diff)
                node.diff = [[start, end]];
            else if (node.diff[node.diff.length-1][1] < start-1)
                node.diff.push([start, end]);
            else
                node.diff[node.diff.length-1][1] = end;
        }
        return new_diff;
    },
    htmlNode = function htmlNode(view, nodeType, id, type, atts, children, value2, modified) {
        var node = new VNode(nodeType, '', '', null, 0), index = 0, new_mod = false, new_diff = false, ch, c, l;
        id = id || null; type = type || null;
        if (is_instance(id, Value)) id = id.val();
        if (is_instance(type, Value)) type = type.val();
        node.id = null == id ? null : Str(id);
        node.type = null == type ? null : Str(type);
        node.attributes = atts || [];
        if (modified && modified.atts && modified.atts.length)
        {
            if (!node.modified) node.modified = {atts:[], nodes:[]};
            node.modified.atts = modified.atts;
            l = modified.modified;
            c = modified.values(node.attributes, Value);
            ch = 0 < modified.dirty(node.attributes, Value);
            /*ch = false; c = 0; l = 0;
            each(modified.atts, function(range){
                for (var a,i=range.from; i<=range.to; i++)
                {
                    l++; a = atts[i];
                    if (is_instance(a.value, Value))
                    {
                        c++;
                        // reset Value after current render session
                        // if dirty and not not from model.getVal() (ie has no key)
                        if (a.value.dirty() && !a.value.key())
                            view.$reset.push(a.value);
                        ch = ch || a.value.dirty();
                        //a.value = a.value.val();
                    }
                }
            });*/
            node.achanged = c === l ? ch : (0 < l);
        }
        if ('t' === nodeType || 'c' === nodeType)
        {
            node.nodeValue = children;
            node.nodeValue2 = value2 || '';
        }
        else
        {
            children = children || [];
            node.childNodes = children.reduce(function process(childNodes, n) {
                if (is_instance(n, Collection))
                {
                    var nn = new VNode('collection', n, null, node, index), len = n.items().length*n.mappedItem;
                    nn.potentialChildNodes = len;
                    nn.changed = 0 < n.diff.length;
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    insMod(node.modified.nodes, index, index+len-1, true);
                    new_mod = true;
                    /*if (nn.changed)
                    {
                        insDiff(node, index, index, true);
                        new_diff = true;
                    }*/
                    childNodes.push(nn);
                    node.potentialChildNodes += len;
                    index += len;
                    // reset Collection after current render session
                    view.$reset.push(n);
                    node.changed = node.changed || nn.changed;
                    return childNodes;
                }
                else if (is_instance(n, Value))
                {
                    var val = n, v = Str(val.val());
                    if ('' === v)
                    {
                        if (!node.modified) node.modified = {atts: [], nodes: []};
                        new_mod = insMod(node.modified.nodes, index, index-1, new_mod);
                        return childNodes;
                    }
                    n = VNode('t', v, v, null, 0);
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    new_mod = insMod(node.modified.nodes, index, index, new_mod);
                    // reset Value after current render session
                    // if dirty and not not from model.getVal() (ie has no key)
                    if (val.dirty() && !val.key())
                        view.$reset.push(val);
                    n.changed = val.dirty();
                }
                else if (!is_instance(n, VNode))
                {
                    if (get_type(n) & T_ARRAY)
                    {
                        if (!node.modified) node.modified = {atts: [], nodes: []};
                        var i = index;
                        childNodes = n.reduce(process, childNodes);
                        new_mod = insMod(node.modified.nodes, i, index-1, new_mod);
                        node.changed = true;
                        return childNodes;
                    }
                    else
                    {
                        var v = Str(n);
                        if ('' === v)
                        {
                            if (!node.modified) node.modified = {atts: [], nodes: []};
                            new_mod = insMod(node.modified.nodes, index, index-1, new_mod);
                            return childNodes;
                        }
                        n = VNode('t', v, v, null, 0);
                        n.changed = true;
                        if (!node.modified) node.modified = {atts: [], nodes: []};
                        new_mod = insMod(node.modified.nodes, index, index, new_mod);
                    }
                }
                else if ('<mv-component>' === n.nodeType)
                {
                    node.potentialChildNodes += n.potentialChildNodes;
                    node.componentNodes += n.childNodes.length;
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    new_mod = insMod(node.modified.nodes, index, index+n.childNodes.length-1, new_mod);
                    //if (n.diff) new_diff = insDiff(node, index, n.diff, new_diff);
                    /*else*/ if (n.changed) new_diff = insDiff(node, index, index+n.childNodes.length-1, new_diff);
                    AP.push.apply(childNodes, n.childNodes.map(function(nn){
                        nn.parentNode = node;
                        nn.index = index++;
                        //nn.changed = nn.changed || n.changed;
                        nn.component = nn.component || n.component;
                        nn.unit = nn.unit || n.unit;
                        return nn;
                    }));
                    node.changed = node.changed || n.changed;
                    return childNodes;
                }
                else if ('collection' === n.nodeType)
                {
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    insMod(node.modified.nodes, index, index+n.potentialChildNodes-1, true);
                    new_mod = true;
                    /*if (n.changed)
                    {
                        insDiff(node, index, index, true);
                        new_diff = true;
                    }*/
                    node.potentialChildNodes += n.potentialChildNodes;
                    n.index = index;
                    n.parentNode = node;
                    index += n.potentialChildNodes;
                    childNodes.push(n);
                    node.changed = node.changed || n.changed;
                    return childNodes;
                }
                else if (('dyn' === n.nodeType) || ('jsx' === n.nodeType))
                {
                    node.potentialChildNodes += n.potentialChildNodes;
                    var i = index, a = n.childNodes.map(function(nn){
                        nn.parentNode = node;
                        nn.index = index++;
                        nn.unit = 'dyn' === n.nodeType ? true : (nn.unit || n.unit);
                        nn.achanged = true;
                        nn.changed = true;
                        return nn;
                    });
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    new_mod = insMod(node.modified.nodes, i, i+a.length-1, new_mod);
                    //new_diff = insDiff(node, i, i+a.length-1, new_diff);
                    AP.push.apply(childNodes, a);
                    node.changed = true;
                    return childNodes;
                }
                else if (!n.nodeType || !n.nodeType.length)
                {
                    node.potentialChildNodes += n.potentialChildNodes;
                    if (n.modified && n.modified.nodes.length)
                    {
                        if (!node.modified) node.modified = {atts: [], nodes: []};
                        insMod(node.modified.nodes, index, n.modified.nodes);
                    }
                    AP.push.apply(childNodes, n.childNodes.map(function(nn){
                        //if (nn.changed || nn.achanged) new_diff = insDiff(node, index, index, new_diff);
                        nn.parentNode = node;
                        nn.index = index++;
                        nn.unit = nn.unit || n.unit;
                        node.changed = node.changed || nn.changed || nn.achanged;
                        return nn;
                    }));
                    return childNodes;
                }
                if (n.modified && (n.modified.atts.length || n.modified.nodes.length))
                {
                    if (!node.modified) node.modified = {atts: [], nodes: []};
                    new_mod = insMod(node.modified.nodes, index, index, new_mod);
                }
                //if (n.changed || n.achanged) new_diff = insDiff(node, index, index, new_diff);
                node.potentialChildNodes++;
                n.parentNode = node;
                n.index = index++;
                childNodes.push(n);
                node.changed = node.changed || n.changed || n.achanged;
                return childNodes;
            }, []);
        }
        return node;
    },
    as_unit = function as_unit(node) {
        if (is_instance(node, VNode))
        {
            node.unit = true;
            return node;
        }
        return is_type(node, T_ARRAY) ? node.map(as_unit) : node;
    },
    to_code = function to_code(vnode) {
        var out = '_$$_(view, "", null, null, [], [])', T = vnode.nodeType;
        if (is_instance(vnode, VCode))
        {
            out = vnode.code;
        }
        else if (T && T.length)
        {
            if ('t' === T)
            {
                out = '_$$_(view, "t", null, null, [], '+toJSON(vnode.nodeValue)+', '+toJSON(vnode.nodeValue2)+')';
            }
            else if ('c' === T)
            {
                out = '_$$_(view, "c", null, null, [], '+toJSON(vnode.nodeValue)+')';
            }
            else
            {
                var modified = {atts: []},
                    dirty = '0', nval = '0', nmod = 0;
                out = '_$$_(view, "'+(svgElements[T] ? T : lower(T))+'", '+Str(vnode.id)+', '+Str(vnode.type)+', ['+vnode.attributes.map(function(a, i){
                    if (is_instance(a.value, VCode))
                    {
                        nmod++;
                        if (!modified.atts.length || modified.atts[modified.atts.length-1].to < i-1)
                            modified.atts.push({from:i, to:i});
                        else
                            modified.atts[modified.atts.length-1].to = i;
                        nval += '+(atts['+i+'].value instanceof Value?1:0)';
                        dirty += '+(atts['+i+'].value instanceof Value?(atts['+i+'].value.dirty()?1:0):0)';
                        return '{name:"'+a.name+'",value:('+a.value.code+')}';
                    }
                    return '{name:"'+a.name+'",value:'+toJSON(a.value)+'}';
                }).join(',')+'], ['+vnode.childNodes.map(to_code).join(',')+'], null, {atts:'+toJSON(modified.atts)+',modified:'+nmod+',values:function(atts, Value){return ('+nval+');},dirty:function(atts, Value){return ('+dirty+');}})';
            }
        }
        else if (vnode.childNodes.length)
        {
            out = '_$$_(view, "", null, null, [], ['+vnode.childNodes.map(to_code).join(',')+'])';
        }
        return out;
    },
    to_string = function to_string(view, vnode) {
        var out = '', selfclosed = true, T = vnode.nodeType;
        if (T && T.length)
        {
            if ('t' === T)
            {
                out = vnode.nodeValue;
            }
            else if ('c' === T)
            {
                out = '<!--'+vnode.nodeValue+'-->';
            }
            else if ('collection' === T)
            {
                out = to_string(view, htmlNode(view, '', null, null, [], vnode.nodeValue.mapped()));
            }
            else
            {
                selfclosed = /*HAS.call(autoclosedTags, T)*/autoclosedTags[T];
                out = T.slice(0, -1)+(vnode.attributes.length ? ' '+vnode.attributes.reduce(function(atts, att) {
                    var val = att.value;
                    if (is_instance(val, Value))
                    {
                        if (val.dirty() && !val.key())
                            view.$reset.push(val);
                        val = val.val();
                    }
                    if (false !== val) atts.push(true === val ? att.name : att.name+'="'+val+'"');
                    return atts;
                }, []).join(' ') : '')+(selfclosed ? '/>' : '>');
                if (!selfclosed) out += to_string_all(view, vnode.childNodes)+'</'+T.slice(1);
            }
        }
        else if (vnode.childNodes.length)
        {
            out = to_string_all(view, vnode.childNodes);
        }
        return out;
    },
    to_string_all = function(view, nodes) {
        return nodes.map(function(n){return to_string(view, n);}).join('');
    },
    to_node = function to_node(view, vnode, with_meta) {
        var rnode, rmv, i, l, a, v, n, t, c, isSVG, T = vnode.nodeType, TT;
        if ('t' === T)
        {
            rnode = Text(vnode.nodeValue2);
        }
        else if ('c' === T)
        {
            rnode = document.createComment(vnode.nodeValue);
        }
        else if ('collection' === T)
        {
            rnode = to_node(view, htmlNode(view, '', null, null, [], vnode.nodeValue.mapped()), with_meta);
        }
        else if (!T || !T.length)
        {
            rnode = Fragment();
            for (i=0,l=vnode.childNodes.length; i<l; i++)
                rnode.appendChild(to_node(view, vnode.childNodes[i], with_meta));
        }
        else
        {
            isSVG = /*HAS.call(svgElements, T)*/svgElements[T];
            TT = lower(vnode[TYPE] || '');
            rnode = isSVG ? document.createElementNS('http://www.w3.org/2000/svg', T.slice(1,-1)) : document.createElement(T.slice(1,-1));
            for (i=0,l=vnode.attributes.length; i<l; i++)
            {
                a = vnode.attributes[i];
                n = a.name; v = a.value;
                if (is_instance(v, Value))
                {
                    if (v.dirty() && !v.key())
                        view.$reset.push(v);
                    v = v.val();
                }
                if (false === v) continue;
                if ('id' === n)
                {
                    rnode[n] = Str(v);
                }
                else if ('style' === n)
                {
                    rnode[n].cssText = Str(v);
                }
                else if ('class' === n)
                {
                    if (isSVG) rnode[SET_ATTR](n, Str(v));
                    else rnode[CLASS] = Str(v);
                }
                else if ('selected' === n && '<option>' === T)
                {
                    rnode[n] = true;
                }
                else if (('disabled' === n || 'required' === n) && ('<select>' === T || '<input>' === T || '<textarea>' === T))
                {
                    rnode[n] = true;
                }
                else if ('checked' === n && '<input>' === T && ('checkbox' === TT || 'radio' === TT))
                {
                    rnode[n] = true;
                }
                else if ('value' === n && '<input>' === T)
                {
                    rnode[n] = Str(v);
                }
                else if ('autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
                    'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
                    'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
                    'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
                {
                    rnode[n] = true;
                }
                /*else if (n in rnode)
                {
                    t = get_type(rnode[n]);
                    rnode[n] = T_NUM === t ? parseFloat(v) : (T_BOOL === t ? !!v : v);
                }*/
                else
                {
                    rnode[SET_ATTR](n, Str(true === v ? n : v));
                }
            }
            if (true === with_meta)
            {
                rnode[MV] = rmv = MV0();
                if (vnode.component)
                {
                    c = rmv.comp = vnode.component; vnode.component = null;
                    if (c.dom && c.dom[MV]) c.dom[MV].comp = null;
                    c.dom = rnode;
                }
                if (vnode.id) rmv.id = vnode.id;
                if (vnode.modified && vnode.modified.nodes.length) {rmv.mod = vnode.modified.nodes; vnode.modified = null;}
            }
            if (vnode.childNodes.length)
            {
                if ('<textarea>' === T)
                {
                    v = to_string_all(view, vnode.childNodes);
                    rnode[VAL] = v;
                    rnode[TEXTC] = v;
                    //rnode.innerHTML = v;
                }
                else if ('<script>' === T || '<style>' === T)
                {
                    rnode[TEXTC] = to_string_all(view, vnode.childNodes);
                }
                else
                {
                    for (i=0,l=vnode.childNodes.length; i<l; i++)
                    {
                        rnode.appendChild(to_node(view, vnode.childNodes[i], with_meta));
                    }
                }
            }
        }
        return rnode;
    },
    attr = function(vnode, name) {
        if (!vnode.atts)
        {
            vnode.atts = vnode.attributes.reduce(function(atts, a){
                atts['@'+a.name] = a.value;
                return atts;
            }, {});
        }
        return vnode.atts['@'+name];
    },
    del_att = function(r, n, T, TT) {
        if ('id' === n)
        {
            //r[n] = '';
            r[DEL_ATTR](n);
        }
        else if ('class' === n)
        {
            if (svgElements[T]) r[SET_ATTR](n, '');
            else r[CLASS] = '';
        }
        else if ('style' === n)
        {
            r[n].cssText = '';
        }
        else if ('selected' === n && '<option>' === T)
        {
            r[n] = false;
        }
        else if (('disabled' === n || 'required' === n) && ('<select>' === T || '<input>' === T || '<textarea>' === T))
        {
            r[n] = false;
        }
        else if ('checked' === n && '<input>' === T && ('checkbox' === TT || 'radio' === TT))
        {
            r[n] = false;
        }
        else if ('value' === n && '<input>' === T)
        {
            r[n] = '';
        }
        else if ('autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
            'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
            'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
            'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
        {
            r[n] = false;
        }
        /*else if ((n in r) && (T_BOOL === get_type(r[n])))
        {
            r[n] = false;
        }*/
        else
        {
            r[DEL_ATTR](n);
        }
        return r;
    },
    set_att = function(r, n, s, T, TT, unconditionally) {
        var t;
        //unconditionally = !unconditionally;
        if ('id' === n)
        {
            r[n] = Str(s);
        }
        else if ('class' === n)
        {
            s = Str(s);
            if (svgElements[T]) r[SET_ATTR](n, s);
            else r[CLASS] = s;
        }
        else if ('style' === n)
        {
            r[n].cssText = Str(s);
        }
        else if ('selected' === n && '<option>' === T)
        {
            r[n] = true;
        }
        else if (('disabled' === n || 'required' === n) && ('<select>' === T || '<input>' === T || '<textarea>' === T))
        {
            r[n] = true;
        }
        else if ('checked' === n && '<input>' === T && ('checkbox' === TT || 'radio' === TT))
        {
            r[n] = true;
        }
        else if ('value' === n && '<input>' === T)
        {
            if (r[n] !== s) r[n] = s;
        }
        else if ('autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
            'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
            'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
            'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
        {
            r[n] = true;
        }
        /*else if (n in r)
        {
            t = get_type(r[n]);
            s = T_NUM === t ? +s : (T_BOOL === t ? !!s : s);
            if (unconditionally || (r[n] !== s)) r[n] = s;
        }*/
        else
        {
            r[SET_ATTR](n, Str(true === s ? n : s));
        }
        return r;
    },
    nodeType = function(node) {
        switch (node.nodeType)
        {
            case 3: return 't';
            case 8: return 'c';
            default:
                var tagName = '<'+(node[TAG] || '')+'>';
                return svgElements[tagName] ? tagName : lower(tagName);
        }
    },
    morphAtts = function morphAtts(view, r, v, unconditionally) {
        var T, TT, vAtts, rAtts, mAtts, j, i, a, n, av;

        if (v.modified && v.modified.atts.length)
        {
            T = v.nodeType;
            TT = lower(v[TYPE] || '');
            // update modified attributes
            for (vAtts=v.attributes,mAtts=v.modified.atts,j=mAtts.length-1; j>=0; j--)
            {
                for (i=mAtts[j].from; i<=mAtts[j].to; i++)
                {
                    a = vAtts[i]; n = a.name; av = a.value;
                    if (is_instance(av, Value))
                    {
                        if (!av.dirty()) continue;
                        else if (!av.key()) view.$reset.push(av);
                        av = av.val();
                    }
                    if (false === av) del_att(r, n, T, TT);
                    else set_att(r, n, av, T, TT);
                }
            }
        }
        else if (true === unconditionally)
        {
            T = v.nodeType;
            TT = lower(v[TYPE] || '');
            vAtts = v.attributes;
            rAtts = r.attributes;
            // remove non-existent attributes
            for (i=rAtts.length-1; i>=0; i--)
            {
                a = rAtts[i]; n = a.name;
                if (null == attr(v, n)) del_att(r, n, T, TT);
            }
            // update new attributes
            for (i=vAtts.length-1; i>=0; i--)
            {
                a = vAtts[i]; n = a.name; av = a.value;
                if (is_instance(av, Value))
                {
                    if (av.dirty() && !av.key()) view.$reset.push(av);
                    av = av.val();
                }
                if (false === av) del_att(r, n, T, TT);
                else set_att(r, n, av, T, TT, true);
            }
        }
        return r;
    },
    eqNodes = function(r, v, T) {
        T = T || nodeType(r);
        var rmv = r[MV] || MV0();
        return (T === v.nodeType) && ((null == v.component && null == rmv.comp) || (null != v.component && null != rmv.comp && (v.component.name === rmv.comp.name))) && (v.id === rmv.id) && ('<input>' !== T || lower(v[TYPE]||'') === lower(r[TYPE]||''));
    },
    delNodes = function(view, r, index, count) {
        if (0 <= index && index < r.childNodes.length)
        {
            if (0 >= index && r.childNodes.length <= index+count)
            {
                // delete all children
                r.textContent = ''; // faster than using range below ??
            }
            else if (1 === count)
            {
                r.removeChild(r.childNodes[index]);
            }
            else
            {
                var range = Range();
                if (range)
                {
                    range.setStart(r, index);
                    range.setEnd(r, stdMath.min(r.childNodes.length, index+count));
                    range.deleteContents();
                    //range.detach();
                }
                else
                {
                    // old-fashioned way
                    for (; (0 < count) && (index < r.childNodes.length); count--)
                        r.removeChild(r.childNodes[index]);
                }
            }
        }
    },
    insNodes = function(view, r, v, index, count, lastNode) {
        var frag = null, vc = v.childNodes.length;
        if (1 < count)
        {
            // using fragment really faster??
            for (frag = Fragment(); 0 < count && index < vc /*&& frag.childNodes.length < count*/; count--,index++)
                frag.appendChild(to_node(view, v.childNodes[index], true));
        }
        else if (0 < count && index < vc)
        {
            frag = to_node(view, v.childNodes[index++], true);
        }
        if (frag)
        {
            if (lastNode) r.insertBefore(frag, lastNode);
            else r.appendChild(frag);
        }
        return index;
    },
    morphSingle = function morphSingle(view, r, rnode, vnode, unconditionally) {
        var T = vnode.nodeType, changed = vnode.changed, achanged = vnode.achanged, val;
        if ('t' === T)
        {
            if (changed || (unconditionally && (rnode.nodeValue !== vnode.nodeValue2)))
                rnode.nodeValue = vnode.nodeValue2;
        }
        else if ('c' === T)
        {
            if (changed || (unconditionally && (rnode.nodeValue !== vnode.nodeValue)))
                rnode.nodeValue = vnode.nodeValue;
        }
        else if ('<textarea>' === T)
        {
            // morph attributes/properties
            if (achanged || unconditionally)
                morphAtts(view, rnode, vnode, unconditionally);
            if (changed || unconditionally)
            {
                val = to_string_all(view, vnode.childNodes);
                /*if (rnode[VAL] !== val)
                {*/
                    rnode[VAL] = val;
                    rnode[TEXTC] = val;
                /*}*/
            }
        }
        else if ('<style>' === T || '<script>' === T)
        {
            // morph attributes/properties
            if (achanged || unconditionally)
                morphAtts(view, rnode, vnode, unconditionally);
            if (changed || unconditionally)
                rnode[TEXTC] = to_string_all(view, vnode.childNodes);
        }
        else
        {
            if (vnode.unit)
            {
                if (changed || unconditionally)
                {
                    r.replaceChild(to_node(view, vnode, true), rnode);
                }
            }
            else
            {
                // morph attributes/properties
                if (achanged || unconditionally)
                    morphAtts(view, rnode, vnode, unconditionally);
                // morph children
                if (changed || unconditionally)
                    morph(view, rnode, vnode);
            }
        }
    },
    morphSelectedNodes = function morphSelectedNodes(view, r, v, start, end, end2, startv, count) {
        var index, indexv, vnode, rnode, T, collection,
            diff, di, dc, d, items, keyed,
            i, j, k, l, m, n, w, x, z, len, frag;
        if ('collection' === v.childNodes[startv].nodeType)
        {
            collection = v.childNodes[startv].nodeValue;
            diff = collection.diff;
            for (di=0,dc=diff.length; di<dc; di++)
            {
                d = diff[di];
                m = collection.mappedItem;
                switch (d.action)
                {
                    case 'set':
                        len = collection.items().length*m;
                        items = collection.mapped();
                        frag = htmlNode(view, '', null, null, [], items);
                        morphSelectedNodes(view, r, frag, start, start+len-1, start+len-1, 0, count);
                        count = 0;
                        return count; // break from diff loop completely, this should be only diff
                        break;
                    case 'reorder':
                        len = collection.items().length;
                        k = len*m;
                        frag = Fragment();
                        j = r.childNodes[start+k];
                        n = slice.call(r.childNodes, start, start+k);
                        count = 0;
                        for (i=0; i<len; i++) for (l=0; l<m; l++) frag.appendChild(n[d.from[i]*m+l]);
                        if (j) r.insertBefore(frag, j);
                        else r.appendChild(frag);
                        return count; // break from diff loop completely, this should be only diff
                        break;
                    case 'add':
                        len = (d.to-d.from+1)*m;
                        items = collection.mapped(d.from, d.to);
                        insNodes(view, r, htmlNode(view, '', null, null, [], items), 0, len, r.childNodes[start+d.from*m]);
                        if (0 > count) count += len;
                        break;
                    case 'del':
                        len = (d.to-d.from+1)*m;
                        delNodes(view, r, start+d.from*m, len);
                        if (0 < count) count -= len;
                        break;
                    case 'swap':
                        i = slice.call(r.childNodes, start+d.from*m, start+d.from*m+m);
                        j = slice.call(r.childNodes, start+d.to*m, start+d.to*m+m);
                        k = j[j.length-1].nextSibling;
                        for (l=0; l<m; l++) r.replaceChild(j[l], i[l]);
                        if (k) for (l=0; l<m; l++) r.insertBefore(i[l], k);
                        else for (l=0; l<m; l++) r.appendChild(i[l]);
                        break;
                    case 'change':
                        len = (d.to-d.from+1)*m;
                        z = new Array(len);
                        for (w=start+d.from*m,j=0,i=0; i<len; i++)
                        {
                            rnode = r.childNodes[w+i];
                            x = rnode[MV] ? rnode[MV].comp : null;
                            if (x) z[j++] = x;
                        }
                        //z.length = j;
                        view.$cache['#'] = z;
                        items = collection.mapped(d.from, d.to);
                        frag = htmlNode(view, '', null, null, [], items);
                        view.$cache['#'] = z = null;
                        for (n=frag.childNodes,w=start+d.from*m,i=0,j=n.length; i<j; i++)
                        {
                            vnode = n[i]; rnode = r.childNodes[w+i];
                            if (eqNodes(rnode, vnode))
                                morphSingle(view, r, rnode, vnode);
                            else
                                r.replaceChild(to_node(view, vnode, true), rnode);
                        }
                        //morphSelectedNodes(view, r, frag, start+d.from*m, start+d.from*m+len-1, start+d.from*m+len-1, 0, 0);
                        break;
                }
            }
            // collection is supposed to cover whole current modification range
            return count;
        }

        keyed = {};
        if (v.childNodes[startv].id || v.childNodes[stdMath.min(v.childNodes.length-1, startv+end-start)].id)
        {
            // there are keyed nodes, associate them in a map for reuse
            for (index=start; index<=end; index++)
            {
                if (index >= r.childNodes.length) break;
                rnode = r.childNodes[index];
                //rnode[MV] = rnode[MV] || MV0();
                // store the keyed nodes in a map
                // to be retrieved and reused easily
                if (rnode[MV] && rnode[MV].id)
                    keyed['#'+rnode[MV].id] = rnode;
            }
        }
        for (indexv=startv,index=start; index<=end; index++,indexv++)
        {
            vnode = v.childNodes[indexv];
            if (index >= r.childNodes.length)
            {
                l = r.childNodes.length;
                insNodes(view, r, v, indexv, end-l+1, null);
                if (0 > count) count += end-l+1;
                break;
            }
            if ((0 > count) && (index >= end2+count+1))
            {
                insNodes(view, r, v, indexv, -count, r.childNodes[end2+count+1]);
                count = 0;
                break;
            }

            rnode = r.childNodes[index];
            T = nodeType(rnode);

            if (eqNodes(rnode, vnode, T))
            {
                morphSingle(view, r, rnode, vnode);
            }
            else if (vnode.id && (frag=keyed['#'+vnode.id]) && eqNodes(frag, vnode))
            {
                r.insertBefore(frag, rnode);
                morphSingle(view, r, frag, vnode);
            }
            else if (0 === count)
            {
                r.replaceChild(frag=to_node(view, vnode, true), rnode);
            }
            else if (0 > count)
            {
                r.insertBefore(frag=to_node(view, vnode, true), rnode);
                count++;
            }
            else
            {
                for (i=index,j=0; 0 < count && j < count; )
                {
                    j++;
                    if (index+j >= r.childNodes.length) break;
                    rnode = r.childNodes[index+j];
                    if (eqNodes(rnode, vnode)) break;
                }
                if (0 < j)
                {
                    delNodes(view, r, i, j);
                    count -= j;
                }
                if (index >= r.childNodes.length)
                {
                    insNodes(view, r, v, indexv, end-r.childNodes.length+1, null);
                    count = 0;
                    break;
                }
                else
                {
                    rnode = r.childNodes[index];
                    T = nodeType(rnode);
                    if (eqNodes(rnode, vnode, T))
                    {
                        morphSingle(view, r, rnode, vnode);
                    }
                    else
                    {
                        r.replaceChild(frag=to_node(view, vnode, true), rnode);
                    }
                }
            }
        }
        // finally remove any remaining nodes that need to be removed and haven't been already
        if (0 < count)
        {
            delNodes(view, r, end+1, count);
            count = 0;
        }
        return count;
    },
    morph = function morph(view, r, v, isRoot) {
        // morph r (real) DOM to match v (virtual) DOM
        var vc = v.childNodes.length, vpc = v.potentialChildNodes,
            count = 0, offset = 0, matched, match,
            mi, m, mc, di, dc, i, j, index, keyed,
            vnode, rnode, T, frag, unconditionally,
            rmv = r[MV] || MV0(),
            modifiedNodesPrev = rmv.mod,
            modifiedNodes = v.modified && v.modified.nodes,
            rComp = rmv.comp, vComp = v.component;

        r[MV] = rmv;
        rmv.id = v.id;
        rmv.comp = vComp; v.component = null;
        if ((rComp !== vComp) && rComp) rComp.dom = null;
        if (vComp) vComp.dom = r;
        // keeping ref both at node and vnode may hinder GC and increase mem consumption
        if (v.modified && v.modified.nodes.length) {rmv.mod = v.modified.nodes; v.modified = null;}
        else if (rmv.mod) rmv.mod = null;

        if (!r.childNodes.length)
        {
            if (0 < vc) insNodes(view, r, v, 0, vc, null);
        }
        else
        {
            modifiedNodesPrev = modifiedNodesPrev || [];
            modifiedNodes = modifiedNodes || [];
            offset = 0;
            matched = (0 < modifiedNodes.length) && (modifiedNodes.length === modifiedNodesPrev.length);
            if (matched)
            {
                for (count=0,mi=0,mc=modifiedNodes.length; mi<mc; mi++)
                {
                    m = modifiedNodes[mi];
                    match = (m.from === offset + modifiedNodesPrev[mi].from);
                    offset += (m.to - m.from + 1) - (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1);
                    count += match;
                }
                matched = (modifiedNodes.length === count) && (offset+r.childNodes.length === vpc);
            }
            if (matched)
            {
                for (offset=0,di=0,mi=0,mc=modifiedNodes.length; mi<mc; mi++)
                {
                    m = modifiedNodes[mi];
                    if (m.to < m.from)
                    {
                        count = (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1);
                        if (0 < count) delNodes(view, r, m.from, count);
                    }
                    else if (modifiedNodesPrev[mi].to < modifiedNodesPrev[mi].from)
                    {
                        count = (m.to - m.from + 1);
                        if (0 < count) insNodes(view, r, v, m.from-offset, 'collection' === v.childNodes[m.from-offset].nodeType ? 1 : count, r.childNodes[m.from]);
                    }
                    else
                    {
                        count = (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1) - (m.to - m.from + 1);
                        if (v.diff && (0 >= count) && (di < v.diff.length) && (v.componentNodes === v.potentialChildNodes) && (v.diff[di][0] >= m.from) && (v.diff[di][1] <= m.to))
                        {
                            for (dc=v.diff.length; (di<dc) && (v.diff[di][1]<=m.to); di++)
                            {
                                count = morphSelectedNodes(view, r, v, v.diff[di][0], v.diff[di][1], m.to, v.diff[di][0]-offset, count);
                            }
                        }
                        else
                        {
                            morphSelectedNodes(view, r, v, m.from, m.to, m.to, m.from-offset, count);
                        }
                    }
                    offset += (vc !== vpc && 'collection' === v.childNodes[m.from-offset].nodeType ? m.to-m.from : 0);
                }
            }
            else
            {
                unconditionally = true;
                // need to flatten first any existent collections
                for (index=vc-1; index>=0; index--)
                {
                    if ('collection' === v.childNodes[index].nodeType)
                        v.childNodes.splice.apply(v.childNodes, [index, 1].concat(htmlNode(view, '', null, null, [], v.childNodes[index].nodeValue.mapped()).childNodes));
                }
                vc = v.childNodes.length;
                keyed = {};
                for (index=0; index<vc; index++)
                {
                    if (v.childNodes[index].id)
                    {
                        // there are keyed nodes, associate them in a map for reuse
                        for (index=0,count=r.childNodes.length; index<count; index++)
                        {
                            rnode = r.childNodes[index];
                            //rnode[MV] = rnode[MV] || MV0();
                            // store the keyed nodes in a map
                            // to be retrieved and reused easily
                            if (rnode[MV] && rnode[MV].id)
                                keyed['#'+rnode[MV].id] = rnode;
                        }
                        break;
                    }
                }
                count = r.childNodes.length - vc;
                for (index=0; index<vc; index++)
                {
                    if (index >= r.childNodes.length)
                    {
                        insNodes(view, r, v, index, vc-r.childNodes.length, null);
                        if (0 > count) count = 0;
                        break;
                    }
                    vnode = v.childNodes[index];
                    rnode = r.childNodes[index];
                    T = nodeType(rnode);

                    if (eqNodes(rnode, vnode, T))
                    {
                        morphSingle(view, r, rnode, vnode, unconditionally);
                    }
                    else if (vnode.id && (frag=keyed['#'+vnode.id]) && eqNodes(frag, vnode))
                    {
                        r.insertBefore(frag, rnode);
                        morphSingle(view, r, frag, vnode, unconditionally);
                    }
                    else if (0 === count)
                    {
                        r.replaceChild(frag=to_node(view, vnode, true), rnode);
                    }
                    else if (0 > count)
                    {
                        r.insertBefore(frag=to_node(view, vnode, true), rnode);
                        count++;
                    }
                    else
                    {
                        for (i=index,j=0; 0 < count && j < count; )
                        {
                            j++;
                            if (index+j >= r.childNodes.length) break;
                            rnode = r.childNodes[index+j];
                            if (eqNodes(rnode, vnode)) break;
                        }
                        if (0 < j)
                        {
                            delNodes(view, r, i, j);
                            count -= j;
                        }
                        if (index >= r.childNodes.length)
                        {
                            insNodes(view, r, v, index, vc-r.childNodes.length, null);
                            count = 0;
                            break;
                        }
                        else
                        {
                            rnode = r.childNodes[index];
                            T = nodeType(rnode);
                            if (eqNodes(rnode, vnode, T))
                            {
                                morphSingle(view, r, rnode, vnode, unconditionally);
                            }
                            else
                            {
                                r.replaceChild(frag=to_node(view, vnode, true), rnode);
                            }
                        }
                    }
                }
                if (r.childNodes.length > vc) delNodes(view, r, vc, r.childNodes.length-vc);
            }
        }
    },
    add_nodes = function(el, nodes, index, move, isStatic) {
        var f, i, n, l = nodes.length, frag, _mvModifiedNodes = el[MV] ? el[MV].mod : null;
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
                        if (index < stdMath.max(_mvModifiedNodes[i].from, _mvModifiedNodes[i].to))
                        {
                            _mvModifiedNodes[i].from += l;
                            _mvModifiedNodes[i].to += l;
                        }
                        else if ((index >= _mvModifiedNodes[i].from && index <= _mvModifiedNodes[i].to) || (index === _mvModifiedNodes[i].from && _mvModifiedNodes[i].to < _mvModifiedNodes[i].from))
                        {
                            f = true;
                            if (!isStatic || (index < _mvModifiedNodes[i].to))
                            _mvModifiedNodes[i].to += l;
                        }
                    }
                    if (!f && !isStatic && _mvModifiedNodes.length && (index === el.childNodes.length) && (el.childNodes.length-1 === _mvModifiedNodes[_mvModifiedNodes.length-1].to))
                    {
                        _mvModifiedNodes[_mvModifiedNodes.length-1].to += l;
                    }
                }
                if (index === el.childNodes.length)
                {
                    if (1 < l)
                    {
                        frag = Fragment();
                        for (i=0; i<l; i++) frag.appendChild(nodes[i]);
                        el.appendChild(frag);
                    }
                    else
                    {
                        el.appendChild(nodes[0]);
                    }
                }
                else
                {
                    if (1 < l)
                    {
                        frag = Fragment();
                        n = el.childNodes[index];
                        for (i=0; i<l; i++) frag.appendChild(nodes[i]);
                        el.insertBefore(frag, n);
                    }
                    else
                    {
                        el.insertBefore(nodes[0], el.childNodes[index]);
                    }
                }
            }
        }
        return el;
    },
    remove_nodes = function(el, count, index, isStatic) {
        var f, i, l, range, _mvModifiedNodes = el[MV] ? el[MV].mod : null;
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
                        if (index < stdMath.max(_mvModifiedNodes[i].from, _mvModifiedNodes[i].to))
                        {
                            _mvModifiedNodes[i].from -= l;
                            _mvModifiedNodes[i].to -= l;
                        }
                        else if (index >= _mvModifiedNodes[i].from && index <= _mvModifiedNodes[i].to)
                        {
                            f = true;
                            _mvModifiedNodes[i].to = stdMath.max(_mvModifiedNodes[i].from-1, _mvModifiedNodes[i].to-l);
                        }
                    }
                }
                range = 1 < l ? Range() : null;
                if (range)
                {
                    range.setStart(el, index);
                    range.setEnd(el, stdMath.min(el.childNodes.length, index+l));
                    range.deleteContents();
                }
                else
                {
                    for (; 0 < l; l--) el.removeChild(el.childNodes[index]);
                }
            }
        }
    },

    insert_map = function(map, ks, v) {
        var m = map;
        each(ks, function(k, i){
            if (!HAS.call(m, 'c')) m.c = {};
            if (!HAS.call(m.c, k)) m.c[k] = {};
            m = m.c[k];
            if (ks.length-1 === i)
            {
                if (!HAS.call(m, 'v')) m.v = [v];
                else m.v.push(v);
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
            each(Keys(m.c), function(k){
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
            each(Keys(m.c), function(k){
                var kk = key + (key.length ? '.' : '') + k;
                if (m.c[k].c) walk_map(m.c[k], f, kk);
                else if (m.c[k].v) f(m.c[k].v, kk);
            });
        }
    },
    placeholder_re = /\{([0-9a-zA-Z\.\-_\$]+)\}/,
    get_placeholders = function get_placeholders(node, map) {
        var m, k, t, s, n;
        if (node)
        {
            if (3 === node.nodeType)
            {
                n = node;
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
                    each(node.attributes, function(a) {
                        var m, k, s = a.value, a1, a2, index = 0, txt = [s], keys = [];
                        while (s.length && (m = s.match(placeholder_re)))
                        {
                            k = trim(m[1]);
                            if (k.length)
                            {
                                if (-1 === keys.indexOf(k)) keys.push(k);
                                txt.pop();
                                a1 = a.value.slice(index, index+m.index);
                                a2 = a.value.slice(index+m.index+m[0].length);
                                if (a1.length) txt.push(a1);
                                txt.push({mvKey:k});
                                if (a2.length) txt.push(a2);
                            }
                            s = s.slice(m.index+m[0].length);
                            index += m.index + m[0].length;
                        }
                        if (1 === keys.length && 1 === txt.length)
                        {
                            insert_map(map.att1, keys[0].split('.'), {node:node, att:a.name});
                        }
                        else
                        {
                            each(keys, function(k) {
                                var t = {node:node, att:a.name, txt:txt.slice()};
                                insert_map(map.att, k.split('.'), t);
                            });
                        }
                    });
                }
                if (node.childNodes.length)
                {
                    each(node.childNodes, function(n) {
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
    morphTextVal = function(list, key, model) {
        var val = Str(model.get(key));
        each(list, function(t) {
            //if (t.nodeValue !== val)
                t.nodeValue = val;
        });
    },
    morphTextAtt1 = function(list, key, model) {
        var v = model.get(key);
        each(list, function(a) {
            var n = a.att, r = a.node;
            if (true === v || false === v)
            {
                // allow to enable/disable attributes via single boolean values
                if ('checked' === n || 'selected' === n || 'disabled' === n || 'required' === n || 'autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
                    'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
                    'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
                    'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
                {
                    r[n] = v;
                }
                else
                {
                    if (v) r[SET_ATTR](n, n);
                    else r[DEL_ATTR](n);
                }
            }
            else
            {
                v = Str(v);
                if ('id' === n)
                {
                    r[n] = v;
                }
                else if ('class' === n)
                {
                    r[CLASS] = v;
                }
                else if ('style' === n)
                {
                    r[n].cssText = v;
                }
                else if ('value' === n)
                {
                    if (r[n] !== v) r[n] = v;
                }
                else//if (r[ATTR](n) !== v)
                {
                    r[SET_ATTR](n, v);
                }
            }
        });
    },
    morphTextAtt = function(list, model) {
        each(list, function(a) {
            var r = a.node, n = a.att,
                v = a.txt.map(function(s) {return s.mvKey ? Str(model.get(s.mvKey)) : s;}).join('');
            if ('id' === n)
            {
                r[n] = v;
            }
            else if ('class' === n)
            {
                r[CLASS] = v;
            }
            else if ('style' === n)
            {
                r[n].cssText = v;
            }
            else if ('value' === n)
            {
                if (r[n] !== v) r[n] = v;
            }
            else//if (r[ATTR](n) !== v)
            {
                r[SET_ATTR](n, v);
            }
        });
    },
    morphText = function morphText(map, model, keys) {
        if (!map || (!map.txt && !map.att1 && !map.att)) return;
        if (keys)
        {
            each(keys, function(ks) {
                var kk = ks.split('.'), mt = map.txt, ma1 = map.att1, ma = map.att;
                each(kk, function(k, i) {
                    mt = mt && mt.c && HAS.call(mt.c, k) ? mt.c[k] : null;
                    ma1 = ma1 && ma1.c && HAS.call(ma1.c, k) ? ma1.c[k] : null;
                    ma = ma && ma.c && HAS.call(ma.c, k) ? ma.c[k] : null;
                    if (kk.length-1 === i)
                    {
                        walk_map(mt, function(list, k) {morphTextVal(list, k, model);}, ks);
                        walk_map(ma1, function(list, k) {morphTextAtt1(list, k, model);}, ks);
                        walk_map(ma, function(list) {morphTextAtt(list, model);}, ks);
                    }
                });
            });
        }
        else
        {
            walk_map(map.txt, function(list, k) {morphTextVal(list, k, model);}, '');
            walk_map(map.att1, function(list, k) {morphTextAtt1(list, k, model);}, '');
            walk_map(map.att, function(list) {morphTextAtt(list, model);}, '');
        }
    }
;

if (HASDOC && window.Node)
{
    // add ModelView custom prop to DOM Node prototype
    // so browser optimization is not affected
    window.Node[proto][MV] = null;
}
