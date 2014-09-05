####ModelView API

**Version 0.26.2**


**Model**

```javascript
// modelview.js model methods

var model = new ModelView.Model( [id=UUID, data={}, types=null, validators=null, getters=null, setters=null] );


// get / set model data
model.data( [data] );

// whether model has given key (bypass custom model getters if RAW is true)
model.has( dottedKey [, RAW=false ] );

// model enable / disable atomic operations, do next update operations on key (and nested keys) as one atom
model.atom( dottedKey | false );

// model get given key (bypass custom model getters if RAW is true)
model.get( dottedKey [, RAW=false ] );

// model set key to val
model.set( dottedKey, val [, publish=false] );

// model append val to key (if key is array-like)
model.append( dottedKey, val [, publish=false] );

// model delete key (without re-arranging array indexes)
model.del( dottedKey [, publish=false] );

// model remove key (re-arranging array indexes)
model.rem( dottedKey [, publish=false] );

// shortcut to model publich change event for key (and nested keys)
model.notify( dottedKey );

// add typecasters given in {dottedKey: typecaster} format
model.types( typeCasters );

// add validators given in {dottedKey: validator} format
model.validators( validators );

// add custom getters (i.e custom observables) given in {dottedKey: getter} format
model.getters( getters );

// add custom setters given in {dottedKey: setter} format
model.setters( setters );

// get model data in plain JS Object format
model.serialize( );

// get data in JSON string format
model.toJSON( [dottedKey] );

// set data from JSON string format
model.fromJSON( jsonData [, dottedKey] );

// dispose model
model.dispose( );

```



**View**

```javascript
// modelview.js view methods

var view = new ModelView.View( [id=UUID, model=new Model(), viewAttributes={bind:"data-bind"}, cacheSize=View._CACHE_SIZE, refreshInterval=View._REFRESH_INTERVAL] );


// get / set view model
view.model( [model] );

// add a custom view named action 
view.action( name, handler );

// add a custom view event handler
view.event( name, handler );

// get / set autobind, autobind automatically binds change events to input elements that refer to model data (via name attribute)
view.autobind( [bool] );

// bind view to dom listening given events (default: ['change', 'click'])
view.bind( events=['change', 'click'] [, dom=document] );

// synchronize view to dom
view.sync( [dom=view.dom] );

// reset view caches only
view.reset( );

// reset view caches and re-bind to UI
view.rebind( events [, dom=document] );

// dispose view (and model)
view.dispose( );

```



**Default View Actions (inherited by sub-views)**

<table>
<thead>
    <tr>
        <td>Declarative Binding</td><td>Method Name</td><td>Description</td>
    </tr>
</thead>
<tbody>
    <tr>
        <td>prop</td><td>view.do_prop</td><td>set element prop(s) based on model data</td>
    </tr>
    <tr>
        <td>html</td><td>view.do_html</td><td>set element html/text property based on model data</td>
    </tr>
    <tr>
        <td>css</td><td>view.do_css</td><td>set element css style(s) based on model data</td>
    </tr>
    <tr>
        <td>show</td><td>view.do_show</td><td>show/hide element based on model data</td>
    </tr>
    <tr>
        <td>hide</td><td>view.do_hide</td><td>hide/show element based on model data</td>
    </tr>
    <tr>
        <td>tpl</td><td>view.do_tpl</td><td>element render a template based on model data</td>
    </tr>
    <tr>
        <td>set</td><td>view.do_set</td><td>element set/update model data based on given value(s)</td>
    </tr>
    <tr>
        <td>bind</td><td>view.do_bind</td><td>element default autobind action (automaticaly update value based on changed model data)</td>
    </tr>
</tbody>
</table>



**Types (used with Models)**

```javascript
// modelview.js type casters

// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );

// cast to boolean
ModelView.Type.Cast.BOOL;

// cast to string
ModelView.Type.Cast.STR;

// cast to trimmed string of spaces
ModelView.Type.Cast.TRIM;

// cast to lowercase string
ModelView.Type.Cast.LCASE;

// cast to uppercase string
ModelView.Type.Cast.UCASE;

// cast to integer
ModelView.Type.Cast.INT;

// cast to float
ModelView.Type.Cast.FLOAT;

// min if value is less than
ModelView.Type.Cast.MIN( min );

// max if value is greater than
ModelView.Type.Cast.MAX( max );

// clamp between min-max (included)
ModelView.Type.Cast.CLAMP( min, max );

// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );

// cast fields of an object with a FIELDS TypeCaster
ModelView.Type.Cast.FIELDS({
    'field1': ModelView.Type.Cast.STR,
    'field2': ModelView.Type.Cast.BOOL,
    'field3': /* a custom type caster */ ModelView.Type.TypeCaster(function(v) { /* .. */ return v; })
    // etc..
});

// add a custom typecaster
ModelView.Type.add( name, typeCaster );
// delete custom typecaster
ModelView.Type.del( name );


```



