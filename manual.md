####ModelView API

**Version 0.22**


**Model**

```javascript
// modelview.js model methods

// get / set model data
model.data( [data] );

// whether model has given key
model.has( key );

// model enable / disable atomic operations, do next update operations on key (and nested keys) as one atom
model.atom( key | false );

// model get given key (bypass custom model getters if RAW is true)
model.get( key [, RAW ] );

// model set key to val
model.set( key, val [, publish] );

// model append val to key (if key is array-like)
model.append( key, val [, publish] );

// model delete key (without re-arranging array indexes)
model.del( key [, publish] );

// model remove key (re-arranging array indexes)
model.rem( key [, publish] );

// shortcut to model publich change event for key (and nested keys)
model.notify( key );

// add a typecaster to key
model.type( key, typeCaster );

// add typecasters given in {key: typecaster} format
model.types( typeCasters );

// add a validator to key
model.validator( key, validator );

// add validators given in {key: validator} format
model.validators( validators );

// add a custom getter for key
model.getter( key, handler );

// add getters given in {key: getter} format
model.getters( getters );

// add a custom setter for key
model.setter( key, handler );

// add setters given in {key: setter} format
model.setters( setters );

// get data in JSON format
model.toJSON( [key] );

// set data from JSON format
model.fromJSON( jsonData [, key] );

// dispose model
model.dispose( );

```

**View**

```javascript
// modelview.js view methods

// get / set view model
view.model( [model] );

// add a custom view named action 
view.action( name, handler );

// add a custom view event handler
view.event( name, handler );

// get / set autobind, autobind automatically binds change events to input elements that refer to model data (via name attribute)
view.autobind( [bool] );

// bind view to dom listening given events (default: ['change', 'click'])
view.bind( events, dom );

// synchronize view to dom
view.sync( [dom] );

// refresh view caches and bindinds
view.refresh( [dom] );

// dispose view (and model)
view.dispose( );

```


**Types**

```javascript
// modelview.js type casters

// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );

// cast to boolean
ModelView.Type.Cast.BOOLEAN;

// cast to string
ModelView.Type.Cast.STRING;

// cast to trimmed string of spaces
ModelView.Type.Cast.TRIMMED;

// cast to lowercase string
ModelView.Type.Cast.LCASE;

// cast to uppercase string
ModelView.Type.Cast.UCASE;

// cast to integer
ModelView.Type.Cast.INTEGER;

// cast to float
ModelView.Type.Cast.FLOAT;

// clamp between min-max
ModelView.Type.Cast.CLAMP( min, max );

// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );

// cast fields of an object with a FIELD TypeCaster
ModelView.Type.Cast.FIELD({
    'field1': ModelView.Type.Cast.STRING,
    'field2': ModelView.Type.Cast.BOOLEAN,
    'field3': /* a custom type caster */ ModelView.Type.TypeCaster(function(v) { /* .. */ return v; })
    // etc..
});

// add a custom typecaster
ModelView.Type.add( name, typeCaster );
// delete custom typecaster
ModelView.Type.del( name );


```


**Validators**

```javascript
// modelview.js validators

// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;

// validate value equal to val
ModelView.Validation.Validate.EQUAL( val [, strict=true] );

// validate value not equal to val
ModelView.Validation.Validate.NOT_EQUAL( val [, strict=true] );

// validate value equal to "model field"
ModelView.Validation.Validate.EQUALTO( model_field [, strict=true] );

// validate value not equal to "model field"
ModelView.Validation.Validate.NOT_EQUALTO( model_field [, strict=true] );

// validate value is numeric
ModelView.Validation.Validate.NUMERIC;

// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );

// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );

// validate value greater than (or equal if "strict" is false) to val
ModelView.Validation.Validate.GREATER_THAN( val [, strict=true] );

// validate value less than (or equal if "strict" is false) to val
ModelView.Validation.Validate.LESS_THAN( val [, strict=true] );

// validate value between (or equal if "strict" is false) the interval [v1, v2]
ModelView.Validation.Validate.BETWEEN( v1, v2 [, strict=true] );

// validate value not between (or equal if "strict" is false) the interval [v1, v2]
ModelView.Validation.Validate.NOT_BETWEEN( v1, v2 [, strict=true] );

// validate value is one of v1, v2, ...
ModelView.Validation.Validate.IN( v1, v2 [, ...] );

// validate value is not one of v1, v2, ...
ModelView.Validation.Validate.NOT_IN( v1, v2 [, ...] );

// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );
// validate fields of an object with a FIELD Validator
ModelView.Validation.Validate.FIELD({
    'field1': ModelView.Validation.Validate.GREATER_THAN( 0 ),
    'field2': ModelView.Validation.Validate.BETWEEN( v1, v2 ),
    'field3': /* a custom validator */ ModelView.Validation.Validator(function(v) { /* .. */ return true; })
    // etc..
});


// add a custom validator
ModelView.Validation.add( name, validator );
// delete custom validator
ModelView.Validation.del( name );

```


