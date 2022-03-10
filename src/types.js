
//
// Data Types / Validators for Models (Static)

var floor = Math.floor, round = Math.round, abs = Math.abs,
    tpl_$0_re = /\$0/g
;

function ModelField(modelField)
{
    if (!is_instance(this, ModelField)) return new ModelField(modelField);
    this.f = modelField || null;
}
function CollectionEach(f)
{
    if (!is_instance(this, CollectionEach)) return new CollectionEach(f);
    this.f = f || null;
    this.fEach = 1;
}
function pad(s, len, ch)
{
    var sp = String(s), n = len-sp.length;
    return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
}
// Validator Compositor
function VC(V)
{
    V.NOT = function() {
        return VC(function(v, k) {
            return !V.call(this, v, k);
        });
    };
    V.AND = function(V2) {
        return VC(function(v, k) {
            var self = this;
            return V.call(self, v, k) && V2.call(self, v, k);
        });
    };
    V.OR = function(V2) {
        return VC(function(v, k) {
            var self = this;
            return V.call(self, v, k) || V2.call(self, v, k);
        });
    };
    V.XOR = function(V2) {
        return VC(function(v, k) {
            var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
            return (r1 && !r2) || (r2 && !r1);
        });
    };
    V.EQ = function(V2, strict) {
        return VC(false !== strict
        ? function(v, k) {
            var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
            return r1 === r2;
        }
        : function(v, k) {
            var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
            return r1 == r2;
        });
    };
    V.NEQ = function(V2, strict) {
        return VC(false !== strict
        ? function(v, k) {
            var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
            return r1 !== r2;
        }
        : function(v, k) {
            var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
            return r1 != r2;
        });
    };
    return V;
}

