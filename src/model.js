
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
                if ( ai[HAS]( k ) ) b.push( ai[ k ].n );
                if ( ai[HAS]( WILDCARD ) ) b.push( ai[ WILDCARD ].n );
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
                    if ( ai[HAS]( k ) && ai[ k ].v ) return ai[ k ].v;
                    if ( ai[HAS]( WILDCARD ) && ai[ WILDCARD ].v ) return ai[ WILDCARD ].v;
                }
            }
        }
        else
        {
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if ( ai && ai.v ) return ai.v;
            }
        }
        return null;
    },
    
    walkadd = function( v, p, obj, isCollectionEach ) {
        var o = obj, k, i = 0, l = p.length;
        while ( i < l )
        {
            k = p[i++];
            if ( !o[HAS](k) ) o[ k ] = new Node( );
            o = o[ k ];
            if ( i < l ) 
            {
                o = o.n;
            }
            else 
            {
                if ( isCollectionEach )
                {
                    if ( !o.n[HAS](WILDCARD) ) o.n[ WILDCARD ] = new Node( );
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
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
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
                else if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return true;
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
            k = p[i++]; to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
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
                else if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return [true, o[k]];
                else if ( T_OBJ === to && 'length' == k ) return [true, Keys(o).length];
                return false;
            }
        }
        return false;
    },
    
    walk2v = function( p, obj, aux, C ) {
        var o = obj, a = aux, k, to, i = 0, l = p.length;
        while ( i < l ) 
        {
            k = p[i++]; to = get_type( o );
            if ( i < l )
            {
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if ( o instanceof C ) return [C, o, p.slice(i)];
                    else if ( !a || !(a = getNext( a, k )) ) return false;
                }
                else
                {
                    return false;
                }
            }
            else
            {
                // nested sub-composite class
                if ( o[k] instanceof C ) return [C, o[k], p.slice(i)];
                else if ( a /*&& getValue( a, k )*/ && (to&T_ARRAY_OR_OBJ) && o[HAS](k) ) return [true, o, k, a];
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
                if ( (to&T_ARRAY_OR_OBJ) && o[HAS](k) )
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
                // fixed, it bypassed setters which had multiple virtual levels
                else if ( all3 && a3 && (a3 = getNext( a3, k )) )
                {
                    a1 = getNext( a1, k );
                    a2 = getNext( a2, k );
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
                else if ( o[HAS](k) /*|| (to === T_OBJ && "length" === k)*/) 
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
    
    addModelTypeValidator = function addModelTypeValidator( model, dottedKey, typeOrValidator, modelTypesValidators ) {
        var k, t, isCollectionEach = false;
        t = get_type( typeOrValidator );
        if ( T_FUNC & t )
        {
            isCollectionEach = is_instance( typeOrValidator, CollectionEach );
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            // each wrapper
            if ( isCollectionEach ) typeOrValidator = typeOrValidator.f; //bindF( typeOrValidator.f, model );
            //else typeOrValidator = bindF( typeOrValidator, model );
            // bind the typeOrValidator handler to 'this model'
            walkadd( typeOrValidator, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelTypesValidators, isCollectionEach );
        }
        else if ( T_ARRAY_OR_OBJ & t )
        {
            // nested keys given, recurse
            for ( k in typeOrValidator ) 
            {
                if ( typeOrValidator[HAS](k) )
                    addModelTypeValidator( model, dottedKey + '.' + k, typeOrValidator[ k ], modelTypesValidators );
            }
        }
    },
    
    addModelGetterSetter = function addModelGetterSetter( model, dottedKey, getterOrSetter, modelGettersSetters ) {
        var k, t;
        t = get_type( getterOrSetter );
        if ( T_FUNC & t )
        {
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            // bind the getterOrSetter handler to 'this model'
            walkadd( getterOrSetter /*bindF( getterOrSetter, model )*/, -1 < dottedKey.indexOf('.') ? dottedKey.split('.') : [dottedKey], modelGettersSetters );
        }
        else if ( T_ARRAY_OR_OBJ & t )
        {
            // nested keys given, recurse
            for ( k in getterOrSetter ) 
            {
                if ( getterOrSetter[HAS](k) )
                    addModelGetterSetter( model, dottedKey + '.' + k, getterOrSetter[ k ], modelGettersSetters );
            }
        }
    },
    
    // handle sub-composite models as data, via walking the data
    serializeModel = function serializeModel( model_instance, model_class, data, dataType ) {
        var key, type;
        if ( arguments.length < 3 ) data = model_instance.$data;
        
        while ( data instanceof model_class ) { data = data.data( ); }
        
        type = dataType || get_type( data );
        data = (T_OBJ & type) ? Merge({}, data) : ((T_ARRAY & type) ? data.slice(0) : data);
        
        if ( T_ARRAY_OR_OBJ & type )
        {
            for (key in data)
            {
                if ( data[HAS](key) )
                {
                    if ( data[ key ] instanceof model_class )
                        data[ key ] = serializeModel( data[ key ], model_class, Merge( {}, data[ key ].data( ) ) );
                    else if ( T_ARRAY_OR_OBJ & (type=get_type(data[ key ])) )
                        data[ key ] = serializeModel( model_instance, model_class, data[ key ], type );
                }
            }
        }
        
        return data;
    },
    
    // handle sub-composite models via walking the data and any attached validators
    validateModel = function validateModel( model, modelClass, breakOnError, dottedKey, data, validators ) {
        var o, key, val, validator, r, res, nestedKey, splitKey, fixKey,
            result = {isValid: true, errors: [ ]}
        ;
        //breakOnError = !!breakOnError;
        data = data || model.$data;
        validators = validators || [model.$validators];
        
        if ( validators && validators.length )
        {
            if ( !!dottedKey )
            {
                fixKey = function( k ){ return !!nestedKey ? (nestedKey + '.' + k) : k; };
                
                if ( (r = walk2v( splitKey=dottedKey.split('.'), o=data, validators, modelClass )) )
                {
                    o = r[ 1 ]; key = r[ 2 ];
                    
                    if ( modelClass === r[ 0 ]  ) 
                    {
                        nestedKey = splitKey.slice(0, splitKey.length-key.length).join('.');
                        
                        // nested sub-model
                        res = validateModel( o, modelClass, breakOnError, key.length ? key.join('.') : null );
                        if ( !res.isValid )
                        {
                            result.errors = result.errors.concat( res.errors.map( fixKey ) );
                            result.isValid = false;
                        }
                        if ( !result.isValid && breakOnError ) return result;
                    }
                    else
                    {
                        nestedKey = splitKey.slice(0, -1).join('.');
                        
                        val = o[ key ]; validator = getValue( r[3], key );
                        if ( validator && !validator.call( model, val, dottedKey ) ) 
                        {
                            result.errors.push( dottedKey/*fixKey( key )*/ );
                            result.isValid = false;
                            if ( breakOnError ) return result;
                        }
                        if ( (T_ARRAY_OR_OBJ & get_type( val )) && (validators=getNext( r[3], key )) && validators.length )
                        {
                            nestedKey += !!nestedKey ? ('.' + key) : key;
                            
                            for (key in val)
                            {
                                if ( val[HAS](key) )
                                {
                                    res = validateModel( model, modelClass, breakOnError, key, val, validators );
                                    if ( !res.isValid )
                                    {
                                        result.errors = result.errors.concat( res.errors.map( fixKey ) );
                                        result.isValid = false;
                                    }
                                    if ( breakOnError && !result.isValid  ) return result;
                                }
                            }
                        }
                    }
                }
            }
            else if ( T_ARRAY_OR_OBJ & get_type( data ) )
            {
                for (key in data)
                {
                    if ( data[HAS](key) )
                    {
                        res = validateModel( model, modelClass, breakOnError, key, data, validators );
                        if ( !res.isValid )
                        {
                            result.errors = result.errors.concat( res.errors );
                            result.isValid = false;
                        }
                        if ( breakOnError && !result.isValid ) return result;
                    }
                }
            }
        }
        return result;
    },
    
    syncHandler = function( evt, data ) {
        var model = evt.target, $syncTo = model.$syncTo, 
            key = data.key, val, keyDot, allKeys, allKeyslen,
            otherkey, othermodel, callback, k, skey,
            syncedKeys, i, l, prev_atomic, prev_atom, __syncing
        ;
        if ( key )
        {
            // make this current key an atom, so as to avoid any circular-loop of updates on same keys
            keyDot = key + '.';
            allKeys = Keys( $syncTo ); allKeyslen = allKeys.length;
            prev_atomic = model.atomic; prev_atom = model.$atom;
            model.atomic = true; model.$atom = key;
            //val = data[HAS]('value') ? data.value : model.get( key );
            for (k=0; k<allKeyslen; k++)
            {
                skey = allKeys[ k ];
                if ( skey === key || startsWith(skey, keyDot) )
                {
                    syncedKeys = $syncTo[skey]; val = model.get( skey );
                    for (i=0,l=syncedKeys.length; i<l; i++)
                    {
                        othermodel = syncedKeys[i][0]; otherkey = syncedKeys[i][1];
                        // fixed, too much recursion, when keys notified other keys, which then were re-synced
                        model.__syncing[othermodel.$id] = model.__syncing[othermodel.$id] || [ ];
                        __syncing = model.__syncing[othermodel.$id];
                        if ( 0 > __syncing.indexOf( otherkey ) )
                        {
                            __syncing.push( otherkey );
                            if ( (callback=syncedKeys[i][2]) ) callback.call( othermodel, otherkey, val, skey, model );
                            else othermodel.set( otherkey, val, 1 );
                            __syncing.pop( );
                        }
                        //model.__syncing[othermodel.$id].__syncing = null;
                    }
                }
            }
            model.$atom = prev_atom; model.atomic = prev_atomic;
        }
    }
;

/**[DOC_MARKDOWN]
####Model

```javascript
// modelview.js model methods

var model = new ModelView.Model( [String id=UUID, Object data={}, Object types=null, Object validators=null, Object getters=null, Object setters=null, Object dependencies=null] );

[/DOC_MARKDOWN]**/
//
// Model Class
var Model = function Model( id, data, types, validators, getters, setters, dependencies ) {
    var model = this;
    
    // constructor-factory pattern
    if ( !(model instanceof Model) ) return new Model( id, data, types, validators, getters, setters, dependencies );
    
    model.$id = uuid('Model');
    model.namespace = model.id = id || model.$id;
    model.key = removePrefix( model.id );
    
    model.$view = null;
    model.atomic = false;  model.$atom = null;
    model.$autovalidate = true;
    model.$types = { }; model.$validators = { }; model.$getters = { }; model.$setters = { };
    model.$idependencies = { }; model.$syncTo = { };
    model.data( data || { } )
        .types( types ).validators( validators )
        .getters( getters ).setters( setters )
        .dependencies( dependencies )
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
// return a sorter to sort model data in custom ways, easily
Model.sorter = sorter;
Model.Field = ModelField;

// Model implements PublishSubscribe pattern
Model[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    constructor: Model
    
    ,id: null
    ,$id: null
    ,$view: null
    ,$data: null
    ,$types: null
    ,$idependencies: null
    ,$validators: null
    ,$getters: null
    ,$setters: null
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
        model.disposePubSub( ).$view = null;
        model.$data = null;
        model.$types = null;
        model.$idependencies = null;
        model.$validators = null;
        model.$getters = null;
        model.$setters = null;
        model.atomic = false;
        model.$atom = null;
        model.key = null;
        model.$autovalidate = false;
        model.$syncTo = null;
        model.$syncHandler = null;
        model.__syncing = null;
        return model;
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
    
/**[DOC_MARKDOWN]
// get / set model data
model.data( [Object data] );

[/DOC_MARKDOWN]**/
    ,data: function( d ) {
        var model = this;
        if ( arguments.length )
        {
            model.$data = d;
            return model;
        }
        return model.$data;
    }
    
/**[DOC_MARKDOWN]
// add model field (inter-)dependencies in {model.key: [array of model.keys it depends on]} format
// when a model.key (model field) changes or updates, it will notify any other fields that depend on it automaticaly
// NOTE: (inter-)dependencies can also be handled by custom model getters/setters as well
model.dependencies( Object dependencies );

[/DOC_MARKDOWN]**/
    ,dependencies: function( deps ) {
        var model = this, k, dependencies = model.$idependencies, d, i, dk, kk, j;
        if ( is_type(deps, T_OBJ) )
        {
            for (k in deps) 
            {
                if ( deps[HAS](k) )
                {
                    // inverse dependencies, used by model
                    d = deps[ k ] ? [].concat( deps[ k ] ) : [];
                    for (i=0; i<d.length; i++)
                    {
                        // add hierarchical/dotted key, all levels
                        kk = d[i].split('.');
                        dk = kk[0];
                        if ( !dependencies[HAS](dk) ) dependencies[ dk ] = [ ];
                        if ( 0 > dependencies[ dk ].indexOf( k ) ) dependencies[ dk ].push( k );
                        for (j=1; j<kk.length; j++)
                        {
                            dk += '.' + kk[j];
                            if ( !dependencies[HAS](dk) ) dependencies[ dk ] = [ ];
                            if ( 0 > dependencies[ dk ].indexOf( k ) ) dependencies[ dk ].push( k );
                        }
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
    ,types: function( types ) {
        var model = this, k;
        if ( is_type(types, T_OBJ) )
        {
            for (k in types) 
            {
                if ( types[HAS](k) )
                    addModelTypeValidator( model, k, types[ k ], model.$types );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add validators given in {dottedKey: validator} format
model.validators( Object validators );

[/DOC_MARKDOWN]**/
    ,validators: function( validators ) {
        var model = this, k;
        if ( is_type(validators, T_OBJ) )
        {
            for (k in validators) 
            {
                if ( validators[HAS](k) )
                    addModelTypeValidator( model, k, validators[ k ], model.$validators );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add custom getters (i.e computed/virtual observables) given in {dottedKey: getter} format
model.getters( Object getters );

[/DOC_MARKDOWN]**/
    ,getters: function( getters ) {
        var model = this, k;
        if ( is_type(getters, T_OBJ) )
        {
            for (k in getters) 
            {
                if ( getters[HAS](k) )
                    addModelGetterSetter( model, k, getters[ k ], model.$getters );
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// add custom setters given in {dottedKey: setter} format
model.setters( Object setters );

[/DOC_MARKDOWN]**/
    ,setters: function( setters ) {
        var model = this, k;
        if ( is_type(setters, T_OBJ) )
        {
            for (k in setters) 
            {
                if ( setters[HAS](k) )
                    addModelGetterSetter( model, k, setters[ k ], model.$setters );
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
    ,serialize: function( ) {
        return serializeModel( this, Model );
    }
    
/**[DOC_MARKDOWN]
// validate model for given key or all data with any attached model validators
// (return on first not valid value if  breakOnFirstError is true )
// handles nested composite models automaticaly
// returns: { isValid: [true|false], errors:[Array of (nested) model keys which are not valid] }
model.validate( [Boolean breakOnFirstError=false, String dottedKey=undefined] );

[/DOC_MARKDOWN]**/
    // handle sub-composite models via walking the data and any attached validators
    ,validate: function( breakOnFirstError, dottedKey ) {
        return validateModel( this, Model, !!breakOnFirstError, dottedKey );
    }
    
/**[DOC_MARKDOWN]
// get/set model auto-validate flag, if TRUE validates each field that has attached validators live as it changes
model.autovalidate( [Boolean enabled] );

[/DOC_MARKDOWN]**/
    ,autovalidate: function( enabled ) {
        var model = this;
        if ( arguments.length )
        {
            model.$autovalidate = !!enabled;
            return model;
        }
        return model.$autovalidate;
    }
    
/**[DOC_MARKDOWN]
// get data in JSON string format
model.toJSON( [String dottedKey] );

[/DOC_MARKDOWN]**/
    ,toJSON: function( dottedKey ) {
        var model = this, json, data, T, e;
        
        if ( arguments.length ) data = model.get( dottedKey );
        else data = model.data( );
        
        try { json = toJSON( serializeModel( model, Model ) ); } 
        catch( e ) { throw e; return; }
        
        return json;
    }
    
/**[DOC_MARKDOWN]
// set data from JSON string format
model.fromJSON( String jsonData [, String dottedKey, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    ,fromJSON: function( dataJson, dottedKey, pub ) {
        var model = this, data, e;
        if ( dataJson )
        {
            try { data = fromJSON( dataJson ); } 
            catch( e ) { throw e; return; }
            
            if ( dottedKey ) model.set( dottedKey, data, true === pub );
            else model.data( data );
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// whether model has given key (bypass custom model getters if RAW is true)
model.has( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,has: function( dottedKey, RAW ) {
        var model = this, data = model.$data, getters = model.$getters, r;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') && ( data[HAS](dottedKey) || (!RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v) ) )
        {
            // handle single key fast
            return true;
        }
        else if ( (r = walkcheck( dottedKey.split('.'), data, RAW ? null : getters, Model )) )
        {
            return (true === r) ? true : r[1].has(r[2].join('.'));
        }
        return false;
    }
    
/**[DOC_MARKDOWN]
// model get given key (bypass custom model getters if RAW is true)
model.get( String dottedKey [, Boolean RAW=false ] );

[/DOC_MARKDOWN]**/
    ,get: function( dottedKey, RAW ) {
        var model = this, data = model.$data, getters = model.$getters, r;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            if ( !RAW && (r=getters[dottedKey]||getters[WILDCARD]) && r.v ) return r.v.call( model, dottedKey );
            return data[ dottedKey ];
        }
        else if ( (r = walk2( dottedKey.split('.'), data, RAW ? null : getters, Model )) )
        {
            // nested sub-model
            if ( Model === r[ 0 ] ) return r[ 1 ].get(r[ 2 ].join('.'), RAW);
            // custom getter
            else if ( false === r[ 0 ] ) return r[ 1 ].call( model, dottedKey );
            // model field
            return r[ 1 ];
        }
        return undef;
    }
    
/**[DOC_MARKDOWN]
// model set key to val
model.set( String dottedKey, * val [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // set/add, it can add last node also if not there
    ,set: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            types, validators, setters, ideps,
            prevval, canSet = false,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) ? r.v : null;
            type = (r=types[k] || types[WILDCARD]) ? r.v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) ? r.v : null;
            canSet = true;
        }
        else if ( (r = walk3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
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
                
                if ( pub )
                {
                    model.publish('change', {
                        key: dottedKey, 
                        value: val, 
                        valuePrev: prevval,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
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
            if ( type ) val = type.call( model, val, dottedKey );
            if ( validator && !validator.call( model, val, dottedKey ) )
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
                if ( false !== setter.call( model, dottedKey, val, pub ) ) 
                {
                    if ( pub )
                    {
                        model.publish('change', {
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                        
                        // notify any dependencies as well
                        if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                    }
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
            
                if ( pub )
                {
                    model.publish('change', {
                        key: dottedKey, 
                        value: val, 
                        valuePrev: prevval,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
                
                if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
            }
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model add/append val to key (if key is array-like)
model.[add|append]( String dottedKey, * val [, Boolean publish=false] );

[/DOC_MARKDOWN]**/
    // add/append value (for arrays like structures)
    ,add: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            types, validators, setters, ideps,
            canSet = false,
            autovalidate = model.$autovalidate
        ;
        
        if ( model.atomic && startsWith( dottedKey, model.$atom ) ) return model;
        
        o = model.$data;
        types = model.$types; 
        validators = model.$validators; 
        setters = model.$setters;
        ideps = model.$idependencies;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') )
        {
            // handle single key fast
            k = dottedKey;
            setter = (r=setters[k]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            type = (r=types[k] || types[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            validator = autovalidate && (r=validators[k] || validators[WILDCARD]) && r.n[WILDCARD] ? r.n[WILDCARD].v : null;
            canSet = true;
        }
        else if ( (r = walk3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model )) )
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
                    o.add( k, val, pub, callData ); 
                }
                else 
                {
                    o.data( val );
                }
                
                if ( pub )
                {
                    model.publish('append', {
                        key: dottedKey, 
                        value: val,
                        $callData: callData
                    });
                    
                    // notify any dependencies as well
                    if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                }
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
            if ( type ) val = type.call( model, val, dottedKey );
            if ( validator && !validator.call( model, val, dottedKey ) )
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
                if ( false !== setter.call( model, dottedKey, val, pub ) ) 
                {
                    if ( pub )
                    {
                        model.publish('append', {
                            key: dottedKey, 
                            value: val,
                            $callData: callData
                        });
                        
                        // notify any dependencies as well
                        if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
                    }
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
        
            if ( pub )
            {
                model.publish('append', {
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
                
                // notify any dependencies as well
                if ( ideps[HAS](dottedKey) ) model.notify( ideps[dottedKey] );
            }
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
/**[DOC_MARKDOWN]
// model delete/remove key (with or without re-arranging array indexes)
model.[del|rem]( String dottedKey [, Boolean publish=false, Boolean reArrangeIndexes=false] );

[/DOC_MARKDOWN]**/
    // delete/remove, with or without re-arranging (array) indexes
    ,del: function( dottedKey, pub, reArrangeIndexes, callData ) {
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
    
/**[DOC_MARKDOWN]
// shortcut to synchronise specific fields of this model to other fields of another model
model.sync( Model otherModel, Object fieldsMap );

[/DOC_MARKDOWN]**/
    // synchronize fields to other model(s)
    ,sync: function( otherModel, fieldsMap ) {
        var model = this, key, otherKey, callback, list, i, l, addIt;
        for (key in fieldsMap)
        {
            if ( fieldsMap[HAS](key) )
            {
                otherKey = fieldsMap[key]; model.$syncTo[key] = model.$syncTo[key] || [];
                callback = null;
                if ( T_ARRAY === get_type(otherKey) )
                {
                    callback = otherKey[1] || null;
                    otherKey = otherKey[0];
                }
                list = model.$syncTo[key]; addIt = 1;
                for (i=list.length-1; i>=0; i--)
                {
                    if ( otherModel === list[i][0] && otherKey === list[i][1] )
                    {
                        list[i][2] = callback;
                        addIt = 0; 
                        break;
                    }
                }
                // add it if not already added
                if ( addIt ) list.push([otherModel, otherKey, callback]);
            }
        }
        if ( !model.$syncHandler ) // lazy, only if needed
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
    ,unsync: function( otherModel ) {
        var model = this, key, syncTo = model.$syncTo, list, i;
        for (key in syncTo)
        {
            if ( syncTo[HAS](key) )
            {
                if ( !(list=syncTo[ key ]) || !list.length ) continue;
                for (i=list.length-1; i>=0; i--)
                {
                    if ( otherModel === list[i][0] ) 
                    {
                        if ( model.__syncing && model.__syncing[otherModel.$id] ) del(model.__syncing, otherModel.$id);
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
    ,notify: function( dottedKey, evt, data ) {
        var model = this, ideps = model.$idependencies, 
            k, l, d, dk, t, deps = [], deps2, keys = {};
        if ( dottedKey )
        {
            t = get_type( dottedKey );
            evt = evt || 'change';  
            d = {key: ''};
            if ( data )
            {
                if ( data[HAS]('value') ) d.value = data.value;
                if ( data[HAS]('$callData') ) d.$callData = data.$callData;
            }
            
            if ( T_STR === t )
            {
                d.key = dottedKey;
                // notify any dependencies as well
                keys['_'+dottedKey] = 1;
                if ( ideps[HAS](dottedKey) ) deps = deps.concat( ideps[dottedKey] );
                model.publish( evt, d );
            }
            else if ( T_ARRAY === t )
            {
                // notify multiple keys
                l = dottedKey.length;
                for (k=0; k<l; k++)
                {
                    d.key = dk = dottedKey[ k ];
                    if ( keys[HAS]('_'+dk) ) continue;
                    // notify any dependencies as well
                    keys['_'+dk] = 1;
                    if ( ideps[HAS](dk) ) deps = deps.concat( ideps[dk] );
                    model.publish( evt, d );
                }
            }
            
            while ( l = deps.length )
            {
                // notify any dependencies as well
                deps2 = [];
                d = {key: ''};
                for (k=0; k<l; k++)
                {
                    dk = deps[ k ];
                    // avoid already notified keys previously
                    if ( keys[HAS]('_'+dk) ) continue;
                    keys['_'+dk] = 1;
                    if ( ideps[HAS](dk) ) deps2 = deps2.concat( ideps[dk] );
                    d.key = dk;
                    model.publish( "change", d );
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
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
