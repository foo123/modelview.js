modelview.js
============

A simple, light-weight, versatile and fast isomorphic MVVM framework for JavaScript


It knows **where**, **when** and **what** needs to be rendered


![ModelView](/modelview.jpg)

**Version 2.1.0** (66 kB minified)


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
* [Examples](#examples)
* [Performance Notes](#performance-notes)
* [JavaScript and Browser Support](#javascript-and-browser-support)
* [API Reference](/manual.md)



#### Hello World

[See it](https://foo123.github.io/examples/modelview/)


```html
<script id="content" type="text/x-template">
    <b>Note:</b> Arbitrary JavaScript Code can be run inside &#123;% and %&#125; template placeholders
    <br /><br />
    <b>Hello {%= this.model().get('msg') %}</b> &nbsp;&nbsp;(updated live on <i>change</i>)
    <br /><br />
    <input type="text" name="model[msg]" size="50" value="{%= this.model().get('msg') %}" />
    <button class="button" title="{%= this.model().get('msg') %}" mv-evt mv-on-click="alert">Hello</button>
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
        'hello': new ModelView.View.Component('hello', `<div title="Hello {%= view.model().get('msg') %}">Hello {%= view.model().get('msg') %}</div>`)
    })
    .template(`{%= view.component('hello') %}`)
;

console.log(view.render());
// output: <div title="Hello Server-Side Rendering">Hello Server-Side Rendering</div>
```

#### Examples

* [Hello World](https://foo123.github.io/examples/modelview/)
* [Temperature Converter](https://foo123.github.io/examples/modelview/temperature-converter.html) based on [Two Way Data Binding](http://n12v.com/2-way-data-binding/)
* [TodoMVC with ModelView](https://foo123.github.io/examples/todomvc/) based on [TodoMVC by Addy Osmani](http://todomvc.com)
* [Weather at a Glance](https://foo123.github.io/examples/weather-modelview/)
* [ModelView with HtmlWidget](https://foo123.github.io/examples/htmlwidget/)


#### Performance Notes

Here are some benchmark results using [js-framework-benchmark](https://github.com/foo123/js-framework-benchmark) for `ModelView 2.1.0` and some popular frameworks.

![Performance](/examples/perf.png)

![Memory](/examples/mem.png)

It is shown that `ModelView 2.1.0` has decent performance in many cases (beating popular frameworks which work differently), while retaining a very low memory footprint (unlike many popular frameworks).

Some comments regarding benchmark results are in order:

* First of all, `ModelView` is designed with the requirement that it should be as simple as possible and **it should work using simple string templates** (interspersed with arbitrary JavaScript code) to build components and applications, instead of Virtual DOM abstractions and overhead (ie no babel, no jsx, no compilation, no dependencies) and morphs the **underlying real DOM to match the results**. This also **enables applications which manipulate the real DOM externally to `ModelView`** itself (at least in many cases).  These are requirements that are considered advantages.
* Then, `ModelView` parses the whole string templates into an Abstrat Syntax Tree/Virtual DOM structure and marks the points where dynamic changes are made and also marks what kind of changes were made (eg node attributes change, nodes were added). Thus it is able to morph only those parts which need to be changed. However the overhead of parsing the string templates to construct the AST/VDOM is always there (eg in the bnchmarks it has to parse the strings of 1,000 or 10,000 entries, although the parsing is very fast, it is still there), and that is why it lags behind in the above benchmarks in some cases. Not because its algorithms and data structures are inefficient nor because it manipulates the real DOM inefficiently.


#### JavaScript and Browser Support

**JavaScript:** ES5

**Browser:** All browsers that support custom element attributes like `[mv-evt]`, `[mv-on-click]`, `[data-mv-evt]`, ...