**Validators (used with Models)**

```javascript
// modelview.js validators

// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;

// validate (string) maximum length
ModelView.Validation.Validate.MAXLEN( len );

// validate (string) minimum length
ModelView.Validation.Validate.MINLEN( len );

// validate (string) is numeric
ModelView.Validation.Validate.NUMERIC;

// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );

// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );

// validate equal to value (or model field)
ModelView.Validation.Validate.EQUAL( value | ModelField [, strict=true] );

// validate not equal to value (or model field)
ModelView.Validation.Validate.NOT_EQUAL( value | ModelField [, strict=true] );

// validate greater than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.GREATER_THAN( value | ModelField [, strict=true] );

// validate less than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.LESS_THAN( value | ModelField [, strict=true] );

// validate between (or equal if "strict" is false) the interval [v1, v2]
ModelView.Validation.Validate.BETWEEN( v1 | ModelField, v2 | ModelField [, strict=true] );

// validate not between (or equal if "strict" is false) the interval [v1, v2]
ModelView.Validation.Validate.NOT_BETWEEN( v1 | ModelField, v2 | ModelField [, strict=true] );

// validate value is one of v1, v2, ...
ModelView.Validation.Validate.IN( v1, v2 [, ...] );

// validate value is not one of v1, v2, ...
ModelView.Validation.Validate.NOT_IN( v1, v2 [, ...] );

// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );

// validate fields of an object with a FIELDS Validator
ModelView.Validation.Validate.FIELDS({
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
            
            mode: $.ModelView.Type.Cast.STR,
            
            // support wildcard assignment of typecasters
            'collection.*': $.ModelView.Type.Cast.FIELDS({
                // type casters  can be composed (using BEFORE/AFTER) in an algebraic/functional way..
                
                'field1': $.ModelView.Type.Cast.DEFAULT( "default" ).AFTER( $.ModelView.Type.Cast.STR ),
                
                'field2': $.ModelView.Type.Cast.BOOL
            })
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
    <!-- multiple actions per multiple events (change->settext, mouseover->hoverAction) -->
    <!-- view action "set" is one of modelview.js "default actions" -->
    <span>Sample Percent:</span>
    <strong id="percent" 
        style="display: inline-block; margin-left: 15px;"
        data-bind='{"text":"percent.percentVisual", "mouseover":"hoverAction"}'>
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
        data-bind='{"click":"openPopup"}' data-popup="#userinfo-popup">
        User Instructions
    </button>

</div>
                            
```



**javascript**

```javascript
    
// jQuery should be already loaded, it is a dependency
    
jQuery(document).ready(function( $ ) {

    // add a custom data type-caster
    ModelView.Type.add('HEXINT', function( val ){
        // 'this' refers to the model that calls this type-caster
        return parseInt(val, 16);
    });
    
    // delete a custom data-type-caster
    //ModelView.Type.del( 'HEXINT' );
    
    // add a custom data validator
    ModelView.Validation.add('BOOL', function( val ){
        // 'this' refers to the model that calls this validator
        return !!( true===val || false===val );
    });
    
    // delete a custom data validator
    //ModelView.Validation.del( 'BOOL' );
    
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
        
        userMode: ModelView.Type.Cast.BOOL,
        
        percent: {
            percentVisual: ModelView.Type.Cast.STR
        }
        
        // this will also work
        //'percent.percentVisual': ModelView.Type.Cast.HEXINT
        // this will also work
        //'percent.percentVisual': ModelView.Type.TypeCaster(function( val ){
        //                                // 'this' refers to the model that calls this type-caster
        //                                return parseInt(val, 16);
        //                            })
    }, {
        // data validation for model keys, can be used here
        // custom validators can also be added
        
        userMode: ModelView.Validation.Validate.BOOL,
        
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
            var popup = $el.attr('data-popup');
            if ( popup ) $(popup).dialog('open');
        })
        
        .action('setUserMode', function(evt, $el, data){
            var userMode, domRef;
            this.model.set('userMode', userMode = $el.is(':checked'));
            
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
                
                userMode: $.ModelView.Type.Cast.BOOL,
                
                percent: {
                    percentVisual: $.ModelView.Type.Cast.STR
                }
                // this will also work
                //'percent.percentVisual': $.ModelView.Type.Cast.HEXINT
            }, 
            
            validators: {
                // data validation for model keys, can be used here
                // custom validators can also be added
                
                userMode: $.ModelView.Validation.Validate.BOOL,
                
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
                var popup = $el.attr('data-popup');
                if ( popup ) $(popup).dialog('open');
            },
            
            'setUserMode': function(evt, $el, data){
                var userMode, domRef;
                this.model.set('userMode', userMode = $el.is(':checked'));
                
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
