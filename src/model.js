//
// Data Types / Validators (Static)
var 
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
    
    ModelField = function( modelField ) {
        if ( !is_instance(this, ModelField) ) return new ModelField( modelField );
        this.f = modelField || null;
    },
    
    CollectionEach = function( f ) {
        if ( !is_instance(this, CollectionEach) ) return new CollectionEach( f );
        this.f = f || null;
    },
    
    bindFieldsToModel = function( model, fields ) {
        var p, t;
        for ( p in fields )
        {
            t = fields[ p ];
            if ( is_instance( t, CollectionEach ) )
            {
                fields[ p ] = bindF( t.f, model );
                fields[ p ].fEach = true;
            }
            else
            {
                fields[ p ] = bindF( t, model );
            }
        }
        return fields;
    },
    
    // Type Compositor
    TC = function( T ) {
        
        T.BEFORE = function( T2 ) {
            return TC(function( v, k ) { 
                var self = this;
                return T2.call(self, T.call(self, v, k), k);
            }); 
        };
        T.AFTER = function( T2 ) {
            return TC(function( v, k ) { 
                var self = this;
                return T.call(self, T2.call(self, v, k), k);
            }); 
        };
        
        return T;
    },
        
    // Validator Compositor
    VC = function( V ) {
        
        V.NOT = function( ) { 
            return VC(function( v, k ) { 
                return !V.call(this, v, k); 
            }); 
        };
        
        V.AND = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this;
                return V.call(self, v, k) && V2.call(self, v, k);
            }); 
        };
        
        V.OR = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this;
                return V.call(self, v, k) || V2.call(self, v, k);
            }); 
        };

        V.XOR = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return (r1 && !r2) || (r2 && !r1);
            }); 
        };
        
        return V;
    },
    
    Type = {
        
        TypeCaster: TC
        
        // default type casters
        ,Cast: {
            // collection for each item type caster
            EACH: CollectionEach,
            
            // type caster for each specific field of an object
            FIELDS: function( typesPerField ) {
                var notbinded = true;
                typesPerField = Merge( {}, typesPerField || {} );
                return TC(function( v ) { 
                    var field, type, val, l, i;
                    if ( notbinded ) { bindFieldsToModel( this, typesPerField ); notbinded = false; }
                    for ( field in typesPerField )
                    {
                        type = typesPerField[ field ]; val = v[ field ];
                        if ( type.fEach && is_type(val, T_ARRAY) )
                        {
                           l = val.length;
                           for (i=0; i<l; i++) val[ i ] = type( val[ i ] );
                           v[ field ] = val;
                        }
                        else
                        {
                            v[ field ] = type( val );
                        }
                    }
                    return v;
                }); 
            },
            
            DEFAULT: function( defaultValue ) {  
                return TC(function( v ) { 
                    var T = get_type( v );
                    if ( (T_UNDEF & T) || ((T_STR & T) && !v.tR().length)  ) v = defaultValue;
                    return v;
                }); 
            },
            BOOL: TC(function( v ) { 
                return !!v; 
            }),
            INT: TC(function( v ) { 
                return parseInt(v, 10);
            }),
            FLOAT: TC(function( v ) { 
                return parseFloat(v, 10); 
            }),
            MIN: function( m ) {  
                return TC(function( v ) { return (v < m) ? m : v; }); 
            },
            MAX: function( M ) {  
                return TC(function( v ) { return (v > M) ? M : v; }); 
            },
            CLAMP: function( m, M ) {  
                // swap
                if ( m > M ) { var tmp = M; M = m; m = tmp; }
                return TC(function( v ) { return (v < m) ? m : ((v > M) ? M : v); }); 
            },
            TRIM: TC(function( v ) { 
                return Str(v).tR();
            }),
            LCASE: TC(function( v ) { 
                return Str(v).toLowerCase( );
            }),
            UCASE: TC(function( v ) { 
                return Str(v).toUpperCase( );
            }),
            STR: TC(function( v ) { 
                return (''+v); 
            })
        }
        
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) Type.Cast[ type ] = TC( handler );
            return Type;
        }
        
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Type.Cast[ type ] ) delete Type.Cast[ type ];
            return Type;
        }
    
        ,toString: function( ) {
            return '[ModelView.Type]';
        }
    },
    
    Validation = {
        
        Validator: VC
        
        // default validators
        ,Validate: {
            // collection for each item validator
            EACH: CollectionEach,
            
            // validator for each specific field of an object
            FIELDS: function( validatorsPerField ) {
                var notbinded = true;
                validatorsPerField = Merge( {}, validatorsPerField || {} );
                return VC(function( v ) { 
                    var field, validator, val, l, i;
                    if ( notbinded ) { bindFieldsToModel( this, validatorsPerField ); notbinded = false; }
                    for ( field in validatorsPerField )
                    {
                        validator = validatorsPerField[ field ]; val = v[ field ];
                        if ( validator.fEach && is_type(val, T_ARRAY) )
                        {
                           l = val.length;
                           for (i=0; i<l; i++) if ( !validator( val[ i ] ) )  return false;
                        }
                        else
                        {
                            if ( !validator( val ) ) return false;
                        }
                    }
                    return true;
                }); 
            },

            NUMERIC: VC(function( v ) { 
                return is_numeric( v ); 
            }),
            NOT_EMPTY: VC(function( v ) { 
                return !!( v && (0 < Str(v).tR().length) ); 
            }),
            MAXLEN: function( len ) {
                return VC(newFunc("v", "return v.length <= "+len+";")); 
            },
            MINLEN: function( len ) {
                return VC(newFunc("v", "return v.length >= "+len+";")); 
            },
            MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return regex_pattern.test( v ); }); 
            },
            NOT_MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return !regex_pattern.test( v ); }); 
            },
            EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;")); 
                return false !== strict 
                    ? VC(function( v ) { return val === v; })
                    : VC(function( v ) { return val == v; })
                ; 
            },
            NOT_EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
                return false !== strict 
                    ? VC(function( v ) { return val !== v; })
                    : VC(function( v ) { return val != v; })
                ; 
            },
            GREATER_THAN: function( m, strict ) { 
                if ( is_instance(m, ModelField) ) m = "this.$data."+m.f;
                else if ( is_type(m, T_STR) ) m = '"' + m + '"';
                return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;")); 
            },
            LESS_THAN: function( M, strict ) { 
                if ( is_instance(M, ModelField) ) M = "this.$data."+M.f;
                else if ( is_type(M, T_STR) ) M = '"' + M + '"';
                return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;")); 
            },
            BETWEEN: function( m, M, strict ) {  
                if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                
                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict 
                    ? VC(newFunc("v", "return ( "+m+" < v ) && ( "+M+" > v );"))
                    : VC(newFunc("v", "return ( "+m+" <= v ) && ( "+M+" >= v );"))
                ; 
            },
            NOT_BETWEEN: function( m, M, strict ) {  
                if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                
                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict 
                    ? VC(newFunc("v", "return ( "+m+" > v ) || ( "+M+" < v );"))
                    : VC(newFunc("v", "return ( "+m+" >= v ) || ( "+M+" <= v );"))
                ; 
            },
            IN: function( /* vals,.. */ ) { 
                var vals = slice( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return ( -1 < vals.indexOf( v ) ); 
                }); 
            },
            NOT_IN: function( /* vals,.. */ ) { 
                var vals = slice( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return ( 0 > vals.indexOf( v ) ); 
                }); 
            }
        }
        
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) Validation.Validate[ type ] = VC( handler );
            return Validation;
        }
        
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Validation.Validate[ type ] ) delete Validation.Validate[ type ];
            return Validation;
        }
    
        ,toString: function( ) {
            return '[ModelView.Validation]';
        }
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
Model[proto] = Merge( Create( Obj[proto] ), PublishSubscribe, {
    
    // allow chaining, return this;
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
    
    ,count: function( dottedKey, val ) {
        if ( !arguments.length ) return 0;
        var o = dottedKey ? this.get( dottedKey ) : val, T = get_type( o );
        
        if ( T_OBJ === T ) return Keys( o ).length;
        else if ( T_ARRAY === T ) return o.length;
        else if ( T_UNDEF !== T ) return 1; //  is scalar value, set count to 1
        return 0;
    }
    
    ,has: function( dottedKey, RAW ) {
        var model = this, r;
        
        // http://jsperf.com/regex-vs-indexof-with-and-without-char
        // http://jsperf.com/split-vs-test-and-split
        // test and split (if needed) is fastest
        if ( 0 > dottedKey.indexOf('.') && ( (dottedKey in model.$data) || (!RAW && (r=model.$getters[dottedKey]) && r.val) ) )
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
            if ( !RAW && (r=model.$getters[dottedKey]) && r.val ) return r.val( dottedKey );
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
    
    // it can add last node also if not there
    ,set: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            types, validators, setters,
            prevval, canSet = false
        ;
        
        if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
        
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
            setter = (r=setters[k]) ? r.val : null;
            type = (r=types[k] || types[WILDCARD]) ? r.val : null;
            validator = (r=validators[k] || validators[WILDCARD]) ? r.val : null;
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
                        model: model, 
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
                        model: model, 
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
                            model: model, 
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
                        model: model, 
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
    
    // append value (for arrays like structures)
    ,append: function ( dottedKey, val, pub, callData ) {
        var model = this, r, o, k, p,
            type, validator, setter,
            canSet = false
        ;
        
        if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
        
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
            setter = (r=setters[k]) && r.next[WILDCARD] ? r.next[WILDCARD].val : null;
            type = (r=types[k] || types[WILDCARD]) && r.next[WILDCARD] ? r.next[WILDCARD].val : null;
            validator = (r=validators[k] || validators[WILDCARD]) && r.next[WILDCARD] ? r.next[WILDCARD].val : null;
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
                        model: model, 
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
                        model: model, 
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
                            model: model, 
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
                    model: model, 
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
    // delete, without re-arranging (array) indexes
    ,del: function( dottedKey, pub, callData ) {
        var model = this, r, o, k, p, val, canDel = false;
        
        if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
        
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
                o.del( k, pub, callData ); 
                pub && model.publish('remove', {
                        model: model, 
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
            delete o[ k ]; // not re-arrange indexes
            pub && model.publish('remove', {
                    model: model, 
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
    // remove, re-arranging (array) indexes
    ,rem: function( dottedKey, pub, callData ) {
        var model = this, r, o, k, p, val, T, canDel = false;
        
        if ( model.atomic && dottedKey.sW( model.$atom ) ) return model;
        
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
                o.rem( k, pub, callData ); 
                pub && model.publish('remove', {
                        model: model, 
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
            o[ k ] = undef;
            T = get_type( o );
            if ( T_ARRAY == T && is_array_index( k ) ) o.splice( +k, 1 );
            else if ( T_OBJ == T ) delete o[ k ];
            pub && model.publish('remove', {
                    model: model, 
                    key: dottedKey, 
                    value: val,
                    $callData: callData
                });
            
            if ( model.$atom && dottedKey === model.$atom ) model.atomic = true;
        }
        return model;
    }
    
    // synchronize fields with other model(s)
    ,syncTo: function( model, fieldsMap ) {
        var self = this, k;
        for ( k in fieldsMap )
        {
            self.$syncTo[k] = self.$syncTo[k] || [];
            self.$syncTo[k].push([model, fieldsMap[k]]);
        }
        if ( !self.$syncHandler ) 
            self.on('change', self.$syncHandler = syncHandler.bind( self ));
        return self;
    }
    
    // un-synchronize fields with other model(s)
    ,unsyncFrom: function( model ) {
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
                model: this, 
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
