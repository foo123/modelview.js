
///////////////////////////////////////////////////////////////////////////////////////
//
// utilities
//
///////////////////////////////////////////////////////////////////////////////////////
var MV = '$MV', NAMESPACE = "modelview", mvDisplay = '--mvDisplay', SEPARATOR = ".", WILDCARD = "*",
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
function clone_var(o)
{
    if (is_array(o))
    {
        return o.map(clone_var);
    }
    else if (is_object(o))
    {
        return Object.keys(o).reduce(function(oo, k) {
            oo[k] = clone_var(o[k]);
            return oo;
        }, {});
    }
    else
    {
        return o;
    }
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
