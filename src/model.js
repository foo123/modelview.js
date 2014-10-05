
// Model utils
var 
    getNext = function( a, k ) {
        if ( !a ) return null;
        var b = [ ], i, ai, l = a.length;
        for (i=0; i<l; i++)
        {
            ai = a[ i ];
            if ( ai )
            {
                if ( ai[ k ] ) b.push( ai[ k ].n );
                if ( ai[ WILDCARD ] ) b.push( ai[ WILDCARD ].n );
            }
        }
        return b.length ? b : null;
    },
    
    getValue = function( a, k ) {
        if ( !a ) return null;
        var i, ai, l = a.length;
        if ( k )
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai )
                {
                    if ( ai[ k ] && ai[ k ].v ) return ai[ k ].v;
                    if ( ai[ WILDCARD ] && ai[ WILDCARD ].v ) return ai[ WILDCARD ].v;
                }
            }
        }
        else
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai && ai.v )  return ai.v;
            }
        }
        return null;
    },
    
    walkadd = function( v, p, obj, isCollectionEach ) {
        var o = obj, k, i = 0, l = p.length;
        while ( i < l )
        {
            k = p[i++];
            if ( !(k in o) ) o[ k ] = new Node( );
            o = o[ k ];
            if ( i < l ) 
            {
                o = o.n;
            }
            else 
            {
                if ( isCollectionEach )
                {
                    if ( !(WILDCARD in o.n) ) o.n[ WILDCARD ] = new Node( );
                    o.n[ WILDCARD ].v = v;
                }
                else
                {
                    o.v = v;
                }
            }
        }
        return obj;
    },
    
    walkcheck = function( p, obj, aux, C ) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while ( i < l ) 
        {
            k = p[i++];
            to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && (k in o) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i)];
                    a && (a = getNext( a, k ));
                }
                else if ( !a || !(a = getNext( a, k )) )
                {
                    return false;
                }
            }
            else
            {
                if ( a && getValue( a, k ) ) return true;
                else if ( (to&T_ARRAY_OR_OBJ) && (k in o) ) return true;
                else if ( T_OBJ === to && 'length' == k ) return true;
                return false;
            }
        }
        return false;
    },
    
    walk2 = function( p, obj, aux, C ) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while ( i < l ) 
        {
            k = p[i++];
            to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && (k in o) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i)];
                    a && (a = getNext( a, k ));
                }
                else if ( !a || !(a = getNext( a, k )) )
                {
                    return false;
                }
            }
            else
            {
                if ( a && (a = getValue( a, k )) ) return [false, a];
                else if ( (to&T_ARRAY_OR_OBJ) && (k in o) ) return [true, o[k]];
                else if ( T_OBJ === to && 'length' == k ) return [true, Keys(o).length];
                return false;
            }
        }
        return false;
    },
    
    walk3 = function( p, obj, aux1, aux2, aux3, C, all3 ) {
        var o = obj, a1 = null, a2 = null, a3 = null, 
            k, to, i = 0, l = p.length
        ;
        all3 = false !== all3;
        if ( all3 ) { a1 = [aux1]; a2 = [aux2]; a3 = [aux3]; }
        
        while ( i < l ) 
        {
            k = p[i++];
            to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && (k in o) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i), 0, null, null, null];
                    if ( all3 )
                    {
                        a1 = getNext( a1, k );
                        a2 = getNext( a2, k );
                        a3 = getNext( a3, k );
                    }
                }
                else
                {
                    return [false, o, k, p, null, null, null];
                }
            }
            else if ( (to&T_ARRAY_OR_OBJ) ) 
            {
                
                // nested sub-composite class
                if ( o[ k ] instanceof C )
                    return [C, o[k], p.slice(i), 0, null, null, null];
                else if ((k in o) /*|| (to === T_OBJ && "length" === k)*/) 
                    return [true, o, k, p.slice(i), a1, a2, a3];
                return [false, o, k, p.slice(i), a1, a2, a3];
            }
        }
        return [false, o, k, p.slice(i), null, null, null];
    },
    
    // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
    dotted = function( key ) {
        return key
                .replace(/\[([^\]]*)\]/g, '.$1')         // convert indexes to properties
                .replace(/^\.+/, '')                       // strip a leading dot
                .replace(/\.+$/, '')                       // strip trailing dots
        ;
    },
    
    bracketed = function( dottedKey ) { return '['+dottedKey.split('.').join('][')+']'; },
    
    removePrefix = function( prefix ) {
        // strict mode (after prefix, a key follows)
        var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
        return function( key, to_dotted ) { 
            var k = key.replace( regex, '$1' );
            return to_dotted ? dotted( k ) : k;
        };
    },

    keyLevelUp = function( dottedKey, level ) {
        return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
    },
    
    addModelTypeValidator = function( model, dottedKey, typeOrValidator, modelTypesValidators ) {
        var k, t, isCollectionEach = false;
        t = get_type( typeOrValidator );
        if ( T_FUNC & t )
        {
            isCollectionEach = is_instance( typeOrValidator, CollectionEach );
            // each wrapper
            if ( isCollectionEach ) typeOrValidator = bindF( typeOrValidator.f, model );
            else typeOrValidator = bindF( typeOrValidator, model );
            // bind the typeOrValidator handler to 'this model'
            walkadd( typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach );
        }
        else if ( T_ARRAY_OR_OBJ & t )
        {
            // nested keys given, recurse
            for ( k in typeOrValidator ) addModelTypeValidator( model, dottedKey + '.' + k, typeOrValidator[ k ], modelTypesValidators );
        }
    },
    
    addModelGetterSetter = function( model, dottedKey, getterOrSetter, modelGettersSetters ) {
        var k, t;
        t = get_type( getterOrSetter );
        if ( T_FUNC & t )
        {
            // bind the getterOrSetter handler to 'this model'
            walkadd( bindF( getterOrSetter, model ), -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelGettersSetters );
        }
        else if ( T_ARRAY_OR_OBJ & t )
        {
            // nested keys given, recurse
            for ( k in getterOrSetter ) addModelGetterSetter( model, dottedKey + '.' + k, getterOrSetter[ k ], modelGettersSetters );
        }
    },
    
    // handle sub-composite models as data, via walking the data
    serializeModel = function( modelClass, data, dataType ) {
        var key, type;
        
        while ( data instanceof modelClass ) { data = data.data( ); }
        
        type = dataType || get_type( data );
        data = (T_OBJ & type) ? Merge({}, data) : ((T_ARRAY & type) ? data.slice(0) : data);
        
        if ( T_ARRAY_OR_OBJ & type )
        {
            for (key in data)
            {
                if ( data[ key ] instanceof modelClass )
                    data[ key ] = serializeModel( modelClass, Merge( {}, data[ key ].data( ) ) );
                else if ( T_ARRAY_OR_OBJ & (type=get_type(data[ key ])) )
                    data[ key ] = serializeModel( modelClass, data[ key ], type );
            }
        }
        
        return data;
    },
    
    syncHandler = function( evt, data ) {
        var self = this, $syncTo = self.$syncTo, 
            key = data.key, val = data.value, syncedKeys;
        if ( key && (key in $syncTo) )
        {
            syncedKeys = $syncTo[key];
            for (i=0; i<syncedKeys.length; i++)
                syncedKeys[i][0].set(syncedKeys[i][1], val, true);
        }
    }