**example**
```javascript

// example

$dom.modelview({

    id: 'view',
    
    autobind: true,
    bindAttribute: 'data-bind',
    events: [ 'change', 'click' ],
    
    model: {
        
        id: 'model',
        
        data: {
            // model data here ..
            
            mode: 'all',
            
            collection: [ ]
        },
        
        types: {
            // data type-casters here ..
            
            mode: $.ModelView.Type.Cast.STRING,
            // support wildcard assignment of typecasters
            'collection.*': $.ModelView.Type.Cast.FIELD({
                // type casters  can be composed (using BEFORE/AFTER) in an algebraic/functional way..
                'field1': $.ModelView.Type.Cast.DEFAULT( "default" ).AFTER( $.ModelView.Type.Cast.STRING ),
                'field2': $.ModelView.Type.Cast.BOOLEAN
            })
        },
        
        validators: {
            // data validators here ..
            
            mode: $.ModelView.Validation.Validate.IN( 'all', 'active', 'completed' ),
            // support wildcard assignment of validators
            'collection.*': $.ModelView.Validation.Validate.FIELD({
                // validators can be combined (using AND/OR/NOT/XOR) in an algebraic/functional way
                'field1': $.ModelView.Validation.Validate.NOT_EMPTY.AND( $.ModelView.Validation.Validate.MATCH( /item\d+/ ) ),
                'field2': $.ModelView.Validation.Validate.BETWEEN( v1, v2 ).OR( $.ModelView.Validation.Validate.GREATER_THAN( v3 ) )
            })
        }
    },
    
    actions: { 
        // custom view actions here ..
    }
});


```

**simple example (jQueryUI also used)**

**markup**

```html

<!--     
    modelview.js (default) 2-way bindings use JSON format embedded in an element's (user-defined) "data-bind" attribute
    the logic behind this:
    
    when, what, who, why, how
    
    when -> event  (eg on model change, on view change, on click, etc..)
    what -> action  (eg auto-bind/update value, (custom) view actions)
    who, why, how -> additional conditions/data
-->
 
<!-- view binds on this part of the page -->
<div id="screen">

    <!-- nested model key used, no problem -->
    <!-- multiple actions per multiple events (change->set, mouseover->hoverAction) -->
    <!-- view action "set" is one of modelview.js "default actions" -->
    <span>Sample Percent:</span>
    <strong id="percent" 
        style="display: inline-block; margin-left: 15px;"
        data-bind='{"change":{"action":"set", "key":"percent.percentVisual", "prop":"text"}, "mouseover":{"action":"hoverAction"}}'>
        0%
    </strong>
    
    <!-- view "custom actions" here -->
    <!-- note the input[name] uses the model key AND the model id as name="modelID[key][key2][..]" -->
    <!-- here name="model[userMode]", see javascript below -->
    <input type="checkbox" class="switch" 
        id="userMode" name="model[userMode]" 
        data-bind='{"change":{"action":"setUserMode", "domRef": "#grid-controls,#image-controls"}}' />
    
    <button class="button ui-button-large" 
        data-icon="ui-icon-extra ui-icon-userinfo" 
        data-bind='{"click":{"action":"openPopup", "domRef": "#userinfo-popup"}}'>
        User Instructions
    </button>

</div>
                            
```

**javascript**