/**[DOC_MARKDOWN]
#### Types
**(used with Models)**

```javascript
// modelview.js type casters

[/DOC_MARKDOWN]**/
var Type = {

    tpl_$0: tpl_$0_re,

    TypeCaster: function(typecaster){return typecaster;}

    // default type casters
    ,Cast: {
/**[DOC_MARKDOWN]
// functionaly compose typeCasters, i.e final TypeCaster = TypeCaster1(TypeCaster2(...(value)))
ModelView.Type.Cast.COMPOSITE( TypeCaster1, TypeCaster2 [, ...] );

[/DOC_MARKDOWN]**/
        // composite type caster
        COMPOSITE: function() {
            var args = arguments;
            if (is_type(args[ 0 ], T_ARRAY)) args = args[ 0 ];
            return function(v, k) {
               var l = args.length;
               while ( l-- ) v = args[l].call(this, v, k);
               return v;
            };
        },

/**[DOC_MARKDOWN]
// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );

[/DOC_MARKDOWN]**/
        // collection for each item type caster
        EACH: CollectionEach,

/**[DOC_MARKDOWN]
// cast fields of an object with a FIELDS TypeCaster
ModelView.Type.Cast.FIELDS({
'field1': ModelView.Type.Cast.STR,
'field2': ModelView.Type.Cast.BOOL,
'field3': ModelView.Type.TypeCaster(function(v) { return v; }) // a custom type caster
// etc..
});

[/DOC_MARKDOWN]**/
        // type caster for each specific field of an object
        FIELDS: function(typesPerField) {
            //var notbinded = true;
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            typesPerField = Merge({}, typesPerField || {});
            return function(v) {
                var self = this, field, type, val;
                for (field in typesPerField)
                {
                    if (HAS.call(typesPerField,field))
                    {
                        type = typesPerField[ field ]; val = v[ field ];
                        if (type.fEach && is_type(val, T_ARRAY))
                        {
                           v[ field ] = iterate(function( i, val ) {
                               val[ i ] = type.f.call( self, val[ i ] );
                           }, 0, val.length-1, val);
                        }
                        else
                        {
                            v[ field ] = type.call( self, val );
                        }
                    }
                }
                return v;
            };
        },

/**[DOC_MARKDOWN]
// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );

[/DOC_MARKDOWN]**/
        DEFAULT: function(defaultValue) {
            return function(v) {
                var T = get_type(v);
                if ((T_UNDEF & T) || ((T_STR & T) && !trim(v).length)) v = defaultValue;
                return v;
            };
        },
/**[DOC_MARKDOWN]
// cast to boolean
ModelView.Type.Cast.BOOL;

[/DOC_MARKDOWN]**/
        BOOL: function(v) {
            // handle string representation of booleans as well
            if (is_type(v, T_STR) && v.length)
            {
                var vs = v.toLowerCase( );
                return "true" === vs || "yes" === vs || "on" === vs || "1" === vs;
            }
            return !!v;
        },
/**[DOC_MARKDOWN]
// cast to integer
ModelView.Type.Cast.INT;

[/DOC_MARKDOWN]**/
        INT: function(v) {
            // convert NaN to 0 if needed
            return parseInt(v, 10) || 0;
        },
/**[DOC_MARKDOWN]
// cast to float
ModelView.Type.Cast.FLOAT;

[/DOC_MARKDOWN]**/
        FLOAT: function(v) {
            // convert NaN to 0 if needed
            return parseFloat(v, 10) || 0;
        },
/**[DOC_MARKDOWN]
// min if value is less than
ModelView.Type.Cast.MIN( min );

[/DOC_MARKDOWN]**/
        MIN: function(m) {
            return function(v) {return v < m ? m : v;};
        },
/**[DOC_MARKDOWN]
// max if value is greater than
ModelView.Type.Cast.MAX( max );

[/DOC_MARKDOWN]**/
        MAX: function(M) {
            return function(v) {return v > M ? M : v;};
        },
/**[DOC_MARKDOWN]
// clamp between min-max (included)
ModelView.Type.Cast.CLAMP( min, max );

[/DOC_MARKDOWN]**/
        CLAMP: function(m, M) {
            // swap
            if (m > M) { var tmp = M; M = m; m = tmp; }
            return function(v) {return v < m ? m : (v > M ? M : v);};
        },
/**[DOC_MARKDOWN]
// cast to trimmed string of spaces
ModelView.Type.Cast.TRIM;

[/DOC_MARKDOWN]**/
        TRIM: function(v) {
            return trim(Str(v));
        },
/**[DOC_MARKDOWN]
// cast to string
ModelView.Type.Cast.STR;

[/DOC_MARKDOWN]**/
        STR: function(v) {
            return Str(v);
        }
    }

/**[DOC_MARKDOWN]
// add a custom typecaster
ModelView.Type.add( name, typeCaster );

[/DOC_MARKDOWN]**/
    ,add: function(type, handler) {
        if (is_type(type, T_STR) && is_type(handler, T_FUNC))
            Type.Cast[type] = handler;
        return Type;
    }

/**[DOC_MARKDOWN]
// delete custom typecaster
ModelView.Type.del( name );

[/DOC_MARKDOWN]**/
    ,del: function(type) {
        if (is_type(type, T_STR) && HAS.call(Type.Cast, type)) delete Type.Cast[type];
        return Type;
    }

    ,toString: function( ) {
        return '[ModelView.Type]';
    }
};
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
#### Validators
**(used with Models)**

(extra validators are available in `modelview.validation.js`)

