
### ModelView API

**Version 3.0.0**

### Contents

* [Types](#types)
* [Validators](#validators)
* [Model](#model)
* [View](#view)
* [Examples](#examples)




#### Types
**(used with Models)**

```javascript
// modelview.js type casters




// functionaly compose typeCasters, i.e final TypeCaster = TypeCaster1(TypeCaster2(...(value)))
ModelView.Type.Cast.COMPOSITE( TypeCaster1, TypeCaster2 [, ...] );




// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );




// cast fields of an object with a FIELDS TypeCaster
ModelView.Type.Cast.FIELDS({
    'field1': ModelView.Type.Cast.STR,
    'field2': ModelView.Type.Cast.BOOL,
    'field3': ModelView.Type.TypeCaster(function(v) { return v; }) // a custom type caster
    // etc..
});




// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );




// cast to boolean
ModelView.Type.Cast.BOOL;




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




// cast to trimmed string of spaces
ModelView.Type.Cast.TRIM;




// cast to string
ModelView.Type.Cast.STR;




// add a custom typecaster
ModelView.Type.add( name, typeCaster );




// delete custom typecaster
ModelView.Type.del( name );





```




#### Validators
**(used with Models)**

(extra validators are available in `modelview.validation.js`)

```javascript
// modelview.js validators
// (extra validators are available in `modelview.validation.js`)




// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );




// validate fields of an object with a FIELDS Validator
ModelView.Validation.Validate.FIELDS({
    'field1': ModelView.Validation.Validate.GREATER_THAN( 0 ),
    'field2': ModelView.Validation.Validate.BETWEEN( v1, v2 ),
    'field3': ModelView.Validation.Validator(function(v) { return true; }) // a custom validator
    // etc..
});




// validate (string) is numeric
ModelView.Validation.Validate.NUMERIC;




// validate (string) empty (can be used as optional)
ModelView.Validation.Validate.EMPTY;




// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;




// validate (string) maximum length
ModelView.Validation.Validate.MAXLEN( len=0 );




// validate (string) minimum length
ModelView.Validation.Validate.MINLEN( len=0 );




// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );




// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );




// validate equal to value (or model field)
ModelView.Validation.Validate.EQUAL( value | Model.Field("a.model.field") [, strict=true] );




// validate not equal to value (or model field)
ModelView.Validation.Validate.NOT_EQUAL( value | Model.Field("a.model.field") [, strict=true] );




// validate greater than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.GREATER_THAN( value | Model.Field("a.model.field") [, strict=true] );




// validate less than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.LESS_THAN( value | Model.Field("a.model.field") [, strict=true] );




// validate between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );




// validate not between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.NOT_BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );




// validate value is one of value1, value2, ...
ModelView.Validation.Validate.IN( value1, value2 [, ...] );




// validate value is not one of value1, value2, ...
ModelView.Validation.Validate.NOT_IN( value1, value2 [, ...] );




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



#### Model

```javascript
// modelview.js model methods

var model = new ModelView.Model( [String id=UUID, Object data={}, Object types=null, Object validators=null, Object getters=null, Object setters=null, Object dependencies=null] );




// dispose model
model.dispose( );




// get / set model data
model.data( [Object data] );




// add model field (inter-)dependencies in {model.key: [array of model.keys it depends on]} format
// when a model.key (model field) changes or updates, it will notify any other fields that depend on it automaticaly
// NOTE: (inter-)dependencies can also be handled by custom model getters/setters as well
model.dependencies( Object dependencies );




// add default values given in {key: defaults} format
model.defaults( Object defaults );




// add typecasters given in {dottedKey: typecaster} format
model.types( Object typeCasters );




// add validators given in {dottedKey: validator} format
model.validators( Object validators );




// add custom getters (i.e computed/virtual observables) given in {dottedKey: getter} format
model.getters( Object getters );




// add custom setters given in {dottedKey: setter} format
model.setters( Object setters );




// get model data in plain JS Object format
// handles nested composite models automaticaly
model.serialize( );




// typecast model for given key or all data with any attached model typecasters
// handles nested composite models automaticaly
model.typecast( [String dottedKey=undefined] );




// validate model for given key or all data with any attached model validators
// (return on first not valid value if  breakOnFirstError is true )
// handles nested composite models automaticaly
// returns: { isValid: [true|false], errors:[Array of (nested) model keys which are not valid] }
model.validate( [Boolean breakOnFirstError=false, String dottedKey=undefined] );




// get/set model auto-validate flag, if TRUE validates each field that has attached validators live as it changes
model.autovalidate( [Boolean enabled] );




// whether model has given key (bypass custom model getters if RAW is true)
model.has( String dottedKey [, Boolean RAW=false ] );




// model get given key (bypass custom model getters if RAW is true)
model.get( String dottedKey [, Boolean RAW=false ] );




// model get all matching keys including wildcards (bypass custom model getters if RAW is true)
model.getAll( Array dottedKeys [, Boolean RAW=false ] );




// model set key to val
model.set( String dottedKey, * val [, Boolean publish=false] );




// model add/append val to key (if key is array-like)
model.[add|append]( String dottedKey, * val [, Boolean prepend=False, Boolean publish=false] );




// model insert val to key (if key is array-like) at specified position/index
model.[ins|insert]( String dottedKey, * val, Number index [, Boolean publish=false] );




// model delete/remove key (with or without re-arranging array indexes)
model.[del|delete|remove]( String dottedKey [, Boolean publish=false, Boolean reArrangeIndexes=true] );




// model delete all matching keys (with or without re-arranging array indexes) including wildcards
model.[delAll|deleteAll]( Array dottedKeys [, Boolean reArrangeIndexes=true] );




// shortcut to synchronise specific fields of this model to other fields of another model
model.sync( Model otherModel, Object fieldsMap );




// shortcut to un-synchronise any fields of this model to other fields of another model
model.unsync( Model otherModel );




// shortcut to model publich change event for key(s) (and nested keys)
model.notify( String | Array dottedKeys [, String event="change", Object calldata=null] );




// model enable / disable atomic operations, do next update operations on key (and nested keys) as one atom
model.atom( String dottedKey | Boolean false );




```



#### View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID] );




// dispose view
view.dispose( );




// get / set view model
view.model( [Model model] );




// get / set the template of the view as HTML string
view.template( [String html] );




// register a view context (eg global functions and variables) which can be used in templates in {name: value} format
view.context( Object ctx );




// add custom view event handlers for model/view/dom/document targets in {"target:eventName": handler} format
view.events( Object events );




// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );




// add custom view named actions in {actionName: handler} format
view.actions( Object actions );




// add custom view named components which render output in {componentName: componentInstance} format
view.components( Object components );




// render a custom view named component
view.component( String componentName, uniqueComponentInstanceId || null, Object props );




// get / set custom prefix for ModelView specific attributes, eg 'data-', so [mv-evt] becomes [data-mv-evt] and so on..
view.attribute( [String prefix] );




// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );




// get / set livebind,
// livebind automatically updates dom when model changes, DEFAULT TRUE
view.livebind( [Boolean enabled] );




// get / set autobind,
// autobind automatically binds (2-way) input elements to model keys via name attribute, DEFAULT TRUE
view.autobind( [Boolean enabled] );




// bind view to dom listening given DOM events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );




// unbind view from underlying dom
view.unbind( );




// render view on actual DOM (immediately or deferred)
// .render is also called internally by view auto-update methods
view.render( [Boolean immediate=false] );




// synchronize dom to underlying model
view.sync();




// synchronize model to underlying dom
view.sync_model();




```




#### View.Component

```javascript
// **Note** that component instances are attached to each view separately, if used in another view, a new instance should be used!
var MyComponent = new ModelView.View.Component(String name, String htmlTpl [, Object options={changed:function(oldProps,newProps){return true}}]);
MyComponent.dispose(); // dispose

```



#### Examples 

[See it](https://foo123.github.io/examples/modelview/)


```html
<script id="content" type="text/x-template">
    <b>Note:</b> Arbitrary JavaScript Expressions can be run inside &#123; and &#125; template placeholders
    <br /><br />
    <b>Hello {this.model().get('msg')}</b> &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value={this.model().get('msg')} />
    <button class="button" title={this.model().get('msg')} mv-evt mv-on-click="alert">Hello</button>
    <button class="button" mv-evt mv-on-click="hello_world">Hello World</button>
</script>
<div id="app"></div>
```

```javascript
// standalone
new ModelView.View('view')
.model(
    new ModelView.Model(
        'model',
        // model data here ..
        {msg: 'Earth!'}
    )
    // model data type-casters (if any) here ..
    .types({msg: ModelView.Type.Cast.STR})
    // model data validators (if any) here ..
    .validators({msg: ModelView.Validation.Validate.NOT_EMPTY})
)
.template(
    document.getElementById('content').innerHTML
)
.actions({
    // custom view actions (if any) here ..
    alert: function(evt, el) {
        alert(this.model().get('msg'));
    },
    hello_world: function(evt, el) {
        this.model().set('msg', "World", true);
    }
})
.shortcuts({
    'alt+h': 'alert'
})
.autovalidate(true)
.autobind(true) // default
.livebind(true) // default
.bind(['click', 'change'], document.getElementById('app'))
.sync()
;
```

**Server-Side Rendering**

```javascript
var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
    'hello': new ModelView.View.Component('hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().get('msg')}</div>`)
    })
    .template(`{view.component('hello')}`)
    .livebind(true)
;

var viewText = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .template(`<div title="Hello {msg}">Hello {msg}</div>`)
    .livebind('text')
;

console.log(view.render());
console.log(viewText.render());
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
```