```javascript
    
// jQuery should be already loaded, it is a dependency
    
jQuery(document).ready(function( $ ) {

    // add a custom data type-caster
    ModelView.Type.add('HEXINTEGER', function( val ){
        // 'this' refers to the model that calls this type-caster
        return parseInt(val, 16);
    });
    
    // delete a custom data-type-caster
    //ModelView.Type.del( 'HEXINTEGER' );
    
    // add a custom data validator
    ModelView.Validation.add('BOOLEAN', function( val ){
        // 'this' refers to the model that calls this validator
        return !!( true===val || false===val );
    });
    
    // delete a custom data validator
    //ModelView.Validation.del( 'BOOLEAN' );
    
    // Application Model
    // 'model' is the model 'id', same as the name used in UI input elements
    // that refer to model keys ( see markup above )
    model = new ModelView.Model('model', {
        userMode: false,
        // nested key
        percent: {
            percentVisual: '00%'
        }
    }, {
        // data typing for model keys, can be used here
        // custom types can also be added
        
        userMode: ModelView.Type.Cast.BOOLEAN,
        percent: {
            percentVisual: ModelView.Type.Cast.STRING
        }
        // this will also work
        //'percent.percentVisual': ModelView.Type.Cast.HEXINTEGER
        // this will also work
        //'percent.percentVisual': ModelView.Type.TypeCaster(function( val ){
        //                                // 'this' refers to the model that calls this type-caster
        //                                return parseInt(val, 16);
        //                            })
    }, {
        // data validation for model keys, can be used here
        // custom validators can also be added
        
        userMode: ModelView.Validation.Validate.BOOLEAN,
        // this will also work
        //userMode: ModelView.Validation.Validator(function( val ){
        //                // 'this' refers to the model that calls this validator
        //                return !!( true===val || false===val );
        //            }),
        percent: {
            percentVisual: ModelView.Validation.Validate.NOT_EMPTY
        }
        // this will also work
        //'percent.percentVisual': ModelView.Validation.Validate.NOT_EMPTY
    });
    

    // Application View
    // pass the associated model also
    view = new ModelView.View('view', model);
    
    // custom view actions
    view
        .action('hoverAction', function(evt, $el, data) {
            console.log('hover action');
        })
        
        .action('openPopup', function(evt, $el, data){
            var popup;
            
            if ( data['domRef'] && (popup = $(data['domRef'])) )
            {
                popup.dialog('open');
            }
        })
        
        .action('setUserMode', function(evt, $el, data){
            var userMode, domRef;
            model.set('[userMode]', userMode = $el.is(':checked'));
            
            setUserMode( userMode );
            
            domRef = data['domRef'];
            if ( domRef )
            {
                if ( userMode )
                {
                    $(domRef).disabable('disableIt');
                }
                else
                {
                    $(domRef).disabable('enableIt');
                }
            }
        })
    ;
    
    
    // init and bind view to UI
    view
        .bindbubble( false )  // whether to detect(bubble) events on nested elements inside a "data-bind" element
        .autobind( true )  // autobind enables input elements which refer to model keys to be updated automatically
        .bind( ['change', 'click', 'mouseover'], '#screen' )  // bind specifies the part of the page and the events the view should bind to
        .sync( )  // synchronize ui/view/model, useful for initialization of UI visual states, etc..
    ;
    
});

```

**or as a jquery plugin (include the jquery.modelview.js file)**

```javascript
    
jQuery(document).ready(function( $ ) {

    $('#screen').modelview({
        
        // custom extended classes for View and Model ( optional )
        //viewClass: $.ModelView.View,
        //modelClass: $.ModelView.Model,
        
        // view id
        id: 'view',
        
        // whether to detect(bubble) events on nested elements inside a "data-bind" element
        bindbubble: false,
        
        // autobind enables input elements which refer to model keys to be updated automatically
        autobind: true,
        
        // element attribute for declarative (2-way) data binding
        bindAttribute: 'data-bind',
        
        // bind events
        events: ['change', 'click', 'mouseover'],
    
        // Application Model
        model: {
            id: 'model',
            
            data: {
                userMode: false,
                // nested key
                percent: {
                    percentVisual: '00%'
                }
            }, 
            
            types: , {
                // data typing for model keys, can be used here
                // custom types can also be added
                
                userMode: $.ModelView.Type.Cast.BOOLEAN,
                percent: {
                    percentVisual: $.ModelView.Type.Cast.STRING
                }
                // this will also work
                //'percent.percentVisual': $.ModelView.Type.Cast.HEXINTEGER
            }, 
            
            validators: {
                // data validation for model keys, can be used here
                // custom validators can also be added
                
                userMode: $.ModelView.Validation.Validate.BOOLEAN,
                percent: {
                    percentVisual: $.ModelView.Validation.Validate.NOT_EMPTY
                }
                // this will also work
                //'percent.percentVisual': $.ModelView.Validation.Validate.NOT_EMPTY
            },
            
            // custom getters per key (eg. custom observables)
            getters: { },
            
            // custom setters per key
            setters: { }
        },
    
        // custom view actions
        actions: {
            'hoverAction': function(evt, $el, data) {
                console.log('hover action');
            },
            'openPopup': function(evt, $el, data){
                var popup;
                
                if ( data['domRef'] && (popup = $(data['domRef'])).length )
                {
                    popup.dialog('open');
                }
            },
            'setUserMode': function(evt, $el, data){
                var userMode, domRef;
                model.set('[userMode]', userMode = $el.is(':checked'));
                
                setUserMode( userMode );
                
                domRef = data['domRef'];
                if ( domRef )
                {
                    if ( userMode )
                    {
                        $(domRef).disabable('disableIt');
                    }
                    else
                    {
                        $(domRef).disabable('enableIt');
                    }
                }
            }
        }
    });
    
    // getter methods
    var view = $( '#screen' ).modelview( 'view' );
    var model = $( '#screen' ).modelview( 'model' );
    var data = $( '#screen' ).modelview( 'data' );
    
    // setter methods
    //$( '#screen' ).modelview( 'model', model );
    //$( '#screen' ).modelview( 'data', data );
    
    // sync method
    $( '#screen' ).modelview( 'sync' );
    
    // refresh method
    //$( '#screen' ).modelview( 'refresh' );
    
    // dispose method
    //$( '#screen' ).modelview( 'dispose' );
    
});

```