```javascript
// modelview.js validators
// (extra validators are available in `modelview.validation.js`)

[/DOC_MARKDOWN]**/
var Validation = {

    Validator: VC

    // default validators
    ,Validate: {
/**[DOC_MARKDOWN]
// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );

[/DOC_MARKDOWN]**/
        // collection for each item validator
        EACH: CollectionEach,

/**[DOC_MARKDOWN]
// validate fields of an object with a FIELDS Validator
ModelView.Validation.Validate.FIELDS({
'field1': ModelView.Validation.Validate.GREATER_THAN( 0 ),
'field2': ModelView.Validation.Validate.BETWEEN( v1, v2 ),
'field3': ModelView.Validation.Validator(function(v) { return true; }) // a custom validator
// etc..
});

[/DOC_MARKDOWN]**/
        // validator for each specific field of an object
        FIELDS: function(validatorsPerField) {
            //var notbinded = true;
            // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
            validatorsPerField = Merge({}, validatorsPerField || {});
            return VC(function(v) {
                var self = this, field, validator, val, l, i;
                for (field in validatorsPerField)
                {
                    if (HAS.call(validatorsPerField,field))
                    {
                        validator = validatorsPerField[ field ]; val = v[ field ];
                        if (validator.fEach && is_type(val, T_ARRAY))
                        {
                           l = val.length;
                           for (i=0; i<l; i++) if (!validator.f.call(self, val[ i ])) return false;
                        }
                        else
                        {
                            if (!validator.call(self, val)) return false;
                        }
                    }
                }
                return true;
            });
        },

/**[DOC_MARKDOWN]
// validate (string) is numeric
ModelView.Validation.Validate.NUMERIC;

[/DOC_MARKDOWN]**/
        NUMERIC: VC(function(v) {
            return is_numeric(v);
        }),
/**[DOC_MARKDOWN]
// validate (string) empty (can be used as optional)
ModelView.Validation.Validate.EMPTY;

[/DOC_MARKDOWN]**/
        EMPTY: VC(function(v){
            return !v || !trim(Str(v)).length;
        }),
/**[DOC_MARKDOWN]
// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;

[/DOC_MARKDOWN]**/
        NOT_EMPTY: VC(function(v) {
            return !!(v && (0 < trim(Str(v)).length));
        }),
/**[DOC_MARKDOWN]
// validate (string) maximum length
ModelView.Validation.Validate.MAXLEN( len=0 );

[/DOC_MARKDOWN]**/
        MAXLEN: function(len) {
            return VC(newFunc("v", "return v.length <= "+(len||0)+";"));
        },
/**[DOC_MARKDOWN]
// validate (string) minimum length
ModelView.Validation.Validate.MINLEN( len=0 );

[/DOC_MARKDOWN]**/
        MINLEN: function(len) {
            return VC(newFunc("v", "return v.length >= "+(len||0)+";"));
        },
/**[DOC_MARKDOWN]
// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );

[/DOC_MARKDOWN]**/
        MATCH: function(regex_pattern) {
            return VC(function(v) {return regex_pattern.test( v );});
        },
/**[DOC_MARKDOWN]
// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );

[/DOC_MARKDOWN]**/
        NOT_MATCH: function(regex_pattern) {
            return VC(function(v) {return !regex_pattern.test( v );});
        },
/**[DOC_MARKDOWN]
// validate equal to value (or model field)
ModelView.Validation.Validate.EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
        EQUAL: function(val, strict) {
            if (is_instance(val, ModelField))
                return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;"));
            return false !== strict
                ? VC(function(v) {return val === v;})
                : VC(function(v) {return val == v;})
            ;
        },
/**[DOC_MARKDOWN]
// validate not equal to value (or model field)
ModelView.Validation.Validate.NOT_EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
        NOT_EQUAL: function(val, strict) {
            if (is_instance(val, ModelField))
                return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
            return false !== strict
                ? VC(function(v) {return val !== v;})
                : VC(function(v) {return val != v;})
            ;
        },
/**[DOC_MARKDOWN]
// validate greater than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.GREATER_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
        GREATER_THAN: function(m, strict) {
            if (is_instance(m, ModelField)) m = "this.$data."+m.f;
            else if (is_type(m, T_STR)) m = '"' + m + '"';
            return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;"));
        },
/**[DOC_MARKDOWN]
// validate less than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.LESS_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
        LESS_THAN: function(M, strict) {
            if (is_instance(M, ModelField)) M = "this.$data."+M.f;
            else if (is_type(M, T_STR)) M = '"' + M + '"';
            return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;"));
        },
/**[DOC_MARKDOWN]
// validate between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
        BETWEEN: function(m, M, strict) {
            if (is_type(m, T_ARRAY)) {strict = M; M = m[1]; m=m[0];}

            var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
            // swap
            if (!is_m_field && !is_M_field && m > M) {tmp = M; M = m; m = tmp;}
            m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
            M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
            return false !== strict
                ? VC(newFunc("v", "return ( "+m+" < v ) && ( "+M+" > v );"))
                : VC(newFunc("v", "return ( "+m+" <= v ) && ( "+M+" >= v );"))
            ;
        },
/**[DOC_MARKDOWN]
// validate not between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.NOT_BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
        NOT_BETWEEN: function(m, M, strict) {
            if (is_type(m, T_ARRAY)) {strict = M; M = m[1]; m=m[0];}

            var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
            // swap
            if (!is_m_field && !is_M_field && m > M) { tmp = M; M = m; m = tmp; }
            m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
            M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
            return false !== strict
                ? VC(newFunc("v", "return ( "+m+" > v ) || ( "+M+" < v );"))
                : VC(newFunc("v", "return ( "+m+" >= v ) || ( "+M+" <= v );"))
            ;
        },
/**[DOC_MARKDOWN]
// validate value is one of value1, value2, ...
ModelView.Validation.Validate.IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
        IN: function(/* vals,.. */) {
            var vals = slice.call(arguments);
            if (is_type(vals[ 0 ], T_ARRAY)) vals = vals[ 0 ];
            return VC(function(v) {
                return -1 < vals.indexOf(v);
            });
        },
/**[DOC_MARKDOWN]
// validate value is not one of value1, value2, ...
ModelView.Validation.Validate.NOT_IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
        NOT_IN: function(/* vals,.. */) {
            var vals = slice.call(arguments);
            if (is_type(vals[ 0 ], T_ARRAY)) vals = vals[ 0 ];
            return VC(function(v) {
                return 0 > vals.indexOf(v);
            });
        }
    }
/**[DOC_MARKDOWN]
// add a custom validator
ModelView.Validation.add( name, validator );

[/DOC_MARKDOWN]**/
    ,add: function(type, handler) {
        if (is_type(type, T_STR) && is_type(handler, T_FUNC))
            Validation.Validate[ type ] = is_type(handler.XOR, T_FUNC) ? handler : VC(handler);
        return Validation;
    }

/**[DOC_MARKDOWN]
// delete custom validator
ModelView.Validation.del( name );

[/DOC_MARKDOWN]**/
    ,del: function(type) {
        if (is_type(type, T_STR) && HAS.call(Validation.Validate, type)) delete Validation.Validate[ type ];
        return Validation;
    }

    ,toString: function() {
        return '[ModelView.Validation]';
    }
};
/**[DOC_MARKDOWN]
```

