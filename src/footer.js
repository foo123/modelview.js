/**[DOC_MARKDOWN]
#### Examples 

[See it](https://foo123.github.io/examples/modelview-todomvc/hello-world.html)


**markup**

```html
<template id="content">
    <b>Hello {%= this.model().get('msg') %}</b> &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value="{%= this.model().get('msg') %}" />
    <button class="button" title="{%= this.model().get('msg') %}" mv-evt mv-on-click="alert">Hello</button>
    <button class="button" mv-evt mv-on-click="hello_world">Hello World</button>
</template>
<div id="app"></div>
```

**javascript** (*standalone*)
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
[/DOC_MARKDOWN]**/

// main
// export it
var ModelView = {

    VERSION: "@@VERSION@@"
    
    ,UUID: uuid
    
    ,Extend: Merge
    
    //,Field: ModelField
    // transfered to Model.Field
    ,Event: DOMEvent
    
    ,Type: Type
    
    ,Validation: Validation
    
    ,PublishSubscribeInterface: PublishSubscribe
    
    ,Model: Model
    
    ,View: View
};
