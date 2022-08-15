/**
*
*   ModelView.js
*   @version: 5.1.0
*   @built on 2022-08-15 20:01:42
*
*   A simple, light-weight, versatile and fast isomorphic MVVM JavaScript framework (Browser and Server)
*   https://github.com/foo123/modelview.js
*
**//**
*
*   ModelView.js
*   @version: 5.1.0
*   @built on 2022-08-15 20:01:42
*
*   A simple, light-weight, versatile and fast isomorphic MVVM JavaScript framework (Browser and Server)
*   https://github.com/foo123/modelview.js
*
**/
!function(root, name, factory) {
"use strict";
if (('object' === typeof module) && module.exports) 
    module.exports = factory.call(root); /* CommonJS */
else if (('function' === typeof define) && define.amd && ('function' === typeof require) && ('function' === typeof require.specified) && require.specified(name))
    define(name, function() {return factory.call(root);}); /* AMD */
else if (!(name in root)) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root) || 1) && (('function' === typeof define) && define.amd) && define(function() {return root[name];});
}(  /* current root */          'undefined' !== typeof self ? self : this, 
    /* module name */           "ModelView",
    /* module factory */        function ModuleFactory__ModelView() {
/* main code starts here */
"use strict";

var HASDOC = ('undefined' !== typeof window) && ('undefined' !== typeof document);

/**[DOC_MARKDOWN]
### ModelView API

**Version 5.1.0**

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
var MV = '$MV', NAMESPACE = "modelview", mvDisplay = '--mvDisplay', WILDCARD = "*",
    MV0 = function(att,mod,id,comp,key) {return {att:att||null,mod:mod||null,id:id||null,comp:comp||null,key:key||null};},
    DEFAULT_MV = MV0(),
    undef = undefined, bindF = function(f, scope) {return f.bind(scope);},
    proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
    Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys, stdMath = Math,
    Func = Function, FP = Func[proto], Str = String, SP = Str[proto],
    A32I = Int32Array || Array,
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
    //FPCall = FP.call, hasProp = bindF(FPCall, OP.hasOwnProperty),
    toString = OP.toString, HAS = OP.hasOwnProperty, slice = AP.slice,
    nextTick = 'undefined' !== typeof Promise
        ? Promise.resolve().then.bind(Promise.resolve())
        : function(cb) {setTimeout(cb, 0);},
    INF = Infinity, rnd = stdMath.random,
    ESCAPED_RE = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g,
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
    SPACES = /\s+/g, NL = /\r\n|\r|\n/g,
    ATTR = 'getAttribute', SET_ATTR = 'setAttribute', HAS_ATTR = 'hasAttribute', DEL_ATTR = 'removeAttribute',
    CHECKED = 'checked', DISABLED = 'disabled', SELECTED = 'selected',
    NAME = 'name', TAG = 'tagName', TYPE = 'type', VAL = 'value',
    OPTIONS = 'options', SELECTED_INDEX = 'selectedIndex', PARENT = 'parentNode',
    NEXT = 'nextSibling', PREV = 'previousSibling',
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
    MATCHES = (function(P) {
        if (!P || P.matches) return 'matches';
        else if (P.matchesSelector) return 'matchesSelector';
        else if (P.webkitMatchesSelector) return 'webkitMatchesSelector';
        else if (P.mozMatchesSelector) return 'mozMatchesSelector';
        else if (P.msMatchesSelector) return 'msMatchesSelector';
        else if (P.oMatchesSelector) return 'oMatchesSelector';
    }(HASDOC && window.Element ? window.Element[proto] : null)),
    get_style = HASDOC && window.getComputedStyle
        ? function(el) {return window.getComputedStyle(el, null);}
        : function(el) {return el.currentStyle;},
    // UUID counter for ModelViews
    _uuid = 0, _cnt = 0,
    HAS_JSX = false, HAS_SIMPLE = false
;

if (HASDOC && window.Node)
{
    // add ModelView custom prop to DOM Node prototype
    // so browser optimization is not affected
    window.Node[proto][MV] = null;
}

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

function NOOP() {}
function newFunc(args, code) {return new Func(args, code);}
function is_instance(o, T) {return o instanceof T;}
function is_array(x) {return '[object Array]' === toString.call(x);}
function tostr(s) {return Str(s);}
function lower(s) {return s.toLowerCase();}
function upper(s) {return s.toUpperCase();}
function esc_re(s) {return s.replace(ESCAPED_RE, "\\$&");}
function notEmpty(s) {return 0 < s.length;}
function err(msg, data)
{
    var e = new Error(msg);
    if (null != data) e.data = data;
    return e;
}
function del(o, k, soft)
{
    o[k] = undef; if (!soft) delete o[k];
    return o;
}
function get_type(v)
{
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
}
function is_type(v, type) {return !!(type & get_type(v));}
function is_numeric(n) {return !isNaN(parseFloat(n, 10)) && isFinite(n);}
function is_array_index(n)
{
    if (is_numeric(n)) // is numeric
    {
        n = +n;  // make number if not already
        if ((0 === n % 1) && n >= 0) // and is positive integer
            return true;
    }
    return false
}
function nextNode(node, m, NEXT)
{
    for (var i=0; node && (i<m); ++i)
        node = node[NEXT];
    return node;
}
function moveNodes(dom, node, m, edge)
{
    var i, next;
    if (edge)
    {
        for (next=node[NEXT],i=0; node && (i<m); ++i)
        {
            dom.insertBefore(node, edge);
            node = next; next = node ? node[NEXT] : null;
        }
    }
    else
    {
        for (next=node[NEXT],i=0; node && (i<m); ++i)
        {
            dom.appendChild(node);
            node = next; next = node ? node[NEXT] : null;
        }
    }
}
function swap(array, i1, i2)
{
    var t = array[i1];
    array[i1] = array[i2];
    array[i2] = t;
    return array;
}
function swapNodes(dom, node1, node2, m)
{
    var last = nextNode(node2, m, NEXT);
    moveNodes(dom, node2, m, node1);
    moveNodes(dom, node1, m, last);
}
function permute(list, perm)
{
    for (var copy=slice.call(list),i=0,l=list.length; i<l; ++i) list[i] = copy[perm[i]];
    return list;
}
function permuteNodes(dom, start, perm, m)
{
    // not necessarily min DOM ops
    var i, j, len = perm.length, tlen = len*m,
        frag = Fragment(),
        edge = dom.childNodes[start+tlen],
        nodes = slice.call(dom.childNodes, start, start+tlen)
    ;
    for (i=0; i<len; ++i)
        for (j=0; j<m; ++j)
            frag.appendChild(nodes[perm[i]*m+j]);
    if (edge) dom.insertBefore(frag, edge);
    else dom.appendChild(frag);
    /*
    // permute DOM tree using minimum DOM operations
    var rNodes = dom.childNodes, cNodes,
        rnode, rnodef, rnode2, left,
        i1, i2, i, j, x, z, pos,
        places, lis, needsReorder, loop = true;

    i1 = 0; i2 = perm.length-1;
    rnode = rNodes[start+m*i1];
    rnodef = rNodes[start+m*i2];
    x = nextNode(rnodef, m, NEXT);

    while (loop)
    {
        loop = false;
        // start
        while ((i1 <= i2) && (i1 === perm[i1]))
        {
            ++i1;
            if (i1 > i2) {loop = false; break;}
            rnode = nextNode(rnode, m, NEXT);
        }
        // end
        while ((i1 <= i2) && (i2 === perm[i2]))
        {
            x = rnodef;
            --i2;
            if (i1 > i2) {loop = false; break;}
            rnodef = nextNode(rnodef, m, PREV);
        }
        // swap
        while ((i1 <= i2) && (i1 === perm[i2]) && (i2 === perm[i1]))
        {
            loop = true;
            rnode2 = nextNode(rnodef, m, PREV);
            moveNodes(dom, rnodef, m, rnode);
            rnodef = rnode2;
            rnode2 = nextNode(rnode, m, NEXT);
            moveNodes(dom, rnode, m, x);
            x = rnode;
            rnode = rnode2;
            ++i1; --i2;
            if (i1 > i2) {loop = false; break;}
        }
    }

    if (i1 <= i2)
    {
        left = i2-i1+1;
        places = new A32I(left);
        needsReorder = false;
        pos = 0;
        for (i=i1; i<=i2; ++i)
        {
            j = perm[i];
            places[j - i1] = i + 1;
            if (pos > j) needsReorder = true;
            else pos = j;
        }
        if (needsReorder)
        {
            // matched entries are not in increasing order
            // compute longest increasing subsequence
            lis = longest_incr_subseq(places); // O(n log n) !!
            j = lis.length - 1;
            cNodes = slice.call(rNodes, start+m*i1, start+m*i2+1); // store as immutable
            for (i=left-1; i>=0; --i)
            {
                pos = places[i];
                if ((0 > j) || (i !== lis[j]))
                {
                    // move existing entry in correct place
                    z = cNodes[m*(pos-1-i1)];
                    moveNodes(dom, z, m, x);
                    x = z;
                }
                else
                {
                    // new place for entry
                    x = cNodes[m*(pos-1-i1)];
                    --j;
                }
            }
        }
    }
    */
}
function flatten(array)
{
    return array.reduce(function(array, item) {
        if (is_array(item)) AP.push.apply(array, flatten(item));
        else array.push(item);
        return array;
    }, []);
}
function filter(a, f)
{
    return AP.filter.call(a, f);
}
function each(a, f)
{
    AP.forEach.call(a, f);
    return a;
}
function iterate(F, i0, i1, F0)
{
    for (var i=i0; i<=i1; ++i) F(i, F0, i0, i1);
    return F0;
}
function Merge(/* var args here.. */)
{
    var args = arguments, argslen,
        o1, o2, v, p, i, T ;
    o1 = args[0] || {};
    argslen = args.length;
    for (i=1; i<argslen; ++i)
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
}
// get a Universal Unique Identifier (UUID)
function uuid(namespace)
{
    return [namespace||'UUID', ++_uuid, NOW()].join('_');
}
function $id(id)
{
    if (HASDOC)
    {
        var found = document.getElementById(id);
        return found ? [found] : [];
    }
    return [];
}
function $tag(tagname, el)
{
    return HASDOC ? slice.call((el || document).getElementsByTagName(tagname), 0) : [];
}
function $class(classname, el)
{
    return HASDOC ? slice.call((el || document).getElementsByClassName(classname), 0) : [];
}
function $closest(selector, el)
{
    el = el || document;
    if (HASDOC)
    {
        if (el.closest)
        {
            var found = el.closest(selector);
            return found ? [found] : [];
        }
        else if (MATCHES && el[MATCHES])
        {
            while (el)
            {
                if (el[MATCHES](selector)) return [el];
                el = el.parentNode;
            }
            return [];
        }
    }
    return [];
}
function $sel(selector, el, single)
{
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
}
function get_dom_ref(el, ref)
{
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
}
function $style(el, prop, val)
{
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
}
function show(el)
{
    if ('' === $style(el, mvDisplay)) $style(el, mvDisplay, get_style(el).display || 'block');
    el[STYLE].display = 'none' !== $style(el, mvDisplay) ? $style(el, mvDisplay) : 'block';
    $style(el, mvDisplay, '');
}
function hide(el)
{
    if ('' === $style(el, mvDisplay)) $style(el, mvDisplay, get_style(el).display || 'block');
    el[STYLE].display = 'none';
}
function opt_val(o)
{
    // attributes.value is undefined in Blackberry 4.7 but
    // uses .value. See #6932
    var val = o.attributes[VAL];
    return !val || val.specified ? o[VAL] : o.text;
}
function select_get(el)
{
    var val, opt, options = el[OPTIONS], sel_index = el[SELECTED_INDEX],
        one = "select-one" === el[TYPE] || sel_index < 0,
        values = one ? null : [],
        max = one ? sel_index + 1 : options.length,
        i = sel_index < 0 ? max : (one ? sel_index : 0)
    ;

    // Loop through all the selected options
    for (; i<max; ++i)
    {
        opt = options[ i ];

        // oldIE doesn't update selected after form reset (#2551)
        if (
            (opt[SELECTED] || i === sel_index) &&
            // Don't return options that are disabled or in a disabled optgroup
            (!opt[DISABLED]) &&
            (!opt[PARENT][DISABLED] || 'OPTGROUP' !== opt[PARENT][TAG])
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
}
function select_set(el, v)
{
    var values = [].concat(v).map(tostr),
        options = el[OPTIONS], selected,
        opt, i, sel_index = -1, ret = false
    ;

    for (i=0; i<options.length; ++i)
    {
        opt = options[i];
        selected = opt[SELECTED];
        opt[SELECTED] = -1 < values.indexOf(opt_val(opt));
        if (selected !== opt[SELECTED]) ret = true;
    }
    if (!values.length) el[SELECTED_INDEX] = -1;
    return ret;
}
function get_val(el)
{
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
}
function set_val(el, v)
{
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
}
function get_index(node)
{
    return node && node.parentNode ? AP.indexOf.call(node.parentNode.childNodes, node) : 0;
}
function is_child_of(el, node, finalNode)
{
    if (el && node)
    {
        if (node === el) return node !== finalNode;
        else if (node.contains) return node.contains(el);
        //else if (node.compareDocumentPosition) return !!(node.compareDocumentPosition(p) & 16);
        while (el)
        {
            if (el === node) return node !== finalNode;
            if (el === finalNode) break;
            el = el.parentNode;
        }
    }
    return false;
}
var n_LIS = 0, _LIS, _LISP;
function longest_incr_subseq(a)
{
    // https://en.wikipedia.org/wiki/Longest_increasing_subsequence
    // O (n log n)
    var aI = 0, i = 0, j = 0, k = 0, seq,
        u = 0, v = 0, c = 0, len = a.length;

    if (len > n_LIS)
    {
        // avoid creating arrays, if it can fit
        n_LIS = len;
        _LIS = new A32I(n_LIS);
        _LISP = new A32I(n_LIS);
    }

    for (; i<len; ++i)
    {
        aI = a[i];

        if (0 < aI)
        {
            j = _LIS[k];
            if (a[j] < aI)
            {
                _LISP[i] = j;
                _LIS[++k] = i;
                continue;
            }

            u = 0;
            v = k;

            while (u < v)
            {
                // binary search
                c = (u + v) >> 1;
                if (a[_LIS[c]] < aI) u = c + 1;
                else v = c;
            }

            if (aI < a[_LIS[u]])
            {
                if (0 < u) _LISP[i] = _LIS[u - 1];
                _LIS[u] = i;
            }
        }
    }

    u = k + 1;
    seq = new A32I(u);
    v = _LIS[u - 1];
    while (u-- > 0)
    {
        seq[u] = v;
        v = _LISP[v];
        _LIS[u] = 0;
    }
    return seq;
}
function Fragment()
{
    return document.createDocumentFragment();
}
function Range()
{
    var range = null;
    try {
        range = document.createRange();
    } catch(e) {
        range = null;
    }
    return range;
}
function Text(val)
{
    return document.createTextNode(val);
}

///////////////////////////////////////////////////////////////////////////////////////
//
// utilities for simple mode
//
///////////////////////////////////////////////////////////////////////////////////////
HAS_SIMPLE = true;
var placeholder_re = /\{([0-9a-zA-Z\.\-_\$]+)\}/,
    foreach_re = /^foreach\s+([a-zA-Z_\$][0-9a-zA-Z_\$]*,)?([a-zA-Z_\$][0-9a-zA-Z_\$]*)\s+in\s+\{([0-9a-zA-Z\.\-_\$]+)\}\s*$/;

function tpl2codesimplek(tpl)
{
    var p1, p2, p, code = '';
    // parse simple keys
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
        p = trim(tpl.slice(p1+1, p2));
        code += "\n"+'_$$_ += (MODEL ? String(MODEL.get(\''+p+'\')) : \'{'+p+'}\');';
        tpl = tpl.slice(p2+1);
    }
    return code;
}
function tpl2codesimplef(tpl)
{
    var p1, p2, p, m, start, end, f = 0, offset = 0, code = '';
    // parse foreach (nested) loops
    while (-1 !== (p1=tpl.indexOf('<!--', offset)))
    {
        p2 = tpl.indexOf('-->', p1+4);
        if (-1 === p2) break;
        p = trim(tpl.slice(p1+4, p2));
        if (m=p.match(foreach_re))
        {
            if (0 === f)
            {
                start = [p1, p2+3, m[3], m[2], m[1] ? m[1].slice(0, -1) : null];
            }
            ++f;
            offset = p2+3;
        }
        else if ((0 < f) && startsWith(p, '/foreach'))
        {
            --f;
            if (0 === f)
            {
                end = [p1, p2+3];
                code += tpl2codesimplek(tpl.slice(0, start[0]));
                code += "\n_$$_ += (function(MODEL){var _$$_='',ITEM=function(MODEL){var _$$_='';"+tpl2codesimplef(tpl.slice(start[1], end[0]))+"\nreturn _$$_;};if(MODEL){for(var I=0,N=MODEL.get('"+start[2]+".length');I<N;++I){_$$_ += ITEM(MODEL.getProxy('"+start[2]+".'+I,'"+start[3]+"')._setIndex("+(start[4]?"'"+start[4]+"'":'null')+",I));}}else{_$$_='<!--foreach "+(start[4]?start[4]+',':'')+start[3]+" in {"+start[2]+"}-->'+ITEM()+'<!--/foreach-->';}return _$$_;})(MODEL);"
                tpl = tpl.slice(end[1]);
                offset = 0;
            }
            else
            {
                offset = p2+3;
            }
        }
        else
        {
            offset = p2+3;
        }
    }
    code += tpl2codesimplek(tpl);
    return code;
}
function tpl2codesimple(view, tpl, args, viewInstance)
{
    return newFunc('MODEL', '"use strict";'+"\n"+'var view='+(viewInstance||'this')+',_$$_=\'\';'+"\n"+tpl2codesimplef(trim(tpl))+"\nreturn _$$_;");
}
function insert_map(map, ks, v)
{
    if (!map) return;
    var m = map;
    each(ks, function(k, i) {
        if (!HAS.call(m, 'c')) m.c = {};
        if (!HAS.call(m.c, k)) m.c[k] = {};
        m = m.c[k];
        if (ks.length-1 === i)
        {
            if (!HAS.call(m, 'v')) m.v = [v];
            else m.v.push(v);
        }
    });
}
function del_map(m, d)
{
    if (!m) return;
    /*if (m.v)
    {
        d(m.v);
    }*/
    if (m.c)
    {
        each(Keys(m.c), function(k) {
            if (m.c[k].v)
            {
                d(m.c[k].v);
            }
            if (m.c[k].c)
            {
                del_map(m.c[k], d);
            }
            if ((!m.c[k].v || !m.c[k].v.length) && (!m.c[k].c || !Keys(m.c[k].c).length))
            {
                del(m.c, k);
            }
        });
    }
}
function walk_map(m, f, key)
{
    if (!m) return;
    key = key || '';
    if (m.v)
    {
        f(m.v, key);
    }
    if (m.c)
    {
        each(Keys(m.c), function(k) {
            var kk = key + (key.length ? '.' : '') + k;
            if (m.c[k].c) walk_map(m.c[k], f, kk);
            else if (m.c[k].v) f(m.c[k].v, kk);
        });
    }
}
function walk_clone_map(m, cm, f)
{
    if (!m) return;
    if (m.v)
    {
        cm.v = f(m.v);
    }
    if (m.c)
    {
        cm.c = {};
        each(Keys(m.c), function(k) {
            cm.c[k] = {};
            if (m.c[k].c) walk_clone_map(m.c[k], cm.c[k], f);
            else if (m.c[k].v) cm.c[k].v = f(m.c[k].v);
        });
    }
}
function split_key(key, rel)
{
    /*if (rel+'.' === key.slice(0, rel.length+1))
    {
        var ks = key.slice(rel.length+1).split('.');
        ks[0] = rel + ks[0];
        return ks;
    }*/
    return key.split('.');
}
function get_placeholders(node, map, path)
{
    var m, k, t, s, n, list, nn, nnn, f, index;
    if (!node) return node;
    path = path || 'n';
    if (node.attributes && node.attributes.length)
    {
        each(node.attributes, function(a) {
            var t, m, k, s = a.value, a1, a2, index = 0, txt = [s], keys = [];
            while (s.length && (m = s.match(placeholder_re)))
            {
                k = trim(m[1]);
                if (k.length)
                {
                    if (-1 === keys.indexOf(k)) keys.push(k);
                    txt.pop();
                    a1 = a.value.slice(index, index + m.index);
                    a2 = a.value.slice(index + m.index + m[0].length);
                    if (a1.length) txt.push(a1);
                    txt.push({mvKey:k});
                    if (a2.length) txt.push(a2);
                }
                s = s.slice(m.index + m[0].length);
                index += m.index + m[0].length;
            }
            if (1 === keys.length && 1 === txt.length)
            {
                insert_map(map, split_key(keys[0], '.'), {type:'att1', node:node, att:a.name, clone:newFunc('n','var c=null; try{c='+path+';}catch(e){c=null;}return c;')});
            }
            else if (keys.length)
            {
                t = {type:'att', node:node, att:a.name, txt:txt, clone:newFunc('n','var c=null; try{c='+path+';}catch(e){c=null;}return c;')};
                each(keys, function(k) {
                    insert_map(map, split_key(k, '.'), t);
                });
            }
        });
    }
    if (node.childNodes.length)
    {
        for (n=node.firstChild; n;)
        {
            if (3 === n.nodeType)
            {
                s = n.nodeValue; index = 0;
                while (s.length && (m = s.match(placeholder_re)))
                {
                    k = trim(m[1]);
                    if (k.length)
                    {
                        t = n.splitText(index + m.index);
                        n = t.splitText(m[0].length);
                        s = n.nodeValue;
                        index = 0;
                        insert_map(map, split_key(k, '.'), {type:'text', node:t, clone:newFunc('n','var c=null; try{c='+path+'.childNodes['+get_index(t)+']'+';}catch(e){c=null;}return c;')});
                    }
                    else
                    {
                        s = s.slice(m.index + m[0].length);
                        index += m.index + m[0].length;
                    }
                }
                n = n[NEXT];
            }
            else if (8 === n.nodeType)
            {
                if ((m = n.nodeValue.match(foreach_re)) && (k = trim(m[3])) && k.length)
                {
                    list = {type:'list', tpl:Fragment(), tplmap:{}, 'index':m[1]?m[1].slice(0, -1):null, 'var':trim(m[2]), start:n, end:null, clone:newFunc('n','var c=null; try{c='+path+'.childNodes['+get_index(n)+']'+';}catch(e){c=null;}return [c, c ? c.nextSibling : null];')};
                    nn = n[NEXT];
                    f = 1;
                    while (nn)
                    {
                        if (8 === nn.nodeType)
                        {
                            if (startsWith(nn.nodeValue, '/foreach'))
                            {
                                --f;
                                if (0 === f)
                                {
                                    list.end = nn;
                                    break;
                                }
                            }
                            else if (foreach_re.test(nn.nodeValue))
                            {
                                ++f;
                            }
                        }
                        if (3 === nn.nodeType && !trim(nn.nodeValue).length)
                        {
                            // ignore only whitespace
                            nnn = nn[NEXT];
                            node.removeChild(nn);
                            nn = nnn;
                        }
                        else
                        {
                            nnn = nn[NEXT];
                            list.tpl.appendChild(nn);
                            nn = nnn;
                        }
                    }
                    get_placeholders(list.tpl, list.tplmap);
                    insert_map(map, split_key(k, '.'), list);
                    n = nn ? nn[NEXT] : null;
                }
                else
                {
                    n = n[NEXT];
                }
            }
            else
            {
                get_placeholders(n, map, path+'.childNodes['+get_index(n)+']');
                n = n[NEXT];
            }
        }
    }
    return node;
}
function morphTextSimple(view, t, key, val, isDirty, model, onlyIfDirty)
{
    if (onlyIfDirty && !isDirty) return;
    if (t.node.nodeValue !== val) t.node.nodeValue = val;
}
function morphAtt1Simple(view, a, key, val, isDirty, model, onlyIfDirty)
{
    if (onlyIfDirty && !isDirty) return;
    var n = a.att, r = a.node;
    if (true === val || false === val)
    {
        // allow to enable/disable attributes via single boolean values
        if ('checked' === n || 'selected' === n || 'disabled' === n || 'required' === n || 'autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
            'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
            'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
            'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
        {
            r[n] = val;
        }
        else
        {
            if (val) r[SET_ATTR](n, n);
            else r[DEL_ATTR](n);
        }
    }
    else
    {
        if ('checked' === n || 'selected' === n || 'disabled' === n || 'required' === n || 'autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
            'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
            'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
            'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
        {
            r[n] = !!val;
        }
        else
        {
            val = Str(val);
            if ('id' === n)
            {
                if (r[n] !== val) r[n] = val;
            }
            else if ('class' === n)
            {
                r[CLASS] = val;
            }
            else if ('style' === n)
            {
                r[n].cssText = val;
            }
            else if ('value' === n)
            {
                if (r[n] !== val) r[n] = val;
            }
            else if (r[ATTR](n) !== val)
            {
                r[SET_ATTR](n, val);
            }
        }
    }
}
function morphAttSimple(view, a, key, val, isDirty, model, onlyIfDirty)
{
    //if (onlyIfDirty && !isDirty) return;
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
    else if (r[ATTR](n) !== v)
    {
        r[SET_ATTR](n, v);
    }
}
function clone(list)
{
    var cloned = {map: {}, dom: list.tpl.cloneNode(true)};
    walk_clone_map(list.tplmap, cloned.map, function(v) {
        return v.map(function(t) {
            switch (t.type)
            {
                case 'text':
                return {
                    type: t.type,
                    node: t.clone(cloned.dom),
                    clone: t.clone
                };
                case 'att1':
                return {
                    type: t.type,
                    node: t.clone(cloned.dom),
                    att: t.att,
                    clone: t.clone
                };
                case 'att':
                return {
                    type: t.type,
                    node: t.clone(cloned.dom),
                    att: t.att,
                    txt: t.txt,
                    clone: t.clone
                };
                case 'list':
                var startend = t.clone(cloned.dom);
                return {
                    type: t.type,
                    tpl: t.tpl,
                    tplmap: t.tplmap,
                    'index': t['index'],
                    'var': t['var'],
                    start: startend[0],
                    end: startend[1],
                    clone: t.clone
                };
            }
        });
    });
    return cloned;
}
function morphCollectionSimple(view, list, key, collection, isDirty, model, onlyIfDirty)
{
    if (!is_instance(collection, Collection)) return;
    var diff = collection.diff;
    if (!diff.length) return;
    view.$reset[collection.id()] = collection;
    var items = collection.items(), start = list.start, end = list.end,
        parentNode = start.parentNode, startIndex = get_index(start),
        m = list.tpl.childNodes.length, di, dc, d,
        range, frag, n, count, i, j, k, l, x;
    list.map = list.map || [];
    for (di=0,dc=diff.length; di<dc; ++di)
    {
        d = diff[di];
        switch(d.action)
        {
            case 'set':
                count = items.length - list.map.length;
                // morph common nodes
                iterate(function(index) {
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, list['var'])._setData(items[index])._setIndex(list['index'], index), true);
                }, 0, stdMath.min(list.map.length, items.length)-1);
                if (0 < count)
                {
                    // add missing nodes
                    frag = Fragment();
                    list.map.push.apply(new Array(count));
                    iterate(function(index) {
                        var node = clone(list);
                        list.map[index] = node.map;
                        morphSimple(view, list.map[index], model.getProxy(key+'.'+index, list['var'])._setData(items[index])._setIndex(list['index'], index), false);
                        frag.appendChild(node.dom);
                    }, items.length-count, items.length-1);
                    if (end) parentNode.insertBefore(frag, end);
                    else parentNode.appendChild(frag);
                }
                else if (0 > count)
                {
                    // remove excess nodes
                    list.map.splice(items.length, -count);
                    delNodes(null, parentNode, startIndex+1+m*items.length, -m*count);
                }
                return;
            case 'replace':
                // delete all and add new
                delNodes(null, parentNode, startIndex+1, m*list.map.length);
                list.map = new Array(items.length);
                frag = Fragment();
                iterate(function(index) {
                    var node = clone(list);
                    list.map[index] = node.map;
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, list['var'])._setData(items[index])._setIndex(list['index'], index), false);
                    frag.appendChild(node.dom);
                }, 0, items.length-1);
                if (end) parentNode.insertBefore(frag, end);
                else parentNode.appendChild(frag);
                return;
            case 'reorder':
                permuteNodes(parentNode, startIndex+1, d.from, m);
                permute(list.map, d.from);
                return;
            case 'swap':
                swapNodes(parentNode, parentNode.childNodes[startIndex+1+d.from*m], parentNode.childNodes[startIndex+1+d.to*m], m);
                swap(list.map, d.from, d.to);
                break;
            case 'del':
                list.map.splice(d.from, d.to-d.from+1);
                delNodes(null, parentNode, startIndex+1+m*d.from, m*(d.to-d.from+1));
                break;
            case 'add':
                x = new Array(2+d.to-d.from+1); x[0] = d.from; x[1] = 0;
                list.map.splice.apply(list.map, x);
                frag = Fragment();
                iterate(function(index) {
                    var node = clone(list);
                    list.map[index] = node.map;
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, list['var'])._setData(items[index])._setIndex(list['index'], index), false);
                    frag.appendChild(node.dom);
                }, d.from, d.to);
                n = parentNode.childNodes[startIndex+1+m*d.from];
                if (n) parentNode.insertBefore(frag, n);
                else parentNode.appendChild(frag);
                break;
            case 'change':
                iterate(function(index) {
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, list['var'])._setData(items[index])._setIndex(list['index'], index), true);
                }, d.from, d.to);
                break;
        }
    }
}
function morphSimple(view, map, model, onlyIfDirty)
{
    walk_map(map, function(nodeList, key) {
        var val = model.get(key), isDirty = model.isDirty(key);
        each(nodeList, function(node) {
            switch (node.type)
            {
                case 'text':
                morphTextSimple(view, node, key, Str(val), isDirty, model, onlyIfDirty);
                break;
                case 'att1':
                morphAtt1Simple(view, node, key, val, isDirty, model, onlyIfDirty);
                break;
                case 'att':
                morphAttSimple(view, node, key, val, isDirty, model, onlyIfDirty);
                break;
                case 'list':
                morphCollectionSimple(view, node, key, val, isDirty, model, onlyIfDirty);
                break;
            }
        });
    }, '');
}