[/DOC_MARKDOWN]**/

/**[DOC_MARKDOWN]
**example**
```javascript

// example

$dom.modelview({

    id: 'view',

    autobind: true,
    events: [ 'change', 'click' ],

    model: {

        id: 'model',

        data: {
            // model data here ..

            mode: 'all',
            user: 'foo',
            collection: [ ]
        },

        types: {
            // data type-casters here ..

            mode: $.ModelView.Type.Cast.STR,
            user: $.ModelView.Type.Cast.STR,

            // support wildcard assignment of typecasters
            'collection.*': $.ModelView.Type.Cast.FIELDS({
                // type casters can be composed in an algebraic/functional way..

                'field1': $.ModelView.Type.Cast.COMPOSITE($.ModelView.Type.Cast.DEFAULT( "default" ), $.ModelView.Type.Cast.STR),

                'field2': $.ModelView.Type.Cast.BOOL
            })
            // this is equivalent to:
            //'collection': $.ModelView.Type.Cast.EACH($.ModelView.Type.Cast.FIELDS( .. ))
        },

        validators: {
            // data validators here ..

            mode: $.ModelView.Validation.Validate.IN( 'all', 'active', 'completed' ),

            // support wildcard assignment of validators
            'collection.*': $.ModelView.Validation.Validate.FIELDS({
                // validators can be combined (using AND/OR/NOT/XOR) in an algebraic/functional way

                'field1': $.ModelView.Validation.Validate.NOT_EMPTY.AND( $.ModelView.Validation.Validate.MATCH( /item\d+/ ) ),

                'field2': $.ModelView.Validation.Validate.BETWEEN( v1, v2 ).OR( $.ModelView.Validation.Validate.GREATER_THAN( v3 ) )
            })
            // this is equivalent to:
            //'collection': $.ModelView.Validation.Validate.EACH($.ModelView.Validation.Validate.FIELDS( .. ))
        },

        dependencies: {
            // data inter-dependencies (if any) here..

            // 'mode' field value depends on 'user' field value, e.g by a custom getter
            mode: ['user']
        }
    },

    actions: {
        // custom view actions (if any) here ..
    }
});
```
[/DOC_MARKDOWN]**/
