
// Tpl utils
var POS = 'lastIndexOf', MATCH = 'match'
    ,VALUE = 'nodeValue', NODETYPE = 'nodeType', ATT_RE = /[a-zA-Z0-9_\-]/
    ,to_int = function(v){return parseInt(v,10);}
    // use hexadecimal string representation in order to have optimal key distribution in hash (??)
    ,nuuid = 0, node_uuid = function( n ) { return n.$TID$ = n.$TID$ || n.id || ('_TID_'+(++nuuid).toString(16)); }
    
    ,multisplit_string = function multisplit_string( str, re_keys, revivable ) {
        var tpl = [ ], i = 0, m, sel_pos, sel, ch, ind,
            atName = false, atIndex, atKeyStart = -1, atKeyEnd = -1, atPos = 0,
            openTag, closeTag, tagEnd, insideTag = false, tpl_keys = {}, key;
        // find and split the tpl_keys
        while ( m = re_keys.exec( str ) )
        {
            sel_pos = re_keys.lastIndex - m[0].length;
            sel = str.slice(i, sel_pos);
            tagEnd = -1;
            if ( revivable )
            {
                openTag = sel[POS]('<'); closeTag = sel[POS]('>');
                // match and annotate open close xml tags as well
                if ( openTag > closeTag /*&& '/' !== sel.charAt(openTag+1)*/ ) 
                {
                    tagEnd = -1; insideTag = true;
                }
                else if ( closeTag > openTag ) 
                {
                    tagEnd = closeTag+1; insideTag = false;
                }
            }
            tpl.push([1, insideTag, sel, tagEnd]);
            
            // match and annotate attributes
            if ( insideTag )
            {
                if ( -1 < (ind=sel[POS]('=')) )
                {
                    atName = ''; atIndex = ind;
                    while ( -1 < ind && ATT_RE.test(ch=sel.charAt(--ind)) ) atName = ch + atName;
                    atKeyStart = sel_pos - i - atIndex-2;
                    atPos = atKeyStart + m[0].length;
                }
                else if ( atName )
                {
                    atKeyStart = atPos + sel_pos - i - 2 -1;
                    atPos += atKeyStart + m[0].length;
                }
            }
            else
            {
                atName = false; atPos = 0; atKeyStart = -1;
            }
            key = m[1] ? m[1] : m[0];
            if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [tpl.length];
            else tpl_keys[key].push(tpl.length);
            tpl.push([0, insideTag, key, undef, atName, atKeyStart]);
            i = re_keys.lastIndex;
        }
        sel = str.slice(i);
        tagEnd = -1;
        if ( revivable )
        {
            openTag = sel[POS]('<'); closeTag = sel[POS]('>');
            // match and annotate open close xml tags as well
            if ( openTag > closeTag /*&& '/' !== sel.charAt(openTag+1)*/ ) 
            {
                tagEnd = -1; insideTag = true;
            }
            else if ( closeTag > openTag ) 
            {
                tagEnd = closeTag+1; insideTag = false;
            }
        }
        tpl.push([1, insideTag, sel, tagEnd]);
        return [tpl_keys, tpl];
    }
    
    ,multisplit_node = function multisplit_node( node, re_keys, revivable ) {
        var tpl_keys, matchedNodes, matchedAtts, i, l, m, matched, matches, ml, n, a, key, nid, atnodes,
            keyNode, aNodes, aNodesCached, txt, atName, att, pos, rest, stack, keyNodes, keyAtts, hash = {}
        ;
         matchedNodes = [ ]; matchedAtts = [ ]; n = node;
        // find the nodes having tpl_keys
        if ( n.attributes && (l=n.attributes.length) ) 
        {
            // revive: match key:val attribute annotations in wrapping comments
            if ( revivable && n.firstChild && 8 === n.firstChild[NODETYPE] && 'att:' === n.firstChild[VALUE].slice(0,4) )
            {
                matches = n.firstChild[VALUE].split("\n"); l = matches.length; 
                atnodes = {};
                for (i=0; i<l; i++)
                {
                    m = matches[i].split('|'); atName = m[0].slice(4); a = n.attributes[atName];
                    if ( !atnodes[HAS](atName) )
                    {
                        atnodes[atName] = [1, []];
                        matchedAtts.push([a, atnodes[atName], n]);
                    }
                    atnodes[atName][1].push([m[1].slice(4),m[2].split(',').map(to_int)]);
                }
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    a = n.attributes[ i ];
                    if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([0, a, m, n]);
                }
            }
        }
        if ( 3 === n[NODETYPE] ) // textNode 
        {
            // revive: match key:val annotations in wrapping comments
            if ( revivable && n.previousSibling && n.nextSibling && 
                8 === n.previousSibling[NODETYPE] && 8 === n.nextSibling[NODETYPE] &&
                'key:' === (key=n.previousSibling[VALUE]).slice(0,4) &&
                '/key' === n.nextSibling[VALUE]
            ) 
            {
                m = [n[VALUE], key.slice(4)];
                matchedNodes.push([n, m, n[PARENT]]);
            }
            else if ( m=n[VALUE][MATCH](re_keys) ) 
            {
                matchedNodes.push([n, m, n[PARENT]]);
            }
        }  
        else if ( n.firstChild )
        {
            stack = [ n=n.firstChild ];
            while ( stack.length ) 
            {
                if ( n.attributes && (l=n.attributes.length) ) 
                {
                    // revive: match key:val attribute annotations in wrapping comments
                    if ( revivable && n.firstChild && 8 === n.firstChild[NODETYPE] && 'att:' === n.firstChild[VALUE].slice(0,4) )
                    {
                        matches = n.firstChild[VALUE].split("\n"); l = matches.length; 
                        atnodes = {};
                        for (i=0; i<l; i++)
                        {
                            m = matches[i].split('|'); atName = m[0].slice(4); a = n.attributes[atName];
                            if ( !atnodes[HAS](atName) )
                            {
                                atnodes[atName] = [1, []];
                                matchedAtts.push([a, atnodes[atName], n]);
                            }
                            atnodes[atName][1].push([m[1].slice(4),m[2].split(',').map(to_int)]);
                        }
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            a = n.attributes[ i ];
                            if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([a, m, n]);
                        }
                    }
                }
                if ( n.firstChild ) stack.push( n=n.firstChild );
                else 
                {
                    if ( 3 === n[NODETYPE] )
                    {
                        // revive: match key:val annotations in wrapping comments
                        if ( revivable && n.previousSibling && n.nextSibling && 
                            8 === n.previousSibling[NODETYPE] && 8 === n.nextSibling[NODETYPE] &&
                            'key:' === (key=n.previousSibling[VALUE]).slice(0,4) &&
                            '/key' === n.nextSibling[VALUE]
                        ) 
                        {
                            m = [n[VALUE], key.slice(4)];
                            matchedNodes.push([n, m, n[PARENT]]);
                        }
                        else if ( (m=n[VALUE][MATCH](re_keys)) ) 
                        {
                            matchedNodes.push([n, m, n[PARENT]]);
                        }
                    }
                    n = stack.pop( );
                    while ( stack.length && !n.nextSibling ) n = stack.pop( );
                    if ( n.nextSibling ) stack.push( n=n.nextSibling );
                }
            }
        }
        // split the tpl_keys nodes
        atnodes = { };
        for (i=0,l=matchedNodes.length; i<l; i++)
        {
            matched = matchedNodes[ i ];
            rest = matched[0]; m = matched[1]; n = matched[2];
            nid = node_uuid( n );
            hash[nid] = hash[nid] || [{},{}]; atnodes[nid] = n;
            keyNodes = hash[nid][0/*KEYS*/];
            txt = rest[VALUE];  
            if ( txt.length > m[0].length )
            {
                // node contains more text than just the $(key) ref
                do {
                    key = m[1] ? m[1] : m[0]; keyNode = rest.splitText( m.index );
                    rest = keyNode.splitText( m[0].length );
                    (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                    m = rest[VALUE][MATCH]( re_keys );
                } while ( m );
            }
            else
            {
                key = m[1] ? m[1] : m[0]; keyNode = rest;
                (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
            }
        }
        aNodes = { };
        for (i=0,l=matchedAtts.length; i<l; i++)
        {
            matched = matchedAtts[ i ];
            a = matched[0]; m = matched[1]; n = matched[2];
            nid = node_uuid( n );
            hash[nid] = hash[nid] || [{},{}]; atnodes[nid] = n;
            keyNodes = hash[nid][0/*KEYS*/]; keyAtts = hash[nid][1/*ATTS*/];
            txt = a[VALUE];  aNodesCached = (txt in aNodes);
            if ( !aNodesCached ) 
            {
                rest = document.createTextNode(txt||''); aNodes[ txt ] = [[], [ rest ]];
                if ( 1 === m[0] ) // revived attribute
                {
                    matches = m[1]; ml = matches.length; pos = 0;
                    for (i=0; i<ml; i++)
                    {
                        att = matches[i];
                        key = att[0];
                        keyNode = rest.splitText( att[1][0]-pos );
                        rest = keyNode.splitText( att[1][1] );
                        aNodes[ txt ][0].push( key );
                        aNodes[ txt ][1].push( keyNode, rest ); 
                        (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                        (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                        pos += att[1][1] + att[1][0];
                    }
                }
                else if ( txt.length > m[0].length )
                {
                    // attr contains more text than just the $(key) ref
                    do {
                        key = m[1] ? m[1] : m[0];
                        keyNode = rest.splitText( m.index );
                        rest = keyNode.splitText( m[0].length );
                        aNodes[ txt ][0].push( key );
                        aNodes[ txt ][1].push( keyNode, rest ); 
                        (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                        (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                        m = rest[VALUE][MATCH]( re_keys );
                    } while ( m );
                }
                else
                {
                    keyNode = rest; key = m[1] ? m[1] : m[0];
                    aNodes[ txt ][0].push( key );
                    (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                    (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                }
            }
            else
            {
                // share txt nodes between same (value) attributes
                for (m=0; m<aNodes[ txt ][0].length; m++)
                    keyAtts[aNodes[ txt ][0][m]].push( [a, aNodes[ txt ][1], txt] );
            }
        }
        
        // convert to another hash format based on tpl_key
        tpl_keys = {};
        for (nid in hash)
        {
            if ( !hash[HAS](nid) ) continue;
            for (key in hash[nid][0/*KEYS*/] )
            {
                if ( !hash[nid][0/*KEYS*/][HAS](key) ) continue;
                if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [hash[nid][0/*KEYS*/][key], hash[nid][1/*ATTS*/][key]||[]];
                else tpl_keys[key][0/*KEYS*/] = tpl_keys[key][0/*KEYS*/].concat(hash[nid][0/*KEYS*/][key]);
            }
            for (key in hash[nid][1/*ATTS*/] )
            {
                if ( !hash[nid][1/*ATTS*/][HAS](key) ) continue;
                if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [hash[nid][0/*KEYS*/][key]||[], hash[nid][1/*ATTS*/][key]];
                else tpl_keys[key][1/*ATTS*/] = tpl_keys[key][1/*ATTS*/].concat(hash[nid][1/*ATTS*/][key]);
            }
        }
        return [tpl_keys, node];
    }
    
    ,renderer_string = function( data ) {
        var tpl = this.$tpl[1/*TPL*/], revivable = this.$revivable, 
            l = tpl.length, t, atts = [],
            i, notIsSub, s, insideTag, out = ''
        ;
        for (i=0; i<l; i++)
        {
            t = tpl[ i ]; 
            notIsSub = t[ 0 ]; 
            insideTag = t[ 1 ];
            s = t[ 2 ];
            if ( notIsSub )
            {
                // add comment annotations for template to be revived on client-side
                if ( revivable && !insideTag && t[ 3 ] > -1 && atts.length )
                {
                    s = s.slice(0,t[ 3 ]) + '<!--' + atts.join("\n") + '-->' + s.slice(t[ 3 ]);
                    atts = [];
                }
                out += s;
            }
            else
            {
                // enable to render/update tempate with partial data updates only
                // check if not key set and re-use the previous value (if any)
                if ( data[HAS](s) ) t[ 3 ] = String(data[ s ]);
                // add comment annotations for template to be revived on client-side
                if ( revivable ) 
                {
                    if ( insideTag )
                    {
                        out += t[ 3 ];
                        if ( t[ 4 ] ) atts.push('att:'+t[ 4 ]+'|key:'+s+'|'+[t[ 5 ],t[ 3 ].length].join(','));
                    }
                    else
                    {
                        out += '<!--key:'+s+'-->' + t[ 3 ] + '<!--/key-->';
                    }
                }
                else out += t[ 3 ];
            }
        }
        return out;
    }
    
    ,renderer_node = function( data ) {
        var att, i, l, keys, key, k, kl, val, keyNodes, keyAtts, nodes, ni, nl, txt, 
            tpl_keys = this.$tpl[0/*KEYS*/];
        keys = Keys(data); kl = keys.length
        for (k=0; k<kl; k++)
        {
            key = keys[k]; val = String(data[key]);
            if ( !tpl_keys[HAS](key) ) continue;
            
            // element live text nodes
            keyNodes = tpl_keys[key][0/*KEYS*/]; 
            for (i=0,l=keyNodes.length; i<l; i++) 
            {
                keyNodes[i][VALUE] = val;
            }
            
            // element live attributes
            keyAtts = tpl_keys[key][1/*ATTS*/];
            for (i=0,l=keyAtts.length; i<l; i++) 
            {
                att = keyAtts[i]; 
                // inline join_text_nodes
                nodes = att[1]; nl = nodes.length; 
                txt = nl ? nodes[0][VALUE] : '';
                if ( nl > 1 ) for (ni=1; ni<nl; ni++) txt += nodes[ni][VALUE];
                att[0][VALUE] = txt;
            }
        }
        return this;
    }
;

/**[DOC_MARKDOWN]
####Tpl

ModelView.Tpl is an adaptation of Tao.js, an isomorphic class to handle inline templates both from/to string format and live dom update format. Used internaly by ModelView.View and also available as public class ModelView.Tpl.

```javascript
// modelview.js tpl methods
// adapted from https://github.com/foo123/Tao.js

var tpl = new ModelView.Tpl( String|DOMNode tpl );

[/DOC_MARKDOWN]**/
//
// String and LiveDom Isomorphic (Inline) Template Class
// adapted from https://github.com/foo123/Tao.js
var Tpl = function Tpl( template, re_keys, revivable ) {
    var tpl = this;
    // constructor-factory pattern
    if ( !(tpl instanceof Tpl) ) return new Tpl( template, re_keys, revivable );
    tpl.initPubSub( );
    tpl.$revivable = true === revivable;
    if ( template.substr && template.substring )
    {
        tpl.$key = new RegExp(re_keys.source, "g"); /* make sure global flag is added */
        tpl.$tpl = Tpl.multisplit_string( template, tpl.$key, tpl.$revivable );
        tpl.render = renderer_string;
    }
    else //if (tpl is dom_node)
    {
        tpl.$key = new RegExp(re_keys.source, ""); /* make sure global flag is removed */
        tpl.$tpl = multisplit_node( template, tpl.$key, tpl.$revivable );
        tpl.render = renderer_node;
    }
};
Tpl.multisplit_string = multisplit_string;
Tpl.multisplit_node = multisplit_node;
Tpl.free = function( node, hash, atKeys ) {
    var nid;
    if ( hash && (nid=node[nUUID]) && hash[HAS](nid) ) del(hash, nid);
    if ( node[ATTR](atKeys) ) node.removeAttribute( atKeys );
    return hash;
};
// Tpl implements PublishSubscribe pattern
Tpl[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: Tpl
    
    ,id: null
    ,$tpl: null
    ,$key: null
    ,$revivable: false
    
/**[DOC_MARKDOWN]
// dispose tpl
tpl.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var tpl = this;
        tpl.disposePubSub( );
        tpl.$key = null;
        tpl.$tpl = null;
        tp.$revivable = null;
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// get the template dynamic keys
tpl.keys( );

[/DOC_MARKDOWN]**/
    ,keys: function( ) {
        return Keys(this.$tpl[0]);
    }
    
/**[DOC_MARKDOWN]
// render/update and return the template string with given data
tpl.render( Object|Array data );

[/DOC_MARKDOWN]**/
    ,render: function( data ) {
        // override
    }
    
/**[DOC_MARKDOWN]
// tpl bind a new Dom node added to the template (if tpl represents a dom template)
tpl.bind( Node el );

[/DOC_MARKDOWN]**/
    ,bind: function( el ) {  
        var tpl = this;
        if ( el ) tpl.$tpl[KEYS] = Tpl.multisplit_node( el, tpl.$key, tpl.$tpl[KEYS], tpl.$tpl[ATKEYS] )[KEYS];
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl free the Dom node removed from the template (if tpl represents a dom template)
tpl.free( Node el );

[/DOC_MARKDOWN]**/
    ,free: function( el ) {  
        var tpl = this;
        if ( el ) tpl.$tpl[KEYS] = Tpl.free( el, tpl.$tpl[KEYS], tpl.$tpl[ATKEYS] );
        return tpl;
    }
    
    /*
    ,clone: function( ) {
        // todo
    }
    */
    
    ,toString: function( ) {
        return '[ModelView.Tpl id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