;

//
// Model Class
var Model = function( id, data, types, validators, getters, setters ) {
    var model = this;
    
    // constructor-factory pattern
    if ( !(model instanceof Model) ) return new Model( id, data, types, validators, getters, setters );
    
    model.namespace = model.id = id || uuid('Model');
    model.key = removePrefix( model.id );
    
    model.$view = null;
    model.atomic = false;  model.$atom = null;
    model.$types = { }; model.$validators = { }; model.$getters = { }; model.$setters = { };
    model.$syncTo = { };
    model.data( data || { } )
        .types( types ).validators( validators )
        .getters( getters ).setters( setters )
        .initPubSub( )
    ;
};
// STATIC
Model.count = function( o ) {
    if ( !arguments.length ) return 0;
    var T = get_type( o );

    if ( T_OBJ === T ) return Keys( o ).length;
    else if ( T_ARRAY === T ) return o.length;
    else if ( T_UNDEF !== T ) return 1; //  is scalar value, set count to 1
    return 0;
};

// Model implements PublishSubscribe pattern
Model[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: Model
    
    ,id: null
    ,$view: null
    ,$data: null
    ,$types: null
    ,$validators: null
    ,$getters: null
    ,$setters: null
    ,atomic: false
    ,$atom: null
    ,$syncTo: null
    ,$syncHandler: null
    
    ,dispose: function( ) {
        var model = this;
        model.disposePubSub( ).$view = null;
        model.$data = null;
        model.$types = null;
        model.$validators = null;
        model.$getters = null;
        model.$setters = null;
        model.atomic = false;
        model.$atom = null;
        model.key = null;
        model.$syncTo = null;
        model.$syncHandler = null;
        return model;
    }
    
    ,isValid: function( ) {
        // todo
        return true;
    }
    
    ,view: function( v ) {
        var model = this;
        if ( arguments.length )
        {
            model.$view = v;
            return model;
        }
        return model.$view;
    }
    
    ,data: function( d ) {
        var model = this;
        if ( arguments.length )
        {
            model.$data = d;
            return model;
        }
        return model.$data;
    }
    
    ,types: function( types ) {
        var model = this, k;
        if ( is_type(types, T_OBJ) )
        {
            for (k in types) addModelTypeValidator( model, k, types[ k ], model.$types );
        }
        return model;
    }
    
    ,validators: function( validators ) {
        var model = this, k;
        if ( is_type(validators, T_OBJ) )
        {
            for (k in validators) addModelTypeValidator( model, k, validators[ k ], model.$validators );
        }
        return model;
    }
    
    ,getters: function( getters ) {
        var model = this, k;
        if ( is_type(getters, T_OBJ) )
        {
            for (k in getters) addModelGetterSetter( model, k, getters[ k ], model.$getters );
        }
        return model;
    }
    
    ,setters: function( setters ) {
        var model = this, k;
        if ( is_type(setters, T_OBJ) )
        {
            for (k in setters) addModelGetterSetter( model, k, setters[ k ], model.$setters );
        }
        return model;
    }
    
    // handle sub-composite models as data, via walking the data
    ,serialize: function( ) {
        return serializeModel( Model, this.$data );
    }
    
    ,toJSON: function( dottedKey ) {
        var model = this, json, data, T, e;
        
        if ( arguments.length ) data = model.get( dottedKey );
        else data = model.data( );
        
        try { json = toJSON( serializeModel( Model, data ) ); } 
        catch( e ) { throw e; return; }
        
        return json;
    }
    
    ,fromJSON: function( dataJson, dottedKey ) {
        var model = this, data, e;
        if ( dataJson )
        {
            try { data = fromJSON( dataJson ); } 
            catch( e ) { throw e; return; }
            
            if ( dottedKey ) model.set( dottedKey, data );
            else model.data( data );
        }
        return model;
    }
    
    ,has: function( dottedKey, RAW ) {
        var model = this, r;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') && ( (dottedKey in model.$data) || (!RAW && (r=model.$getters[dottedKey]) && r.v) ) )
        {
            // handle single key fast
            return true;
        }
        else if ( (r = walkcheck( dottedKey.split('.'), model.$data, RAW ? null : model.$getters, Model )) )
        {
            return (true === r) ? true : r[1].has(r[2].join('.'));
        }
        return false;
    }
    
    ,get: function( dottedKey, RAW ) {
        var model = this, r, p;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            if ( !RAW && (r=model.$getters[dottedKey]) && r.v ) return r.v( dottedKey );
            return model.$data[ dottedKey ];
        }
        else if ( (r = walk2( dottedKey.split('.'), model.$data, RAW ? null : model.$getters, Model )) )
        {
            // nested sub-model
            if ( Model === r[ 0 ] ) return r[ 1 ].get(r[ 2 ].join('.'), RAW);
            // custom getter
            else if ( false === r[ 0 ] ) return r[ 1 ]( dottedKey );
            // model field
            return r[ 1 ];
        }
        return undef;
    }
    
    // set/add, it can add last node also if not there
    ,set: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            types, validators, setters,
            prevval, canSet = false
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) ? r.v : null;
            type = (r=types[k] || types[WILDCARD]) ? r.v : null;
            validator = (r=validators[k] || validators[WILDCARD]) ? r.v : null;
            canSet = true;
        }
        else if ( (r = walk3( dottedKey.split('.'), o, types, validators, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            type = getValue( r[4], k );
            validator = getValue( r[5], k );
            setter = getValue( r[6], k );
            
            if ( Model === r[ 0 ]  ) 
            {
                // nested sub-model
                if ( k.length ) 
                {
                    k = k.join('.');
                    prevval = o.get( k );
                    if ( prevval !== val ) o.set( k, val, pub, callData ); 
                    else  pub = false;
                }
                else 
                {
                    prevval = o.data( );
                    if ( prevval !== val ) o.data( val );
                    else  pub = false;
                }
                
                pub && model.publish('change', {
                        key: dottedKey, 
                        value: val, 
                        valuePrev: prevval,
                        $callData: callData
                    });
                
                return model;
            }
            else if ( !setter  && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values
                return model;
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) val = type( val, dottedKey );
            if ( validator && !validator( val, dottedKey ) )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: o[k], 
                        $callData: callData
                    });
                }
                return model;
            }
            
            // custom setter
            if ( setter ) 
            {
                if ( setter( dottedKey, val ) ) 
                {
                    pub && model.publish('change', {
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                    
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }
            
            prevval = o[ k ];
            // update/set only if different
            if ( prevval !== val )
            {
                // modify or add final node here
                o[ k ] = val;
            
                pub && model.publish('change', {
                        key: dottedKey, 
                        value: val, 
                        valuePrev: prevval,
                        $callData: callData
                    });
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
            }
        }
        return model;
    }
    
    // add/append value (for arrays like structures)
    ,add: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            canSet = false
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            type = (r=types[k] || types[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            validator = (r=validators[k] || validators[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            canSet = true;
        }
        else if ( (r = walk3( dottedKey.split('.'), o, types, validators, setters, Model )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            type = getValue( getNext( r[4], k ), WILDCARD );
            validator = getValue( getNext( r[5], k ), WILDCARD );
            setter = getValue( getNext( r[6], k ), WILDCARD );
            
            if ( Model === r[ 0 ]  ) 
            {
                // nested sub-model
                if ( k.length ) 
                {
                    k = k.join('.');
                    o.append( k, val, pub, callData ); 
                }
                else 
                {
                    o.data( val );
                }
                
                pub && model.publish('change', {
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                
                return model;
            }
            else if ( !setter && (false === r[0] && r[3].length) )
            {
                // cannot add intermediate values or not array
                return model;
            }
            canSet = true;
        }
        
        if ( canSet )
        {
            if ( type ) val = type( val, dottedKey );
            if ( validator && !validator( val, dottedKey ) )
            {
                if ( pub )
                {
                    if ( callData ) callData.error = true;
                    model.publish('error', {
                        key: dottedKey, 
                        value: /*val*/undef,
                        $callData: callData
                    });
                }
                return model;
            }
            
            // custom setter
            if ( setter ) 
            {
                if ( setter( dottedKey, val ) ) 
                {
                    pub && model.publish('change', {
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                    
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }
            
            if ( T_ARRAY === get_type( o[ k ] ) )
            {
                // append node here
                o[ k ].push( val );
            }
            else
            {
                // not array-like, do a set operation, in case
                o[ k ] = val;
            }
        
            pub && model.publish('change', {
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
    // delete/remove, with or without re-arranging (array) indexes
    ,del: function( dottedKey, reArrangeIndexes, pub, callData ) {
        var model = this, r, o, k, p, val, canDel = false;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        reArrangeIndexes = !!reArrangeIndexes;
        o = model.$data;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            canDel = true;
        }
        else if ( (r = walk3( dottedKey.split('.'), o, null, null, null, Model, false )) )
        {
            o = r[ 1 ]; k = r[ 2 ];
            
            if ( Model === r[ 0 ] && k.length ) 
            {
                // nested sub-model
                k = k.join('.');
                val = o.get( k );
                o.del( k, reArrangeIndexes, pub, callData ); 
                pub && model.publish('delete', {
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                return model;
            }
            else if ( r[ 3 ].length )
            {
                // cannot remove intermediate values
                return model;
            }
            canDel = true;
        }
        
        if ( canDel )
        {
            val = o[ k ];
            if ( reArrangeIndexes )
            {
                o[ k ] = undef; T = get_type( o );
                 // re-arrange indexes
                if ( T_ARRAY == T && is_array_index( k ) ) o.splice( +k, 1 );
                else if ( T_OBJ == T ) delete o[ k ];
            }
            else
            {
                delete o[ k ]; // not re-arrange indexes
            }
            pub && model.publish('delete', {
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
    // synchronize fields with other model(s)
    ,sync: function( model, fieldsMap ) {
        var self = this, k;
        for ( k in fieldsMap )
        {
            self.$syncTo[k] = self.$syncTo[k] || [];
            self.$syncTo[k].push([model, fieldsMap[k]]);
        }
        if ( !self.$syncHandler ) // lazy, only if needed
            self.on('change', self.$syncHandler = syncHandler.bind( self ));
        return self;
    }
    
    // un-synchronize fields with other model(s)
    ,unsync: function( model ) {
        var self = this, k, syncTo = self.$syncTo, list, i;
        for ( k in syncTo )
        {
            list = syncTo[ k ];
            if ( !list.length ) continue;
            for (i=list.length-1; i>=0; i--)
            {
                if ( model === list[i][0] ) list.splice(i, 1);
            }
        }
        return self;
    }
    
    // shortcut to trigger "model:change" per given key
    ,notify: function( dottedKey, evt, callData ) {
        dottedKey && this.publish(evt||'change', {
                key: dottedKey,
                /*, value: null*/
                $callData: callData
            });
        return this;
    }
    
    // atomic (update) operation(s) by key
    ,atom: function( dottedKey ) {
        var model = this;
        if ( undef !== dottedKey )
        {
            if ( false === dottedKey )
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
    
    ,toString: function( ) {
        return '[ModelView.Model id: '+this.id+']';
    }
});
// aliases
Model[proto].append = Model[proto].add;
Model[proto].rem = Model[proto].del;
