
///////////////////////////////////////////////////////////////////////////////////////
//
// utilities for jsx mode
//
///////////////////////////////////////////////////////////////////////////////////////
HAS_JSX = true;
var SPACE = /\s/,
    NUM = /^\d+$/,
    HEXNUM = /^[0-9a-fA-F]+$/,
    TAGCHAR = /[a-zA-Z0-9\-_:]/,
    ATTCHAR = TAGCHAR,
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
    }
;

function KeyedNode(node)
{
    // idempotent
    if (is_instance(node, KeyedNode)) node = node.node;
    this.node = node;
}
KeyedNode[proto] = {
    constructor: KeyedNode
    ,node: null
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
    ,hasKeyedNodes: false
    ,modified: null
    ,diff: null
    ,changed: false
    ,achanged: false
    ,unit: false
    ,simple: true
    ,create: null
    ,uAtts: null
    ,uFAtts: null
    ,uNodes: null
    ,uFNodes: null
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

function tpl2code(view, tpl, args, scoped, opts, rootNodeType, viewInstance)
{
    var p1, p2, c, code = '"use strict";'+"\n"+'var view = '+(viewInstance||'this')+';', state;
    args = (args || '') + '_$$_';
    if (scoped && scoped.length) code += "\n" + Str(scoped);
    code += "\nreturn " + to_code(parse(view, tpl, opts, rootNodeType || '', true)) + ";";
    return newFunc(args, code);
}
function initState(opts, nodeType)
{
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
}
function finState(state)
{
    if ((!state.opts.trim && state.txt.length) || (state.opts.trim && trim(state.txt).length))
    {
        state.dom.childNodes.push(VNode('t', state.txt, state.txt2, state.dom, state.dom.childNodes.length));
    }
    state.txt = '';
    state.txt2 = '';
    return state;
}
function getRoot(state)
{
    if (!state.dom) throw err('No root node!');
    else if (state.dom.parentNode) throw err('Unclosed tag '+state.dom.parentNode.nodeType);
    //while (state.dom && state.dom.parentNode) state.dom = state.dom.parentNode;
    return state.dom;
}
function parse(view, str, opts, rootNode, withJsCode)
{
    return getRoot(finState(html2ast(view, trim(str), initState(opts, rootNode || ''), true === withJsCode)));
}
function jsx2code(view, tpl, opts)
{
    var i = 0, l = tpl.length, out = '', jsx = '', j = 0, k,
        injsx = false, inparen = false, instr = false, esc = false, q = '', c = '';
    while (i<l)
    {
        c = tpl.charAt(i++);
        if (inparen && !SPACE.test(c))
        {
            inparen = false;
            if ('<' === c)
            {
                injsx = true;
                jsx = c;
                j = 1;
                continue;
            }
            else
            {
                out += '(';
                if ('(' === c) inparen = true;
            }
        }
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
            /*else if ('<' === tpl.charAt(i))
            {
                injsx = true;
                jsx = '';
                j = 1;
            }*/
            else
            {
                inparen = true;
                //out += c;
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
    if (inparen) out += '(';
    if (jsx.length || (0 !== j)) throw err('Malformed HTML/JSX at "'+tpl+'"');
    return trim(out);
}
function html2ast(view, html, state, jscode)
{
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
                if (state.opts.id === att.name) {
                    state.dom.id = is_instance(att.value, VCode) ? '('+att.value.code+')' : toJSON(att.value);
                    state.dom.attributes.pop();
                }
                else if ('type' === att.name) state.dom.type = is_instance(att.value, VCode) ? '('+att.value.code+')' : toJSON(att.value);
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
                                                if (state.opts.id === att.name)
                                                {
                                                    state.dom.id = '('+att.value.code+')';
                                                    state.dom.attributes.pop();
                                                }
                                                else if ('type' === att.name) state.dom.type = '('+att.value.code+')';
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
                    if ((true === jscode) && hasComponent(view, state.dom.nodeType.slice(1,-1)))
                    {
                        // capital 1st letter signifies custom component
                        component = state.dom;
                        state.dom = component.parentNode;
                        component.parentNode = null;
                        state.dom.childNodes[state.dom.childNodes.length-1] = new VCode('view.component("'+component.nodeType.slice(1,-1)+'",'+(is_instance(attr(component, 'id'), VCode) ? attr(component, 'id').code : toJSON(attr(component, 'id')))+','+(is_instance(attr(component, 'data'), VCode) ? attr(component, 'data').code : toJSON(attr(component, 'data')))+',[])');
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
                        if ((true === jscode) && hasComponent(view, state.dom.nodeType.slice(1,-1)))
                        {
                            // capital 1st letter signifies custom component
                            component = state.dom;
                            state.dom = component.parentNode;
                            component.parentNode = null;
                            state.dom.childNodes[state.dom.childNodes.length-1] = new VCode('view.component("'+component.nodeType.slice(1,-1)+'",'+(is_instance(attr(component, 'id'), VCode) ? attr(component, 'id').code : toJSON(attr(component, 'id')))+','+(is_instance(attr(component, 'data'), VCode) ? attr(component, 'data').code : toJSON(attr(component, 'data')))+','+(component.childNodes.length ? to_code(component)+'.childNodes' : '[]')+')');
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
}
function insMod(nodes, start, end, new_mod, type)
{
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
    else if (last && last.from === start && last.to === end && last.type === type)
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
                    nodes.push({from:start, to:end, type:type});
                    if (to > end) nodes.push({from:end+1, to:to, type:last.type});
                }
                else if (last.from > start)
                {
                    nodes[nodes.length-1] = {from:start, to:end, type:type};
                    last.from = stdMath.max(last.from, end+1);
                    nodes.push(last);
                }
                else
                {
                    if (to > end) nodes.push({from:end+1, to:to, type:last.type});
                    last.to = end;
                    last.type = type;
                }
            }
            else if (to >= start)
            {
                last.to = start-1;
                nodes.push({from:start, to:end, type:type});
            }
            else
            {
                nodes.push({from:start, to:end, type:type});
            }
        }
        else
        {
            nodes.push({from:start, to:end, type:type});
        }
    }
    else if (!last || last.to < start-1)
    {
        nodes.push({from:start, to:end, type:type});
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
}
function htmlNode(view, nodeType, id, type, atts, children, value2, modified, create)
{
    if (
        // idempotent shortcut
        ('' === nodeType) &&
        children && (1 === children.length) &&
        ('' === children[0].nodeType || '<mv-component>' === children[0].nodeType)
    )
    {
        return children[0];
    }
    var node = new VNode(nodeType, '', '', null, 0), index = 0, new_mod = false;
    id = id || null; type = type || null;
    if (is_instance(id, Value)) id = id.val();
    if (is_instance(type, Value)) type = type.val();
    node.id = null == id ? null : Str(id);
    node.type = null == type ? null : Str(type);
    node.attributes = atts || [];
    node.create = create || null;
    if (modified)
    {
        node.modified = {atts: [], nodes: []};
        if (modified.atts && modified.atts.length)
        {
            node.modified.atts = modified.atts;
            node.achanged = true;
            each(modified.atts, function(range) {
                for (var v,a=node.attributes,i=range.from,e=range.to; i<=e; ++i)
                {
                    v = a[i].value;
                    if (!is_instance(v, Value))
                    {
                        node.uAtts = (function(u, att, val) {
                            return function(view, r, v) {
                                u && u(view, r, v);
                                if (false === val) del_att(r, att, v.nodeType);
                                else set_att(r, att, val, v.nodeType, true);
                            };
                        })(node.uAtts, a[i].name, v);
                    }
                    else if (v.changed())
                    {
                        node.uAtts = (function(u, att, val) {
                            return function(view, r, v) {
                                u && u(view, r, v);
                                if (val.id()) view.$reset[val.id()] = val;
                                val = val.val();
                                if (false === val) del_att(r, att, v.nodeType);
                                else set_att(r, att, val, v.nodeType);
                            };
                        })(node.uAtts, a[i].name, v);
                    }
                    else
                    {
                        node.uFAtts = (function(u, att, val) {
                            return function(view, r, v, forced) {
                                u && u(view, r, v, forced);
                                if (false === val) del_att(r, att, v.nodeType);
                                else set_att(r, att, val, v.nodeType, forced);
                            };
                        })(node.uFAtts, a[i].name, v.val());
                    }
                }
            });
        }
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
            var nn, i, len, val, v, a;
            if (is_instance(n, KeyedNode))
            {
                node.hasKeyedNodes = true;
                n = n.node;
            }
            if (is_instance(n, Collection))
            {
                nn = new VNode('collection', n, null, node, index);
                len = n.items().length*n.mappedItem;
                nn.potentialChildNodes = len;
                nn.changed = n.changed();
                if (!node.modified) node.modified = {atts: [], nodes: []};
                insMod(node.modified.nodes, index, index+len-1, true, 'collection');
                new_mod = true;
                childNodes.push(nn);
                node.potentialChildNodes += len;
                index += len;
                // reset Collection after current render session
                if (nn.changed) view.$reset[n.id()] = n;
                node.changed = node.changed || nn.changed;
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
                return childNodes;
            }
            else if (is_array(n))
            {
                i = index;
                node.changed = true;
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
                if (!node.modified) node.modified = {atts: [], nodes: []};
                childNodes = flatten(n).reduce(process, childNodes);
                insMod(node.modified.nodes, i, index-1, true, 'array');
                new_mod = true;
                return childNodes;
            }
            else if (is_instance(n, Value))
            {
                val = n;
                v = Str(val.val());
                n = VNode('t', v, v, null, 0);
                if (!node.modified) node.modified = {atts: [], nodes: []};
                new_mod = insMod(node.modified.nodes, index, index, new_mod, '');
                n.changed = val.changed();
                // reset Value after current render session
                if (val.changed() && val.id()) view.$reset[val.id()] = val;
                if (n.changed)
                {
                    n.uNodes = (function(val) {
                        return function(view, r, v) {
                            //if (r.nodeValue !== val)
                                r.nodeValue = val;
                        };
                    })(v);
                }
                else
                {
                    n.uFNodes = (function(val) {
                        return function(view, r, v, forced) {
                            if (r.nodeValue !== val)
                                r.nodeValue = val;
                        };
                    })(v);
                }
            }
            else if (!is_instance(n, VNode))
            {
                v = Str(n);
                n = VNode('t', v, v, null, 0);
                if (!node.modified) node.modified = {atts: [], nodes: []};
                new_mod = insMod(node.modified.nodes, index, index, new_mod, '');
                n.changed = true;
                n.uNodes = (function(val) {
                    return function(view, r, v, forced) {
                        if (r.nodeValue !== val)
                            r.nodeValue = val;
                    };
                })(v);
            }
            else if ('<mv-component>' === n.nodeType)
            {
                node.potentialChildNodes += n.potentialChildNodes;
                node.componentNodes += n.childNodes.length;
                if (!node.modified) node.modified = {atts: [], nodes: []};
                new_mod = insMod(node.modified.nodes, index, index+n.childNodes.length-1, new_mod, '');
                node.changed = node.changed || n.changed;
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
                AP.push.apply(childNodes, n.childNodes.map(function(nn) {
                    nn.parentNode = node;
                    nn.index = index++;
                    //nn.changed = nn.changed || n.changed;
                    nn.component = nn.component || n.component;
                    nn.unit = nn.unit || n.unit;
                    if (nn.unit) node.changed = true;
                    return nn;
                }));
                return childNodes;
            }
            else if ('collection' === n.nodeType)
            {
                if (!node.modified) node.modified = {atts: [], nodes: []};
                insMod(node.modified.nodes, index, index+n.potentialChildNodes-1, true, 'collection');
                new_mod = true;
                node.potentialChildNodes += n.potentialChildNodes;
                n.index = index;
                n.parentNode = node;
                index += n.potentialChildNodes;
                childNodes.push(n);
                node.changed = node.changed || n.changed;
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
                return childNodes;
            }
            else if ('dyn' === n.nodeType)
            {
                node.potentialChildNodes += n.potentialChildNodes;
                i = index;
                a = n.childNodes.map(function(nn) {
                    nn.parentNode = node;
                    nn.index = index++;
                    nn.unit = true;
                    nn.achanged = true;
                    nn.changed = true;
                    return nn;
                });
                if (!node.modified) node.modified = {atts: [], nodes: []};
                new_mod = insMod(node.modified.nodes, i, i+a.length-1, new_mod, '');
                AP.push.apply(childNodes, a);
                node.changed = true;
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
                return childNodes;
            }
            else if (!n.nodeType || !n.nodeType.length)
            {
                node.potentialChildNodes += n.potentialChildNodes;
                if (!node.modified) node.modified = {atts: [], nodes: []};
                new_mod = insMod(node.modified.nodes, index, index+n.childNodes.length-1, new_mod, '');
                AP.push.apply(childNodes, n.childNodes.map(function(nn) {
                    if (is_instance(nn, KeyedNode))
                    {
                        node.hasKeyedNodes = true;
                        nn = nn.node;
                    }
                    nn.parentNode = node;
                    nn.index = index++;
                    nn.unit = nn.unit || n.unit;
                    node.changed = node.changed || nn.changed || nn.achanged;
                    if (nn.unit)
                    {
                        node.changed = true;
                        node.simple = false;
                        node.uNodes = null;
                        node.uFNodes = null;
                    }
                    if (node.simple)
                    {
                        if (nn.uAtts || nn.uNodes)
                        {
                            node.uNodes = (function(u, ua, un, index) {
                                return function(view, r, v) {
                                    u && u(view, r, v);
                                    var rnode = r.childNodes[index], vnode = v.childNodes[index];
                                    ua && ua(view, rnode, vnode);
                                    un && un(view, rnode, vnode);
                                };
                            })(node.uNodes, nn.uAtts, nn.uNodes, nn.index);
                        }
                        if (nn.uFAtts || nn.uFNodes)
                        {
                            node.uFNodes = (function(u, ua, un, index) {
                                return function(view, r, v, forced) {
                                    u && u(view, r, v, forced);
                                    var rnode = r.childNodes[index], vnode = v.childNodes[index];
                                    ua && ua(view, rnode, vnode, forced);
                                    un && un(view, rnode, vnode, forced);
                                };
                            })(node.uFNodes, nn.uFAtts, nn.uFNodes, nn.index);
                        }
                    }
                    return nn;
                }));
                return childNodes;
            }
            if (n.modified && (n.modified.atts.length || n.modified.nodes.length))
            {
                if (!node.modified) node.modified = {atts: [], nodes: []};
                new_mod = insMod(node.modified.nodes, index, index, new_mod, '');
            }
            node.potentialChildNodes++;
            n.parentNode = node;
            n.index = index++;
            childNodes.push(n);
            node.changed = node.changed || n.changed || n.achanged;
            if (!n.simple)
            {
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
            }
            if (n.unit)
            {
                node.changed = true;
                node.simple = false;
                node.uNodes = null;
                node.uFNodes = null;
            }
            if (node.simple)
            {
                if (n.uAtts || n.uNodes)
                {
                    node.uNodes = (function(u, ua, un, index) {
                        return function(view, r, v) {
                            u && u(view, r, v);
                            var rnode = r.childNodes[index], vnode = v.childNodes[index];
                            ua && ua(view, rnode, vnode);
                            un && un(view, rnode, vnode);
                        };
                    })(node.uNodes, n.uAtts, n.uNodes, n.index);
                }
                if (n.uFAtts || n.uFNodes)
                {
                    node.uFNodes = (function(u, ua, un, index) {
                        return function(view, r, v, forced) {
                            u && u(view, r, v, forced);
                            var rnode = r.childNodes[index], vnode = v.childNodes[index];
                            ua && ua(view, rnode, vnode, forced);
                            un && un(view, rnode, vnode, forced);
                        };
                    })(node.uFNodes, n.uFAtts, n.uFNodes, n.index);
                }
            }
            return childNodes;
        }, []);
    }
    return node;
}
function create_att(name, value, isSVG, isCode)
{
    var out = 'val='+value+';'
    if (isCode)
    {
        out += 'if(val instanceof Value){if(val.changed()&&val.id()){view.$reset[val.id()]=val;}val=val.val();}'
    }

    out += 'if(false!==val){';

    if (-1 !== ['selected','disabled','required','checked','autoFocus','allowfullscreen','autoplay','capture','controls','default','hidden','indeterminate','loop','muted','novalidate','open','readOnly','reversed','scoped','seamless'].indexOf(name))
    {
        out += 'r.'+name+'=!!val;';
    }
    else if ('class' === name)
    {
        out += isSVG ? 'r.setAttribute("class",String(val));' : 'r.className=String(val);';
    }
    else if ('style' === name)
    {
        out += 'r.style.cssText=String(val);';
    }
    else if ('id' === name)
    {
        out += 'r.id=String(val);';
    }
    else if ('value' === name)
    {
        out += 'r.value=val;';
    }
    else
    {
        out += 'r.setAttribute("'+name+'",true===val?"'+name+'":String(val));';
    }

    out += '}';

    return out;
}
function to_code(vnode)
{
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
            out = '_$$_(view, "c", null, null, [], '+toJSON(vnode.nodeValue)+', null)';
        }
        else
        {
            var isSVG = svgElements[T], modifiedAtts = [],
                createNode = (isSVG ? 'r=document.createElementNS("http://www.w3.org/2000/svg","'+T.slice(1,-1)+'");' : 'r=document.createElement("'+T.slice(1,-1)+'");') + 'if(true===with_meta){r.$MV=rmv=MV0();if(v.id||v.component||v.modified){rmv.id=v.id;rmv.comp=v.component;if(rmv.comp){if(rmv.comp.dom&&rmv.comp.dom.$MV)rmv.comp.dom.$MV.comp=null;rmv.comp.dom=r;}if(v.modified){if(v.modified.atts.length)rmv.att=v.modified.atts;if(v.modified.nodes.length)rmv.mod=v.modified.nodes;}}}';
            out = '_$$_(view, "'+(isSVG ? T : lower(T))+'", '+Str(vnode.id)+', '+Str(vnode.type)+', ['+vnode.attributes.map(function(a, i){
                var val = a.value;
                if (is_instance(val, VCode))
                {
                    if (!modifiedAtts.length || modifiedAtts[modifiedAtts.length-1].to < i-1)
                        modifiedAtts.push({from:i, to:i});
                    else
                        modifiedAtts[modifiedAtts.length-1].to = i;
                    createNode += create_att(a.name, 'atts['+i+'].value', isSVG, true);
                    return '{name:"'+a.name+'",value:('+val.code+')}';
                }
                createNode += create_att(a.name, val = toJSON(val), isSVG, false);
                return '{name:"'+a.name+'",value:'+val+'}';
            }).join(',')+'], ['+vnode.childNodes.map(to_code).join(',')+'], null, {atts:'+toJSON(modifiedAtts)+'},function(view,v,with_meta,Value,MV0){var r,atts=v.attributes,val,rmv;'+createNode+'return r;})';
        }
    }
    else if (vnode.childNodes.length)
    {
        out = '_$$_(view, "", null, null, [], ['+vnode.childNodes.map(to_code).join(',')+'])';
    }
    return out;
}
function to_string(view, vnode)
{
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
        else if ('<mv-component>' === T)
        {
            out = to_string_all(view, vnode.childNodes);
        }
        else
        {
            selfclosed = /*HAS.call(autoclosedTags, T)*/autoclosedTags[T];
            out = T.slice(0, -1)+(vnode.attributes.length ? ' '+vnode.attributes.reduce(function(atts, att) {
                var val = att.value;
                if (is_instance(val, Value))
                {
                    if (val.changed() && val.id())
                        view.$reset[val.id()] = val;
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
}
function to_string_all(view, nodes)
{
    return nodes.map(function(n){return to_string(view, n);}).join('');
}
function to_node(view, vnode, with_meta)
{
    var rnode, rmv, i, l, a, v, n, t, c, isSVG, T = vnode.nodeType, TT, C;
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
        rnode = to_node(view, {nodeType:'',childNodes:mergeChildNodes(vnode.nodeValue.mapped())}, with_meta);
    }
    else if ('<mv-component>' === T || !T || !T.length)
    {
        rnode = Fragment();
        for (i=0,l=vnode.childNodes.length; i<l; ++i)
            rnode.appendChild(to_node(view, vnode.childNodes[i], with_meta));
    }
    else
    {
        if (vnode.create)
        {
            rnode = vnode.create(view, vnode, with_meta, Value, MV0);
        }
        else
        {
            // createElement is faster than innerHTML in wrapper
            isSVG = /*HAS.call(svgElements, T)*/svgElements[T];
            TT = lower(vnode[TYPE] || '');
            rnode = isSVG ? document.createElementNS('http://www.w3.org/2000/svg', T.slice(1,-1)) : document.createElement(T.slice(1,-1));
            for (i=0,l=vnode.attributes.length; i<l; ++i)
            {
                a = vnode.attributes[i];
                n = a.name; v = a.value;
                if (is_instance(v, Value))
                {
                    if (v.changed() && v.id()) view.$reset[v.id()] = v;
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
                else if ('selected' === n || 'disabled' === n || 'required' === n || 'checked' === n || 'autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
                    'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
                    'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
                    'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
                {
                    rnode[n] = !!v;
                }
                else if ('value' === n)
                {
                    rnode[n] = v;
                }
                else
                {
                    rnode[SET_ATTR](n, Str(true === v ? n : v));
                }
            }
            if (true === with_meta)
            {
                rnode[MV] = rmv = MV0();
                if (vnode.id || vnode.component || vnode.modified)
                {
                    rmv.id = vnode.id;
                    c = rmv.comp = vnode.component;
                    if (c)
                    {
                        if (c.dom && c.dom[MV]) c.dom[MV].comp = null;
                        c.dom = rnode;
                    }
                    if (vnode.modified)
                    {
                        if (vnode.modified.atts.length)
                            rmv.att = vnode.modified.atts;
                        if (vnode.modified.nodes.length)
                            rmv.mod = vnode.modified.nodes;
                    }
                }
            }
        }
        if (vnode.childNodes.length)
        {
            if ('<textarea>' === T)
            {
                v = to_string_all(view, vnode.childNodes);
                rnode[VAL] = v;
                rnode[TEXTC] = v;
            }
            else if ('<script>' === T || '<style>' === T)
            {
                rnode[TEXTC] = to_string_all(view, vnode.childNodes);
            }
            else
            {
                for (i=0,l=vnode.childNodes.length; i<l; ++i)
                {
                    rnode.appendChild(to_node(view, vnode.childNodes[i], with_meta));
                }
            }
        }
    }
    return rnode;
}
function nodeType(node)
{
    var tagName, NodeType = node.nodeType;
    if (3 === NodeType)
    {
        return 't';
    }
    else if (8 === NodeType)
    {
        return 'c';
    }
    else
    {
        tagName = '<'+(node[TAG] || '')+'>';
        return svgElements[tagName] ? tagName : lower(tagName);
    }
}
function eqNodes(r, v, T)
{
    T = T || nodeType(r);
    var rmv = r[MV] || DEFAULT_MV;
    return (T === v.nodeType) && ((null == v.component && null == rmv.comp) || (null != v.component && null != rmv.comp && (v.component.name === rmv.comp.name))) && (v.id === rmv.id) && ('<input>' !== T || lower(v[TYPE]||'') === lower(r[TYPE]||''));
}
function attr(vnode, name)
{
    if (!vnode.atts)
    {
        for (var atts={},a=vnode.attributes,l=a.length,i=0; i<l; ++i)
            atts['@'+a[i].name] = a[i].value;
        vnode.atts = atts;
    }
    return vnode.atts['@'+name];
}
function del_att(r, n, T/*, TT*/)
{
    if ('id' === n)
    {
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
    else if ('selected' === n || 'disabled' === n || 'required' === n || 'checked' === n || 'autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
        'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
        'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
        'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
    {
        r[n] = false;
    }
    else if ('value' === n)
    {
        r[n] = '';
    }
    else
    {
        r[DEL_ATTR](n);
    }
    return r;
}
function set_att(r, n, s, T/*, TT*/, forced)
{
    var t;
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
    else if ('selected' === n || 'disabled' === n || 'required' === n || 'checked' === n || 'autoFocus' === n || 'allowfullscreen' === n || 'autoplay' === n ||
        'capture' === n || 'controls' === n || 'default' === n || 'hidden' === n ||
        'indeterminate' === n || 'loop' === n || 'muted' === n || 'novalidate' === n ||
        'open' === n || 'readOnly' === n || 'reversed' === n || 'scoped' === n || 'seamless' === n)
    {
        r[n] = !!s;
    }
    else if ('value' === n)
    {
        if (r[n] !== s) r[n] = s;
    }
    else
    {
        s = Str(true === s ? n : s);
        if (!forced || (r[ATTR](n) !== s)) r[SET_ATTR](n, s);
    }
    return r;
}
function delNodes(view, r, index, count)
{
    if (0 <= index && index < r.childNodes.length && 0 < count)
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
            var range = Range(), rnode, rnode2;
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
                for (rnode=r.childNodes[index]; (0 < count) && rnode/*(index < r.childNodes.length)*/; --count)
                {
                    rnode2 = rnode[NEXT];
                    r.removeChild(rnode);
                    rnode = rnode2;
                }
            }
        }
    }
}
function insNodes(view, r, v, index, count, lastNode)
{
    var frag = null, vc = v.childNodes.length;
    if (1 < count)
    {
        // using fragment really faster??
        for (frag = Fragment(); 0 < count && index < vc /*&& frag.childNodes.length < count*/; --count,++index)
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
}
function morphAttsAll(view, r, v)
{
    var T, TT, vAtts, rAtts, i, a, n, av;
    T = v.nodeType;
    TT = lower(v[TYPE] || '');
    vAtts = v.attributes;
    rAtts = r.attributes;
    // remove non-existent attributes
    for (i=rAtts.length-1; i>=0; --i)
    {
        a = rAtts[i]; n = a.name;
        if (null == attr(v, n)) del_att(r, n, T/*, TT*/);
    }
    // update new attributes
    for (i=vAtts.length-1; i>=0; --i)
    {
        a = vAtts[i]; n = a.name; av = a.value;
        if (is_instance(av, Value))
        {
            if (av.changed() && av.id()) view.$reset[av.id()] = av;
            av = av.val();
        }
        if (false === av) del_att(r, n, T/*, TT*/);
        else set_att(r, n, av, T/*, TT*/, true);
    }
    return r;
}
function morphAtts(view, r, v, forced)
{
    var count, mi, mc, m, mp, match, matched,
        modifiedAttsPrev = (r[MV] && r[MV].att) || [],
        modifiedAtts = (v.modified && v.modified.atts) || [];

    matched = (modifiedAtts.length === modifiedAttsPrev.length);
    /*if (matched)
    {
        for (count=0,mi=0,mc=modifiedAtts.length; mi<mc; ++mi)
        {
            m = modifiedAtts[mi];
            mp = modifiedAttsPrev[mi];
            match = (m.from === mp.from) && (m.to === mp.to);
            count += match;
        }
        matched = (mc === count);
    }*/
    if (matched)
    {
        if (modifiedAtts.length)
        {
            v.uAtts && v.uAtts(view, r, v);
            forced && v.uFAtts && v.uFAtts(view, r, v, forced);
        }
    }
    else
    {
        morphAttsAll(view, r, v);
    }
    return r;
}
function morphSingleAll(view, r, rnode, vnode)
{
    var T = vnode.nodeType, val;
    if ('t' === T)
    {
        if (rnode.nodeValue !== vnode.nodeValue2)
            rnode.nodeValue = vnode.nodeValue2;
    }
    else if ('c' === T)
    {
        //if (rnode.nodeValue !== vnode.nodeValue)
            rnode.nodeValue = vnode.nodeValue;
    }
    else if ('<textarea>' === T)
    {
        morphAttsAll(view, rnode, vnode);
        val = to_string_all(view, vnode.childNodes);
        rnode[VAL] = val;
        rnode[TEXTC] = val;
    }
    else if ('<style>' === T || '<script>' === T)
    {
        morphAttsAll(view, rnode, vnode);
        rnode[TEXTC] = to_string_all(view, vnode.childNodes);
    }
    else
    {
        morphAttsAll(view, rnode, vnode);
        morphAll(view, rnode, vnode);
    }
}
function morphSingle(view, r, rnode, vnode, forced)
{
    var T = vnode.nodeType, changed = vnode.changed, val;
    if ('t' === T)
    {
        if ((forced || changed) && (rnode.nodeValue !== vnode.nodeValue2))
            rnode.nodeValue = vnode.nodeValue2;
    }
    else if ('c' === T)
    {
        if (forced || changed) rnode.nodeValue = vnode.nodeValue;
    }
    else if (vnode.unit)
    {
        morphAttsAll(view, rnode, vnode);
        morphAll(view, rnode, vnode);
    }
    else if (vnode.simple)
    {
        // skips further modifiedNodes matched tests, assumes matched
        vnode.uAtts && vnode.uAtts(view, rnode, vnode);
        changed && vnode.uNodes && vnode.uNodes(view, rnode, vnode);
        if (forced)
        {
            vnode.uFAtts && vnode.uFAtts(view, rnode, vnode, forced);
            vnode.uFNodes && vnode.uFNodes(view, rnode, vnode, forced);
        }
    }
    else if ('<textarea>' === T)
    {
        morphAtts(view, rnode, vnode, forced);
        if (forced || changed)
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
        morphAtts(view, rnode, vnode, forced);
        if (forced || changed) rnode[TEXTC] = to_string_all(view, vnode.childNodes);
    }
    else
    {
        morphAtts(view, rnode, vnode, forced);
        if (forced || changed) morph(view, rnode, vnode, forced);
    }
}
function mergeChildNodes(nodes)
{
    return 1 === nodes.length
        ? nodes[0].childNodes
        : nodes.reduce(function(nodes, node){
            AP.push.apply(nodes, node.childNodes);
            return nodes;
        }, []);
}
function morphCollection(view, r, v, start, end, end2, startv, count, forced)
{
    var vNodes = v.childNodes, rNodes = r.childNodes,
        vnode, rnode, collection,
        diff, di, dc, d, items, change,
        i, j, k, l, m, n, w, x, z, len, frag;

    collection = vNodes[startv].nodeValue;
    diff = collection.diff;
    m = collection.mappedItem;
    change = function change(d, forced) {
        len = (d.to-d.from+1)*m;
        z = new Array(len);
        for (w=start+d.from*m,j=0,i=0,rnode=rNodes[w]; i<len; ++i)
        {
            //rnode = rNodes[w+i];
            x = rnode[MV] && rnode[MV].comp;
            if (x) z[j++] = x;
            rnode = rnode[NEXT];
        }
        //z.length = j;
        view.$cache['#'] = z;
        items = collection.mapped(d.from, d.to);
        frag = mergeChildNodes(items)/*htmlNode(view, '', null, null, [], items)*/;
        view.$cache['#'] = z = null;
        for (n=frag/*.childNodes*/,w=start+d.from*m,i=0,j=n.length,rnode=rNodes[w]; i<j; ++i)
        {
            vnode = n[i]; //rnode = rNodes[w+i];
            if (eqNodes(rnode, vnode))
            {
                morphSingle(view, r, rnode, vnode, forced);
                rnode = rnode[NEXT];
            }
            else
            {
                r.replaceChild(x=to_node(view, vnode, true), rnode);
                rnode = x[NEXT];
            }
        }
        //morphSelectedNodes(view, r, frag, start+d.from*m, start+d.from*m+len-1, start+d.from*m+len-1, 0, 0, forced);
    };
    for (di=0,dc=diff.length; di<dc; ++di)
    {
        d = diff[di];
        switch (d.action)
        {
            case 'set':
                len = collection.items().length*m;
                items = collection.mapped();
                frag = {nodeType:'',hasKeyedNodes:v.hasKeyedNodes,childNodes:mergeChildNodes(items)}/*htmlNode(view, '', null, null, [], items)*/;
                morphSelectedNodes(view, r, frag, start, start+len-1, start+len-1, 0, count, true);
                count = 0;
                return count; // break from diff loop completely, this should be only diff
                break;
            case 'replace':
                // delete all and add new
                len = collection.items().length*m;
                delNodes(view, r, start, stdMath.min(len, len+count));
                items = collection.mapped();
                insNodes(view, r, {nodeType:'',childNodes:mergeChildNodes(items)}, 0, len, rNodes[start]);
                count = 0;
                return count; // break from diff loop completely, this should be only diff
                break;
            case 'reorder':
                permuteNodes(r, start, d.from, m);
                count = 0;
                len = collection.items().length*m;
                items = collection.mapped();
                frag = {nodeType:'',hasKeyedNodes:v.hasKeyedNodes,childNodes:mergeChildNodes(items)};
                morphSelectedNodes(view, r, frag, start, start+len-1, start+len-1, 0, 0, false);
                return count; // break from diff loop completely, this should be only diff
                break;
            case 'swap':
                swapNodes(r, rNodes[start+d.from*m], rNodes[start+d.to*m], m);
                change({from:d.from,to:d.from}, false);
                change({from:d.to,to:d.to}, false);
                break;
            case 'add':
                if (di+1 === dc && 0 < d.from)
                {
                    items = collection.mapped(0, d.from-1);
                    len = (d.from)*m;
                    frag = {nodeType:'',hasKeyedNodes:v.hasKeyedNodes,childNodes:mergeChildNodes(items)};
                    morphSelectedNodes(view, r, frag, start, start+len-1, start+len-1, 0, 0, false);
                }
                items = collection.mapped(d.from, d.to);
                len = (d.to-d.from+1)*m;
                insNodes(view, r, {nodeType:'',childNodes:mergeChildNodes(items)}/*htmlNode(view, '', null, null, [], items)*/, 0, len, rNodes[start+d.from*m]);
                if (0 > count) count += len;
                if (di+1 === dc && d.to+1 < collection.items().length)
                {
                    items = collection.mapped(d.to+1, collection.items().length-1);
                    len = (collection.items().length-d.to-1)*m;
                    frag = {nodeType:'',hasKeyedNodes:v.hasKeyedNodes,childNodes:mergeChildNodes(items)};
                    morphSelectedNodes(view, r, frag, start+(d.to+1)*m, start+(d.to+1)*m+len-1, start+(d.to+1)*m+len-1, 0, 0, false);
                }
                break;
            case 'del':
                len = (d.to-d.from+1)*m;
                delNodes(view, r, start+d.from*m, len);
                if (0 < count) count -= len;
                if (di+1 === dc)
                {
                    items = collection.mapped();
                    len = (collection.items().length)*m;
                    frag = {nodeType:'',hasKeyedNodes:v.hasKeyedNodes,childNodes:mergeChildNodes(items)};
                    morphSelectedNodes(view, r, frag, start, start+len-1, start+len-1, 0, 0, false);
                }
                break;
            case 'change':
                change(d, forced);
                break;
        }
    }
    return count;
}
function morphKeyedNodes(view, r, v, start, end, end2, startv, count, forced)
{
    // standard algorithm to morph DOM tree using minimum DOM operations
    var vNodes = v.childNodes, rNodes = r.childNodes, cNodes,
        vnode, vnodef, rnode, rnodef, rnode2, vLeft, rLeft,
        i1, j1, i2, j2, i, j, x, z, cnt, del, matched, pos,
        keyed, places, lis, needsReorder, loop = true;

    j1 = startv; j2 = startv + end - start;
    i1 = start; i2 = stdMath.max(start, stdMath.min(end+count, rNodes.length-1));
    vnode = vNodes[j1]; vnodef = vNodes[j2];
    rnode = rNodes[i1]; rnodef = rNodes[i2];
    x = rnodef[NEXT];

    while (loop)
    {
        loop = false;
        // start
        while ((i1 <= i2) && (j1 <= j2) && eqNodes(rnode, vnode))
        {
            morphSingle(view, r, rnode, vnode);
            ++i1; ++j1;
            if (i1 > i2 || j1 > j2) {loop = false; break;}
            rnode = rnode[NEXT];
            vnode = vNodes[j1];
        }
        // end
        while ((i1 <= i2) && (j1 <= j2) && eqNodes(rnodef, vnodef))
        {
            morphSingle(view, r, rnodef, vnodef);
            x = rnodef;
            --i2; --j2;
            if (i1 > i2 || j1 > j2) {loop = false; break;}
            rnodef = rnodef[PREV];
            vnodef = vNodes[j2];
        }
        // reverse end start
        while ((i1 <= i2) && (j1 <= j2) && eqNodes(rnodef, vnode))
        {
            loop = true;
            rnode2 = rnodef[PREV];
            r.insertBefore(rnodef, rnode);
            morphSingle(view, r, rnodef, vnode);
            --i2; ++j1;
            if (i1 > i2 || j1 > j2) {loop = false; break;}
            rnodef = rnode2;
            vnode = vNodes[j1];
        }
        // reverse start end
        while ((i1 <= i2) && (j1 <= j2) && eqNodes(rnode, vnodef))
        {
            loop = true;
            rnode2 = rnode[NEXT];
            if (x) r.insertBefore(rnode, x);
            else r.appendChild(rnode);
            morphSingle(view, r, rnode, vnodef);
            x = rnode;
            ++i1; --j2;
            if (i1 > i2 || j1 > j2) {loop = false; break;}
            rnode = rnode2;
            vnodef = vNodes[j2];
        }
    }

    rLeft = stdMath.max(0, i2 - i1 + 1);
    vLeft = stdMath.max(0, j2 - j1 + 1);
    if (!rLeft)
    {
        if (vLeft)
        {
            insNodes(view, r, v, j1, vLeft, x);
            count += vLeft;
        }
    }
    else if (!vLeft)
    {
        if (rLeft)
        {
            delNodes(view, r, i1, rLeft);
            count -= rLeft;
        }
    }
    else
    {
        places = new A32I(vLeft);
        needsReorder = false;
        pos = 0;
        matched = 0;
        del = 0;
        keyed = {};
        // create lookup dictionary
        for (j=j1; j<=j2; ++j)
        {
            // assume vnode has key id, since they are marked as keyed
            vnode = vNodes[j];
            keyed['#'+vnode.id] = j;
        }
        for (i=i1,rnode=rNodes[i]; rnode && (i<=i2); ++i)
        {
            rnode2 = rnode[NEXT];
            if (matched < vLeft)
            {
                j = rnode[MV] && rnode[MV].id && keyed['#'+rnode[MV].id];
                if ((null != j) && eqNodes(rnode, vnode=vNodes[j]))
                {
                    if (0 < del)
                    {
                        i2 -= del;
                        i -= del;
                        delNodes(view, r, i, del);
                        count -= del;
                        del = 0;
                    }
                    places[j - j1] = i + 1;
                    if (pos > j) needsReorder = true;
                    else pos = j;
                    morphSingle(view, r, rnode, vnode);
                    ++matched;
                }
                else
                {
                    ++del;
                }
            }
            else
            {
                del += i2 - i + 1;
                i = i2+1;
                break;
            }
            rnode = rnode2;
        }
        if (0 < del)
        {
            i2 -= del;
            i -= del;
            delNodes(view, r, i, del);
            count -= del;
            del = 0;
        }
        if (!matched)
        {
            // nothing matched, replace all
            if (i2 >= i1)
            {
                delNodes(view, r, i1, cnt=i2-i1+1);
                count -= cnt;
            }
            if (j2 >= j1)
            {
                insNodes(view, r, v, j1, cnt=j2-j1+1, x);
                count += cnt;
            }
        }
        else if (needsReorder)
        {
            // matched entries are not in increasing order
            // compute longest increasing subsequence
            lis = longest_incr_subseq(places); // O(n log n) !!
            j = lis.length - 1;
            cNodes = slice.call(rNodes, i1, i2+1); // store as immutable
            for (i=vLeft-1; i>=0; --i)
            {
                pos = places[i];
                if (!pos)
                {
                    // insert new entry in correct place
                    z = to_node(view, vNodes[i+j1], true);
                    if (x) r.insertBefore(z, x);
                    else r.appendChild(z);
                    x = z;
                    ++count;
                }
                else if ((0 > j) || (i !== lis[j]))
                {
                    // move existing entry in correct place
                    z = cNodes[pos-1-i1];
                    if (x) r.insertBefore(z, x);
                    else r.appendChild(z);
                    x = z;
                }
                else
                {
                    // new place for entry
                    x = cNodes[pos-1-i1];
                    --j;
                }
            }
        }
        else if (matched < vLeft)
        {
            // matched entries are in increasing order
            for (i=vLeft-1; i>=0; --i)
            {
                pos = places[i];
                if (!pos)
                {
                    // insert new entry in correct place
                    z = to_node(view, vNodes[i+j1], true);
                    if (x) r.insertBefore(z, x);
                    else r.appendChild(z);
                    x = z;
                    ++count;
                }
                else
                {
                    // new place for entry
                    x = rNodes[pos-1];
                }
            }
        }
    }
    return count;
}
function morphNodes(view, r, v, start, end, end2, startv, count, forced)
{
    // linear general algorithm to morph DOM tree but DOM operations may not be minimum
    var rNodes = r.childNodes, vNodes = v.childNodes,
        index, indexv, vnode, rnode, rnode2,
        i, j, k, l, frag;

    for (indexv=startv,index=start,rnode=rNodes[index],l=vNodes.length,k=rNodes.length; index<=end; ++index,++indexv)
    {
        if (indexv >= l) break;
        if (index >= k)
        {
            //rNodes.length;
            insNodes(view, r, v, indexv, end-k+1, null);
            if (0 > count) count += end-k+1;
            break;
        }
        if ((0 > count) && (index >= end2+count+1))
        {
            insNodes(view, r, v, indexv, -count, rNodes[end2+count+1]);
            count = 0;
            break;
        }

        vnode = vNodes[indexv];
        //rnode = rNodes[index];

        if (eqNodes(rnode, vnode))
        {
            morphSingle(view, r, rnode, vnode, forced);
            rnode = rnode[NEXT];
        }
        else if (0 === count)
        {
            rnode2 = rnode[NEXT];
            r.replaceChild(frag=to_node(view, vnode, true), rnode);
            rnode = rnode2;
        }
        else if (0 > count)
        {
            r.insertBefore(frag=to_node(view, vnode, true), rnode);
            ++k;
            ++count;
        }
        else
        {
            for (i=index,j=0; 0 < count && j < count; )
            {
                ++j;
                if (index+j >= k/*rNodes.length*/) break;
                rnode = rnode[NEXT]/*rNodes[index+j]*/;
                if (eqNodes(rnode, vnode)) break;
            }
            if (0 < j)
            {
                delNodes(view, r, i, j);
                k -= j;
                count -= j;
            }
            if (index >= k/*rNodes.length*/)
            {
                insNodes(view, r, v, indexv, end-k+1, null);
                count = 0;
                break;
            }
            else
            {
                rnode = rNodes[index];
                if (eqNodes(rnode, vnode))
                {
                    morphSingle(view, r, rnode, vnode, forced);
                    rnode = rnode[NEXT];
                }
                else
                {
                    rnode2 = rnode[NEXT];
                    r.replaceChild(frag=to_node(view, vnode, true), rnode);
                    rnode = rnode2;
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
}
function morphSelectedNodes(view, r, v, start, end, end2, startv, count, forced)
{
    if ('collection' === v.childNodes[startv].nodeType)
        // collection is supposed to cover whole current modification range
        return morphCollection(view, r, v, start, end, end2, startv, count, forced);
    else if (v.hasKeyedNodes)
        return morphKeyedNodes(view, r, v, start, end, end2, startv, count, forced);
    else
        return morphNodes(view, r, v, start, end, end2, startv, count, forced);
}
function morphAll(view, r, v, alreadyInited)
{
    // morph unconditionally r (real) DOM to match v (virtual) DOM
    var vNodes = v.childNodes, rNodes = r.childNodes, vc = vNodes.length, rc,
        count, i, j, index, hasKeyed = v.hasKeyedNodes, keyed,
        vnode, rnode, rnode2, frag, rmv, rComp, vComp;

    if (!alreadyInited)
    {
        rmv = r[MV] || MV0(),
        rComp = rmv.comp;
        vComp = v.component;
        r[MV] = rmv;
        rmv.id = v.id;
        rmv.comp = vComp;
        if ((rComp !== vComp) && rComp) rComp.dom = null;
        if (vComp) vComp.dom = r;
        if (v.modified && v.modified.atts.length)
            rmv.att = v.modified.atts;
        else if (rmv.att)
            rmv.att = null;
        if (v.modified && v.modified.nodes.length)
            rmv.mod = v.modified.nodes;
        else if (rmv.mod)
            rmv.mod = null;
    }

    // need to flatten first any existent collections
    for (index=vc-1; index>=0; --index)
    {
        if ('collection' === vNodes[index].nodeType)
            vNodes.splice.apply(vNodes, [index, 1].concat(mergeChildNodes(vNodes[index].nodeValue.mapped())));
    }
    vc = vNodes.length;
    rc = rNodes.length;
    if (hasKeyed)
    {
        // there are keyed nodes, associate them in a map for reuse
        for (keyed={},index=0,rnode=r.firstChild; rnode; /*index<rc; ++index*/)
        {
            //rnode = rNodes[index];
            //rnode[MV] = rnode[MV] || DEFAULT_MV;
            // store the keyed nodes in a map
            // to be retrieved and reused easily
            if (rnode[MV] && rnode[MV].id)
                keyed['#'+rnode[MV].id] = rnode;
            rnode = rnode[NEXT];
        }
    }
    count = rc - vc;
    for (index=0,rnode=r.firstChild; index<vc; ++index)
    {
        if (index >= rc)
        {
            insNodes(view, r, v, index, vc-rc, null);
            if (0 > count) count = 0;
            break;
        }
        vnode = vNodes[index];
        //rnode = rNodes[index];

        if (eqNodes(rnode, vnode))
        {
            morphSingleAll(view, r, rnode, vnode);
            rnode = rnode[NEXT];
        }
        else if (hasKeyed && vnode.id && (frag=keyed['#'+vnode.id]) && eqNodes(frag, vnode))
        {
            r.insertBefore(frag, rnode);
            morphSingleAll(view, r, frag, vnode);
        }
        else if (0 === count)
        {
            rnode2 = rnode[NEXT];
            r.replaceChild(frag=to_node(view, vnode, true), rnode);
            rnode = rnode2;
        }
        else if (0 > count)
        {
            r.insertBefore(frag=to_node(view, vnode, true), rnode);
            ++rc;
            ++count;
        }
        else
        {
            for (i=index,j=0; 0 < count && j < count; )
            {
                ++j;
                if (index+j >= rc/*rNodes.length*/) break;
                rnode = rnode[NEXT]/*rNodes[index+j]*/;
                if (eqNodes(rnode, vnode)) break;
            }
            if (0 < j)
            {
                delNodes(view, r, i, j);
                rc -= j;
                count -= j;
            }
            if (index >= rc)
            {
                insNodes(view, r, v, index, vc-rc, null);
                count = 0;
                break;
            }
            else
            {
                rnode = rNodes[index];
                if (eqNodes(rnode, vnode))
                {
                    morphSingleAll(view, r, rnode, vnode);
                    rnode = rnode[NEXT];
                }
                else
                {
                    rnode2 = rnode[NEXT];
                    r.replaceChild(frag=to_node(view, vnode, true), rnode);
                    rnode = rnode2;
                }
            }
        }
    }
    if (rNodes.length > vc) delNodes(view, r, vc, rNodes.length-vc);
}
function morph(view, r, v, forced)
{
    // morph r (real) DOM to match v (virtual) DOM
    var vNodes = v.childNodes, rNodes = r.childNodes,
        vc = vNodes.length, vpc = v.potentialChildNodes,
        count = 0, offset = 0, matched, match,
        mi, m, mc, di, dc, i, j, index, keyed,
        vnode, rnode, T, frag, rmv = r[MV] || MV0(),
        modifiedNodesPrev = rmv.mod,
        modifiedNodes = v.modified && v.modified.nodes,
        rComp = rmv.comp, vComp = v.component;

    r[MV] = rmv;
    rmv.id = v.id;
    rmv.comp = vComp;
    if ((rComp !== vComp) && rComp) rComp.dom = null;
    if (vComp) vComp.dom = r;
    if (v.modified && v.modified.atts.length)
        rmv.att = v.modified.atts;
    else if (rmv.att)
        rmv.att = null;
    if (v.modified && v.modified.nodes.length)
        rmv.mod = v.modified.nodes;
    else if (rmv.mod)
        rmv.mod = null;

    if (!rNodes.length)
    {
        if (0 < vc) insNodes(view, r, v, 0, vc, null);
    }
    else
    {
        modifiedNodesPrev = modifiedNodesPrev || [];
        modifiedNodes = modifiedNodes || [];
        offset = 0;
        matched = /*(0 < modifiedNodes.length) &&*/ (modifiedNodes.length === modifiedNodesPrev.length);
        if (matched)
        {
            for (count=0,mi=0,mc=modifiedNodes.length; mi<mc; ++mi)
            {
                m = modifiedNodes[mi];
                match = (m.from === offset + modifiedNodesPrev[mi].from);
                offset += (m.to - m.from + 1) - (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1);
                count += match;
            }
            matched = (modifiedNodes.length === count) && (offset+rNodes.length === vpc);
        }
        if (matched)
        {
            for (offset=0,di=0,mi=0,mc=modifiedNodes.length; mi<mc; ++mi)
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
                    if (0 < count) insNodes(view, r, v, m.from-offset, 'collection' === vNodes[m.from-offset].nodeType ? 1 : count, rNodes[m.from]);
                }
                else
                {
                    count = (modifiedNodesPrev[mi].to - modifiedNodesPrev[mi].from + 1) - (m.to - m.from + 1);
                    morphSelectedNodes(view, r, v, m.from, m.to, m.to, m.from-offset, count, 'array' === m.type ? true : forced);
                }
                offset += (vc !== vpc && 'collection' === vNodes[m.from-offset].nodeType ? m.to-m.from : 0);
            }
        }
        else
        {
            morphAll(view, r, v, true);
        }
    }
}
