
### ModelView API

**Version 5.0.2**

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




// model get given key as dynamic Model.Value -- see Model.Value below -- (bypass custom model getters if RAW is true)
model.getVal( String dottedKey [, Boolean RAW=false ] );




// get data proxy for a branch of model data specified by given key
// model.Proxy is used to get/set values of the object (and nested objects)
// at given branch of the model data as autonomous entity
// proxy takes care to notify central model of any changes made
model.getProxy( String dottedKey );




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




// dynamic value data structure, which keeps note of when value is dirty (has changed)
var value = new Model.Value(val [, String key=undefined]);
var val = value.val(); // get value
value.set(newVal); // set new value and update dirty flag as needed
var isDirty = value.changed(); // get dirty flag
value.reset(); // reset dirty flag
var key = value.key(); // get associated Model key of value (if associated with some Model key, else undefined/null)




// dynamic collection data structure, which keeps note of which manipulations are done and reflects these as DOM manipulations if requested
var collection = new Model.Collection( [Array array=[]] );




// reset all manipulations so far, data are kept intact, return same collection
collection.reset();




// clone this collection and/or the data (optionally with any Array.map functions as well)
collection.clone(Boolean type = undefined);
collection.clone(true) // new instance with **cloned** array **and** Array.map function
collection.clone(false) // new instance with **original** array, without Array.map function
collection.clone() // new instance with **original** array **and** Array.map function




// get the (array) items of this collection (optionally between start and end index, like Array.slice)
collection.items([startIndex[, endIndex]]);




// get data item at index
collection.get(index);




// set data item at index, or whole data if passed as single argument, return same collection
collection.set(index, dataItem);
collection.set(newData);




// mark entry at index as changed
collection.upd(index);




// replace data with completely new data, return same collection
collection.replace(newData);




// swap data item at index1 with data item at index2, return same collection
collection.swap(index1, index2);




// sort items given a `compare` function (same as Array.sort), return same collection
collection.sort(Function compare);




// push data item, return same collection
collection.push(dataItem);




// pop data item, return result of pop
collection.pop();




// unshift data item, return same collection
collection.unshift(dataItem);




// shift data item, return result of shift
collection.shift();




// splice collection, return result of splice
collection.splice(index, numRemoved, ..);




// concat array, in place, return same collection
collection.concat(array);




// map collection items given a map function, return same collection
// actual mapping is executed lazily when actually requested (see below),
// else func is stored to be used later, items remain intact
// **NOTE** that map function should return that many html nodes for each item passed as denoted by `itemsReturned` parameter (default 1), so that fast morphing can work as expected
collection.mapTo(func [, Number itemsReturned = 1]);




// perform actual mapping (see above), return mapped collection items array
collection.mapped([start [, end]]);




```



#### View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID] );




// dispose view
view.dispose( );




// get / set view builtin and user-defined options
view.option(String key [, Any val]);




// get / set view model
view.model( [Model model] );




// get / set the template of the view as HTML string
view.template( [String html] );




// register a view context (eg global functions and variables) which can be used in templates in {name: value} format
view.context( Object ctx );




// add custom view event handlers for model/view/dom/document/window targets in {"target:eventName": handler} format
view.events( Object events );




// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );




// add custom view named actions in {actionName: handler} format
view.actions( Object actions );




// add custom view named components which render output in {componentName: componentInstance} format
view.components( Object components );




// basic view Router component
view.router({
    type: "hash", // "hash" or "path", default "hash"
    caseSensitive: false, // default true
    prefix: "/prefix/", // default no prefix ""
    routes: {
        "/": () => (<IndexPage/>),
        "/user/:id": (match) => (<UserPage data={{id:match.id}}/>),
        "/msg/:id/:line?": (match) => (<MsgPage data={{id:match.id,line:match.line}}/>) // if there is no :line, match.line will be null
    },
    fail: () => (<ErrorPage/>) // default empty
});




// navigate to full url or path, or hash using window.history (or directly if noHistory is true)
view.navigateTo(String url[, Boolean noHistory = false]);




// can integrate with HtmlWidget
view.widget( ..args );




// dynamically parse html string to virtual html node(s) at run-time
view.html( String htmlString );




// mark html virtual node(s) to be morphed completely as a single unit
// (without using speed heuristics which may in some cases fail)
view.unit( nodes );




// declare that html virtual node(s) are keyed nodes
view.keyed( nodes );




// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );




// get / set livebind,
// livebind automatically updates dom when model changes, DEFAULT TRUE
view.livebind( [type=true|false|'simple'|'text'|'jsx'] );




// get / set autobind,
// autobind automatically binds (2-way) input elements to model keys via name attribute, DEFAULT TRUE
view.autobind( [Boolean enabled] );




// precompile content and component html templates
// should be called after all view options (eg livebind) have been set
view.precompile();




// bind view to dom listening given DOM events (default: ['change', 'click'])
// optionaly can define a render sub dom of dom where rendering happens (rest dom remains intact), default renderdom=dom
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body [, DOMNode renderdom=dom]] );




// unbind view from underlying dom
view.unbind( );




// render view on actual DOM (immediately or deferred) or return rendered string if on server
// .render is also called internally by view auto-update methods
view.render( [Boolean immediate=false] );




// directly add node at index position of parentNode (this method is compatible with general morphing routines)
view.addNode( parentNode, nodeToAdd, atIndex );




// directly move node at index position of same parentNode (this method is compatible with general morphing routines)
view.moveNode( parentNode, nodeToMove, atIndex );




// directly remove node (this method is compatible with general morphing routines)
view.removeNode( nodeToRemove );




// synchronize dom to underlying model
view.sync();




// synchronize model to underlying dom
view.sync_model();




```




