modelview.js
============

A simple, light-weight, versatile and fast isomorphic MVVM framework for JavaScript (Browser and Server)


It knows **where**, **when** and **what** needs to be rendered.


![ModelView](/modelview.jpg)

**Version 4.1.0 in progress** (83 kB minified)


**see also:**

* [Importer](https://github.com/foo123/Importer) simple class &amp; dependency manager and loader for PHP, JavaScript, Python
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for PHP, Python, JavaScript
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for PHP, Python, JavaScript
* [Contemplate](https://github.com/foo123/Contemplate) a fast, flexible &amp; light-weight template engine for JavaScript, PHP, Python
* [HtmlWidget](https://github.com/foo123/HtmlWidget) html widgets standalone or as plugins for PHP, JavaScript and Python
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL builder for PHP, Python, JavaScript
* [DialectORM](https://github.com/foo123/DialectORM) a simple and versatile cross-platform ORM and ODM for PHP, Python and JavaScript based on `Dialect`
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for JavaScript, PHP, Python
* [Xpresion](https://github.com/foo123/Xpresion) a simple and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, JavaScript
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript
* [Abacus](https://github.com/foo123/Abacus) a fast and versatile combinatorics symbolic computation library for JavaScript


### Contents

* [Hello World](#hello-world)
* [How it works](#how-it-works)
* [Examples](#examples)
* [Performance Notes](#performance-notes)
* [JavaScript and Browser Support](#javascript-and-browser-support)
* [API Reference](/manual.md)



#### Hello World

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
            changed: (oldProps, newProps) => false,
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
        'Hello': ModelView.View.Component('Hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().get('msg') }</div>`)
    })
    .template(`<Hello/>`)
;

console.log(view.render());
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
```


#### How it works

ModelView uses only the basic building blocks of Web Development: **HTML and JavaScript**. No need to learn new syntax, or do things differently. ModelView works with **simple `HTML` strings** which are interspersed with **arbitrary `JavaScript` Expressions**. It all starts at the top level with HTML. If only HTML exists, then once the template is rendered there is nothing to update anymore. To introduce dynamic JavaScript code you wrap it in `{` and `}` template separators, which separate JavaScript expressions from static HTML code. ModelView understands this and takes note of where the code is and what the result of the code is (eg modify node attribute, modify child nodes, etc..). Thus it acquires an understanding of how the DOM will change. But that is not over. You can also write HTML inside JavaScript by tightly wrapping the HTML in parentheses (similar to JSX), ie `(<span>some text</span>)`. This is not the end of the story either, you can again run dynamic JavaScript inside HTML, which is inside JavaScript, by wrapping the inner JavaScript expression in `{` and `}` and so on..

For example, see all the above in action:

```html
<ul>{
this.model().get('items').map(item => (<li id={item.id}>{item.text}</li>))
}</ul>
```

For those like me, who like to test code by commenting and uncommenting certain parts, block comments ie `/*` and `*/` are supported in dynamic JavaScript Expressions (**note** single line comments ie `// ..` will break the compiled code).

HTML attributes are very simple as well. If the value of an attribute is different than `true/false`, it is rendered with that value cast as string. If the value is literally `true`, it is rendered as turned on. Else if the value is literally `false`, it is removed. Simple as that! So to dynamically remove attributes you simply make sure the code that is attached to that attribute evaluates to literally `false`.

ModelView enables to encapsulate reusable layout/functionality in separate blocks of code. These are called **components**. Components are simply templates on their own (with some extra functionality) and are attached to a main View. A component is rendered by calling the syntactic sugar `<ComponentName id={..}, props={..} />` or `<ComponentName id={..} props={..}>.. childs ..</ComponentName>`. `id` in component is simply a unique identifier (not necessarily globally unique, unique among same components is all that is needed) that makes ModelView remember the props and state of this component, so it can test them against previous props of the component with same `id` and determine if component has changed (components implement their own `changed` method, see examples). If no `id` is given, ModelView constructs an `id` based on the order of rendering. ModelView components can have their own separate state model similar to the built-in View.Model (see below) and/or passed props to manage state as needed if needed. **Important:** ModelView components must return a single html element (similar to React), so if you need multiple nodes to be rendered by a component, wrap them within another html element. Also trivial "wrapper" components which simply return another component should not be used, **instead use the inner component directly**.

The previous example using components:

```javascript
new ModelView.View(
//..
).components({
    'ListItem': ModelView.View.Component('ListItem', `<li id={props.id}>{props.text}</li>`, {changed: (oldProps, newProps) => oldProps.id !== newProps.id})
});
```
```html
<ul>{
this.model().get('items').map(item => (<ListItem props={item}/>))
}</ul>
```

**make sure** your custom component names **do not match default html element names!**

ModelView furthermore has built-in (global) data Model which is available in each template (or component) via `view.model()` (`view` reference is available in all contexts and is always the main View instance, while `this` references the main view in main template, whereas it references the current component instance in a component template). Model supports custom getters and setters, typecasters, validators and notification functionality when data change. Model also supports a dynamic (scalar) Value data structure which represents a single value which keeps note of when value has changed, and dynamic Collection data structure which represents an array of items where each array manipulation can be reflected as DOM manipulation, so that DOM changes faster only what needs to be changed. Global Model can also play the role that redux or vuex play in some other popular frameworks. See manual and examples to understand how easy and powerful Model is. Components can have their own local Model as well to manage internal local state, see documentation.

ModelView also has a **simpler and faster livebind mode** called **text-only** (`view.livebind('text')`) which supports very fast morphing of only text nodes and element attributes marked with the values of specific data model keys (see [Hello World Text-Only](/examples/hello-world-text-only.html) example).

ModelView uses some heuristics in order to morph the real DOM as fast as posible and skip parts that haven't changed (or at least heuristics say so). However heuristics don't cover some edge cases (since these would require a deep diffing between real and virtual DOM, which beats the purpose of fast morphing). These cases are defined by implicitly dynamic parts which appear as static (they are implicitly dynamic as being parts of a larger dynamic element, whose static parts change as a whole, but are not marked as explicitly dynamic), while the explicitly dynamic parts are similar (see example below). These edge cases are however very easy to handle fully, by providing very simple hints to ModelView engine as to what to morph exactly and how.

Example in question:

```javascript
<div>{
someCondition ? (<ul><li>{text}</li><li>some static text</li></ul>) : (<ul><li>{text2}</li><li>some other static text</li></ul>)
}</div>
```

If you run above example and change the value of `someCondition` you will see that result is not what is expected (ie `some static text` does not morph to `some other static text` or vice-versa). This is because for ModelView to understand that these static parts are different would require a deep diffing of the two `<ul>` nodes which is slow(er), while its heuristics say that they are similar. However there are **at least two very simple ways to remedy the situation**:

**1st way: make code manifestly dynamic**

```javascript
<div>{
someCondition ? (<ul><li>{text}</li><li>{'some static text'}</li></ul>) : (<ul><li>{text2}</li><li>{'some other static text'}</li></ul>)
}</div>
```

In this case, we make the different implicitly dynamic but manifestly static parts to be explicitly dynamic which makes ModelView morph them as expected.

**2nd way: mark html as single unit**

```javascript
<div>{
someCondition ? view.unit(<ul><li>{text}</li><li>some static text</li></ul>) : view.unit(<ul><li>{text2}</li><li>some other static text</li></ul>)
}</div>
```

In this case we mark the whole html node to be morphed as a single unit (ie `view.unit(..)`), instead of recursively piece-by-piece, so it is replaced at once and we have our expected result.


ModelView idea and implementation was based on some requirements. One of those is the ability of other actors to manipulate the DOM except ModelView itself. This was a desired feature. **ModelView does not claim exclusive manipulation of the DOM** (unlike frameworks like React or Vue or Inferno), other actors can manipulate the DOM and ModelView will still work (at least in most cases of interest). This is because ModelView relies on the **actual DOM** (and not any virtual DOM) which is the **only reliable source of truth**. In fact ModelView itself provides some necessary direct DOM-level manipulation methods (eg to handle some things even faster, like add/move/remove nodes directly) which can be used along with ModelView's general DOM morphing functionality.

Take a look at the examples and manual to see how easy and intuitive is to make applications with ModelView.


#### Examples

* [Hello World](https://foo123.github.io/examples/modelview/)
* [Temperature Converter](https://foo123.github.io/examples/modelview/temperature-converter.html) based on [Two Way Data Binding](http://n12v.com/2-way-data-binding/)
* [TodoMVC with ModelView](https://foo123.github.io/examples/todomvc/) based on [TodoMVC by Addy Osmani](http://todomvc.com)
* [Weather at a Glance](https://foo123.github.io/examples/weather-modelview/)
* [ModelView with HtmlWidget](https://foo123.github.io/examples/htmlwidget/)


#### Performance Notes

Here are some benchmark results using [js-framework-benchmark](https://github.com/foo123/js-framework-benchmark) for Latest ModelView and some popular frameworks (env: Windows 7 64bit, Chrome 98.0.4758.82 64bit).


**Keyed Results**


![Performance](/examples/perf.png)

![Memory](/examples/mem.png)


**Non-Keyed Results**


![Performance 2](/examples/perf2.png)

![Memory 2](/examples/mem2.png)

It is shown that ModelView has very good performance (comparable to, or even better than, other popular frameworks which work differently), while memory consumption is within acceptable limits, and all that while retaining maximum generalizability (unlike solutions that although slightly faster are in essense handcrafted to match the benchmark task and don't generalize nor scale; not displayed in results).


#### JavaScript and Browser Support

**JavaScript:** ES5

**Browser:** All browsers that support `createDocumentFragment` and custom element attributes like `[mv-evt]`, `[mv-on-click]`, `[data-mv-evt]`, ...
