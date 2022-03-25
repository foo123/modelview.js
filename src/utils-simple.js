
///////////////////////////////////////////////////////////////////////////////////////
//
// utilities for simple mode
//
///////////////////////////////////////////////////////////////////////////////////////
var placeholder_re = /\{([0-9a-zA-Z\.\-_\$]+)\}/,
    foreach_re = /^foreach\s*\{([0-9a-zA-Z\.\-_\$]+)\}\s*$/;

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
        if (startsWith(p, 'foreach') && (m=p.match(placeholder_re)))
        {
            if (0 === f)
            {
                start = [p1, p2+3, m[1]];
            }
            f++;
            offset = p2+3;
        }
        else if ((0 < f) && startsWith(p, '/foreach'))
        {
            f--;
            if (0 === f)
            {
                end = [p1, p2+3];
                code += tpl2codesimplek(tpl.slice(0, start[0]));
                code += "\n_$$_ += (function(MODEL){var _$$_='',ITEM=function(MODEL){var _$$_='';"+tpl2codesimplef(tpl.slice(start[1], end[0]))+"\nreturn _$$_;};if(MODEL){for(var I=0,N=MODEL.get('"+start[2]+".length');I<N;++I){_$$_ += ITEM(MODEL.getProxy('"+start[2]+".'+I, '.'));}}else{_$$_='<!--foreach {"+start[2]+"}-->'+ITEM()+'<!--/foreach-->';}return _$$_;})(MODEL);"
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
    if (rel === key.charAt(0))
    {
        var ks = key.slice(1).split('.');
        ks[0] = rel + ks[0];
        return ks;
    }
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
                if ((m = n.nodeValue.match(foreach_re)) && (k = trim(m[1])) && k.length)
                {
                    list = {type:'list', tpl:Fragment(), tplmap:{}, start:n, end:null, clone:newFunc('n','var c=null; try{c='+path+'.childNodes['+get_index(n)+']'+';}catch(e){c=null;}return [c, c ? c.nextSibling : null];')};
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
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), true);
                }, 0, stdMath.min(list.map.length, items.length)-1);
                if (0 < count)
                {
                    // add missing nodes
                    frag = Fragment();
                    iterate(function(index) {
                        var node = clone(list);
                        list.map.push(node.map);
                        morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), false);
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
                /*count = items.length - list.map.length;
                // replace common nodes
                n = parentNode.childNodes[startIndex + 1];
                iterate(function(index) {
                    var node = clone(list);
                    list.map[index] = node.map;
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), false);
                    each(node.dom.childNodes, function(nn){
                        x = n[NEXT];
                        parentNode.replaceChild(nn, n);
                        n = x;
                    });
                }, 0, stdMath.min(list.map.length, items.length)-1);
                if (0 < count)
                {
                    // add missing nodes
                    frag = Fragment();
                    iterate(function(index) {
                        var node = clone(list);
                        list.map.push(node.map);
                        morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), false);
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
                }*/
                // delete all and add new
                delNodes(null, parentNode, startIndex+1, m*list.map.length);
                list.map = new Array(items.length);
                frag = Fragment();
                iterate(function(index) {
                    var node = clone(list);
                    list.map[index] = node.map;
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), false);
                    frag.appendChild(node.dom);
                }, 0, items.length-1);
                if (end) parentNode.insertBefore(frag, end);
                else parentNode.appendChild(frag);
                return;
            case 'reorder':
                count = items.length;
                k = count*m;
                frag = Fragment();
                n = slice.call(parentNode.childNodes, startIndex+1, startIndex+1+k);
                l = list.map.slice();
                for (i=0; i<count; ++i)
                {
                    list.map[i] = l[d.from[i]];
                    for (j=0; j<m; ++j)
                        frag.appendChild(n[d.from[i]*m+j]);
                }
                if (end) parentNode.insertBefore(frag, end);
                else parentNode.appendChild(frag);
                return;
            case 'swap':
                x = list.map[d.from];
                list.map[d.from] = list.map[d.to];
                list.map[d.to] = x;
                i = slice.call(parentNode.childNodes, startIndex+1+d.from*m, startIndex+1+d.from*m+m);
                j = slice.call(parentNode.childNodes, startIndex+1+d.to*m, startIndex+1+d.to*m+m);
                k = j[j.length-1][NEXT];
                for (l=0; l<m; ++l) parentNode.replaceChild(j[l], i[l]);
                if (k) for (l=0; l<m; ++l) parentNode.insertBefore(i[l], k);
                else for (l=0; l<m; ++l) parentNode.appendChild(i[l]);
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
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), false);
                    frag.appendChild(node.dom);
                }, d.from, d.to);
                n = parentNode.childNodes[startIndex+1+m*d.from];
                if (n) parentNode.insertBefore(frag, n);
                else parentNode.appendChild(frag);
                break;
            case 'change':
                iterate(function(index) {
                    morphSimple(view, list.map[index], model.getProxy(key+'.'+index, '.', items[index]), true);
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