#### View.Component

```javascript
// **Note** that component instances are attached to each view separately, if used in another view, a new instance should be used!
var MyComponent = ModelView.View.Component(
    String name,
    String htmlTpl [,
    Object options = {
         attached: (componentInstance) => {} // component has been attached to DOM, for componentInstance see below
        ,updated: (componentInstance) => {} // component has been updated, for componentInstance see below
        ,detached: (componentInstance) => {} // component has been detached from DOM, for componentInstance see below
        ,changed: (oldData, newData, componentInstance) => false // whether component has changed given new data
        ,model: () => ({clicks:0}) // initial state model data, if state model is to be used, else null
        ,actions: {
            // custom component actions here, if any, eg referenced as <.. mv-evt mv-on-click=":click"></..>
            click: function(evt, el, data) {
                // update local clicks count and re-render
                this.model.set('clicks', this.model.get('clicks')+1, true);
            }
        }
}]);

```



#### View.Component.Instance

```javascript
MyComponentInstance {
    view // the main view this component instance is attached to
    model // component state model, if any, else null
    data // current component instance data
    dom // domElement this component instance is attached to
    d // property to attach user-defined data, if needed
}

```



#### Examples 

[See it](https://foo123.github.io/examples/modelview/)


```html
<script id="HelloButtonComponent" type="text/x-template">
    <button class="button" mv-evt mv-on-click=":hello_world">Hello World ({this.model.getVal('clicks')})</button>
</script>
<script id="content" type="text/x-template">
    <b>Note:</b> Arbitrary JavaScript Expressions can be run inside &#123; and &#125; template placeholders
    <br /><br />
    <b>Hello {view.model().getVal('msg')}</b> &nbsp;&nbsp;(updated live on <i>keyup</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value={view.model().getVal('msg')} mv-evt mv-on-keyup="update" />
    <button class="button" title={view.model().getVal('msg')} mv-evt mv-on-click="alert">Hello</button>
    <HelloButton/>
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
.template(document.getElementById('content').innerHTML)
.components({
    HelloButton: ModelView.View.Component(
        'HelloButton',
        document.getElementById('HelloButtonComponent').innerHTML,
        {
            model: () => ({clicks:0}),
            actions: {
                hello_world: function(evt, el) {
                    this.model.set('clicks', this.model.get('clicks')+1, true);
                    this.view.model().set('msg', 'World', true);
                }
            },
            changed: (oldData, newdata) => false,
            attached: (comp) => {console.log('HelloButton attached to DOM <'+comp.dom.tagName+'>')},
            detached: (comp) => {console.log('HelloButton detached from DOM <'+comp.dom.tagName+'>')}
        }
    )
})
.actions({
    // custom view actions (if any) here ..
    alert: function(evt, el) {
        alert(this.model().get('msg'));
    },
    update: function(evt, el) {
        this.model().set('msg', el.value, true);
    }
})
.shortcuts({
    'alt+h': 'alert'
})
.autovalidate(true)
.autobind(true) // default
.livebind(true) // default
.bind(['click', 'keyup'], document.getElementById('app'))
.sync()
;
```

**Server-Side Rendering**

```javascript
var ModelView = require('../build/modelview.js');

var view = new ModelView.View('view')
    .model(new ModelView.Model('model', {msg:'Server-Side Rendering'}))
    .components({
    'Hello': new ModelView.View.Component('Hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().get('msg')}</div>`)
    })
    .template(`<Hello/>`)
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
