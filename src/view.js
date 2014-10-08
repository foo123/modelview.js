
// View utils
var
    getInlineTplRE = function( InlineTplFormat, modelID ) {
        return new Regex(
            esc_re( InlineTplFormat )
            .replace('__MODEL__', esc_re( modelID || ''))
            .replace('__KEY__', '(\\S+?)')
        ,'');
    },
    
    joinTextNodes = function( nodes ) {
        var i, l = nodes.length, txt = l ? nodes[0].nodeValue : '';
        if ( l > 1 ) for (i=1; i<l; i++) txt += nodes[i].nodeValue;
        return txt;
    },
    
    namedKeyProp = "mv_namedkey", nUUID = 'mv_uuid',
    // use hexadecimal string representation in order to have optimal key distribution in hash (??)
    nuuid = 0, node_uuid = function( n ) { return n[nUUID] = n[nUUID] || n.id || (++nuuid).toString(16); },
    
    removeKeyTextNodes = function( node, hash ) {
        var nid;
        if ( hash && (nid=node[nUUID]) && hash[nid] ) del(hash, nid);
        return hash;
    },
    
    getKeyTextNodes = function( node, re_key, hash, atKeys ) {
        if ( !re_key ) return hash;
        
        var matchedNodes, matchedAtts, i, l, m, matched, n, a, key, nid,
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
            if ( 3 === n.nodeType ) 
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
            
            for (i=0,l=matchedNodes.length; i<l; i++)
            {
                matched = matchedNodes[ i ];
                rest = matched[0]; m = matched[1]; n = matched[2];
                nid = node_uuid( n ); //if ( hash[nid] && hash[nid].keys ) continue;
                hash[nid] = hash[nid] || { }; 
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
                if ( !n[ATTR](atKeys) ) n[SET_ATTR](atKeys, 1);
            }
            aNodes = { };
            for (i=0,l=matchedAtts.length; i<l; i++)
            {
                matched = matchedAtts[ i ];
                a = matched[0]; m = matched[1]; n = matched[2];
                nid = node_uuid( n ); //if ( hash[nid] && hash[nid].atts ) continue;
                hash[nid] = hash[nid] || { }; 
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
                if ( !n[ATTR](atKeys) ) n[SET_ATTR](atKeys, 1);
            }
        }
        return hash;
    },
    
    getSelectors = function( bind, livebind, autobind ) {
        return [
            bind ? '[' + bind + ']' : null,
            
            livebind ? '[' + livebind + ']' : null,
            
            autobind 
            ? (autobind[1] 
                /* exact */ ? 'input[name="' + autobind[0] + '"],textarea[name="' + autobind[0] + '"],select[name="' + autobind[0] + '"]'
                /* prefix */ : 'input[name^="' + autobind[0] + '"],textarea[name^="' + autobind[0] + '"],select[name^="' + autobind[0] + '"]'
            ) 
            : null
        ];
    },
    
    getBindData = function( event, bind ) {
        if ( bind && bind[ event ] )
        {
            if ( is_type(bind[ event ], T_STR) ) bind[ event ] = { action: bind[ event ] };
            return bind[ event ];
        }
    },
    
    doBindAction = function( view, elements, evt, fromModel ) {
        var model = view.$model, isSync = 'sync' == evt.type, 
            event = isSync ? 'change' : evt.type, i, l = elements.length,
            modelkey = fromModel && fromModel.key ? fromModel.key : null,
            modelkeyDot = modelkey ? (modelkey+'.') : null,
            el, bind, do_action, name, key, 
            isAtom = model.atomic, atom = model.$atom,
            atomDot = isAtom ? (atom+'.') : null
        ;
            
        for (i=0; i<l; i++)
        {
            el = elements[i]; if ( !el ) continue;
            bind = getBindData( event, view.attr(el, 'bind') );
            // during sync, dont do any actions based on (other) events
            if ( !bind || !bind.action ) continue;
            
            do_action = 'do_' + bind.action;
            if ( !is_type( view[ do_action ], T_FUNC ) ) continue;
            
            name = el[NAME]; key = bind.key;
            if ( !key )
            {
                if  ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key(name, 1);
                key = el[namedKeyProp];
            }
            // "model:change" event and element does not reference the (nested) model key
            // OR model atomic operation(s)
            if ( (isAtom && key && ((atom === key) || startsWith( key, atomDot ))) || (modelkey && !key) ) continue;
            
            if ( !modelkey || key === modelkey || startsWith( key, modelkeyDot ) )
                view[ do_action ]( evt, el, bind );
        }
    },
    
    doAutoBindAction = function( view, elements, evt, fromModel ) {
        var model = view.$model, cached = { }, i, l = elements.length,
            el, name, key, value
        ;
        
        for (i=0; i<l; i++)
        {
            el = elements[i];  if ( !el ) continue;
            name = el[NAME]; key = 0;
            if ( !el[namedKeyProp] && !!name ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp]; if ( !key ) continue;
            
            // use already cached key/value
            if ( cached[ key ] )  value = cached[ key ][ 0 ];
            else if ( model.has( key ) ) cached[ key ] = [ value=model.get( key ) ];
            else continue;  // nothing to do here
            
            // call default action (ie: live update)
            view.do_bind( evt, el, {name:name, key:key, value:value} );
        }
    },
    
    doLiveBindAction = function( view, elements, evt, key, val ) {
        var model = view.$model, els_len = elements.length, el, e, att,
            i, nodes, l, keys, k, kk, kl, v, keyDot, keyNodes, keyAtts,
            isSync = 'sync' == evt.type, hash = view.$keynodes, cached = { }, nid
        ;
        
        if ( !hash ) return;
        
        if ( key )
        {
            keyDot = key + '.'; val = '' + model.get(key); //val;
            for (e=0; e<els_len; e++)
            {
                el = elements[ e ]; if ( !el || !(nid=el[nUUID]) || !hash[nid] ) continue;
                
                // element live text nodes
                if ( (keyNodes=hash[nid].keys) )
                {
                    if ( (nodes=keyNodes[key]) )
                    {
                        for (i=0,l=nodes.length; i<l; i++) nodes[i].nodeValue = val;
                    }
                    keys = Keys(keyNodes);
                    for (k=0,kl=keys.length; k<kl; k++)
                    {
                        kk = keys[k]; if ( key === kk ) continue;
                        if ( startsWith( kk, keyDot ) && (nodes=keyNodes[kk]).length )
                        {
                            // use already cached key/value
                            if ( cached[ kk ] ) v = cached[ kk ][ 0 ];
                            else cached[ kk ] = [ v='' + model.get( kk ) ];
                            for (i=0,l=nodes.length; i<l; i++) nodes[i].nodeValue = v;
                        }
                    }
                }
                
                // element live attributes
                if ( (keyAtts=hash[nid].atts) )
                {
                    if ( keyAtts && (nodes=keyAtts[key]) )
                    {
                        for (i=0,l=nodes.length; i<l; i++) nodes[i][0].nodeValue = joinTextNodes( nodes[i][1] );
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
                                if ( cached[ att[2] ] ) v = cached[ att[2] ][ 0 ];
                                else cached[ att[2] ] = [ v=joinTextNodes( att[1] ) ];
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
                            if ( cached[ kk ] ) v = cached[ kk ][ 0 ];
                            else cached[ kk ] = [ v='' + model.get( kk ) ];
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
                                if ( cached[ att[2] ] ) v = cached[ att[2] ][ 0 ];
                                else cached[ att[2] ] = [ v=joinTextNodes( att[1] ) ];
                                att[0].nodeValue = v;
                            }
                        }
                    }
                }
            }
        }
    }
