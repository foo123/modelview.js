
// Tpl utils
var
    namedKeyProp = "mv_namedkey", nUUID = 'mv_uuid',
    // use hexadecimal string representation in order to have optimal key distribution in hash (??)
    nuuid = 0, node_uuid = function( n ) { return n[nUUID] = n[nUUID] || n.id || ('_'+(++nuuid).toString(16)); }
;

/**[DOC_MARKDOWN]
####Tpl

ModelView.Tpl is an adaptation of Tao.js, an isomorphic class to handle inline templates both from/to string format and live dom update format. Used internaly by ModelView.View and also available as public class ModelView.Tpl.

```javascript
// modelview.js tpl methods
// adapted from https://github.com/foo123/Tao.js

var tpl = new ModelView.Tpl( [String id=UUID] );

[/DOC_MARKDOWN]**/
//
// String and LiveDom Isomorphic (Inline) Template Class
// adapted from https://github.com/foo123/Tao.js
var Tpl = function Tpl( id ) {
    var tpl = this;
    // constructor-factory pattern
    if ( !(tpl instanceof Tpl) ) return new Tpl( id );
    tpl.id = id || uuid('Tpl');
    tpl.initPubSub( );
};
Tpl.string2Dom = str2dom;
Tpl.dom2String = dom2str;
Tpl.multisplit_string = function multisplit_string( str, re_key ) {
    var a = [ ], i = 0, m;
    while ( m = re_key.exec( str ) )
    {
        a.push([1, str.slice(i, re_key.lastIndex - m[0].length)]);
        a.push([0, m[1] ? m[1] : m[0], undef]);
        i = re_key.lastIndex;
    }
    a.push([1, str.slice(i)]);
    return a;
};
Tpl.multisplit_node = function multisplit_node( node, re_key, hash, atKeys ) {
    if ( !re_key ) return {node: node, keys: hash, atkeys: atKeys};
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
                    keyNode = rest; key = m[1];
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
    return {node: node, keys: hash, atkeys: atKeys};;
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
    ,$key: null
    
/**[DOC_MARKDOWN]
// dispose tpl
tpl.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var tpl = this;
        tpl.disposePubSub( );
        tpl.$key = null;
        tpl.$tpl = null;
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl represents a string template str_tpl
// re_keys is a regular expression for key replacememnts inside the template
tpl.str( String str_tpl, RegExp re_keys );

[/DOC_MARKDOWN]**/
    ,str: function( str, re_keys ) {
        var tpl = this;
        tpl.$key = new RegExp(re_keys.source, "g"); // make sure global flag is added
        tpl.$tpl = Tpl.multisplit_string(str, tpl.$key);
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl represents a live dom Node
// re_keys is the regular expression for key replacememnts inside the template
// atkeys is the attribute to use on node if it has key replacements (used internaly mostly)
tpl.dom( DoOMNode node, RegExp re_keys, String atkeys );

[/DOC_MARKDOWN]**/
    ,dom: function( node, re_keys, atkeys ) {
        var tpl = this;
        tpl.$key = new RegExp(re_keys.source, ""); // make sure global flag is removed
        tpl.$tpl = Tpl.multisplit_node( node, tpl.$key, null, atkeys );
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl bind a new Dom node added to the template (if tpl represents a dom template)
tpl.bind( Node el );

[/DOC_MARKDOWN]**/
    ,bind: function( el ) {  
        var tpl = this;
        if ( el ) tpl.$tpl.keys = Tpl.multisplit_node( el, tpl.$key, tpl.$tpl.keys, tpl.$tpl.atkeys );
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// tpl free the Dom node removed from the template (if tpl represents a dom template)
tpl.free( Node el );

[/DOC_MARKDOWN]**/
    ,free: function( el ) {  
        var tpl = this;
        if ( el ) tpl.$tpl.keys = Tpl.free( el, tpl.$tpl.keys, tpl.$tpl.atkeys );
        return tpl;
    }
    
    ,renderView: function( view, model, evt, elements, key, val, isSync ) {
        var tpl = this,
            els_len = elements.length, el, e, att,
            i, nodes, l, keys, k, kk, nkk, kl, v, keyDot, keyNodes, keyAtts,
            hash = tpl.$tpl.keys, cached = { }, nid
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
                        for (i=0,l=nodes.length; i<l; i++) nodes[i][0].nodeValue = join_text_nodes( nodes[i][1] );
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
                                else cached[ nkk ] = [ v=join_text_nodes( att[1] ) ];
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
                                else cached[ nkk ] = [ v=join_text_nodes( att[1] ) ];
                                att[0].nodeValue = v;
                            }
                        }
                    }
                }
            }
        }
        return tpl;
    }
    
/**[DOC_MARKDOWN]
// render/update and return the template string with given data
tpl.renderString( Object|Array data );

[/DOC_MARKDOWN]**/
    ,renderString: function( data ) {
        var tpl = this.$tpl,
            l = tpl.length,
            i, notIsSub, s, out = ''
        ;
        for (i=0; i<l; i++)
        {
            notIsSub = tpl[ i ][ 0 ]; s = tpl[ i ][ 1 ];
            if ( notIsSub )
            {
                out += s;
            }
            else
            {
                // allow to render/update tempate with partial data updates only
                // check if not key set and re-use the previous value (if any)
                if ( data[HAS](s) ) tpl[i][2] = String(data[ s ]);
                out += tpl[i][2];
            }
        }
        return out;
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