//
// PublishSubscribe (Interface)
var CAPTURING_PHASE = 1, AT_TARGET = 2, BUBBLING_PHASE = 3;

function getNS(evt)
{
    var ns = evt.split('.'), e = ns[0];
    ns = filter(ns.slice(1), notEmpty);
    return [e, ns.sort()];
}
function getNSMatcher(givenNamespaces)
{
    return givenNamespaces.length
        ? new Regex( "(^|\\.)" + givenNamespaces.join("\\.(?:.*\\.|)") + "(\\.|$)" )
        : false;
}

function PBEvent(evt, target, ns)
{
    var self = this;
    if (!is_instance(self, PBEvent)) return new PBEvent(evt, target, ns);
    // http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Event
    self.type = evt;
    self.target = target;
    self.currentTarget = target;
    self.timeStamp = NOW();
    self.eventPhase = AT_TARGET;
    self.namespace = ns || null;
}
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
        if (!PB) return self;
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
        if (PB && evt && evt.length && is_type(callback, T_FUNC))
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
        if (!PB) return self;
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

var floor = Math.floor, round = Math.round, abs = Math.abs,
    tpl_$0_re = /\$0/g
;

function ModelField(modelField)
{
    if (!is_instance(this, ModelField)) return new ModelField(modelField);
    this.f = modelField || null;
}
function CollectionEach(f)
{
    if (!is_instance(this, CollectionEach)) return new CollectionEach(f);
    this.f = f || null;
    this.fEach = 1;
}
function pad(s, len, ch)
{
    var sp = String(s), n = len-sp.length;
    return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
}
// Validator Compositor
function VC(V)
{
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
}