;

//
// View Class
var View = function( id, model, atts, cacheSize, refreshInterval ) {
    var view = this;
    
    // constructor-factory pattern
    if ( !(view instanceof View) ) return new View( id, model, atts, cacheSize, refreshInterval );
    
    view.namespace = view.id = id || uuid('View');
    if ( !('bind' in (atts=atts||{})) ) atts['bind'] = "data-bind";
    if ( !('keys' in atts) ) atts['keys'] = "data-mvkeys" + (++nuuid);
    view.$atts = atts;
    cacheSize = cacheSize || View._CACHE_SIZE;
    refreshInterval = refreshInterval || View._REFRESH_INTERVAL;
    view.$memoize = new Cache( cacheSize, INF );
    view.$selectors = new Cache( cacheSize, refreshInterval );
    view.$atbind = view.attribute( "bind" );
    view.$atkeys = view.attribute( "keys" );
    view.model( model || new Model( ) ).initPubSub( );
};
// STATIC
View._CACHE_SIZE = 600; // cache size
View._REFRESH_INTERVAL = INF; // refresh cache interval
// View implements PublishSubscribe pattern
View[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: View
    
    ,id: null
    ,$dom: null
    ,$model: null
    ,$livebind: null
    ,$autobind: false
    ,$bindbubble: false
    ,$template: null
    ,$atts: null
    ,$memoize: null
    ,$selectors: null
    ,$keynodes: null
    ,$atbind: null
    ,$atkeys: null
    
    ,dispose: function( ) {
        var view = this;
        view.unbind( ).disposePubSub( );
        if ( view.$model ) view.$model.dispose( );
        view.$model = null;
        view.$dom = null;
        view.$template = null;
        view.$atts = null;
        view.$memoize.dispose( );
        view.$memoize = null;
        view.$selectors.dispose( );
        view.$selectors = null;
        view.$livebind = null;
        view.$keynodes = null;
        view.$atbind = null;
        view.$atkeys = null;
        return view;
    }
    
    ,model: function( model ) {
        var view = this;
        if ( arguments.length )
        {
            if ( view.$model ) view.$model.dispose( );
            view.$model = model.view( view );
            return view;
        }
        return view.$model;
    }
    
    ,attribute: function( name, att ) {
        var view = this;
        if ( arguments.length > 1 )
        {
            view.$atts[ name ] = att;
            view.$atbind = view.$atts.bind;
            view.$atkeys = view.$atts.keys;
            return view;
        }
        return name ? (view.$atts[ name ] || undef) : undef;
    }
    
    ,template: function( renderer ) {
        var view = this;
        if ( arguments.length )
        {
            if ( is_type( renderer, T_FUNC ) ) view.$template = renderer;
            return view;
        }
        return view.$template;
    }
    
    ,events: function( events ) {
        var view = this, k;
        if ( is_type(events, T_OBJ) )
        {
            for ( k in events ) 
                if ( is_type(events[k], T_FUNC) )
                    view[ 'on_' + k.split(':').join('_') ] = events[k];
        }
        return view;
    }
    
    ,actions: function( actions ) {
        var view = this, k;
        if ( is_type(actions, T_OBJ) )
        {
            for ( k in actions ) 
                if ( is_type(actions[k], T_FUNC) )
                    view[ 'do_' + k ] = actions[k];
        }
        return view;
    }
    
    ,livebind: function( format ) {
        var view = this;
        if ( arguments.length )
        {
            view.$livebind = !!format ? getInlineTplRE( format, view.$model ? view.$model.id : '' ) : null;
            return view;
        }
        return view.$livebind;
    }
    
    ,autobind: function( enable ) {
        var view = this;
        if ( arguments.length )
        {
            view.$autobind = !!enable;
            return view;
        }
        return view.$autobind;                        
    }
    
    ,bindbubble: function( enable ) {
        var view = this;
        if ( arguments.length )
        {
            view.$bindbubble = !!enable;
            return view;
        }
        return view.$bindbubble;                        
    }
    
    // cache selectors for even faster performance
    ,get: function( selector, $dom, addRoot, bypass ) {
        var view = this, selectorsCache = view.$selectors, elements;
        
        $dom = $dom || view.$dom;
        
        if ( bypass || !(elements=selectorsCache.get( selector )) ) 
        {
            elements = $sel( selector, $dom );
            if ( addRoot && matches.call($dom, selector) ) elements.push( $dom );
            if ( !bypass ) selectorsCache.set( selector, elements );
        }
        
        return elements;
    }
    
    // http://stackoverflow.com/questions/10892322/javascript-hashtable-use-object-key
    // http://stackoverflow.com/questions/2937120/how-to-get-javascript-object-references-or-reference-count
    ,attr: function( el, att ) {
        var view = this, attr = view.$atts[ att ],
            memoizeCache = view.$memoize, attribute, attbind
        ;
        
        // use memoization/caching
        if ( !!(attr=el[ATTR]( attr )) )
        {
            attribute = memoizeCache.get( attr );
            
            if ( undef === attribute )
            {
                attribute = fromJSON( attr );
                
                // shortcut abbreviations for some default actions
                if ( attribute.set )
                {
                    attribute.click = attribute.set;
                    attribute.click.action = "set";
                    del(attribute, 'set');
                }
                
                if ( attribute.show )
                {
                    attribute.change = {action:"show", key:attribute.show};
                    del(attribute, 'show');
                }
                if ( attribute.hide )
                {
                    attribute.change = {action:"hide", key:attribute.hide};
                    del(attribute, 'hide');
                }
                
                if ( attribute.html )
                {
                    attribute.change = {action:"html", key:attribute.html};
                    del(attribute, 'html'); del(attribute, 'text');
                }
                else if ( attribute.text )
                {
                    attribute.change = {action:"html", key:attribute.text, text:1};
                    del(attribute, 'text');
                }
                
                if ( attribute.css )
                {
                    attribute.change = {action:"css", css:attribute.css};
                    del(attribute, 'css');
                }
                
                if ( attribute.value )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.value = attribute.value;
                    else
                        attribute.change = {action:"prop", prop:{value:attribute.value}};
                    del(attribute, 'value');
                }
                if ( attribute.checked )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.checked = attribute.checked;
                    else
                        attribute.change = {action:"prop", prop:{checked:attribute.checked}};
                    del(attribute, 'checked');
                }
                if ( attribute.disabled )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.disabled = attribute.disabled;
                    else
                        attribute.change = {action:"prop", prop:{disabled:attribute.disabled}};
                    del(attribute, 'disabled');
                }
                if ( attribute.options )
                {
                    if ( attribute.change && ("prop" == attribute.change.action) )
                        attribute.change.prop.options = attribute.options;
                    else
                        attribute.change = {action:"prop", prop:{options:attribute.options}};
                    del(attribute, 'options');
                }
                
                if ( (attbind=attribute.change) )
                {
                    if ( !attbind.domRef && attribute.domRef ) attbind.domRef = attribute.domRef;
                    if ( !attbind.key && attribute.key ) attbind.key = attribute.key;
                }
                
                // parsing is expensive, use memoize cache
                memoizeCache.set( attr, attribute );
            }
            
            return attribute;
        }
        
        return undef;
    }
    
    ,getDomRef: function( el, ref ) {
        // shortcut to get domRefs relative to current element $el, represented as "$this::" in ref selector
        return ( /*ref &&*/ startsWith(ref, "$this::") ) ? $sel( ref.slice( 7 ), el, 1 ) : $sel( ref, null, 1 );
    }
    
    ,add: function( el, and_sync ) {  
        var view = this;
        if ( el )
        {
            if ( !!view.$livebind )
                view.$keynodes = getKeyTextNodes( el, view.$livebind, view.$keynodes, view.$atkeys );
            if ( false !== and_sync ) view.sync( null, el );
        }
        return view;
    }
    
    ,remove: function( el, and_reset ) {  
        var view = this;
        if ( el ) 
        {
            view.$keynodes = removeKeyTextNodes( el, view.$keynodes );
            if ( false !== and_reset ) view.$selectors.reset( );
        }
        return view;
    }
    
    ,bind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, view.$atkeys, [model.id+'['] ),
            bindSelector = sels[ 0 ], autobindSelector = sels[ 2 ],
            method, evt, namespaced, modelMethodPrefix = /^on_model_/,
            autobind = view.$autobind, livebind = !!view.$livebind
        ;
        
        events = events || ['change', 'click'];
        view.$dom = dom || document.body;
        
        // live update dom nodes
        if ( livebind )
            view.$keynodes = getKeyTextNodes( view.$dom, view.$livebind, null, view.$atkeys );
        
        // model events
        for (method in view)
        {
            if ( !is_type( view[ method ], T_FUNC ) || !modelMethodPrefix.test( method ) ) continue;
            
            evt = method.replace( modelMethodPrefix, '' );
            evt.length && view.onTo( model, evt, view[ method ] );
        }
        
        // view/dom change events
        if ( view.on_view_change && events.length )
        {
            namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
            
            // use one event handler for bind and autobind
            // avoid running same (view) action twice on autobind and bind elements
            DOMEvent( view.$dom ).on( 
                events.map( namespaced ).join( ' ' ), 
                
                autobind ? [ autobindSelector, bindSelector ].join( ',' ) : bindSelector,
                
                function( evt ) {
                    // avoid "ghosting" events on other elements which may be inside a bind element
                    // Chrome issue on nested button clicked, when data-bind on original button
                    // add "bubble" option in modelview data-bind params
                    var el = this,
                        isAutoBind = false, isBind = false, 
                        bind = view.$bindbubble ? view.attr(el, 'bind') : null
                    ;
                    if ( (evt.target === el) || (bind && bind.bubble) )
                    {
                        // view/dom change events
                        isBind = view.$bindbubble ? !!bind : matches.call( el, bindSelector );
                        // view change autobind events
                        isAutoBind = autobind && "change" == evt.type && matches.call( el, autobindSelector );
                        if ( isBind || isAutoBind ) 
                            view.on_view_change( evt, {el:el, isBind:isBind, isAutoBind:isAutoBind} );
                    }
                    return true;
                }
            );
        }
        
        return view;
    }
    
    ,unbind: function( events, dom ) {
        var view = this, model = view.$model,
            sels = getSelectors( view.$atbind, view.$atkeys, [model.id+'['] ),
            namespaced, $dom,
            autobind = view.$autobind, livebind = !!view.$livebind
        ;
        
        events = events || null;
        $dom = dom || view.$dom;
         
        // view/dom change events
        if ( view.on_view_change )
        {
            namespaced = function( evt ) { return NSEvent(evt, view.namespace); };
            
            DOMEvent( $dom ).off( 
                
                events && events.length ? events.map( namespaced ).join(' ') : NSEvent('', view.namespace), 
                
                autobind ? [ sels[ 2 ], sels[ 0 ] ].join( ',' ) : sels[ 0 ]
            );
        }
        
        // model events
        view.offFrom( model );
        
        // live update dom nodes
        view.$keynodes = null;
        
        return view;
    }
    
    ,rebind: function( events, $dom ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        // re-bind to UI
        return view.unbind( ).bind( events, $dom );
    }
    
    ,sync: function( $dom, el ) {
        var view = this, s = getSelectors( view.$atbind, view.$atkeys, [view.$model.id+'['] ), 
            syncEvent = PBEvent('sync', view), binds, autobinds, livebinds, 
            autobind = view.$autobind, livebind = !!view.$livebind, andCache;
        
        view.$selectors.reset( );
        if ( el )
        {
            syncEvent.currentTarget = el;
            binds = view.get( s[ 0 ], el, 0, 1 );
            if ( livebind ) livebinds = view.get( s[ 1 ], el, 1, 1 );
            if ( autobind ) autobinds = view.get( s[ 2 ], el, 0, 1 );
        }
        else
        {
            $dom = $dom || view.$dom; andCache = !($dom === view.$dom);
            binds = view.get( s[ 0 ], $dom, 0, andCache );
            if ( livebind ) livebinds = view.get( s[ 1 ], $dom, 1, andCache );
            if ( autobind ) autobinds = view.get( s[ 2 ], $dom, 0, andCache );
        }
        if ( binds.length ) doBindAction( view, binds, syncEvent );
        if ( livebind && livebinds.length ) doLiveBindAction( view, livebinds, syncEvent );
        if ( autobind && autobinds.length ) doAutoBindAction( view, autobinds, syncEvent );
        return view;
    }
    
    ,reset: function( ) {
        var view = this;
        // refresh caches
        view.$memoize.reset( );
        view.$selectors.reset( );
        return view;
    }
    
    //
    // view "on_event" methods
    //
    
    ,on_view_change: function( evt, data ) {
        var view = this, model = view.$model, 
            el = data.el, name, key, val, 
            checkbox, modeldata = { }
        ;
        
        // update model and propagate to other elements of same view (via model publish hook)
        if ( data.isAutoBind && !!(name=el[NAME]) )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( name, 1 );
            key = el[namedKeyProp];
            
            if ( key && model.has( key ) )
            {
                if ( 'checkbox' === el[TYPE].toLowerCase( ) )
                {
                    checkbox = view.get('input[type="checkbox"][name="'+name+'"]');
                    
                    if ( checkbox.length > 1 )
                    {
                        val = [ ];
                        checkbox.forEach(function( c ) {
                            val.push( c[CHECKED] ? c[VAL] : '' );
                        });
                    }
                    else if ( el[CHECKED] )
                    {
                        val = el[VAL];
                    }
                    else
                    {
                        val = '';
                    }
                }
                else
                {
                    val = get_val( el );
                }
                
                modeldata.$trigger = el;
                model.set( key, val, 1, modeldata );
            }
        }
        
        // if not model update error and element is bind element
        // do view action
        if ( !modeldata.error && data.isBind ) doBindAction( view, [el], evt/*, data*/ );
        
        // notify any 3rd-party also if needed
        view.publish( 'change', data );
    }
    
    ,on_model_change: function( evt, data ) {
        var view = this, model = view.$model,
            s = getSelectors( view.$atbind, view.$atkeys, [model.id + bracketed( data.key )] ),
            bindElements, autoBindElements, liveBindings,  
            autobind = view.$autobind, livebind = !!view.$livebind, 
            notTriggerElem
        ;
        
        bindElements = view.get( s[ 0 ] );
        if ( livebind ) liveBindings = view.get( s[ 1 ], 0, 1 );
        if ( autobind ) autoBindElements = view.get( s[ 2 ] );
        
        // bypass element that triggered the "model:change" event
        if ( data.$callData && data.$callData.$trigger )
        {
            notTriggerElem = function( ele ){ return ele !== data.$callData.$trigger; };
            bindElements = bindElements.filter( notTriggerElem );
            if ( autobind ) autoBindElements = autoBindElements.filter( notTriggerElem );
            data.$callData = null;
        }
        
        // do actions ..
        
        // do view action first
        if ( bindElements.length ) doBindAction( view, bindElements, evt, data );
        // do view live DOM bindings update action
        if ( livebind && liveBindings.length ) doLiveBindAction( view, liveBindings, evt, data.key, data.value );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( autobind && autoBindElements.length ) doAutoBindAction( view, autoBindElements, evt, data );
    }

    ,on_model_error: function( evt, data ) {
        var view = this, model = view.$model,
            s = getSelectors( view.$atbind, view.$atkeys, [model.id + bracketed( data.key )] ),
            bindElements, autoBindElements, liveBindings
        ;

        // do actions ..
        
        // do view bind action first
        if ( (bindElements=view.get( s[ 0 ] )).length ) doBindAction( view, bindElements, evt, data );
        // do view live DOM bindings update action
        if ( view.$livebind && (liveBindings=view.get( s[ 1 ], 0, 1 )).length ) doLiveBindAction( view, liveBindings, evt, data.key, data.value );
        // do view autobind action to bind input elements that map to the model, afterwards
        if ( view.$autobind && (autoBindElements=view.get( s[ 2 ] )).length ) doAutoBindAction( view, autoBindElements, evt, data );
    }
    
    //
    // view "do_action" methods
    //
    
    // NOP action
    ,do_nop: null
    
    // set element(s) attributes/properties according to binding
    ,do_prop: function( evt, el, data ) {
        if ( !is_type(data.prop, T_OBJ) ) return;
        
        var view = this, model = view.$model, 
            prop = data.prop, p, k, v, vT
        ;
        
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el ) return;
            
        for (p in prop)
        {
            k = prop[ p ];
            if ( !model.has( k ) ) continue;
            v = model.get( k ); vT = get_type( v );
            switch( p )
            {
                case 'value':
                    set_val(el, v);
                    break;
                
                case 'checked': case 'disabled':
                    el[p] = ( T_BOOL === vT ) ? v : (Str(v) == el[VAL]);
                    break;
                
                case 'options':
                    if ( 'select' === el[TAG] && (T_ARRAY === vT) )
                    {
                        var sel, ii, vl = v.length,
                            _options = '', group = $tag( 'optgroup', el );
                        sel = select_get( el ); // get selected value
                        group = group.length ? group[ 0 ] : el;
                        $tag( 'option', group ).forEach(function( o ){ group.removeChild( o ); });
                        for (ii=0; ii<vl; ii++)
                        {
                            if ( v[ii] && v[ii].label )
                                _options += '<option value="' + v[ii].value + '">' + v[ii].label + '</option>';
                            else
                                _options += '<option value="' + v[ii] + '">' + v[ii] + '</option>';
                        }
                        group[HTML] = _options;
                        select_set( el, sel ); // select the appropriate option
                    }
                    break;
                
                default:
                    el[SET_ATTR](p, v);
                    break;
            }
        }
    }
    
    // set element(s) html/text prop based on model key value
    ,do_html: function( evt, el, data ) {
        if ( !data.key ) return;
        var view = this, model = view.$model, key = data.key;
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key || !model.has( key ) ) return;
        el[data.text ? (TEXTC in el ? TEXTC : TEXT) : HTML] = model.get( key );
    }
    
    // set element(s) css props based on model key value
    ,do_css: function( evt, el, data ) {
        if ( !is_type(data.css, T_OBJ) ) return;
        var view = this, model = view.$model, css = data.css, k, p, v;
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[ 0 ];
        if ( !el ) return;
        // css attributes
        for ( p in css )
        {
            k = css[ p ]; v = model.get( k );
            if ( /*model.has( k )*/v ) el.style[ p ] = v;
        }
    }
    
    // update/set a model field with a given value
    ,do_set: function( evt, el, data ) {
        var view = this, model = view.$model, key = null, val;
        
        if ( data.key ) 
        {
            key = data.key;
        }
        else if ( el[NAME] )
        {
            if ( !el[namedKeyProp] ) el[namedKeyProp] = model.key( el[NAME], 1 );
            key = el[namedKeyProp];
        }
        
        if ( !!key ) 
        {
            if ( "value" in data ) 
            {
                val = data.value;
            }
            else
            {
                if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
                val = get_val( el );
            }
            model.set( key, val, 1 );
        }
    }
    
    // render an element using a custom template and model data
    ,do_tpl: function( evt, el, data ) {
        var view = this, model, 
            key = data.key, tplID = data.tpl,
            mode, html
        ;
        if ( !view.$template || !key || !tplID ) return;
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el ) return;
        
        model = view.$model;
        if ( !key || !model.has( key ) ) return;
        
        mode = data.mode || 'replace';
        if ( 'replace' == mode ) el[HTML] = '';
        html = view.$template( tplID, model.get( key ) );
        if ( html ) el[HTML] += html;
    }
    
    // show/hide element(s) according to binding
    ,do_show: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key;
        
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key ) return;
        if ( 'value' in data )
        {
            // show if data[key] is value, else hide
            if ( data.value === model.get( key ) ) show(el);
            else hide(el);
        }
        else
        {
            // show if data[key] is true, else hide
            if ( !!model.get( key ) ) show(el);
            else hide(el);
        }
    }
    
    // hide/show element(s) according to binding
    ,do_hide: function( evt, el, data ) {
        var view = this, model = view.$model, key = data.key;
        
        if ( data['domRef'] ) el = view.getDomRef( el, data['domRef'] )[0];
        if ( !el || !key ) return;
        if ( 'value' in data )
        {
            // hide if data[key] is value, else show
            if ( data.value === model.get( key ) ) hide(el);
            else show(el);
        }
        else
        {
            // hide if data[key] is true, else show
            if ( !!model.get( key ) ) hide(el);
            else show(el);
        }
    }
    
    // default bind/update element(s) values according to binding on model:change
    ,do_bind: function( evt, el, data ) {
        var view = this, model = view.$model, 
            name = data.name, key = data.key, 
            elType = el[TYPE].toLowerCase( ),
            value, valueType
        ;
        
        // use already computed/cached key/value from calling method passed in "data"
        if ( !key ) return;
        value = data.value; valueType = get_type( value );
        
        if ( 'radio' === elType )
        {
            if ( Str(value) == el[VAL] )
            {
                view.get('input[name="'+name+'"]').forEach(function( ele ){
                    if ( el !== ele )
                        ele[CHECKED] = false;
                });
                el[CHECKED] = true;
            }
        }
        
        else if ( 'checkbox' === elType )
        {
            var checkbox = view.get('input[type="checkbox"][name="'+name+'"]'); 
            
            if ( checkbox.length > 1 && (T_ARRAY === valueType) )
            {
                checkbox.forEach(function( cb ) {
                    if ( -1 < value.indexOf( cb[VAL] ) ) cb[CHECKED] = true;
                    else cb[CHECKED] = false;
                });
            }
            
            else
            {
                el[CHECKED] = T_BOOL === valueType ? value : (Str(value) == el[VAL]);
            }
        }
        else
        {
            set_val(el, value);
        }
    }
    
    ,toString: function( ) {
        return '[ModelView.View id: '+this.id+']';
    }
});
