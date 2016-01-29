
###ModelView API

**Version 0.80.0**

###Contents

* [Types](#types)
* [Validators](#validators)
* [Cache](#cache)
* [Model](#model)
* [Tpl](#tpl)
* [View](#view)
* [View Actions](#view-actions)
* [Examples](#examples)




####Cache

ModelView.Cache is a cache class for caching key/values for limited time and space. Used internaly by ModelView.View and ModelView.Model, but also available as public class via ModelView.Cache.

```javascript
// modelview.js cache methods

var cache = new ModelView.Cache( Number cacheSize=Infinity, Number refreshInterval=Infinity );




// dispose cache
cache.dispose( );




// reset cache, clear key/value store
cache.reset( );




// get/set cache  key/value store size
cache.size( [Number size] );




// get/set cache  key/value store refresh interval
cache.interval( [Number interval] );




// whether cache has given key
cache.has( key );




// get cache key (if exists and valid)
cache.get( key );




// set cache key to val
cache.set( key, val );




// delete cache key (if exists)
cache.del( key );





```




####Types 
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




// cast to lowercase string
ModelView.Type.Cast.LCASE;




// cast to uppercase string
ModelView.Type.Cast.UCASE;




// cast to padded string (pad type can be "L"=LEFT, "R"=RIGHT, "LR"=LEFT-RIGHT)
ModelView.Type.Cast.PAD(pad_char, pad_size, pad_type="L");




// cast to string
ModelView.Type.Cast.STR;




// cast to formatted output based on given template
ModelView.Type.Cast.FORMAT( String | ModelView.Tpl | Function tpl );




// add a custom typecaster
ModelView.Type.add( name, typeCaster );




// delete custom typecaster
ModelView.Type.del( name );





```




####Validators 
**(used with Models)**

```javascript
// modelview.js validators




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




// validate array/collection of items contains at least 'limit' items (use optional item_filter to only filtered items)
ModelView.Validation.Validate.MIN_ITEMS( limit [, item_filter] );




// validate array/collection of items contains at maximum 'limit' items (use optional item_filter to only filtered items)
ModelView.Validation.Validate.MAX_ITEMS( limit [, item_filter] );




// validate value is valid email pattern
ModelView.Validation.Validate.EMAIL;




// validate value is valid url pattern (including mailto|http|https|ftp)
ModelView.Validation.Validate.URL;




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



####Model

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
model.[add|append]( String dottedKey, * val [, Boolean publish=false] );




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




####Tpl

ModelView.Tpl is an adaptation of Tao.js, an isomorphic class to handle inline templates both from/to string format and live dom update format. Used internaly by ModelView.View and also available as public class ModelView.Tpl.

```javascript
// modelview.js tpl methods
// adapted from https://github.com/foo123/Tao.js

var tpl = new ModelView.Tpl( String|DOMNode tpl );




// dispose tpl
tpl.dispose( );




// get the template dynamic keys
tpl.keys( );




// render/update and return the template string with given data
tpl.render( Object|Array data );




// tpl bind a new Dom node added to the template (if tpl represents a dom template)
tpl.bind( Node el );




// tpl free the Dom node removed from the template (if tpl represents a dom template)
tpl.free( Node el );





```




####View

```javascript
// modelview.js view methods

var view = new ModelView.View( [String id=UUID, Model model=new Model(), Object viewAttributes={bind:"data-bind"}, Integer cacheSize=View._CACHE_SIZE, Integer refreshInterval=View._REFRESH_INTERVAL] );




// dispose view (and model)
view.dispose( );




// get / set view model
view.model( [Model model] );




// get/set the name of view-specific attribute (e.g "bind": "data-bind" )
view.attribute( String name [, String att] );




// add custom view event handlers for model/view/dom/document in {"target:eventName": handler} format
view.events( Object events );




// add/remove custom view keyboard shortcuts/hotkeys in {"key+combination": actionName|handler|false} format
view.shortcuts( Object shortcuts );




// add custom view named actions in {actionName: handler} format
view.actions( Object actions );




// get/set associated model auto-validate flag
view.autovalidate( [Boolean enabled] );




// get / set livebind, 
// livebind automatically binds DOM live nodes to model keys according to {model.key} inline tpl format
// e.g <span>model.key is $(model.key)</span>
view.livebind( [String format | Boolean false] );




// get / set isomorphic flag, 
// isomorphic flag enables ModelView API to run both on server and browser and seamlessly and continously pass from one to the other
view.isomorphic( [Boolean false] );




// get / set autobind, 
// autobind automatically binds (2-way) input elements to model keys via name attribute 
// e.g <input name="model[key]" />, <select name="model[key]"></select>
view.autobind( [Boolean bool] );




// bind view to dom listening given events (default: ['change', 'click'])
view.bind( [Array events=['change', 'click'], DOMNode dom=document.body] );




// unbind view from dom listening to events or all events (if no events given)
view.unbind( [Array events=null, DOMNode dom=view.$dom] );




// reset view caches and re-bind to dom UI
view.rebind( [Array events=['change', 'click'], DOMNOde dom=document.body] );




// synchronize dom (or part of it) to underlying model
view.sync( [DOMNode dom=view.$dom] );




// synchronize model to underlying dom (or part of it)
view.sync_model( [DOMNode dom=view.$dom] );




// reset view caches only
view.reset( );





```





####View Actions

Default View Actions (inherited by sub-views)


The declarative view binding format is like:

```html
<element bind-attr="JSON"></element>

<!-- for example: -->
<div data-bind='{"event_name":{"action":"action_name","key":"a.model.key","anotherparam":"anotherparamvalue"}}'></div>

<!-- for some actions there are shorthand formats (see below) e.g -->
<div data-bind='{"hide":"a.model.key"}'></div>

<!-- is shorthand for: -->
<div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'></div>

<!-- or -->
<div data-bind='{"event_name":"action_name"}'></div>

<!-- is shorthand for: -->
<div data-bind='{"event_name":{"action":"action_name"}}'></div>
```

<table>
<thead>
<tr>
    <td>Declarative Binding</td>
    <td>Method Name</td>
    <td>Bind Example</td>
    <td>Description</td>
</tr>
</thead>
<tbody>
<tr>
    <td><code>each</code></td>
    <td><code>view.do_each</code></td>
    <td>

<code><pre>
&lt;ul data-bind='{"each":"a.model.collection.key"}'>&lt;/ul>
&lt;!-- is shorthand for: -->
&lt;ul data-bind='{"change":{"action":"each","key":"a.model.collection.key"}}'>&lt;/ul>
</pre></code>

    </td>
    <td>update element each child node depending on model collection key (TODO)</td>
</tr>
<tr>
    <td><code>prop</code></td>
    <td><code>view.do_prop</code></td>
    <td>

<code><pre>
&lt;input type="text" data-bind='{"value":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="text" data-bind='{"change":{"action":"prop","prop":{"value":"a.model.key"}}}' />

&lt;input type="checkbox" data-bind='{"checked":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="checkbox" data-bind='{"change":{"action":"prop","prop":{"checked":"a.model.key"}}}' />

&lt;input type="text" data-bind='{"disabled":"a.model.key"}' />
&lt;!-- is shorthand for: -->
&lt;input type="text" data-bind='{"change":{"action":"prop","prop":{"disabled":"a.model.key"}}}' />

&lt;select data-bind='{"options":"a.model.key"}'>&lt;/select>
&lt;!-- is shorthand for: -->
&lt;select data-bind='{"change":{"action":"prop","prop":{"options":"a.model.key"}}}'>&lt;/select>
</pre></code>

    </td>
    <td>set element properties based on model data keys</td>
</tr>
<tr>
    <td><code>html</code> / <code>text</code></td>
    <td><code>view.do_html</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"html":"a.model.key"}'>&lt;/div>
&lt;span data-bind='{"text":"a.model.key"}'>&lt;/span>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"html","key":"a.model.key"}}'>&lt;/div>
&lt;span data-bind='{"change":{"action":"text","key":"a.model.key"}}'>&lt;/span>
</pre></code>

    </td>
    <td>set element html/text property based on model data key</td>
</tr>
<tr>
    <td><code>css</code></td>
    <td><code>view.do_css</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"css":{"color":"a.model.key","background":"another.model.key"}}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"css","css":{"color":"a.model.key","background":"another.model.key"}}}'>&lt;/div>
</pre></code>

    </td>
    <td>set element css style(s) based on model data key(s)</td>
</tr>
<tr>
    <td><code>show</code></td>
    <td><code>view.do_show</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"show":"a.model.key"}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"show","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>show/hide element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td><code>hide</code></td>
    <td><code>view.do_hide</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"hide":"a.model.key"}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"change":{"action":"hide","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>hide/show element based on model data key (interpreted as *truthy value*)</td>
</tr>
<tr>
    <td><code>tpl</code></td>
    <td><code>view.do_tpl</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"click":{"action":"tpl","tpl":"tplID","key":"a.model.key"}}'>&lt;/div>