/**[DOC_MARKDOWN]
#### Types
**(used with Models)**

```javascript
// modelview.js type casters

[/DOC_MARKDOWN]**/
var Type = {

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
};
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
var Validation = {

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
};
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
// http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
var index_to_prop_re = /\[([^\]]*)\]/g,
    trailing_dots_re = /^\.+|\.+$/g;

function get_next(a, k)
{
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
}
function get_value(a, k)
{
    if (!a) return null;
    var i, ai, l = a.length;
    if (undef !== k)
    {
        for (i=0; i<l; ++i)
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
        for (i=0; i<l; ++i)
        {
            ai = a[ i ];
            if (ai && ai.v) return ai.v;
        }
    }
    return null;
}
function walk_and_add(v, p, obj, isCollectionEach)
{
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
}
function walk_and_check(p, obj, aux, C)
{
    var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
    while (i < l)
    {
        k = p[i++];
        if (is_instance(o, Collection)) o = o.items();
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
}
function walk_and_get2(p, obj, aux, C)
{
    var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
    while (i < l)
    {
        k = p[i++];
        if (is_instance(o, Collection)) o = o.items();
        to = get_type( o );
        if (i < l)
        {
            if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
            {
                o = o[ k ];
                // nested sub-composite class
                if (is_instance(o, C)) return [C, o, p.slice(i)];
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
}
function walk_and_get_value2(p, obj, aux, C)
{
    var o = obj, a = aux, k, to, i = 0, l = p.length;
    while (i < l)
    {
        k = p[i++];
        if (is_instance(o, Collection) && i < l) o = o.items();
        to = get_type( o );
        if (i < l)
        {
            if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
            {
                o = o[ k ];
                // nested sub-composite class
                if (is_instance(o, C)) return [C, o, p.slice(i)];
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
            if (is_instance(o[k], C)) return [C, o[k], p.slice(i)];
            else if (a /*&& get_value( a, k )*/ && (is_instance(o, Collection) || ((to&T_ARRAY_OR_OBJ) && HAS.call(o,k)))) return [true, o, k, a];
            return false;
        }
    }
    return false;
}
function walk_and_get3(p, obj, aux1, aux2, aux3, C, all3, collections)
{
    var o = obj, a1 = null, a2 = null, a3 = null,
        k, to, i = 0, l = p.length
    ;
    all3 = false !== all3;
    if (all3) { a1 = [aux1]; a2 = [aux2]; a3 = [aux3]; }

    while (i < l)
    {
        k = p[i++];
        if (is_instance(o, Collection) && i < l)
        {
            if (collections) collections.push([o, +k, p.slice(0, i-1)]);
            o = o.items();
        }
        to = get_type( o );
        if (i < l)
        {
            if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
            {
                o = o[ k ];
                // nested sub-composite class
                if (is_instance(o, C)) return [C, o, p.slice(i), 0, null, null, null];
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
        else if (is_instance(o, Collection))
        {
            return [true, o, k, p.slice(i), a1, a2, a3];
        }
        else if (to & T_ARRAY_OR_OBJ)
        {

            // nested sub-composite class
            if (is_instance(o[ k ], C))
                return [C, o[k], p.slice(i), 0, null, null, null];
            else if (HAS.call(o,k) /*|| (to === T_OBJ && "length" === k)*/)
                return [true, o, k, p.slice(i), a1, a2, a3];
            return [false, o, k, p.slice(i), a1, a2, a3];
        }
    }
    return [false, o, k, p.slice(i), null, null, null];
}
function dotted(key)
{
    //        convert indexes to properties     strip leading/trailing dots
    return key.replace(index_to_prop_re, '.$1').replace(trailing_dots_re, '');
}
function bracketed(dottedKey)
{
    return '['+dottedKey.split('.').join('][')+']';
}
function removePrefix(prefix)
{
    // strict mode (after prefix, a key follows)
    var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
    return function(key, to_dotted) {
        var k = key.replace(regex, '$1');
        return to_dotted ? dotted(k) : k;
    };
}
function keyLevelUp(dottedKey, level)
{
    return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
}
function addModelTypeValidator(model, dottedKey, typeOrValidator, modelTypesValidators)
{
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
}
function addModelGetterSetter(model, dottedKey, getterOrSetter, modelGettersSetters)
{
    var k, t;
    t = get_type(getterOrSetter);
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
}
function modelDefaults(model, data, defaults)
{
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
}
// handle collection and sub-composite models as data, via walking the data
function serializeModel(model_instance, model_class, data, dataType)
{
    var key, type;
    if (arguments.length < 3) data = model_instance.$data;

    while (is_instance(data, model_class)) { data = data.data( ); }

    if (is_instance(data, Value)) data = data.val();
    if (is_instance(data, Collection)) data = data.items();
    type = dataType || get_type( data );
    data = T_OBJ & type ? Merge({}, data) : (T_ARRAY & type ? data.slice(0) : data);

    if (T_ARRAY_OR_OBJ & type)
    {
        for (key in data)
        {
            if (HAS.call(data,key))
            {
                if (is_instance(data[ key ], Value))
                    data[ key ] = data[ key ].val( );
                if (is_instance(data[ key ], Collection))
                    data[ key ] = serializeModel( model_instance, model_class, data[ key ].items(), type );
                else if (is_instance(data[ key ], model_class))
                    data[ key ] = serializeModel(data[ key ], model_class, Merge( {}, data[ key ].data( ) ));
                else if (T_ARRAY_OR_OBJ & (type=get_type(data[ key ])))
                    data[ key ] = serializeModel( model_instance, model_class, data[ key ], type );
            }
        }
    }

    return data;
}
// handle collections and sub-composite models via walking the data and any attached typecasters
function typecastModel(model, modelClass, dottedKey, data, typecasters, prefixKey)
{
    var o, key, val, typecaster, r, res, nestedKey, splitKey;
    prefixKey = !!prefixKey ? (prefixKey+'.') : '';
    data = data || model.$data;
    if (is_instance(data, Collection)) data = data.items();
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
                    if (is_instance(o, Collection)) o = o.items();
                    nestedKey = splitKey.slice(0, -1).join('.');
                    val = o[ key ]; typecaster = get_value( r[3], key );
                    if (typecaster)
                    {
                        if (is_instance(val, Value))
                            o[ key ].set(typecaster.call(model, val.val(), prefixKey+dottedKey), true);
                        else
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
}
// handle sub-composite models via walking the data and any attached validators
function validateModel(model, modelClass, breakOnError, dottedKey, data, validators)
{
    var o, key, val, validator, r, res, nestedKey, splitKey, fixKey,
        result = {isValid: true, errors: [ ]}
    ;
    //breakOnError = !!breakOnError;
    data = data || model.$data;
    if (is_instance(data, Collection)) data = data.items();
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
                        result.errors = result.errors.concat(res.errors.map(fixKey));
                        result.isValid = false;
                    }
                    if (!result.isValid && breakOnError) return result;
                }
                else
                {
                    if (is_instance(o, Collection)) o = o.items();
                    nestedKey = splitKey.slice(0, -1).join('.');

                    val = o[ key ]; validator = get_value( r[3], key );
                    if (is_instance(val, Value)) val = val.val();
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
                                    result.errors = result.errors.concat(res.errors.map(fixKey));
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
}
function syncHandler(evt, data)
{
    var model = evt.target, $syncTo = model.$syncTo,
        key = data.key, val, keyDot, allKeys, allKeyslen,
        otherkey, othermodel, callback, k, skey,
        syncedKeys, i, l, prev_atomic, prev_atom, __syncing
    ;
    if (key)
    {
        // make this current key an atom, so as to avoid any circular-loop of updates on same keys
        keyDot = key + '.';
        allKeys = Keys($syncTo); allKeyslen = allKeys.length;
        prev_atomic = model.atomic; prev_atom = model.$atom;
        model.atomic = true; model.$atom = key;
        //val = HAS.call(data,'value') ? data.value : model.get( key );
        for (k=0; k<allKeyslen; ++k)
        {
            skey = allKeys[ k ];
            if (skey === key || startsWith(skey, keyDot))
            {
                syncedKeys = $syncTo[skey]; val = model.get( skey );
                for (i=0,l=syncedKeys.length; i<l; ++i)
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
function getDirty(u, ks)
{
    var upds = [], k;
    if (u.k)
    {
        if (ks && ks.length)
        {
            k = ks[0];
            if (u.k[k])
            {
                ks.shift();
                return getDirty(u.k[k], ks);
            }
        }
        else
        {
            each(Keys(u.k), function(k){
                if (u.k[k].f) upds.push(k);
                var rest = getDirty(u.k[k], ks);
                if (rest.length) upds.push.apply(upds, rest.map(function(kk){return k+'.'+kk;}));
                //else upds.push(k);
            });
        }
    }
    return upds;
}
function setDirty(model, key, many)
{
    if (many) each(key, function(k){model.setDirty(k.split('.'));});
    else model.setDirty(key);
}
function isDirty(u, ks, i)
{
    if (!u) return false;
    if (u.f) return true;
    i = i || 0;
    if (!u.k || (i >= ks.length)) return false;
    return (HAS.call(u.k, ks[i]) ? isDirty(u.k[ks[i]], ks, i+1) : false) || isDirty(u.k[WILDCARD], ks, i+1);
}

// Array multi - sorter utility
// returns a sorter that can (sub-)sort by multiple (nested) fields
// each ascending or descending independantly
function sorter()
{
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
        for (i=l-1; i>=0; --i)
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
}

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
    if (!is_instance(model, Model)) return new Model(id, data, types, validators, getters, setters, dependencies);

    model.$id = uuid('Model');
    model.namespace = model.id = id || model.$id;
    model.key = removePrefix(model.id);

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
    if (is_instance(o, Value)) o = o.val();
    if (is_instance(o, Collection)) o = o.items();
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
    ,namespace: null
    ,$id: null
    ,$data: null
    ,$types: null
    ,$idependencies: null
    ,$validators: null
    ,$getters: null
    ,$setters: null
    ,$upds: null
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
        model.$upds = null;
        model.atomic = false;
        model.$atom = null;
        model.key = null;
        model.$autovalidate = false;
        model.$syncTo = null;
        model.$syncHandler = null;
        model.__syncing = null;
        return model;
    }

    ,key: null

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

    ,setDirty: function(ks) {
        var model = this, i, l, u;
        if (!model.$upds) model.$upds = {};
        u = model.$upds;
        //if (!is_array(ks)) ks = Str(ks).split('.');
        for (i=0,l=ks.length; i<l; ++i)
        {
            if (!u.k) u.k = {};
            if (!u.k[ks[i]]) u.k[ks[i]] = {};
            u = u.k[ks[i]];
            if (i+1 === l) u.f = true;
        }
        return model;
    }
    ,getDirty: function(ks) {
        var model = this;
        return model.$upds ? getDirty(model.$upds, ks) : [];
    }
    ,isDirty: function(ks) {
        var model = this, u = model.$upds;
        if (!arguments.length) return !!(u && u.k);
        if (!is_array(ks)) ks = Str(ks).split('.');
        return isDirty(u, ks, 0);
    }
    ,resetDirty: function() {
        this.$upds = null;
        return this;
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
                    for (i=0; i<d.length; ++i)
                    {
                        // add hierarchical/dotted key, all levels
                        kk = d[i].split('.');
                        dk = kk[0];
                        if (!HAS.call(dependencies,dk)) dependencies[ dk ] = [ ];
                        if (0 > dependencies[ dk ].indexOf( k )) dependencies[ dk ].push( k );
                        for (j=1; j<kk.length; ++j)
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
// model get given key as dynamic Model.Value -- see Model.Value below -- (bypass custom model getters if RAW is true)
model.getVal( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,getVal: function(dottedKey, RAW) {
        var model = this, data = model.$data, getters = model.$getters, r, ks, ret;

        // test and split (if needed) is fastest
        if (0 > dottedKey.indexOf('.'))
        {
            // handle single key fast
            if (!RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v)
            {
                ret = r.v.call(model, dottedKey);
                return is_instance(ret, Value) ? ret : Value(v, dottedKey, true).changed(model.isDirty([dottedKey]));
            }
            return is_instance(data[dottedKey], Value) ? data[dottedKey] : Value(data[dottedKey], dottedKey, true).changed(model.isDirty([dottedKey]));
        }
        else if ((r = walk_and_get2( ks=dottedKey.split('.'), data, RAW ? null : getters, Model )))
        {
            // nested sub-model
            if (Model === r[ 0 ])
            {
                return r[ 1 ].getVal(r[ 2 ].join('.'), RAW);
            }
            // custom getter
            else if (false === r[ 0 ])
            {
                ret = r[ 1 ].call(model, dottedKey);
                return is_instance(ret, Value) ? ret : Value(ret, dottedKey, true).changed(model.isDirty(ks));
            }
            // model field
            return is_instance(r[ 1 ], Value) ? r[ 1 ] : Value(r[ 1 ], dottedKey, true).changed(model.isDirty(ks));
        }
        return undef;
    }

/**[DOC_MARKDOWN]
// get data proxy for a branch of model data specified by given key refernced as relVar
// model.Proxy is used to get/set values of the object (and nested objects)
// at given branch of the model data as autonomous entity
// proxy takes care to notify central model of any changes made
model.getProxy( String dottedKey, String relVar );

[/DOC_MARKDOWN]**/
    ,getProxy: function(dottedKey, rel) {
        return new Proxy(this, dottedKey, rel);
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
        for (f=0,fl=fields.length; f<fl; ++f)
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
                    if (is_instance(o, Collection) && i < l) o = o.items();
                    if (i < l)
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; ++kk)
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
                                for (kk=0; kk<o.length; ++kk)
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
                                for (kk=0; kk<keys.length; ++kk)
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
                                for (kk=0; kk<o.length; ++kk)
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
            type, validator, setter, ks,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            prevval, canSet = false, validated,
            autovalidate = model.$autovalidate,
            collections = []
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
            ks = [dottedKey];
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
        else if ((r = walk_and_get3( ks=dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model, true, collections )))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    prevval = o.get(k);
                    if (is_instance(prevval, Value)) prevval = prevval.val();
                    if (is_instance(val, Value)) val = val.val();
                    if (prevval !== val)
                    {
                        o.set(k, val, pub, callData);
                        each(collections, function(collection){
                            collection[0].upd(collection[1]);
                            setDirty(model, collection[2]);
                        });
                    }
                    else pub = false;
                }
                else
                {
                    prevval = o.data( );
                    if (prevval !== val) o.data(val);
                    else pub = false;
                }

                setDirty(model, ks);
                pub && model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'set',
                    valuePrev: prevval,
                    $callData: callData
                });

                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey))
                {
                    //setDirty(model, ideps[dottedKey], true);
                    pub && model.notify(ideps[dottedKey]);
                }
                return model;
            }

            setter = get_value(r[6], k);
            if (!setter && (false === r[0] && r[3].length))
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
            if (is_instance(val, Value)) val = val.val();
            if (type)
            {
                val = type.call(model, val, dottedKey);
            }
            else if (collection_type)
            {
                for (i=0,l=val.length; i<l; ++i)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if (collection_validator)
            {
                for (i=0,l=val.length; i<l; ++i)
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
                    setDirty(model, ks);
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
                    each(collections, function(collection){
                        collection[0].upd(collection[1]);
                        setDirty(model, collection[2]);
                    });
                    setDirty(model, ks);
                    pub && model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'set',
                        $callData: callData
                    });
                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey))
                    {
                        //setDirty(model, ideps[dottedKey], true);
                        pub && model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            prevval = is_instance(o, Collection) ? o.get(k) : (is_instance(o[k], Collection) ? o[k].items() : o[ k ]);
            if (is_instance(prevval, Value)) prevval = prevval.val();
            // update/set only if different
            if (prevval !== val)
            {
                each(collections, function(collection){
                    collection[0].upd(collection[1]);
                    setDirty(model, collection[2]);
                });

                // modify or add final node here
                if (is_instance(o, Collection)) o.set(k, val);
                else if (is_instance(o[k], Collection)) o[k].set(val);
                else if (is_instance(o[k], Value)) o[k].set(val);
                else o[ k ] = val;

                setDirty(model, ks);
                pub && model.publish('change', {
                    key: dottedKey,
                    value: val,
                    valuePrev: prevval,
                    action: 'set',
                    $callData: callData
                });
                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey))
                {
                    //setDirty(model, ideps[dottedKey], true);
                    pub && model.notify(ideps[dottedKey]);
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
            type, validator, setter, ks,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            canSet = false, validated,
            autovalidate = model.$autovalidate,
            collections = []
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
            ks = [dottedKey];
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
        else if ((r = walk_and_get3(ks=dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model, true, collections)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    o.add(k, val, prepend, pub, callData);
                    each(collections, function(collection){
                        collection[0].upd(collection[1]);
                        setDirty(model, collection[2]);
                    });
                }
                else
                {
                    index = 0;
                    o.data(val);
                }

                setDirty(model, ks/*.concat(index)*/);
                pub && model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: prepend ? 'prepend' : 'append',
                    index: index,
                    $callData: callData
                });
                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey))
                {
                    //setDirty(model, ideps[dottedKey], true);
                    pub && model.notify(ideps[dottedKey]);
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
                for (i=0,l=val.length; i<l; ++i)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if ( collection_validator )
            {
                for (i=0,l=val.length; i<l; ++i)
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
                    setDirty(model, ks);
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
                    each(collections, function(collection){
                        collection[0].upd(collection[1]);
                        setDirty(model, collection[2]);
                    });
                    setDirty(model, ks);
                    if (pub)
                    {
                        if (is_instance(o[k], Collection) || (T_ARRAY === get_type(o[ k ])))
                        {
                            index = prepend ? 0 : (is_instance(o[k], Collection) ? o[k].items().length : o[k].length);
                        }
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: prepend ? 'prepend' : 'append',
                            index: index,
                            $callData: callData
                        });
                    }
                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey))
                    {
                        //setDirty(model, ideps[dottedKey], true);
                        pub && model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            if (is_instance(o[k], Collection) || (T_ARRAY === get_type(o[ k ])))
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
                    index = is_instance(o[k], Collection) ? o[k].items().length : o[ k ].length;
                    o[ k ].push(val);
                }
            }
            else
            {
                // not array-like, do a set operation, in case
                index = -1;
                o[ k ] = val;
            }

            each(collections, function(collection){
                collection[0].upd(collection[1]);
                setDirty(model, collection[2]);
            });

            setDirty(model, ks/*.concat(index)*/);
            pub && model.publish('change', {
                key: dottedKey,
                value: val,
                action: 'append',
                index: index,
                $callData: callData
            });
            // notify any dependencies as well
            if (HAS.call(ideps,dottedKey))
            {
                //setDirty(model, ideps[dottedKey], true);
                pub && model.notify(ideps[dottedKey]);
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
            type, validator, setter, ks,
            collection_type = null, collection_validator = null,
            is_collection = false,
            types, validators, setters, ideps,
            canSet = false, validated,
            autovalidate = model.$autovalidate,
            collections = []
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
            ks = [dottedKey];
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
        else if ((r = walk_and_get3(ks=dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model, true, collections)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    o.ins(k, val, index, pub, callData);
                    each(collections, function(collection){
                        collection[0].upd(collection[1]);
                        setDirty(model, collection[2]);
                    });
                }
                else
                {
                    //index = 0;
                    o.data(val);
                }

                setDirty(model, ks/*.concat(index)*/);
                pub && model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'insert',
                    index: index,
                    $callData: callData
                });
                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey))
                {
                    //setDirty(model, ideps[dottedKey], true);
                    pub && model.notify(ideps[dottedKey]);
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
                for (i=0,l=val.length; i<l; ++i)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if (collection_validator)
            {
                for (i=0,l=val.length; i<l; ++i)
                    if (!collection_validator.call(model, val[i], dottedKey))
                    {
                        validated = false;
                        break;
                    }
            }
            if (!validated)
            {
                if (callData) callData.error = true;
                setDirty(model, ks/*.concat(index)*/);
                pub && model.publish('error', {
                    key: dottedKey,
                    value: /*val*/undef,
                    action: 'insert',
                    index: -1,
                    $callData: callData
                });
                return model;
            }

            // custom setter
            if (setter)
            {
                if (false !== setter.call(model, dottedKey, val, pub))
                {
                    each(collections, function(collection){
                        collection[0].upd(collection[1]);
                        setDirty(model, collection[2]);
                    });
                    setDirty(model, ks/*.concat(index)*/);
                    pub && model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'insert',
                        index: index,
                        $callData: callData
                    });
                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey))
                    {
                        //setDirty(model, ideps[dottedKey], true);
                        pub && model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            if (is_instance(o[k], Collection) || (T_ARRAY === get_type(o[ k ])))
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

            each(collections, function(collection){
                collection[0].upd(collection[1]);
                setDirty(model, collection[2]);
            });

            setDirty(model, ks/*.concat(index)*/);
            pub && model.publish('change', {
                key: dottedKey,
                value: val,
                action: 'insert',
                index: index,
                $callData: callData
            });
            // notify any dependencies as well
            if (HAS.call(ideps,dottedKey))
            {
                //setDirty(model, ideps[dottedKey], true);
                pub && model.notify(ideps[dottedKey]);
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
        var model = this, r, o, k, p, val, index = -1, canDel = false, collections = [], ideps = model.$idependencies, ks;

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
            ks = [k];
            canDel = true;
        }
        else if ((r = walk_and_get3(ks=dottedKey.split('.'), o, null, null, null, Model, false, collections)))
        {
            o = r[ 1 ]; k = r[ 2 ];
            ks.length = ks.length-1; // not include removed key/index

            if (Model === r[ 0 ] && k.length)
            {
                // nested sub-model
                k = k.join('.');
                val = o.get(k);
                o.del(k, reArrangeIndexes, pub, callData);
                each(collections, function(collection){
                    collection[0].upd(collection[1]);
                    setDirty(model, collection[2]);
                });
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
            if (is_instance(o, Collection))
            {
                index = +k;
                val = o.get(index);
                o.splice(index, 1);
                reArrangeIndexes = true;
            }
            else
            {
                val = o[ k ]; o[ k ] = undef;
                if (reArrangeIndexes)
                {
                    T = get_type( o );
                     // re-arrange indexes
                    if ((T_ARRAY == T) && is_array_index( k )) {index = +k; o.splice(index, 1);}
                    else if (T_OBJ == T) delete o[ k ];
                }
                else
                {
                    delete o[ k ]; // not re-arrange indexes
                }
            }

            each(collections, function(collection){
                collection[0].upd(collection[1]);
                setDirty(model, collection[2]);
            });

            setDirty(model, ks);
            pub && model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'delete',
                    index: index,
                    rearrange: reArrangeIndexes,
                    $callData: callData
                });

            k = ks.join('.');
            // notify any dependencies as well
            if (HAS.call(ideps,k))
            {
                //setDirty(model, ideps[k], true);
                pub && model.notify(ideps[k]);
            }

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
            data, stack, to_remove, dottedKey, collections = [];

        if (!fields || !fields.length) return model;
        if (fields.substr) fields = [fields];
        reArrangeIndexes = false !== reArrangeIndexes;
        data = model.$data;
        for (f=0,fl=fields.length; f<fl; ++f)
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
                    if (is_instance(o, Collection) && i < l)
                    {
                        collections.push([o, +k]);
                        o = o.items();
                    }
                    if (i < l)
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; ++kk)
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
                                for (kk=0; kk<o.length; ++kk)
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
                        if (is_instance(o, Collection))
                        {
                            if (WILDCARD === k)
                            {
                                o.set([]);
                            }
                            else
                            {
                                o.splice(+k, 1);
                            }
                        }
                        else if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; ++kk)
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
                                for (kk=o.length-1; kk>=0; --kk)
                                {
                                    if (reArrangeIndexes)
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
        each(collections, function(collection){
            collection[0].upd(collection[1]);
            setDirty(model, collection[2]);
        });
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
                for (i=list.length-1; i>=0; --i)
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
                for (i=list.length-1; i>=0; --i)
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
                model.setDirty(dottedKey.split('.'));
                model.publish(evt, d);
            }
            else if (T_ARRAY === t)
            {
                // notify multiple keys
                l = dottedKey.length;
                for (k=0; k<l; ++k)
                {
                    d.key = dk = dottedKey[ k ];
                    if (HAS.call(keys,'_'+dk)) continue;
                    // notify any dependencies as well
                    keys['_'+dk] = 1;
                    if (HAS.call(ideps,dk)) deps = deps.concat(ideps[dk]);
                    model.setDirty(dk.split('.'));
                    model.publish(evt, d);
                }
            }

            while (l = deps.length)
            {
                // notify any dependencies as well
                deps2 = [];
                d = {key: '', action: 'set'};
                for (k=0; k<l; ++k)
                {
                    dk = deps[ k ];
                    // avoid already notified keys previously
                    if (HAS.call(keys,'_'+dk)) continue;
                    keys['_'+dk] = 1;
                    if (HAS.call(ideps,dk)) deps2 = deps2.concat(ideps[dk]);
                    d.key = dk;
                    model.setDirty(dk.split('.'));
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
Model[proto].setChanged = Model[proto].setDirty;
Model[proto].getChanged = Model[proto].getDirty;
Model[proto].isChanged = Model[proto].isDirty;
Model[proto].resetChanged = Model[proto].resetDirty;

function Proxy(model, key, rel)
{
    var self = this, getKey, prefix, data = NOOP, indexKey = null, index = 0, getData;
    if (!is_instance(self, Proxy)) return new Proxy(model, key, rel);

    key = null == key ? '' : key;
    prefix = !key || !key.length ? '' : (key + '.');
    getKey = function(dottedKey) {
        var ret;
        if (rel && rel.length)
        {
            if ('' === dottedKey || rel === dottedKey)
            {
                ret = key;
            }
            else if (indexKey && (indexKey === dottedKey))
            {
                ret = new String(indexKey);
                ret.$mvIndex = true;
            }
            else if (('.' === rel) && ('.' === dottedKey.charAt(0)))
            {
                ret = prefix + dottedKey.slice(1);
            }
            else if (startsWith(dottedKey, rel+'.'))
            {
                ret = prefix + dottedKey.slice(rel.length+1);
            }
            else
            {
                ret = new String(dottedKey);
                ret.$mvTop = true;
            }
        }
        else
        {
            ret = new String(dottedKey);
            ret.$mvTop = true;
        }
        return ret;
    };
    getData = function(dottedKey, isReal) {
        if (!rel || !rel.length) return NOOP;
        var realKey = isReal ? dottedKey : getKey(dottedKey);
        if (realKey.$mvTop) return NOOP;
        if (realKey.$mvIndex) return index;
        if (NOOP === data) data = model.get(key);
        if ('' === realKey || key === realKey) return data;
        realKey = realKey.split('.');
        for (var i=0,l=realKey.length,o=data; i<l; ++i)
        {
            if (HAS.call(o, realKey[i])) o = o[realKey[i]];
            else return NOOP;
        }
        return o;
    };
    self._setData = function(d) {
        data = d;
        return self;
    };
    self._setIndex = function(k, i) {
        if (k && k.length)
        {
            indexKey = k;
            index = i;
        }
        return self;
    };
    self.get = function(dottedKey, RAW) {
        var fullKey = getKey(dottedKey), ret = getData(fullKey, true);
        return NOOP === ret ? model.get(fullKey, RAW) : ret;
    };
    self.getVal = function(dottedKey, RAW) {
        var fullKey = getKey(dottedKey), ret = getData(fullKey, true);
        return NOOP === ret ? model.getVal(fullKey, RAW) : Value(ret, fullKey, true).dirty(fullKey.$mvIndex ? true : model.isDirty(fullKey));
    };
    self.getProxy = function(dottedKey, rel) {
        return new Proxy(model, getKey(dottedKey), rel);
    };
    self.getChanged = self.getDirty = function() {
        var d = model.getDirty(key && key.length ? key.split('.') : null);
        if (indexKey) d.push(indexKey);
        return d;
    };
    self.isChanged = self.isDirty = function(dottedKey) {
        var realKey = getKey(dottedKey);
        return realKey.$mvIndex ? true/*model.isDirty(key)*/ : model.isDirty(realKey);
    };
    self.set = function(dottedKey, val, pub, callData) {
        model.set(getKey(dottedKey), val, pub, callData);
        return self;
    };
    self.add = self.append = function(dottedKey, val, prepend, pub, callData) {
        model.add(getKey(dottedKey), val, prepend, pub, callData);
        return self;
    };
    self.ins = self.insert = function(dottedKey, val, index, pub, callData) {
        model.ins(getKey(dottedKey), val, index, pub, callData);
        return self;
    };
    self.del = self.remove = self['delete'] = function(dottedKey, pub, reArrangeIndexes, callData) {
        model.del(getKey(dottedKey), pub, reArrangeIndexes, callData);
        return self;
    };
}
Model.Proxy = Proxy;
Proxy[proto] = {
    constructor: Proxy
    ,_setData: null
    ,_setIndex: null
    ,get: null
    ,getVal: null
    ,getProxy: null
    ,getDirty: null
    ,getChanged: null
    ,isDirty: null
    ,isChanged: null
    ,set: null
    ,add: null
    ,append: null
    ,ins: null
    ,insert: null
    ,del: null
    ,remove: null
    ,'delete': null
};

/**[DOC_MARKDOWN]
// dynamic value data structure, which keeps note of when value is dirty (has changed)
var value = new Model.Value(val [, String key=undefined]);
var val = value.val(); // get value
value.set(newVal); // set new value and update dirty flag as needed
var isDirty = value.changed(); // get dirty flag
value.reset(); // reset dirty flag
var key = value.key(); // get associated Model key of value (if associated with some Model key, else undefined/null)

[/DOC_MARKDOWN]**/
function Value(_val, _key, noID)
{
    var self = this, _dirty = true, _id = 0;
    if (is_instance(_val, Value)) {_key = _val.key(); _val = _val.val();}
    if (!is_instance(self, Value)) return new Value(_val, _key, noID);

    _id = true === noID ? 0 : (++_cnt);
    self.id = function() {
        return _id;
    };
    self.key = function(key) {
        if (arguments.length)
        {
            _key = key;
            return self;
        }
        else
        {
            return _key;
        }
    };
    self.val = function() {
        return _val;
    };
    self.set = function(val, noDirty) {
        if (is_instance(val, Value)) val = val.val();
        if (val !== _val)
        {
            _val = val;
            _dirty = !noDirty;
        }
        return self;
    };
    self.reset = function() {
        _dirty = false;
        return self;
    };
    self.changed = self.dirty = function(isDirty) {
        if (arguments.length)
        {
            _dirty = !!isDirty;
            return self;
        }
        else
        {
            return _dirty;
        }
    };
}
Model.Value = Value;
Value[proto] = {
    constructor: Value
    ,id: null
    ,key: null
    ,val: null
    ,set: null
    ,reset: null
    ,changed: null
    ,dirty: null
    ,toString: function() {
        return Str(this.val());
    }
    ,valueOf: function() {
        return this.val().valueOf();
    }
};

/**[DOC_MARKDOWN]
// dynamic collection data structure, which keeps note of which manipulations are done and reflects these as DOM manipulations if requested
var collection = new Model.Collection( [Array array=[]] );

[/DOC_MARKDOWN]**/
function Collection(array)
{
    var self = this, _id = 0;
    if (is_instance(array, Collection)) return array;
    if (!is_instance(self, Collection)) return new Collection(array);
    _id = ++_cnt;
    self.id = function() {
        return _id;
    };
    self.set(array || []);
}
Model.Collection = Collection;
Collection[proto] = {
    constructor: Collection
    ,_items: null
    ,diff: null
    ,mapper: null
    ,mappedItem: 1
    ,id: null
    ,dispose: function() {
        var self = this;
        self._items = null;
        self.diff = null;
        self.mapper = null;
        return self;
    }
    ,_upd: function(action, start, end) {
        var diff = this.diff/*, last = diff.length ? diff[diff.length-1] : null*/;
        /*if (!last || (last.action !== action) || (last.to < start-1) || (last.from >= end))
        {*/
            diff.push({action:action, from:start, to:end});
        /*}
        else
        {
            last.to = stdMath.max(last.to, end);
        }*/
        return this;
    }
/**[DOC_MARKDOWN]
// reset all manipulations so far, data are kept intact, return same collection
collection.reset();

[/DOC_MARKDOWN]**/
    ,reset: function() {
        var self = this;
        self.diff = [];
        self.mapper = null;
        self.mappedItem = 1;
        return self;
    }
/**[DOC_MARKDOWN]
// clone this collection and/or the data (optionally with any Array.map functions as well)
collection.clone(Boolean type = undefined);
collection.clone(true) // new instance with **cloned** array **and** Array.map function
collection.clone(false) // new instance with **original** array, without Array.map function
collection.clone() // new instance with **original** array **and** Array.map function

[/DOC_MARKDOWN]**/
    ,clone: function(type) {
        var self = this, cloned = new Collection();
        cloned._items = true === type ? self._items.slice() : self._items;
        cloned.diff = self.diff.slice();
        if (false !== type)
        {
            cloned.mapper = self.mapper;
            cloned.mappedItem = self.mappedItem;
        }
        return cloned;
    }
/**[DOC_MARKDOWN]
// get the (array) items of this collection (optionally between start and end index, like Array.slice)
collection.items([startIndex[, endIndex]]);

[/DOC_MARKDOWN]**/
    ,items: function(startIndex, endIndex) {
        return arguments.length ? this._items.slice.apply(this._items, arguments) : this._items;
    }

/**[DOC_MARKDOWN]
// get data item at index
collection.get(index);

[/DOC_MARKDOWN]**/
    ,get: function(index) {
        return arguments.length ? this._items[index] : this._items;
    }
/**[DOC_MARKDOWN]
// set data item at index, or whole data if passed as single argument, return same collection
collection.set(index, dataItem);
collection.set(newData);

[/DOC_MARKDOWN]**/
    ,set: function(index, data) {
        var self = this;
        if (1 === arguments.length)
        {
            self._items = index;
            self.reset()._upd('set', 0, self._items.length-1);
        }
        else if (2 === arguments.length)
        {
            if (0 > index) index += self._items.length;
            if (index >= self._items.length)
            {
                self.push(data);
            }
            else if (0 <= index)
            {
                if (is_instance(self._items[index], Value))
                {
                    self._items[index].set(data);
                    if (self._items[index].changed()) self._upd('change', index, index);
                }
                else if (self._items[index] !== data)
                {
                    self._items[index] = data;
                    self._upd('change', index, index);
                }
            }
        }
        return self;
    }
/**[DOC_MARKDOWN]
// mark entry at index as changed
collection.upd(index);

[/DOC_MARKDOWN]**/
    ,upd: function(index) {
        return this._upd('change', index, index);
    }
/**[DOC_MARKDOWN]
// replace data with completely new data, return same collection
collection.replace(newData);

[/DOC_MARKDOWN]**/
    ,replace: function(data) {
        var self = this;
        if (self._items !== data)
        {
            self._items = data;
            self.reset()._upd('replace', 0, self._items.length-1);
        }
        return self;
    }
/**[DOC_MARKDOWN]
// swap data item at index1 with data item at index2, return same collection
collection.swap(index1, index2);

[/DOC_MARKDOWN]**/
    ,swap: function(index1, index2) {
        var self = this, t;
        if (index1 !== index2 && 0 <= index1 && 0 <= index2 && index1 < self._items.length && index2 < self._items.length)
        {
            t = self._items[index1]
            self._items[index1] = self._items[index2];
            self._items[index2] = t;
            self._upd('swap', stdMath.min(index1, index2), stdMath.max(index1, index2));
        }
        return self;
    }
/**[DOC_MARKDOWN]
// sort items given a `compare` function (same as Array.sort), return same collection
collection.sort(Function compare);

[/DOC_MARKDOWN]**/
    ,sort: function(compare) {
        var self = this, items = self._items.map(function(it, i){return [it, i];});
        compare = compare || function(a, b) {return a < b ? -1 : (a > b ? 1 : 0);};
        items.sort(function(a, b) {return compare(a[0], b[0]);});
        self._items = items.map(function(it) {return it[0];});
        self._upd('reorder', items.map(function(it) {return it[1];}), null);
        return self;
    }
/**[DOC_MARKDOWN]
// push data item, return same collection
collection.push(dataItem);

[/DOC_MARKDOWN]**/
    ,push: function(data) {
        var self = this;
        self._items.push(data);
        self._upd('add', self._items.length-1, self._items.length-1);
        return self;
    }
/**[DOC_MARKDOWN]
// pop data item, return result of pop
collection.pop();

[/DOC_MARKDOWN]**/
    ,pop: function() {
        var self = this, data;
        if (self._items.length)
        {
            data = self._items.pop();
            self._upd('del', self._items.length, self._items.length);
        }
        return data;
    }
/**[DOC_MARKDOWN]
// unshift data item, return same collection
collection.unshift(dataItem);

[/DOC_MARKDOWN]**/
    ,unshift: function(data) {
        var self = this;
        self._items.unshift(data);
        self._upd('add', 0, 0);
        return self;
    }
/**[DOC_MARKDOWN]
// shift data item, return result of shift
collection.shift();

[/DOC_MARKDOWN]**/
    ,shift: function() {
        var self = this, data;
        if (self._items.length)
        {
            data = self._items.shift();
            self._upd('del', 0, 0);
        }
        return data;
    }
/**[DOC_MARKDOWN]
// splice collection, return result of splice
collection.splice(index, numRemoved, ..);

[/DOC_MARKDOWN]**/
    ,splice: function(index, to_del) {
        var self = this, ret, to_add = arguments.length - 2;
        if (0 <= index && index < self._items.length)
        {
            if (0 < to_del || 0 < to_add)
            {
                ret = self._items.splice.apply(self._items, arguments);
                if (to_add >= to_del)
                {
                    self._upd('change', index, index+to_del-1);
                    if (to_add > to_del) self._upd('add', index+to_del, index+to_add-1);
                }
                else
                {
                    self._upd('del', index, index+to_del-to_add-1);
                    if (0 < to_add) self._upd('change', index, index+to_add-1);
                }
            }
        }
        return ret;
    }
/**[DOC_MARKDOWN]
// concat array, in place, return same collection
collection.concat(array);

[/DOC_MARKDOWN]**/
    ,concat: function(items) {
        var self = this, l;
        if (items.length)
        {
            l = self._items.length;
            self._items.push.apply(self._items, items);
            self._upd('add', l, self._items.length-1);
        }
        return self;
    }
/**[DOC_MARKDOWN]
// map collection items given a map function, return same collection
// actual mapping is executed lazily when actually requested (see below),
// else func is stored to be used later, items remain intact
// **NOTE** that map function should return that many html nodes for each item passed as denoted by `itemsReturned` parameter (default 1), so that fast morphing can work as expected
collection.mapTo(func [, Number itemsReturned = 1]);

[/DOC_MARKDOWN]**/
    ,mapTo: function(f, itemsReturned) {
        this.mapper = f;
        this.mappedItem = +(itemsReturned || 1);
        return this;
    }
/**[DOC_MARKDOWN]
// perform actual mapping (see above), return mapped collection items array
collection.mapped([start [, end]]);

[/DOC_MARKDOWN]**/
    ,mapped: function(start, end) {
        var items = this._items, f = this.mapper, i, j, l, ret;
        start = null == start ? 0 : start;
        end = null == end ? items.length-1 : end;
        if (end >= start)
        {
            if (f)
            {
                for (l=end-start+1,ret=new Array(l),i=0,j=start; i<l; ++i,++j)
                    ret[i] = f(items[j], j, items);
            }
            else
            {
                ret = items.slice(start, end+1);
            }
            return ret;
        }
        return [];
    }
};
/**[DOC_MARKDOWN]
```
[/DOC_MARKDOWN]**/

// View utils
var numeric_re = /^\d+$/,
    empty_brackets_re = /\[\s*\]$/,
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
    eventOptionsSupported = null
;

function contains_non_strict(collection, value)
{
    if (collection)
    {
        for (var i=0,l=collection.length; i<l; ++i)
            if (value == Str(collection[i])) return true;
    }
    return false;
}
function normalisePath(path)
{
    if (path && path.length)
    {
        path = trim(path);
        if ('#' === path.charAt(0)) path = path.slice(1);
        if ('/' === path.charAt(0)) path = path.slice(1);
        if ('/' === path.slice(-1)) path = path.slice(0, -1);
        path = trim(path);
    }
    return path;
}
function fields2model(view, elements)
{
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
        if (!startsWith(key, model_prefix)) return;
        key = key.slice(model_prefix.length);

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
}
function serialize_fields(node, name_prefix)
{
    var data = {},
        model_prefix = name_prefix && name_prefix.length ? name_prefix + '.' : null,
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
}
function do_bind_action(view, evt, elements, fromModel)
{
    var model = view.$model, event = evt.type;

    if ('sync' === event) event = 'change';
    iterate(function(i) {
        var el, cel, c, comp, do_action, data;
        el = elements[i]; if (!el) return;
        do_action = el[ATTR](view.attr('mv-on-'+(fromModel ? 'model-' : '')+event));
        if (!do_action || !do_action.length) return;
        each(do_action.split(','), function(do_action){
            do_action = trim(do_action);
            if (!do_action.length) return;
            data = {};
            if (fromModel)
            {
                data.key = fromModel.key;
                data.value = fromModel.value;
            }
            if (':' === do_action.charAt(0))
            {
                // local component action
                do_action = do_action.slice(1);
                if (!do_action.length) return;
                cel = el;
                while (cel)
                {
                    c = cel[MV] ? cel[MV].comp : null;
                    if (c)
                    {
                        comp = view.$components['#'+c.name];
                        if (is_instance(comp, View.Component) && comp.opts && comp.opts.actions && ('function' === typeof comp.opts.actions[do_action]))
                        {
                            data.component = c;
                            comp.opts.actions[do_action].call(c, evt, el, data);
                            return;
                        }
                    }
                    cel = cel.parentNode;
                    if (cel === view.$renderdom) return;
                }
            }
            else
            {
                // main view action
                if ('text' === do_action)
                {
                    do_action = 'html';
                    data.text = true;
                }
                do_action = 'do_' + do_action;
                if ('function' !== typeof view[do_action]) return;
                data.view = view;
                view[do_action](evt, el, data);
            }
        });
    }, 0, elements.length-1);
}
function do_auto_bind_action(view, evt, elements, fromModel)
{
    var model = view.$model, cached = {};

    iterate(function(i) {
        var el, name, key, ns_key, value;
        el = elements[i];  if (!el) return;
        name = el[NAME]; key = 0;
        el[MV] = el[MV] || MV0();
        if (!el[MV].key && !!name) el[MV].key = model.key(name, 1);
        key = el[MV].key; if (!key) return;

        // use already cached key/value
        ns_key = '_'+key;
        if (HAS.call(cached, ns_key))  value = cached[ ns_key ][ 0 ];
        else if (model.has(key)) cached[ ns_key ] = [ value=model.get( key ) ];
        else return;  // nothing to do here

        // call default action (ie: live update)
        view.do_bind(evt, el, {name:name, key:key, value:value});
    }, 0, elements.length-1);
}
function add_nodes(el, nodes, index, move, isStatic)
{
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
                for (i=0; i<_mvModifiedNodes.length; ++i)
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
            if (index >= el.childNodes.length)
            {
                if (1 < l)
                {
                    frag = Fragment();
                    for (i=0; i<l; ++i) frag.appendChild(nodes[i]);
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
                    for (i=0; i<l; ++i) frag.appendChild(nodes[i]);
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
}
function remove_nodes(el, count, index, isStatic)
{
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
                for (i=0; i<_mvModifiedNodes.length; ++i)
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
                for (; 0 < l; --l) el.removeChild(el.childNodes[index]);
            }
        }
    }
}
function getCtxScoped(view, viewvar)
{
    var k, code = '';
    viewvar = viewvar || 'this';
    for (k in view.$ctx)
    {
        if (HAS.call(view.$ctx,k))
            code += 'var '+k+'='+viewvar+'.$ctx["'+k+'"];'
    }
    return code;
}
function clearInvalid(view)
{
    // reset any Values/Collections present
    if (view.$model) view.$model.resetDirty();
    if (view.$reset) each(Keys(view.$reset), function(k) {
        view.$reset[k].reset();
    });
    view.$reset = null;
    if (view.$cache) each(Keys(view.$cache), function(id) {
        var comp = view.$cache[id], COMP;
        if (is_instance(comp, MVComponentInstance))
        {
            COMP = view.$components['#'+comp.name];
            if ((2 === comp.status) || !is_child_of(comp.dom, view.$renderdom, view.$renderdom))
            {
                if (1 === comp.status || 10 === comp.status)
                {
                    comp.status = 2;
                    if (comp.dom && COMP && COMP.opts && 'function' === typeof COMP.opts.detached)
                        COMP.opts.detached.call(comp, comp);
                }
                comp.dispose();
                delete view.$cache[id];
            }
            else
            {
                if (comp.model) comp.model.resetDirty();
                if (0 === comp.status)
                {
                    comp.status = 1;
                    if (comp.dom && COMP && COMP.opts && 'function' === typeof COMP.opts.attached)
                        COMP.opts.attached.call(comp, comp);
                }
                else if (10 === comp.status)
                {
                    comp.status = 1;
                    if (comp.dom && COMP && COMP.opts && 'function' === typeof COMP.opts.updated)
                        COMP.opts.updated.call(comp, comp);
                }
            }
        }
    });
}
function clearAll(view)
{
    view.$reset = null;
    if (view.$cache) each(Keys(view.$cache), function(id){
        var comp = view.$cache[id];
        if (is_instance(comp, MVComponentInstance))
        {
            comp.dispose();
            delete view.$cache[id];
        }
    });
}
function updateMap(node, action, map, topNode)
{
    if (!map) return node;
    if ('add' === action)
    {
        if (node) get_placeholders(node, map);
    }
    else if ('remove' === action)
    {
        del_map(map, function(v) {
            v.reduce(function(rem, t, i) {
                if (('list' === t.type) && ((node && is_child_of(t.start, node)) || (!node && !is_child_of(t.start, topNode)))) rem.push(i);
                else if (('list' !== t.type) && ((node && is_child_of(t.node, node)) || (!node && !is_child_of(t.node, topNode)))) rem.push(i);
                return rem;
            }, [])
            .reverse()
            .forEach(function(i) {
                v.splice(i, 1);
            });
        });
    }
    return node;
}
function hasComponent(view, name)
{
    return view && name && view.$components && is_instance(view.$components['#'+name], View.Component);
}
function viewHandler(view, method)
{
    return function(evt) {return method.call(view, evt, {el:evt.target});};
}
function closestEvtEl(el, evt, view)
{
    var mvEvt = view.attr('mv-evt'), mvOnEvt = view.attr('mv-on-'+evt.type);
    while (el)
    {
        if (view.$dom === el) break;
        if (el[HAS_ATTR](mvEvt) && el[ATTR](mvOnEvt)) return el;
        el = el.parentNode;
    }
}
function as_unit(node)
{
    if (is_instance(node, VNode))
    {
        node.unit = true;
        return node;
    }
    return is_array(node) ? node.map(as_unit) : node;
}
function debounce(callback, instance)
{
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
}
function hasEventOptions()
{
    var passiveSupported = false, options = {};
    try {
        Object.defineProperty(options, 'passive', {
            get: function(){
                passiveSupported = true;
                return false;
            }
        });
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
    } catch(e) {
        passiveSupported = false;
    }
    return passiveSupported;
}
function addEvent(target, event, handler, options)
{
    if (!HASDOC || !target) return;
    if (null == eventOptionsSupported) eventOptionsSupported = hasEventOptions();
    if (target.attachEvent) target.attachEvent('on' + event, handler);
    else target.addEventListener(event, handler, eventOptionsSupported ? options : ('object' === typeof options ? !!options.capture : !!options));
}
function removeEvent(target, event, handler, options)
{
    if (!HASDOC || !target) return;
    if (null == eventOptionsSupported) eventOptionsSupported = hasEventOptions();
    // if (el.removeEventListener) not working in IE11
    if (target.detachEvent) target.detachEvent('on' + event, handler);
    else target.removeEventListener(event, handler, eventOptionsSupported ? options : ('object' === typeof options ? !!options.capture : !!options));
}
function dispatchEvent(target, event, data)
{
    var evt; // The custom event that will be created
    if (!HASDOC || !target) return;
    if (document.createEvent)
    {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        evt.eventName = event;
        if (null != data) evt.data = data;
        target.dispatchEvent(evt);
    }
    else
    {
        evt = document.createEventObject();
        evt.eventType = event;
        evt.eventName = event;
        if (null != data) evt.data = data;
        target.fireEvent('on' + event, evt);
    }
}


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
    if (!is_instance(view, View)) return new View(id);

    view.$opts = {};
    view.option('view.uuid', uuid('View'));
    view.option('view.livebind', true);
    view.option('view.autobind', true);
    view.option('view.autobindAll', true);
    view.option('model.events', true);
    view.namespace = view.id = id || view.option('view.uuid');
    view.$shortcuts = {};
    view.$num_shortcuts = 0;
    view.$components = {};
    view.$ctx = {};
    view.$cache = {};
    view.$cnt = null;
    view.changeHandler = bindF(view.changeHandler, view);
    view.initPubSub();
};
// STATIC
View.serialize = serialize_fields;
View.nextTick = nextTick;
View.getDomRef = get_dom_ref;
// View implements PublishSubscribe pattern
View[proto] = Merge(Create(Obj[proto]), PublishSubscribe, {

    constructor: View

    ,id: null
    ,namespace: null
    ,$opts: null
    ,$dom: null
    ,$renderdom: null
    ,$model: null
    ,$tpl: ''
    ,$out: null
    ,$map: null
    ,$shortcuts: null
    ,$num_shortcuts: null
    ,$components: null
    ,$ctx: null
    ,$cache: null
    ,$cnt: null
    ,$reset: null
    ,_dbnc: null

/**[DOC_MARKDOWN]
// dispose view
view.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function() {
        var view = this;
        view.unbind().disposePubSub();
        view.$opts = null;
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
        view.$cnt = null;
        view.$reset = null;
        return view;
    }

    ,nop: NOOP

    ,changeHandler: function changeHandler(evt) {
        var view = this;
        // event triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;
        var el = evt.target, tag = (el.tagName || '').toLowerCase(),
            isAutoBind = ('change' === evt.type) && view.option('view.autobind') && ('input' === tag || 'textarea' === tag || 'select' === tag) && ((view.$model && startsWith(el.name || '', view.$model.id+'[')) || startsWith(el.name || '', ':model[')),
            isBind = el[HAS_ATTR](view.attr('mv-evt')) && el[ATTR](view.attr('mv-on-'+evt.type));
        if (!isBind && !isAutoBind) isBind = !!(el = closestEvtEl(el.parentNode, evt, view));
        if (isBind || isAutoBind) view.on_view_change(evt, {el:el, isBind:isBind, isAutoBind:isAutoBind});
        return true;
    }


/**[DOC_MARKDOWN]
// get / set view builtin and user-defined options
view.option(String key [, Any val]);

[/DOC_MARKDOWN]**/
    ,option: function(key, val) {
        var view = this;
        if (!view.$opts) view.$opts = {};
        if (1 < arguments.length)
        {
            view.$opts[key] = val;
        }
        else if (key)
        {
            return HAS.call(view.$opts, key) ? view.$opts[key] : undef;
        }
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
// add custom view event handlers for model/view/dom/document/window targets in {"target:eventName": handler} format
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
                    for (i=keys.length-1; i>=0; --i)
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
                    view.$components['#'+k] = components[k];
        }
        return view;
    }
    ,component: function(name, id, data, children) {
        var view = this, out, c, compId, nk, component, changed;
        if (HAS_JSX && name && (c=view.$components[nk='#'+name]))
        {
            if (c.tpl && !c.out)
            {
                c.out = tpl2code(view, c.tpl, 'data,children,', getCtxScoped(view, 'view'), {trim:true, id:view.attr('mv-id')}, '<mv-component>', 'this.view');
            }
            if (c.out)
            {
                view.$cnt[nk] = (view.$cnt[nk] || 0)+1;
                if (is_instance(id, Value)) id = id.val();
                if (view.$cache['#'] && view.$cache['#'].length)
                {
                    // already references given component instance, given in order of rendering
                    component = view.$cache['#'].shift();
                    if (!component || name !== component.name || (null != id && component.id !== name+'_id_'+Str(id))) component = null;
                }
                if (!component)
                {
                    compId = null == id ? name+'_#'+Str(view.$cnt[nk]) : name+'_id_'+Str(id);
                    component = view.$cache[compId];
                }
                if (!component)
                {
                    component = new MVComponentInstance(view, compId, name, null, c.opts && c.opts.model ? c.opts.model() : null);
                    view.$cache[compId] = component;
                    if (component.model) component.model.on('change', function() {view.render();});
                    changed = true;
                }
                else
                {
                    changed = component.model ? component.model.isDirty() : false;
                    changed = (c.opts && ('function' === typeof c.opts.changed) ? c.opts.changed(component.data, data, component) : false) || changed;
                }
                component.data = data;
                out = c.out.call(component, data, children||[], htmlNode);
                out.component = component;
                out.changed = changed;
                out.simple = false; // components are not simple nodes
                // set component.status to updated
                if (changed && (1 === component.status)) component.status = 10;
                else if (!changed && (10 === component.status)) component.status = 1;
                return out;
            }
        }
        return '';
    }

/**[DOC_MARKDOWN]
// basic view Router component
view.router({
    type: "hash", // "hash" or "path", default "hash"
    caseSensitive: false, // default true
    prefix: "/prefix/", // default no prefix ""
    routes: {
        "/": () => (<IndexPage/>),
        "/user/:id": (match) => (<UserPage data={{id:match.id}}/>),
        "/msg/:id/:line?": (match) => (<MsgPage data={{id:match.id,line:match.line}}/>) // if there is no :line, match.line will be null
    },
    fail: () => (<ErrorPage/>) // default empty
});

[/DOC_MARKDOWN]**/
    ,router: function(opts) {
        var view = this, loc, fail, r, rl, route, prefix, pattern, i, l, m, match, matches;
        opts = opts || {};
        if (!HAS.call(opts, 'type')) opts.type = 'hash';
        opts.type = Str(opts.type || 'hash').toLowerCase();
        if (!HAS.call(opts, 'caseSensitive')) opts.caseSensitive = true;
        opts.caseSensitive = !!opts.caseSensitive;
        if (!HAS.call(opts, 'prefix')) opts.prefix = '';
        opts.prefix = trim(opts.prefix || '');
        if (!HAS.call(opts, 'routes')) opts.routes = {};
        opts.routes = opts.routes || {};
        fail = opts.fail || function(){return [];/*empty*/};
        loc = (HASDOC ? window.location : view.option('router.location')) || {pathname:'/', hash:'#/'};
        route = normalisePath(('path' === opts.type ? loc.pathname : loc.hash) || '');
        if (opts.prefix && opts.prefix.length)
        {
            prefix = normalisePath(opts.prefix);
            if (opts.caseSensitive)
            {
                if ('/'+prefix+'/' !== '/'+route.slice(0, prefix.length+1)) return fail();
                else route = route.slice(prefix.length+2);
            }
            else
            {
                if ('/'+prefix.toLowerCase()+'/' !== '/'+route.slice(0, prefix.length+1).toLowerCase()) return fail();
                else route = route.slice(prefix.length+2);
            }
        }
        route = route.split('/'); rl = route.length;
        for (r in opts.routes)
        {
            if (!HAS.call(opts.routes, r)) continue;
            pattern = normalisePath(r).split('/');
            l = pattern.length;
            if (rl > l) continue;
            match = {};
            matches = true;
            for (i = 0; i < l; ++i)
            {
                m = null;
                if (i >= rl)
                {
                    if ('?' === pattern[i].slice(-1))
                    {
                        if (':' === pattern[i].charAt(0))
                        {
                            m = pattern[i].slice(1, -1);
                            match[m] = null;
                        }
                    }
                    else
                    {
                        matches = false;
                        break;
                    }
                }
                else
                {
                    if (':' === pattern[i].charAt(0))
                    {
                        m = pattern[i].slice(1);
                        if ('?' === m.slice(-1)) m = m.slice(0, -1);
                        match[m] = decodeURIComponent(route[i]);
                    }
                    else if (opts.caseSensitive)
                    {
                        if (pattern[i] !== route[i])
                        {
                            matches = false;
                            break;
                        }
                    }
                    else
                    {
                        if (pattern[i].toLowerCase() !== route[i].toLowerCase())
                        {
                            matches = false;
                            break;
                        }
                    }
                }
            }
            if (matches) return opts.routes[r](match);
        }
        return fail();
    }
/**[DOC_MARKDOWN]
// navigate to full url or path, or hash using window.history (or directly if noHistory is true)
view.navigateTo(String url[, Boolean noHistory = false]);

[/DOC_MARKDOWN]**/
    ,navigateTo: function(loc, noHistory) {
        var view = this, evt;
        if (HASDOC && loc)
        {
            loc = trim(loc);
            if (!loc.length) return view;
            if ('/' === loc.slice(-1) && '/' !== loc && '#/' !== loc)
                loc = loc.slice(0, -1);
            if (!noHistory && window.history && window.history.pushState)
            {
                window.history.pushState({}, '', loc);
                if ('undefined' !== typeof PopStateEvent)
                {
                    evt = new PopStateEvent('popstate', {state: {}});
                    evt.data = evt.data || {};
                    evt.data.trigger = view;
                    window.dispatchEvent(evt);
                }
            }
            else if ('#' === loc.charAt(0))
            {
                window.location.hash = loc;
            }
            else if ('/' === loc.charAt(0))
            {
                window.location.pathname = loc;
            }
            else if ('..' === loc.slice(0, 2) || '.' === loc.slice(0, 1))
            {
                window.location.pathname = window.location.pathname + ('/'===window.location.pathname.slice(-1) ? '' : '/') + loc;
            }
            else
            {
                window.location.href = loc;
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// can integrate with HtmlWidget
view.widget( ..args );

[/DOC_MARKDOWN]**/
    ,widget: function(/*args*/) {
        var HtmlWidget = View.HtmlWidget;
        return HtmlWidget && ("function" === typeof HtmlWidget.widget) ? this.html(HtmlWidget.widget.apply(HtmlWidget, arguments)) : '';
    }


/**[DOC_MARKDOWN]
// dynamically parse html string to virtual html node(s) at run-time
view.html( String htmlString );

[/DOC_MARKDOWN]**/
    ,html: function(str) {
        return HAS_JSX ? parse(this, str, {trim:true, id:this.attr('mv-id')}, 'dyn') : str;
    }
/**[DOC_MARKDOWN]
// mark html virtual node(s) to be morphed completely as a single unit
// (without using speed heuristics which may in some cases fail)
view.unit( nodes );

[/DOC_MARKDOWN]**/
    ,unit: function(nodes) {
        return HAS_JSX ? as_unit(nodes) : nodes;
    }
/**[DOC_MARKDOWN]
// declare that html virtual node(s) are keyed nodes
view.keyed( nodes );

[/DOC_MARKDOWN]**/
    ,keyed: function(nodes) {
        return HAS_JSX ? new KeyedNode(nodes) : nodes;
    }

    ,attr: function(attr) {
        return (this.option('view.attr') || '') + Str(attr);
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
view.livebind( [type=true|false|'simple'|'text'|'jsx'] );

[/DOC_MARKDOWN]**/
    ,livebind: function(enable) {
        var view = this;
        if (arguments.length)
        {
            view.option('view.livebind', 'simple' === enable || 'text' === enable ? 'text' : ('jsx' === enable ? true : !!enable));
            return view;
        }
        return view.option('view.livebind');
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
            view.option('view.autobind', !!enable);
            return view;
        }
        return view.option('view.autobind');
    }

/**[DOC_MARKDOWN]
// precompile content and component html templates
// should be called after all view options (eg livebind) have been set
view.precompile();

[/DOC_MARKDOWN]**/
    ,precompile: function() {
        var view = this, n, c, livebind = view.option('view.livebind');
        if (HAS_SIMPLE && ('text' === livebind))
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2codesimple(view, view.$tpl, '');

            if (!view.$map)
            {
                if (view.$out) view.$renderdom.innerHTML = view.$out.call(view);
                updateMap(view.$renderdom, 'add', view.$map={}, view.$dom);
            }
        }
        else if (HAS_JSX && (true === livebind))
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2code(view, view.$tpl, '', getCtxScoped(view, 'this'), {trim:true, id:view.attr('mv-id')});

            for (n in view.$components)
            {
                if (HAS.call(view.$components, n))
                {
                    c = view.$components[n];
                    if (c.tpl && !c.out)
                    {
                        c.out = tpl2code(view, c.tpl, 'data,children,', getCtxScoped(view, 'view'), {trim:true, id:view.attr('mv-id')}, '<mv-component>', 'this.view');
                    }
                }
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// bind view to dom listening given DOM events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );

[/DOC_MARKDOWN]**/
    ,bind: function(events, dom, renderdom) {
        var view = this, model = view.$model, method, evt;

        view.$dom = dom || (HASDOC ? document.body : null);
        view.$renderdom = renderdom || view.$dom;

        // default view/dom binding events
        view.option('view.events', events = events || ['change', 'click']);

        if (HASDOC && view.$dom && view.on_view_change && events.length)
        {
            each(events, function(event) {
                addEvent(view.$dom, event, view.changeHandler, {capture:true, passive:false});
            });
        }

        // bind model/dom/document/window (custom) event handlers
        for (method in view)
        {
            if (!is_type(view[method], T_FUNC)) continue;

            if (startsWith(method, 'on_model_') && model)
            {
                evt = method.slice(9);
                evt.length && view.onTo(model, evt, view[method] = bindF(view[method], view));
            }
            else if (HASDOC)
            {
                if (startsWith(method, 'on_window_'))
                {
                    evt = method.slice(10);
                    evt.length && addEvent(window, evt, view[method] = viewHandler(view, view[method]), {capture:true, passive:false});
                }
                else if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && addEvent(document.body, evt, view[method] = viewHandler(view, view[method]), {capture:false, passive:false});
                }
                else if (view.$dom && startsWith(method, 'on_dom_'))
                {
                    evt = method.slice(7);
                    evt.length && addEvent(view.$dom, evt, view[method] = viewHandler(view, view[method]), {capture:true, passive:false});
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
        var view = this, model = view.$model;

        // model events
        if (model) view.offFrom(model);

        if (HASDOC && view.$dom && view.on_view_change && view.option('view.events'))
        {
            each(view.option('view.events'), function(event) {
                removeEvent(view.$dom, event, view.changeHandler, {capture:true, passive:false});
            });
        }

        // unbind dom/document/window (custom) event handlers
        if (HASDOC)
        {
            for (method in view)
            {
                if (!is_type(view[method], T_FUNC)) continue;

                if (startsWith(method, 'on_window_'))
                {
                    evt = method.slice(10);
                    evt.length && removeEvent(window, evt, view[method], {capture:true, passive:false});
                }
                else if (startsWith(method, 'on_document_'))
                {
                    evt = method.slice(12);
                    evt.length && removeEvent(document.body, evt, view[method], {capture:false, passive:false});
                }
                else if (view.$dom && startsWith(method, 'on_dom_'))
                {
                    evt = method.slice(7);
                    evt.length && removeEvent(view.$dom, evt, view[method], {capture:true, passive:false});
                }
            }
            clearAll(view);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// render view on actual DOM (immediately or deferred) or return rendered string if on server
// .render is also called internally by view auto-update methods
view.render( [Boolean immediate=false] );

[/DOC_MARKDOWN]**/
    ,render: function(immediate) {
        var view = this, model = view.$model, out = '', callback,
            livebind = view.option('view.livebind');
        if (HAS_SIMPLE && ('text' === livebind))
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2codesimple(view, view.$tpl, '');

            if (!view.$renderdom)
            {
                view.$reset = {}; view.$cache = null;
                if (view.$out) out = view.$out.call(view, model); // return the rendered string
                if (model) model.resetDirty();
                view.$reset = null;
                // notify any 3rd-party also if needed
                view.publish('render', {});
                return out;
            }
            else
            {
                if (!view.$map)
                {
                    if (view.$out) view.$renderdom.innerHTML = view.$out.call(view);
                    updateMap(view.$renderdom, 'add', view.$map={}, view.$dom);
                }
                callback = function() {
                    view.$reset = {}; view.$cache = null;
                    morphSimple(view, view.$map, model, !model || ('sync' === immediate) ? false : true);
                    nextTick(function() {
                        clearInvalid(view);
                        // notify any 3rd-party also if needed
                        view.publish('render', {});
                    });
                };
                if (true === immediate || 'sync' === immediate)
                {
                    callback();
                }
                else
                {
                    debounce(callback, view);
                }
            }
        }
        else if (HAS_JSX && (true === livebind))
        {
            if (!view.$out && view.$tpl)
                view.$out = tpl2code(view, view.$tpl, '', getCtxScoped(view, 'this'), {trim:true, id:view.attr('mv-id')});

            if (view.$out)
            {
                if (!view.$renderdom)
                {
                    view.$cnt = {}; view.$reset = {}; view.$cache['#'] = null;
                    var out = to_string(view, view.$out.call(view, htmlNode)); // return the rendered string
                    if (model) model.resetDirty();
                    view.$reset = null; view.$cache['#'] = null;
                    // notify any 3rd-party also if needed
                    view.publish('render', {});
                    return out;
                }
                callback = function() {
                    view.$cnt = {}; view.$reset = {}; view.$cache['#'] = null;
                    morph(view, view.$renderdom, view.$out.call(view, htmlNode), false);
                    view.$cache['#'] = null;
                    nextTick(function() {
                        clearInvalid(view);
                        // notify any 3rd-party also if needed
                        view.publish('render', {});
                    });
                };
                if (true === immediate || 'sync' === immediate)
                {
                    callback();
                }
                else
                {
                    debounce(callback, view);
                }
            }
        }
        return view;
    }

/**[DOC_MARKDOWN]
// directly add node at index position of parentNode (this method is compatible with general morphing routines)
view.addNode( parentNode, nodeToAdd, atIndex );

[/DOC_MARKDOWN]**/
    ,addNode: function(el, node, index, isStatic) {
        var view = this;
        if (el && node)
        {
            if ((true!==isStatic) && ('text' === view.livebind()) && view.$map)
                updateMap(node, 'add', view.$map, view.$dom);
            add_nodes(el, [node], index, true===isStatic);
        }
        return view;
    }
/**[DOC_MARKDOWN]
// directly move node at index position of same parentNode (this method is compatible with general morphing routines)
view.moveNode( parentNode, nodeToMove, atIndex );

[/DOC_MARKDOWN]**/
    ,moveNode: function(el, node, index) {
        if (el && node) add_nodes(el, [node], index, true);
        return this;
    }
/**[DOC_MARKDOWN]
// directly remove node (this method is compatible with general morphing routines)
view.removeNode( nodeToRemove );

[/DOC_MARKDOWN]**/
    ,removeNode: function(node) {
        var view = this;
        if (node && node.parentNode)
        {
            remove_nodes(node.parentNode, 1, get_index(node));
            if (('text' === view.livebind()) && view.$map)
                updateMap(node, 'remove', view.$map, view.$dom);
        }
        return view;
    }

/**[DOC_MARKDOWN]
// synchronize dom to underlying model
view.sync();

[/DOC_MARKDOWN]**/
    ,sync: function() {
        var view = this, model = view.$model, els,
            autobind = view.option('view.autobind'),
            livebind = view.option('view.livebind');

        if (HASDOC && view.$dom)
        {
            view.render('sync');

            if (model && (true !== livebind) && view.option('model.events'))
            {
                do_bind_action(view, {type:'sync'}, $sel('['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']', view.$dom), {});
            }

            if (model && autobind && ((true !== livebind) || (view.$dom !== view.$renderdom && view.option('view.autobindAll'))))
            {
                els = $sel('input[name^="' + model.id+'[' + '"],textarea[name^="' + model.id+'[' + '"],select[name^="' + model.id+'[' + '"]', view.$dom);
                //if (livebind) els = filter(els, function(el){return !is_child_of(el, view.$renderdom, view.$dom);});
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
            autobind = view.option('view.autobind'), autobinds
        ;

        if (HASDOC && model && view.$dom && autobind)
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
            comp, isFromComponent = false, modeldata = {}
        ;

        // evt triggered by view itself, ignore
        if (evt.data && (view === evt.data.trigger)) return;

        // update model and propagate to other elements of same view (via model publish hook)
        if (data.isAutoBind && !!(name=el[NAME]))
        {
            el[MV] = el[MV] || MV0();
            if (':model[' === name.slice(0, 7))
            {
                isFromComponent = true;
                if (!el[MV].key) el[MV].key = dotted(name.slice(6));
            }
            else
            {
                if (!el[MV].key) el[MV].key = model.key(name, 1);
            }
            key = el[MV].key;

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

                modeldata.triggerEl = el;
                if (isFromComponent)
                {
                    comp = el;
                    while (comp)
                    {
                        if (comp[MV] && comp[MV].comp) break;
                        comp = comp.parentNode;
                    }
                    if (comp && comp[MV] && comp[MV].comp && comp[MV].comp.model)
                        comp[MV].comp.model.set(key, val, 1, modeldata);
                }
                else if (model)
                {
                    model.set(key, val, 1, modeldata);
                }
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
        if (!view.$num_shortcuts || 'text' === input_type || 'email' === input_type || 'password' === input_type || 'url' === input_type || 'number' === input_type || 'tel' === input_type) return;

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
                evt.stopPropagation && evt.stopPropagation();
                evt.stopImmediatePropagation && evt.stopImmediatePropagation();
                evt.preventDefault && evt.preventDefault();
                return false;
            }
        }
    }

    ,on_model_change: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.option('view.autobind'),
            livebind = view.option('view.livebind'),
            key, autobindSelector, bindSelector, triggerEl,
            bindElements, autoBindElements, notTriggerElem
        ;

        if (HASDOC && model && view.$dom)
        {
            // bypass element that triggered the "model:change" event
            if (data.$callData && data.$callData.triggerEl)
            {
                triggerEl = data.$callData.triggerEl;
                data.$callData = null;
                notTriggerElem = function(ele) {return ele !== triggerEl;};
            }

            // do actions ..
            if ((true !== livebind) && view.option('model.events'))
            {
                bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-change')+']';
                bindElements = $sel(bindSelector, view.$dom);
                if (notTriggerElem) bindElements = filter(bindElements, notTriggerElem);
                // do view action first
                if (bindElements.length) do_bind_action(view, evt, bindElements, data);
            }

            if (autobind && ((true !== livebind) || ((view.$dom !== view.$renderdom) && view.option('view.autobindAll'))))
            {
                key = model.id + bracketed(data.key);
                autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
                autoBindElements = $sel(autobindSelector, view.$dom);
                if (notTriggerElem) autoBindElements = filter(autoBindElements, notTriggerElem);
                // do autobind action to bind input elements that map to the model, afterwards
                if (autoBindElements.length) do_auto_bind_action(view, evt, autoBindElements, data);
            }

            // do view live DOM update action
            if (livebind) view.render();
        }
    }

    ,on_model_error: function(evt, data) {
        var view = this, model = view.$model,
            autobind = view.option('view.autobind'),
            livebind = view.option('view.livebind'),
            key, autobindSelector, bindSelector,
            bindElements, autoBindElements
        ;

        if (HASDOC && model && view.$dom)
        {
            if ((true !== livebind) && view.option('model.events'))
            {
                bindSelector = '['+view.attr('mv-model-evt')+']['+view.attr('mv-on-model-error')+']';
                bindElements = $sel(bindSelector, view.$dom);
                // do view action first
                if (bindElements.length) do_bind_action(view, evt, bindElements, data);
            }

            if (autobind && ((true !== livebind) || ((view.$dom !== view.$renderdom) && view.option('view.autobindAll'))))
            {
                key = model.id + bracketed(data.key);
                autobindSelector = 'input[name^="' + key + '"],textarea[name^="' + key + '"],select[name^="' + key + '"]';
                autoBindElements = $sel(autobindSelector, view.$dom);
                if (autoBindElements.length) do_auto_bind_action(view, evt, autoBindElements, data);
            }

            // do view live DOM bindings update action
            if (livebind) view.render();
        }
    }

    //
    // view "do_action" methods
    //

    // NOP action
    //,do_nop: null

    // simulate link url change, through history api
    ,do_link: function(evt, el, data) {
        var view = this, path, withHash;

        if (HASDOC && el)
        {
            path = trim(el[ATTR](view.attr('mv-link')) || el[ATTR]('href'));
            if (path && path.length)
            {
                withHash = view.option('router.useHash');
                if ('/' !== path.charAt(0) && '#' !== path.charAt(0)) path = '/'+path;
                if (true === withHash && '#' !== path.charAt(0)) path = '#'+path;
                if (false === withHash && '#' === path.charAt(0)) path = path.slice(1);
                if ('/' !== path.charAt(0) && '#' !== path.charAt(0)) path = '/'+path;
                evt.preventDefault && evt.preventDefault();
                view.navigateTo(path);
            }
        }
    }

    // set element(s) html/text prop based on model key value
    ,do_html: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function() {
            var html = Str(model.get(key));
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                var val = el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML];
                if (val !== html) el[data && data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = html;
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // set element(s) css props based on model key value
    ,do_css: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function(){
            var style = model.get(key);
            if (!is_type(style, T_OBJ)) return;
            each(el, function(el) {
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
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // show/hide element(s) according to binding
    ,do_show: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function() {
            var modelkey = model.get(key);
            // show if data[key] is value, else hide
            // show if data[key] is true, else hide
            var enabled = (key === data.key) && HAS.call(data, 'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) show(el);
                else hide(el);
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // hide/show element(s) according to binding
    ,do_hide: function(evt, el, data) {
        var view = this, model = view.$model, key,
            domref, callback, livebind = view.option('view.livebind');

        if (!model) return;
        key = el[ATTR](view.attr('mv-model')) || data.key;
        if (!key) return;
        if (!!(domref=el[ATTR](view.attr('mv-domref')))) el = View.getDomRef(el, domref);
        else el = [el];
        if (!el || !el.length) return;

        callback = function() {
            var modelkey = model.get(key);
            // hide if data[key] is value, else show
            // hide if data[key] is true, else show
            var enabled = (key === data.key) && HAS.call(data, 'value') ? data.value === modelkey : !!modelkey;
            each(el, function(el) {
                if (!el || !is_child_of(el, view.$dom)) return;
                if (enabled) hide(el);
                else show(el);
            });
        };
        if (true !== livebind)
        {
            if (!livebind || ('sync' === evt.type)) callback();
            else if ('text' === livebind) view.on('render', callback, true);
        }
    }

    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function(evt, el, data) {
        var view = this, name = data.name, key = data.key,
            input_type = (el[TYPE]||'').toLowerCase(),
            value, value_type, checked, checkboxes, is_dynamic_array
        ;

        // if should be updated via new live render, ignore
        if (true===view.option('view.livebind') && (view.$dom===view.$renderdom || is_child_of(el, view.$renderdom, view.$dom))) return;

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
                    dispatchEvent(el, 'change', {trigger:view});
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
                    dispatchEvent(el, 'change', {trigger:view});
            }
            else if (/*checkboxes.length > 1 &&*/ (T_ARRAY === value_type))
            {
                checked = el[CHECKED];
                el[CHECKED] = contains_non_strict(value, el[VAL]);
                if (checked !== el[CHECKED])
                    dispatchEvent(el, 'change', {trigger:view});
            }

            else
            {
                checked = el[CHECKED];
                el[CHECKED] = T_BOOL === value_type ? value : (Str(value) == el[VAL]);
                if (checked !== el[CHECKED])
                    dispatchEvent(el, 'change', {trigger:view});
            }
        }
        else
        {
            if (set_val(el, value))
                dispatchEvent(el, 'change', {trigger:view});
        }
    }

    ,toString: function( ) {
        return '[ModelView.View id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

// can integrate with HtmlWidget by setting the lib via this static property
View.HtmlWidget = null;

/**[DOC_MARKDOWN]
#### View.Component

```javascript
// **Note** that component instances are attached to each view separately, if used in another view, a new instance should be used!
var MyComponent = ModelView.View.Component(
    String name,
    String htmlTpl [,
    Object options = {
         attached: (componentInstance) => {} // component has been attached to DOM, for componentInstance see below
        ,updated: (componentInstance) => {} // component has been updated, for componentInstance see below
        ,detached: (componentInstance) => {} // component has been detached from DOM, for componentInstance see below
        ,changed: (oldData, newData, componentInstance) => false // whether component has changed given new data
        ,model: () => ({clicks:0}) // initial state model data, if state model is to be used, else null
        ,actions: {
            // custom component actions here, if any, eg referenced as <.. mv-evt mv-on-click=":click"></..>
            click: function(evt, el, data) {
                // update local clicks count and re-render
                this.model.set('clicks', this.model.get('clicks')+1, true);
            }
        }
}]);

```
[/DOC_MARKDOWN]**/
View.Component = function Component(name, tpl, opts) {
  var self = this;
  if (!is_instance(self, Component)) return new Component(name, tpl, opts);
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
/**[DOC_MARKDOWN]
#### View.Component.Instance

```javascript
MyComponentInstance {
    view // the main view this component instance is attached to
    model // component state model, if any, else null
    data // current component instance data
    dom // domElement this component instance is attached to
    d // property to attach user-defined data, if needed
}

```
[/DOC_MARKDOWN]**/
function MVComponentInstance(view, id, name, data, state, dom)
{
    var self = this;
    if (!is_instance(self, MVComponentInstance)) return new MVComponentInstance(view, id, name, data, state, dom);
    self.status = 0;
    self.id = id;
    self.name = name;
    self.data = null == data ? null : data;
    self.model = state ? (is_instance(state, Model) ? state : new Model(self.name, state)) : null;
    self.view = view;
    self.dom = dom || null;
    self.d = {};
}
View.Component.Instance = MVComponentInstance;
MVComponentInstance[proto] = {
    constructor: MVComponentInstance
    ,status: 0
    ,id: null
    ,name: null
    ,data: null
    ,model: null
    ,view: null
    ,dom: null
    ,d: null
    ,dispose: function() {
        var self = this;
        self.status = 2;
        self.data = null;
        self.data = null;
        if (self.model) self.model.dispose();
        self.model = null;
        self.view = null;
        if (self.dom && self.dom[MV]) self.dom[MV].comp = null;
        self.dom = null;
        return self;
    }
};
/**[DOC_MARKDOWN]
#### Examples 

[See it](https://foo123.github.io/examples/modelview/)


```html
<script id="HelloButtonComponent" type="text/x-template">
    <button class="button" mv-evt mv-on-click=":hello_world">Hello World ({this.model.getVal('clicks')})</button>
</script>
<script id="content" type="text/x-template">
    <b>Note:</b> Arbitrary JavaScript Expressions can be run inside &#123; and &#125; template placeholders
    <br /><br />
    <b>Hello {view.model().getVal('msg')}</b> &nbsp;&nbsp;(updated live on <i>keyup</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value={view.model().getVal('msg')} mv-evt mv-on-keyup="update" />
    <button class="button" title={view.model().getVal('msg')} mv-evt mv-on-click="alert">Hello</button>
    <HelloButton/>
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
.template(document.getElementById('content').innerHTML)
.components({
    HelloButton: ModelView.View.Component(
        'HelloButton',
        document.getElementById('HelloButtonComponent').innerHTML,
        {
            model: () => ({clicks:0}),
            actions: {
                hello_world: function(evt, el) {
                    this.model.set('clicks', this.model.get('clicks')+1, true);
                    this.view.model().set('msg', 'World', true);
                }
            },
            changed: (oldData, newdata) => false,
            attached: (comp) => {console.log('HelloButton attached to DOM <'+comp.dom.tagName+'>')},
            detached: (comp) => {console.log('HelloButton detached from DOM <'+comp.dom.tagName+'>')}
        }
    )
})
.actions({
    // custom view actions (if any) here ..
    alert: function(evt, el) {
        alert(this.model().get('msg'));
    },
    update: function(evt, el) {
        this.model().set('msg', el.value, true);
    }
})
.shortcuts({
    'alt+h': 'alert'
})
.autovalidate(true)
.autobind(true) // default
.livebind(true) // default
.bind(['click', 'keyup'], document.getElementById('app'))
.sync()
;
```

**Server-Side Rendering**

```javascript
var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
    'Hello': new ModelView.View.Component('Hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().get('msg')}</div>`)
    })
    .template(`<Hello/>`)
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

    VERSION: "5.1.0"
    
    ,UUID: uuid
    
    ,Extend: Merge
    
    ,Type: Type
    
    ,Validation: Validation
    
    ,PublishSubscribeInterface: PublishSubscribe
    
    ,Model: Model
    
    ,View: View
};

/* main code ends here */
/* export the module */
return ModelView;
});