
// Model utils
var
    get_next = function(a, k) {
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
    },

    get_value = function(a, k) {
        if (!a) return null;
        var i, ai, l = a.length;
        if (undef !== k)
        {
            for (i=0; i<l; i++)
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
            for (i=0; i<l; i++)
            {
                ai = a[ i ];
                if (ai && ai.v) return ai.v;
            }
        }
        return null;
    },

    walk_and_add = function(v, p, obj, isCollectionEach) {
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
    },

    walk_and_check = function(p, obj, aux, C) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++];
            if (o instanceof Collection) o = o.items();
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
    },

    walk_and_get2 = function(p, obj, aux, C) {
        var o = obj, a = aux ? [aux] : null, k, to, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++];
            if (o instanceof Collection) o = o.mapped();
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
                if (a && (a = get_value( a, k ))) return [false, a];
                else if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k)) return [true, o[k]];
                else if (T_OBJ === to && 'length' == k) return [true, Keys(o).length];
                return false;
            }
        }
        return false;
    },

    walk_and_get_value2 = function(p, obj, aux, C) {
        var o = obj, a = aux, k, to, i = 0, l = p.length;
        while (i < l)
        {
            k = p[i++];
            if (o instanceof Collection && i < l) o = o.mapped();
            to = get_type( o );
            if (i < l)
            {
                if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if (o instanceof C) return [C, o, p.slice(i)];
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
                if (o[k] instanceof C) return [C, o[k], p.slice(i)];
                else if (a /*&& get_value( a, k )*/ && ((o instanceof Collection) || ((to&T_ARRAY_OR_OBJ) && HAS.call(o,k)))) return [true, o, k, a];
                return false;
            }
        }
        return false;
    },

    walk_and_get3 = function(p, obj, aux1, aux2, aux3, C, all3, collections) {
        var o = obj, a1 = null, a2 = null, a3 = null,
            k, to, i = 0, l = p.length
        ;
        all3 = false !== all3;
        if (all3) { a1 = [aux1]; a2 = [aux2]; a3 = [aux3]; }

        while (i < l)
        {
            k = p[i++];
            if (o instanceof Collection && i < l)
            {
                if (collections) collections.push([o, +k]);
                o = o.mapped();
            }
            to = get_type( o );
            if (i < l)
            {
                if ((to & T_ARRAY_OR_OBJ) && HAS.call(o,k))
                {
                    o = o[ k ];
                    // nested sub-composite class
                    if (o instanceof C) return [C, o, p.slice(i), 0, null, null, null];
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
            else if (o instanceof Collection)
            {
                return [true, o, k, p.slice(i), a1, a2, a3];
            }
            else if (to & T_ARRAY_OR_OBJ)
            {

                // nested sub-composite class
                if (o[ k ] instanceof C)
                    return [C, o[k], p.slice(i), 0, null, null, null];
                else if (HAS.call(o,k) /*|| (to === T_OBJ && "length" === k)*/)
                    return [true, o, k, p.slice(i), a1, a2, a3];
                return [false, o, k, p.slice(i), a1, a2, a3];
            }
        }
        return [false, o, k, p.slice(i), null, null, null];
    },

    // http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key
    index_to_prop_re = /\[([^\]]*)\]/g, trailing_dots_re = /^\.+|\.+$/g,
    dotted = function(key) {
        //        convert indexes to properties     strip leading/trailing dots
        return key.replace(index_to_prop_re, '.$1').replace(trailing_dots_re, '');
    },
    bracketed = function(dottedKey) {
        return '['+dottedKey.split('.').join('][')+']';
    },

    removePrefix = function(prefix) {
        // strict mode (after prefix, a key follows)
        var regex = new Regex( '^' + prefix + '([\\.|\\[])' );
        return function(key, to_dotted) {
            var k = key.replace(regex, '$1');
            return to_dotted ? dotted(k) : k;
        };
    },

    keyLevelUp = function(dottedKey, level) {
        return dottedKey && (0 > level) ? dottedKey.split('.').slice(0, level).join('.') : dottedKey;
    },

    addModelTypeValidator = function addModelTypeValidator(model, dottedKey, typeOrValidator, modelTypesValidators) {
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
    },

    addModelGetterSetter = function addModelGetterSetter(model, dottedKey, getterOrSetter, modelGettersSetters) {
        var k, t;
        t = get_type( getterOrSetter );
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
    },

    modelDefaults = function modelDefaults(model, data, defaults) {
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
    },

    // handle collection and sub-composite models as data, via walking the data
    serializeModel = function serializeModel(model_instance, model_class, data, dataType) {
        var key, type;
        if (arguments.length < 3) data = model_instance.$data;

        while (data instanceof model_class) { data = data.data( ); }

        if (data instanceof Collection) data = data.mapped();
        type = dataType || get_type( data );
        data = T_OBJ & type ? Merge({}, data) : (T_ARRAY & type ? data.slice(0) : data);

        if (T_ARRAY_OR_OBJ & type)
        {
            for (key in data)
            {
                if (HAS.call(data,key))
                {
                    if (data[ key ] instanceof Collection)
                        data[ key ] = serializeModel( model_instance, model_class, data[ key ].mapped(), type );
                    else if (data[ key ] instanceof model_class)
                        data[ key ] = serializeModel(data[ key ], model_class, Merge( {}, data[ key ].data( ) ));
                    else if (T_ARRAY_OR_OBJ & (type=get_type(data[ key ])))
                        data[ key ] = serializeModel( model_instance, model_class, data[ key ], type );
                }
            }
        }

        return data;
    },

    // handle collections and sub-composite models via walking the data and any attached typecasters
    typecastModel = function typecastModel(model, modelClass, dottedKey, data, typecasters, prefixKey) {
        var o, key, val, typecaster, r, res, nestedKey, splitKey;
        prefixKey = !!prefixKey ? (prefixKey+'.') : '';
        data = data || model.$data;
        if (data instanceof Collection) data = data.items();
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
                        if (o instanceof Collection) o = o.items();
                        nestedKey = splitKey.slice(0, -1).join('.');
                        val = o[ key ]; typecaster = get_value( r[3], key );
                        if (typecaster)
                        {
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
    },

    // handle sub-composite models via walking the data and any attached validators
    validateModel = function validateModel(model, modelClass, breakOnError, dottedKey, data, validators) {
        var o, key, val, validator, r, res, nestedKey, splitKey, fixKey,
            result = {isValid: true, errors: [ ]}
        ;
        //breakOnError = !!breakOnError;
        data = data || model.$data;
        if (data instanceof Collection) data = data.items();
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
                            result.errors = result.errors.concat(map(res.errors, fixKey));
                            result.isValid = false;
                        }
                        if (!result.isValid && breakOnError) return result;
                    }
                    else
                    {
                        if (o instanceof Collection) o = o.items();
                        nestedKey = splitKey.slice(0, -1).join('.');

                        val = o[ key ]; validator = get_value( r[3], key );
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
                                        result.errors = result.errors.concat(map(res.errors, fixKey));
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
    },

    syncHandler = function(evt, data) {
        var model = evt.target, $syncTo = model.$syncTo,
            key = data.key, val, keyDot, allKeys, allKeyslen,
            otherkey, othermodel, callback, k, skey,
            syncedKeys, i, l, prev_atomic, prev_atom, __syncing
        ;
        if ( key )
        {
            // make this current key an atom, so as to avoid any circular-loop of updates on same keys
            keyDot = key + '.';
            allKeys = Keys($syncTo); allKeyslen = allKeys.length;
            prev_atomic = model.atomic; prev_atom = model.$atom;
            model.atomic = true; model.$atom = key;
            //val = HAS.call(data,'value') ? data.value : model.get( key );
            for (k=0; k<allKeyslen; k++)
            {
                skey = allKeys[ k ];
                if (skey === key || startsWith(skey, keyDot))
                {
                    syncedKeys = $syncTo[skey]; val = model.get( skey );
                    for (i=0,l=syncedKeys.length; i<l; i++)
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
;

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
    if (!(model instanceof Model)) return new Model(id, data, types, validators, getters, setters, dependencies);

    model.$id = uuid('Model');
    model.namespace = model.id = id || model.$id;
    model.key = removePrefix(model.id);

    model.$view = null;
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
    if (o instanceof Collection) o = o.items();
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
    ,$id: null
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
        model.disposePubSub();
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
                    for (i=0; i<d.length; i++)
                    {
                        // add hierarchical/dotted key, all levels
                        kk = d[i].split('.');
                        dk = kk[0];
                        if (!HAS.call(dependencies,dk)) dependencies[ dk ] = [ ];
                        if (0 > dependencies[ dk ].indexOf( k )) dependencies[ dk ].push( k );
                        for (j=1; j<kk.length; j++)
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
        for (f=0,fl=fields.length; f<fl; f++)
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
                    if (o instanceof Collection && i < l) o = o.mapped();
                    if (i < l)
                    {
                        t = get_type( o );
                        if (t & T_OBJ)
                        {
                            if (WILDCARD === k)
                            {
                                k = p.slice(i).join('.');
                                keys = Keys(o);
                                for (kk=0; kk<keys.length; kk++)
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
                                for (kk=0; kk<o.length; kk++)
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
                                for (kk=0; kk<keys.length; kk++)
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
                                for (kk=0; kk<o.length; kk++)
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
            type, validator, setter,
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
        else if ((r = walk_and_get3( dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model, true, collections )))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    prevval = o.get(k);
                    if (prevval !== val)
                    {
                        o.set(k, val, pub, callData);
                        collections.forEach(function(collection){
                            collection[0]._upd('change', collection[1], collection[1]);
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

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'set',
                        valuePrev: prevval,
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
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
            if (type)
            {
                val = type.call(model, val, dottedKey);
            }
            else if (collection_type)
            {
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if (collection_validator)
            {
                for (i=0,l=val.length; i<l; i++)
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
                    collections.forEach(function(collection){
                        collection[0]._upd('change', collection[1], collection[1]);
                    });
                    if (pub)
                    {
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: 'set',
                            $callData: callData
                        });

                        // notify any dependencies as well
                        if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                    }
                    if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
                }
                return model;
            }

            prevval = o instanceof Collection ? o.get(k) : (o[k] instanceof Collection ? o[k].items() : o[ k ]);
            // update/set only if different
            if (prevval !== val)
            {
                collections.forEach(function(collection){
                    collection[0]._upd('change', collection[1], collection[1]);
                });

                // modify or add final node here
                if (o instanceof Collection) o.set(k, val);
                else if (o[k] instanceof Collection) o[k].set(val);
                else o[ k ] = val;

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        valuePrev: prevval,
                        action: 'set',
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
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
            type, validator, setter,
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
        else if ((r = walk_and_get3(dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model, true, collections)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    o.add(k, val, prepend, pub, callData);
                    collections.forEach(function(collection){
                        collection[0]._upd('change', collection[1], collection[1]);
                    });
                }
                else
                {
                    index = 0;
                    o.data(val);
                }

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: prepend ? 'prepend' : 'append',
                        index: index,
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
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
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if ( collection_validator )
            {
                for (i=0,l=val.length; i<l; i++)
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
                    collections.forEach(function(collection){
                        collection[0]._upd('change', collection[1], collection[1]);
                    });
                    if (pub)
                    {
                        if ((o[k] instanceof Collection) || (T_ARRAY === get_type(o[ k ])))
                        {
                            index = prepend ? 0 : (o[k] instanceof Collection ? o[k].items().length : o[k].length);
                        }
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: prepend ? 'prepend' : 'append',
                            index: index,
                            $callData: callData
                        });

                        // notify any dependencies as well
                        if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            if ((o[k] instanceof Collection) || (T_ARRAY === get_type(o[ k ])))
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
                    index = o[k] instanceof Collection ? o[k].items().length : o[ k ].length;
                    o[ k ].push(val);
                }
            }
            else
            {
                // not array-like, do a set operation, in case
                index = -1;
                o[ k ] = val;
            }

            collections.forEach(function(collection){
                collection[0]._upd('change', collection[1], collection[1]);
            });

            if (pub)
            {
                model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'append',
                    index: index,
                    $callData: callData
                });

                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
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
            type, validator, setter,
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
        else if ((r = walk_and_get3(dottedKey.split('.'), o, types, autovalidate ? validators : null, setters, Model, true, collections)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ])
            {
                // nested sub-model
                if (k.length)
                {
                    k = k.join('.');
                    o.ins(k, val, index, pub, callData);
                    collections.forEach(function(collection){
                        collection[0]._upd('change', collection[1], collection[1]);
                    });
                }
                else
                {
                    //index = 0;
                    o.data(val);
                }

                if (pub)
                {
                    model.publish('change', {
                        key: dottedKey,
                        value: val,
                        action: 'insert',
                        index: index,
                        $callData: callData
                    });

                    // notify any dependencies as well
                    if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
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
                for (i=0,l=val.length; i<l; i++)
                    val[i] = collection_type.call(model, val[i], dottedKey);
            }

            validated = true;
            if (validator)
            {
                validated = validator.call(model, val, dottedKey);
            }
            else if (collection_validator)
            {
                for (i=0,l=val.length; i<l; i++)
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
                    model.publish('error', {
                        key: dottedKey,
                        value: /*val*/undef,
                        action: 'insert',
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
                    collections.forEach(function(collection){
                        collection[0]._upd('change', collection[1], collection[1]);
                    });
                    if (pub)
                    {
                        model.publish('change', {
                            key: dottedKey,
                            value: val,
                            action: 'insert',
                            index: index,
                            $callData: callData
                        });

                        // notify any dependencies as well
                        if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
                    }
                    if (model.$atom && dottedKey === model.$atom) model.atomic = true;
                }
                return model;
            }

            if ((o[k] instanceof Collection) || (T_ARRAY === get_type(o[ k ])))
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

            collections.forEach(function(collection){
                collection[0]._upd('change', collection[1], collection[1]);
            });

            if (pub)
            {
                model.publish('change', {
                    key: dottedKey,
                    value: val,
                    action: 'insert',
                    index: index,
                    $callData: callData
                });

                // notify any dependencies as well
                if (HAS.call(ideps,dottedKey)) model.notify(ideps[dottedKey]);
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
        var model = this, r, o, k, p, val, index = -1, canDel = false, collections = [];

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
            canDel = true;
        }
        else if ((r = walk_and_get3(dottedKey.split('.'), o, null, null, null, Model, false, collections)))
        {
            o = r[ 1 ]; k = r[ 2 ];

            if (Model === r[ 0 ] && k.length)
            {
                // nested sub-model
                k = k.join('.');
                val = o.get(k);
                o.del(k, reArrangeIndexes, pub, callData);
                collections.forEach(function(collection){
                    collection[0]._upd('change', collection[1], collection[1]);
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
            if (o instanceof Collection)
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

            collections.forEach(function(collection){
                collection[0]._upd('change', collection[1], collection[1]);
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
        for (f=0,fl=fields.length; f<fl; f++)
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
                    if (o instanceof Collection && i < l)
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
                                for (kk=0; kk<keys.length; kk++)
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
                                for (kk=0; kk<o.length; kk++)
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
                        if (o instanceof Collection)
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
                                for (kk=0; kk<keys.length; kk++)
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
                                for (kk=o.length-1; kk>=0; kk--)
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
        collections.forEach(function(collection){
            collection[0]._upd('change', collection[1], collection[1]);
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
                for (i=list.length-1; i>=0; i--)
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
                for (i=list.length-1; i>=0; i--)
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
                model.publish(evt, d);
            }
            else if (T_ARRAY === t)
            {
                // notify multiple keys
                l = dottedKey.length;
                for (k=0; k<l; k++)
                {
                    d.key = dk = dottedKey[ k ];
                    if (HAS.call(keys,'_'+dk)) continue;
                    // notify any dependencies as well
                    keys['_'+dk] = 1;
                    if (HAS.call(ideps,dk)) deps = deps.concat(ideps[dk]);
                    model.publish(evt, d);
                }
            }

            while (l = deps.length)
            {
                // notify any dependencies as well
                deps2 = [];
                d = {key: '', action: 'set'};
                for (k=0; k<l; k++)
                {
                    dk = deps[ k ];
                    // avoid already notified keys previously
                    if (HAS.call(keys,'_'+dk)) continue;
                    keys['_'+dk] = 1;
                    if (HAS.call(ideps,dk)) deps2 = deps2.concat(ideps[dk]);
                    d.key = dk;
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

/**[DOC_MARKDOWN]
// dynamic collection data structure, which keeps note of which manipulations are done and reflects these as DOM manipulations if requested
var collection = new Model.Collection( [Array array=[]] );

[/DOC_MARKDOWN]**/
function Collection(array)
{
    var self = this;
    if (array instanceof Collection) return array;
    if (!(self instanceof Collection)) return new Collection(array);
    self.set(array || []);
}
Model.Collection = Collection;
Collection[proto] = {
    constructor: Collection
    ,_items: null
    ,diff: null
    ,mapper: null
    ,mappedItem: 1
    ,dispose: function() {
        var self = this;
        self._items = null;
        self.diff = null;
        self.mapper = null;
        return self;
    }
    ,_upd: function(action, start, end) {
        this.diff.push({action:action, from:start, to:end});
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
// clone this collection (optionally with any Array.map functions as well)
collection.clone(Boolean with_data_mapper = false);

[/DOC_MARKDOWN]**/
    ,clone: function(with_mapper) {
        var self = this, cloned = new Collection();
        cloned._items = self._items.slice();
        cloned.diff = self.diff.slice();
        if (true === with_mapper)
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
            if (self._items !== index)
            {
                self._items = index;
                self.reset()._upd('set', 0, self._items.length-1);
            }
        }
        else if (2 === arguments.length)
        {
            if (0 > index) index += self._items.length;
            if (index >= self._items.length)
            {
                self.push(data);
            }
            else if (0 <= index && self._items[index] !== data)
            {
                self._items[index] = data;
                self._upd('change', index, index);
            }
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
collection.mapTo(func[, Number itemsReturned = 1]);

[/DOC_MARKDOWN]**/
    ,mapTo: function(f, itemsReturned) {
        this.mapper = this.mapper ? (function(f0){return function(x, i){return f(f0(x, i), i);};})(this.mapper) : f;
        this.mappedItem = +(itemsReturned || 1);
        return this;
    }
/**[DOC_MARKDOWN]
// perform actual mapping (see above), return mapped collection items array
collection.mapped([Array items=collection.items()]);

[/DOC_MARKDOWN]**/
    ,mapped: function(items) {
        items = items || this._items;
        return this.mapper ? items.map(this.mapper) : items;
    }
};
/**[DOC_MARKDOWN]
```
[/DOC_MARKDOWN]**/
