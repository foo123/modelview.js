
//
// Data Types / Validators for Models (Static)
var 
    ModelField = function( modelField ) {
        if ( !is_instance(this, ModelField) ) return new ModelField( modelField );
        this.f = modelField || null;
    },
    
    CollectionEach = function( f ) {
        if ( !is_instance(this, CollectionEach) ) return new CollectionEach( f );
        this.f = f || null;
    },
    
    bindFieldsToModel = function( /*model,*/ fields ) {
        // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
        var p, t;
        for ( p in fields )
        {
            t = fields[ p ];
            if ( is_instance( t, CollectionEach ) )
            {
                fields[ p ] = t.f;//bindF( t.f, model );
                fields[ p ].fEach = 1;
            }
            else
            {
                fields[ p ] = t;//bindF( t, model );
            }
        }
        return fields;
    },
    
    // Type Compositor
    TC = function TC( T ) {
        
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
    VC = function VC( V ) {
        
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
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                typesPerField = bindFieldsToModel( Merge( {}, typesPerField || {} ) );
                return TC(function( v ) { 
                    var self = this, field, type, val, l, i;
                    //if ( notbinded ) { bindFieldsToModel( this, typesPerField ); notbinded = false; }
                    for ( field in typesPerField )
                    {
                        type = typesPerField[ field ]; val = v[ field ];
                        if ( type.fEach && is_type(val, T_ARRAY) )
                        {
                           l = val.length;
                           for (i=0; i<l; i++) val[ i ] = type.call( self, val[ i ] );
                           v[ field ] = val;
                        }
                        else
                        {
                            v[ field ] = type.call( self, val );
                        }
                    }
                    return v;
                }); 
            },
            
            DEFAULT: function( defaultValue ) {  
                return TC(function( v ) { 
                    var T = get_type( v );
                    if ( (T_UNDEF & T) || ((T_STR & T) && !trim(v).length)  ) v = defaultValue;
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
                return trim(Str(v));
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
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Type.Cast[ type ] = is_type( handler.AFTER, T_FUNC ) ? handler : TC( handler );
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
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                validatorsPerField = bindFieldsToModel( Merge( {}, validatorsPerField || {} ) );
                return VC(function( v ) { 
                    var self = this, field, validator, val, l, i;
                    //if ( notbinded ) { bindFieldsToModel( this, validatorsPerField ); notbinded = false; }
                    for ( field in validatorsPerField )
                    {
                        validator = validatorsPerField[ field ]; val = v[ field ];
                        if ( validator.fEach && is_type(val, T_ARRAY) )
                        {
                           l = val.length;
                           for (i=0; i<l; i++) if ( !validator.call( self, val[ i ] ) )  return false;
                        }
                        else
                        {
                            if ( !validator.call( self, val ) ) return false;
                        }
                    }
                    return true;
                }); 
            },

            NUMERIC: VC(function( v ) { 
                return is_numeric( v ); 
            }),
            NOT_EMPTY: VC(function( v ) { 
                return !!( v && (0 < trim(Str(v)).length) ); 
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
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Validation.Validate[ type ] = is_type( handler.XOR, T_FUNC ) ? handler : VC( handler );
            return Validation;
        }
        
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Validation.Validate[ type ] ) delete Validation.Validate[ type ];
            return Validation;
        }
    
        ,toString: function( ) {
            return '[ModelView.Validation]';
        }
    }
;
