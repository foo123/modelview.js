####ModelView API

**Version 0.40**


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

// (experimental) shortcut to synchronise specific fields of this model to other fields of another model
model.syncTo( otherModel, fieldsMap );

// (experimental) shortcut to un-synchronise any fields of this model to other fields of another model
model.unsyncFrom( otherModel );

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
view.bind( events=['change', 'click'] [, dom=document.body] );

// synchronize view.dom to model
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



**simple example** [See it](https://foo123.github.io/examples/modelview-todomvc/hello-world.html)


**markup**

```html
<div id="screen">
    Hello $(msg) &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value="" />
    <button class="button" title="$(msg)" data-bind='{"click":"alert_msg"}'>Hello</button>
</div>
```

**javascript** (*standalone*)
```javascript
// standalone

new ModelView.View('view', 
    new ModelView.Model('model', 
    // model data here ..
    { msg: 'World!' },
    // model data type-casters (if any) here ..
    { msg: ModelView.Type.Cast.STR },
    // model data validators (if any) here ..
    { msg: ModelView.Validation.Validate.NOT_EMPTY }
    ),
    {bind: 'data-bind'}
)
.action('alert_msg', function( evt, el, bindData ) {
    alert( this.$model.get('msg') );
    // this also works
    //alert( this.model().get('msg') );
    // or even this, if you want the raw data without any processing
    //alert( this.$model.$data.msg );
})
.autobind( true )
.bind( [ 'change', 'click' ], document.getElementById('screen') )
.sync( )
;
```

**javascript** (*as a jquery plugin/widget, include the jquery.modelview.js file*)
```javascript
// as a jQuery plugin/widget

// make sure the modelview jQuery plugin is added if not already
if ( ModelView.jquery ) ModelView.jquery( $ );

$('#screen').modelview({
    id: 'view',
    
    autobind: true,
    bindAttribute: 'data-bind',
    inlineTplFormat: '$(__KEY__)',
    events: [ 'change', 'click' ],
    
    model: {
        id: 'model',
        
        data: {
            // model data here ..
            msg: 'World!'
        },
        
        types: {
            // model data type-casters (if any) here ..
            msg: ModelView.Type.Cast.STR
        },
        
        validators: {
            // model data validators (if any) here ..
            msg: ModelView.Validation.Validate.NOT_EMPTY
        }
    },
    
    actions: {
        // custom view actions (if any) here ..
        alert_msg: function( evt, el, bindData ) {
            alert( this.$model.get('msg') );
            // this also works
            //alert( this.model().get('msg') );
            // or even this, if you want the raw data without any processing
            //alert( this.$model.$data.msg );
        }
    }
});
```
