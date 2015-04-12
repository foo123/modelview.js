
// Tpl utils
var
    namedKeyProp = "mv_namedkey", nUUID = 'mv_uuid',
    // use hexadecimal string representation in order to have optimal key distribution in hash (??)
    nuuid = 0, node_uuid = function( n ) { return n[nUUID] = n[nUUID] || n.id || ('_'+(++nuuid).toString(16)); }
;

/**[DOC_MARKDOWN]
####Tpl

ModelView.Tpl is an isomorphic class to handle inline templates both from/to string format and live dom update format. Used internaly by ModelView.View and also available as public class ModelView.Tpl.

```javascript
// modelview.js tpl methods

var tpl = new ModelView.Tpl( [String id=UUID] );

[/DOC_MARKDOWN]**/
//
// String and LiveDom Isomorphic (Inline) Template Class
var Tpl = function Tpl( id ) {
    var tpl = this;
    // constructor-factory pattern
    if ( !(tpl instanceof Tpl) ) return new Tpl( id );
    tpl.id = id || uuid('Tpl');
    tpl.initPubSub( );
};
Tpl.multisplit = function multisplit( tpl, reps, as_array ) {
    var r, sr, s, i, j, a, b, c, al, bl/*, as_array = is_array(reps)*/;
    as_array = !!as_array;
    a = [ [1, tpl] ];
    for ( r in reps )
    {
        if ( reps[HAS]( r ) )
        {
            c = [ ]; sr = as_array ? reps[ r ] : r; s = [0, reps[ r ]];
            for (i=0,al=a.length; i<al; i++)
            {
                if ( 1 === a[ i ][ 0 ] )
                {
                    b = a[ i ][ 1 ].split( sr ); bl = b.length;
                    c.push( [1, b[0]] );
                    if ( bl > 1 )
                    {
                        for (j=0; j<bl-1; j++)
                        {
                            c.push( s );
                            c.push( [1, b[j+1]] );
                        }
                    }
                }
                else
                {
                    c.push( a[ i ] );
                }
            }
            a = c;
        }
    }
    return a;
};
Tpl.multisplit_re = function multisplit_re( tpl, re ) {
    var a = [ ], i = 0, m;
    while ( m = re.exec( tpl ) )
    {
        a.push([1, tpl.slice(i, re.lastIndex - m[0].length)]);
        a.push([0, m[1] ? m[1] : m[0]]);
        i = re.lastIndex;
    }
    a.push([1, tpl.slice(i)]);
    return a;
};
Tpl.render = function render( tpl, args ) {
    var l = tpl.length,
        i, notIsSub, s, out = ''
    ;
    args = args || [ ];
    for (i=0; i<l; i++)
    {
        notIsSub = tpl[ i ][ 0 ]; s = tpl[ i ][ 1 ];
        out += (notIsSub ? s : args[ s ]);
    }
    return out;
};
Tpl.compile = function compile( tpl ) {
    var l = tpl.length, 
        i, notIsSub, s, out = '"use strict";' + "\n" + 'return (';
    ;
    for (i=0; i<l; i++)
    {
        notIsSub = tpl[ i ][ 0 ]; s = tpl[ i ][ 1 ];
        if ( notIsSub ) out += "'" + s.replace(SQUOTE, "\\'").replace(NEWLINE, "' + \"\\n\" + '") + "'";
        else out += " + String(args['" + s + "']) + ";
    }
    out += ');';
    return newFunc('args', out);
};
Tpl.multisplit_dom = function multisplit_dom( node, re_key, hash, atKeys ) {
    if ( !re_key ) return hash;
    
    var matchedNodes, matchedAtts, i, l, m, matched, n, a, key, nid, atnodes,
        keyNode, aNodes, aNodesCached, txt, rest, stack, keyNodes, keyAtts
    ;
    
    hash = hash || {};
    if ( node )
    {
        // http://www.geeksforgeeks.org/inorder-tree-traversal-without-recursion/
        /*
        1) Create an empty stack S.
        2) Initialize current node as root
        3) Push the current node to S and set current = current->left until current is NULL
        4) If current is NULL and stack is not empty then 
             a) Pop the top item from stack.
             b) Print the popped item, set current = current->right 
             c) Go to step 3.
        5) If current is NULL and stack is empty then we are done.            
        */
        matchedNodes = [ ]; matchedAtts = [ ]; n = node;
        if ( n.attributes && (l=n.attributes.length) ) 
        {
            for (i=0; i<l; i++)
            {
                a = n.attributes[ i ];
                if ( m=a.nodeValue.match(re_key) ) matchedAtts.push([a, m, n]);
            }
        }
        if ( 3 === n.nodeType ) // textNode 
        {
            if ( m=n.nodeValue.match(re_key) ) matchedNodes.push([n, m, n[PARENT]]);
        }  
        else if ( n.firstChild )
        {
            stack = [ n=n.firstChild ];
            while ( stack.length ) 
            {
                if ( n.attributes && (l=n.attributes.length) ) 
                {
                    for (i=0; i<l; i++)
                    {
                        a = n.attributes[ i ];
                        if ( m=a.nodeValue.match(re_key) ) matchedAtts.push([a, m, n]);
                    }
                }
                if ( n.firstChild ) stack.push( n=n.firstChild );
                else 
                {
                    if ( 3 === n.nodeType && (m=n.nodeValue.match(re_key)) ) matchedNodes.push([n, m, n[PARENT]]);
                    n = stack.pop( );
                    while ( stack.length && !n.nextSibling ) n = stack.pop( );
                    if ( n.nextSibling ) stack.push( n=n.nextSibling );
                }
            }
        }
        atnodes = { };
        for (i=0,l=matchedNodes.length; i<l; i++)
        {
            matched = matchedNodes[ i ];
            rest = matched[0]; m = matched[1]; n = matched[2];
            nid = node_uuid( n ); //if ( hash[nid] && hash[nid].keys ) continue;
            hash[nid] = hash[nid] || { }; atnodes[nid] = n;
            hash[nid].keys = hash[nid].keys || { }; keyNodes = hash[nid].keys;
            txt = rest.nodeValue;  
            if ( txt.length > m[0].length )
            {
                // node contains more text than just the $(key) ref
                do {
                    key = m[1]; keyNode = rest.splitText( m.index );
                    rest = keyNode.splitText( m[0].length );
                    (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                    m = rest.nodeValue.match( re_key );
                } while ( m );
            }
            else
            {
                key = m[1]; keyNode = rest;
                (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
            }
            //if ( !n[ATTR](atKeys) ) n[SET_ATTR](atKeys, 1);
        }
        aNodes = { };
        for (i=0,l=matchedAtts.length; i<l; i++)
        {
            matched = matchedAtts[ i ];
            a = matched[0]; m = matched[1]; n = matched[2];
            nid = node_uuid( n ); //if ( hash[nid] && hash[nid].atts ) continue;
            hash[nid] = hash[nid] || { }; atnodes[nid] = n;
            hash[nid].keys = hash[nid].keys || { }; keyNodes = hash[nid].keys;
            hash[nid].atts = hash[nid].atts || { }; keyAtts = hash[nid].atts;
            txt = a.nodeValue;  aNodesCached = (txt in aNodes);
            if ( !aNodesCached ) 
            {
                rest = get_textnode( txt ); aNodes[ txt ] = [[], [ rest ]];
                if ( txt.length > m[0].length )
                {
                    // attr contains more text than just the $(key) ref
                    do {
                        key = m[1]; 
                        keyNode = rest.splitText( m.index );
                        rest = keyNode.splitText( m[0].length );
                        aNodes[ txt ][0].push( key );
                        aNodes[ txt ][1].push( keyNode ); 
                        aNodes[ txt ][1].push( rest );
                        (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                        (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                        m = rest.nodeValue.match( re_key );
                    } while ( m );
                }
                else
                {
                    keyNode = rest;
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
            //if ( !n[ATTR](atKeys) ) n[SET_ATTR](atKeys, 1);
        }
        key = Keys( atnodes );
        for (m=0; m<key.length; m++)
        {
            n = atnodes[ nid=key[m] ];
            n[SET_ATTR](atKeys, '|'+Keys(hash[nid].keys).join('|'));
        }
    }
    return hash;
};
Tpl.joinTextNodes = function joinTextNodes( nodes ) {
    var i, l = nodes.length, txt = l ? nodes[0].nodeValue : '';
    if ( l > 1 ) for (i=1; i<l; i++) txt += nodes[i].nodeValue;
    return txt;
};
Tpl.findNode = function findNode( root, node_type, node_index ) {
    var ndList = root.childNodes, len = ndList.length, 
        n, node = null, i = 0, node_ith = 0;
    node_index = node_index || 1;
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
    // TEXT_NODE = 3, COMMENT_NODE = 8
    // return node.nodeValue
    while ( i < len )
    {
        n = ndList[i++];
        if ( node_type === n.nodeType )
        {
            node = n;
            if (++node_ith === node_index) break;
        }
    }
    return node;
};
Tpl.renderDom = function renderDom( tpl, data ) {
    var model = data.model, elements = data.elements, els_len = elements.length, el, e, att,
        key = data.key, val = data.val, evt = data.evt,
        i, nodes, l, keys, k, kk, nkk, kl, v, keyDot, keyNodes, keyAtts,
        isSync = data.isSync, hash = tpl.$keynodes, cached = { }, nid
    ;
    if ( !hash ) return;

    if ( key )
    {
        keyDot = key + '.'; val = '' + model.get(key); //val;
        for (e=0; e<els_len; e++)
        {
            el = elements[ e ]; if ( !el || !(nid=el[nUUID]) || !hash[HAS](nid) ) continue;
            
            // element live text nodes
            if ( (keyNodes=hash[nid].keys) )
            {
                if ( keyNodes[HAS](key) )
                {
                    nodes=keyNodes[key];
                    for (i=0,l=nodes.length; i<l; i++) nodes[i].nodeValue = val;
                }
                keys = Keys(keyNodes);
                for (k=0,kl=keys.length; k<kl; k++)
                {
                    kk = keys[k]; if ( key === kk ) continue;
                    if ( startsWith( kk, keyDot ) && (nodes=keyNodes[kk]).length )
                    {
                        // use already cached key/value
                        nkk = '_' + kk;
                        if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                        else cached[ nkk ] = [ v='' + model.get( kk ) ];
                        for (i=0,l=nodes.length; i<l; i++) nodes[i].nodeValue = v;
                    }
                }
            }
            
            // element live attributes
            if ( (keyAtts=hash[nid].atts) )
            {
                if ( keyAtts && keyAtts[HAS](key) )
                {
                    nodes=keyAtts[key];
                    for (i=0,l=nodes.length; i<l; i++) nodes[i][0].nodeValue = Tpl.joinTextNodes( nodes[i][1] );
                }
                keys = Keys(keyAtts);
                for (k=0,kl=keys.length; k<kl; k++)
                {
                    kk = keys[k]; if ( key === kk ) continue;
                    if ( startsWith( kk, keyDot ) && (nodes=keyAtts[kk]).length )
                    {
                        for (i=0,l=nodes.length; i<l; i++) 
                        {
                            att = nodes[i];
                            // use already cached key/value
                            nkk = '_' + att[2];
                            if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                            else cached[ nkk ] = [ v=Tpl.joinTextNodes( att[1] ) ];
                            att[0].nodeValue = v;
                        }
                    }
                }
            }
        }
    }
    else if ( isSync )
    {
        for (e=0; e<els_len; e++)
        {
            el = elements[ e ]; if ( !el || !(nid=el[nUUID]) || !hash[nid] ) continue;
            
            // element live text nodes
            if ( (keyNodes=hash[nid].keys) )
            {
                keys = Keys(keyNodes);
                for (k=0,kl=keys.length; k<kl; k++)
                {
                    kk = keys[k];
                    if ( (nodes=keyNodes[kk]) && (l=nodes.length) )
                    {
                        // use already cached key/value
                        nkk = '_' + kk;
                        if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                        else cached[ nkk ] = [ v='' + model.get( kk ) ];
                        for (i=0; i<l; i++) nodes[i].nodeValue = v;
                    }
                }
            }
            
            // element live attributes
            if ( (keyAtts=hash[nid].atts) )
            {
                keys = Keys(keyAtts);
                for (k=0,kl=keys.length; k<kl; k++)
                {
                    kk = keys[k];
                    if ( (nodes=keyAtts[kk]) && (l=nodes.length) )
                    {
                        for (i=0; i<l; i++) 
                        {
                            att = nodes[i];
                            // use already cached key/value
                            nkk = '_' + att[2];
                            if ( cached[HAS]( nkk ) ) v = cached[ nkk ][ 0 ];
                            else cached[ nkk ] = [ v=Tpl.joinTextNodes( att[1] ) ];
                            att[0].nodeValue = v;
                        }
                    }
                }
            }
        }
    }
};
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
    ,$dom: null
    ,$key: null
    ,$atkeys: null
    ,$keynodes: null
    ,$renderer: null
    
/**[DOC_MARKDOWN]
// dispose tpl
tpl.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var tpl = this;
        tpl.disposePubSub( );
        tpl.$renderer = null;
        tpl.$tpl = null;
        tpl.$dom = null;
        tpl.$key = null;
        tpl.$atkeys = null;
        tpl.$keynodes = null;
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl represents a live dom Node
// re_key is the regular expression for key replacememnts inside the template
// atkeys is the attribute to use on node if it has key replacements (used internaly mostly)
tpl.dom( Node dom, RegExp re_key, String atkeys );

[/DOC_MARKDOWN]**/
    ,dom: function( $dom, re_key, atkeys ) {
        var tpl = this;
        tpl.$tpl = null;
        tpl.$dom = $dom;
        tpl.$key = re_key;
        tpl.$atkeys = atkeys;
        tpl.$keynodes = Tpl.multisplit_dom( tpl.$dom, tpl.$key, null, tpl.$atkeys );
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl represents a string template str_tpl
// reps is either a regular expression for key replacememnts inside the template or a hash of keys to be replaced
// if compiled is set to true, the tpl will be compiled into a function renderer for even faster performance
tpl.str( String str_tpl, RegExp|Object reps [, Boolean compiled=false] );

[/DOC_MARKDOWN]**/
    ,str: function( str, reps, compiled ) {
        var tpl = this;
        tpl.$dom = null;
        tpl.$tpl = reps instanceof RegExp ? Tpl.multisplit_re(str, reps) : Tpl.multisplit(str, reps);
        if ( true === compiled ) tpl.$renderer = Tpl.compile( tpl.$tpl );
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl bind a new Dom node added to the template (if tpl represents a dom template)
tpl.bind( Node el );

[/DOC_MARKDOWN]**/
    ,bind: function( el ) {  
        var tpl = this;
        if ( el ) 
            tpl.$keynodes = Tpl.multisplit_dom( el, tpl.$key, tpl.$keynodes, tpl.$atkeys );
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl free the Dom node removed from the template (if tpl represents a dom template)
tpl.free( Node el );

[/DOC_MARKDOWN]**/
    ,free: function( el ) {  
        var view = this;
        if ( el ) 
            tpl.$keynodes = Tpl.free( el, tpl.$keynodes, tpl.$atkeys );
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// render the template with given data (either update DOM Node or return the replaced string template)
tpl.render( Object|Array data );

[/DOC_MARKDOWN]**/
    ,render: function( data ) {
        var tpl = this;
        
        if ( tpl.$dom )
        {
            data = data || {};
            Tpl.renderDom( tpl, data );
            return tpl;
        }
        else if ( tpl.$tpl )
        {
            data = data || [];
            if ( tpl.$renderer ) return tpl.$renderer( data );
            else return Tpl.render( tpl.$tpl, data );
        }
    }
    
    ,toString: function( ) {
        return '[ModelView.Tpl id: '+this.id+']';
    }
});
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
