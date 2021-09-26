modelview.js
============

A simple, light-weight, versatile and fast isomorphic MVVM framework for JavaScript


It knows **where**, **when** and **what** needs to be rendered


![ModelView](/modelview.jpg)

**Version 3.0.0** (71 kB minified)


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
        'hello': new ModelView.View.Component('hello', `<div title={'Hello ' + view.model().get('msg')}>Hello {view.model().get('msg') }</div>`)
    })
    .template(`{view.component('hello')}`)
;

console.log(view.render());
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
```


#### How it works

`ModelView` works with **simple `HTML` strings** which are interspersed with **arbitrary `JavaScript` Expressions**. It all starts at the top level with HTML. If only HTML exists, then once the template is rendered there is nothing to update anymore. To introduce dynamic JavaScript code you wrap it in `{` and `}` template separators, which separate JavaScript expressions from static HTML code. `ModelView` understands this and takes note of where the code is and what the result of the code is (eg modify node attribute, modify child nodes, etc..). Thus it is able to have an understanding of how the DOM will change. But that is not over. You can also write HTML inside JavaScript by tightly wrapping the HTML in parentheses (similar to `JSX`), ie `(<span>some text</span>)`. This is not the end of the story either, you can again run dynamic JavaScript inside HTML, which is inside JavaScript, by wrapping the inner JavaScript expression in `{` and `}` and so on..

For example, see all the above in action:

```html
<ul>{
this.model().get('items').map(item => (<li id={item.id}>{item.text}</li>))
}</ul>
```

HTML attributes are very simple as well. If the value of an attribute is different than `true/false`, it is rendered with that value cast as string. If the value is literally `true`, it is rendered as turned on. Else if the value is literally `false`, it is removed. Simple as that! So to dynamically remove attributes you simply make sure the code that is attached to that attribute evaluates to literally `false`.


`ModelView` furthermore has built-in data `Models` which are available in each template via `this.model()` or `view.model()` (`view` is an alias of `this`, and `this` is always the `View` instance). Model supports, custom getters and setters, typecasters, validators and notification functionality when data are changed. See manual and examples to understand how easy and powerful `Model` is.

Take a look at the examples and manual to see how easy and intuitive is to make applications with `ModelView`.


#### Examples

* [Hello World](https://foo123.github.io/examples/modelview/)
* [Temperature Converter](https://foo123.github.io/examples/modelview/temperature-converter.html) based on [Two Way Data Binding](http://n12v.com/2-way-data-binding/)
* [TodoMVC with ModelView](https://foo123.github.io/examples/todomvc/) based on [TodoMVC by Addy Osmani](http://todomvc.com)
* [Weather at a Glance](https://foo123.github.io/examples/weather-modelview/)
* [ModelView with HtmlWidget](https://foo123.github.io/examples/htmlwidget/)


#### Performance Notes

Here are some benchmark results using [js-framework-benchmark](https://github.com/foo123/js-framework-benchmark) for `ModelView 3.0.0` and some popular frameworks.

![Performance](/examples/perf.png)

![Memory](/examples/mem.png)

It is shown that `ModelView 3.0.0` has great performance in all cases (beating many popular frameworks which work differently), while retaining a low memory footprint (unlike many popular frameworks) and all that while retaining maximum generalizability (unlike solutions that although slightly faster are in essense handcrafted to match the benchmark task and don't generalize nor scale; not displayed in results).

As is clear from previous versions, `ModelView` consistently improves performance, even dramatically, while maintaining high ease of use and generalizability. Until the next update..


#### JavaScript and Browser Support

**JavaScript:** ES5

**Browser:** All browsers that support custom element attributes like `[mv-evt]`, `[mv-on-click]`, `[data-mv-evt]`, ...