</pre></code>

    </td>
    <td>element render a template based on model data key</td>
</tr>
<tr>
    <td><code>set</code></td>
    <td><code>view.do_set</code></td>
    <td>

<code><pre>
&lt;div data-bind='{"set":{"key":"akey","value":"aval"}}'>&lt;/div>
&lt;!-- is shorthand for: -->
&lt;div data-bind='{"click":{"action":"set","key":"a.model.key","value":"aval"}}'>&lt;/div>
</pre></code>

    </td>
    <td>set/update model data key with given value on a UI event (default "click")</td>
</tr>
<tr>
    <td><code>bind</code></td>
    <td><code>view.do_bind</code></td>
    <td>

<code><pre>
&lt;input name="model[a][model][key]" />
&lt;select name="model[another][model][key]">&lt;/select>
</pre></code>

    </td>
    <td>input element default two-way autobind action (automaticaly update value on input elements based on changed model data key or vice-versa)</td>
</tr>
</tbody>
</table>




####Examples 

[See it](https://foo123.github.io/examples/modelview-todomvc/hello-world.html)


**markup**

```html
<div id="screen">
    Hello $(model.msg) &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value="" />
    <button class="button" title="$(model.msg)" data-bind='{"click":"alert_msg"}'>Hello</button>
    <button class="button" data-bind='{"set":{"key":"msg","value":"You"}}'>Hello You</button>
    <button class="button" data-bind='{"click":"hello_world"}'>Hello World</button>
</div>
```

**javascript** (*standalone*)
```javascript
// standalone

new ModelView.View(
    'view', 
    new ModelView.Model(
        'model', 
        // model data here ..
        { msg: 'Earth!' }
    )
    // model data type-casters (if any) here ..
    .types({ msg: ModelView.Type.Cast.STR })
    // model data validators (if any) here ..
    .validators({ msg: ModelView.Validation.Validate.NOT_EMPTY })
)
.shortcuts({
    'alt+h': 'alert_msg'
})
.actions({
    // custom view actions (if any) here ..
    alert_msg: function( evt, el, bindData ) {
        alert( this.$model.get('msg') );
        // this also works
        //alert( this.model().get('msg') );
        // or even this, if you want the raw data without any processing
        //alert( this.$model.$data.msg );
    },
    hello_world: function( evt, el, bindData ) {
        // set msg to "World" and publish the change
        this.$model.set('msg', "World", true);
    }
})
.attribute( 'bind', 'data-bind' ) // default
.livebind( '$(__MODEL__.__KEY__)' )
.autobind( true )
.isomorphic( false ) // default
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
    
    bindAttribute: 'data-bind', // default
    events: [ 'change', 'click' ], // default
    livebind: '$(__MODEL__.__KEY__)',
    autobind: true,
    isomorphic: false, // default
    autoSync: true, // default
    
    model: {
        id: 'model',
        
        data: {
            // model data here ..
            msg: 'Earth!'
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
    
    shortcuts: {
        'alt+h': 'alert_msg'
    },
    
    actions: {
        // custom view actions (if any) here ..
        alert_msg: function( evt, el, bindData ) {
            alert( this.$model.get('msg') );
            // this also works
            //alert( this.model().get('msg') );
            // or even this, if you want the raw data without any processing
            //alert( this.$model.$data.msg );
        },
        hello_world: function( evt, el, bindData ) {
            // set msg to "World" and publish the change
            this.$model.set('msg', "World", true);
        }
    }
});
```


