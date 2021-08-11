modelview.js
============

A simple, light-weight, versatile and fast MVVM front-end framework for JavaScript

![ModelView](/modelview.jpg)

**Version 1.1.0** (51 kB minified)


**see also:**  

* [Importer](https://github.com/foo123/Importer) simple class &amp; dependency manager and loader for PHP, JavaScript, Python
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for PHP, Python, JavaScript
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for PHP, Python, JavaScript
* [Contemplate](https://github.com/foo123/Contemplate) a fast, flexible &amp; light-weight template engine for JavaScript, PHP, Python
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL builder for PHP, Python, JavaScript
* [DialectORM](https://github.com/foo123/DialectORM) a simple and versatile cross-platform ORM and ODM for PHP, Python and JavaScript based on `Dialect`
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for JavaScript, PHP, Python
* [Xpresion](https://github.com/foo123/Xpresion) a simple and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, JavaScript
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript
* [Abacus](https://github.com/foo123/Abacus) a fast and versatile combinatorics symbolic computation library for JavaScript


### Contents

* [Hello World](#hello-world)
* [Examples](#examples)
* [JavaScript and Browser Support](#javascript-and-browser-support)
* [API Reference](/manual.md)



#### Hello World

[See it](https://foo123.github.io/examples/modelview/hello-world.html)


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

#### Examples

* [Hello World](https://foo123.github.io/examples/modelview/hello-world.html)
* [Temperature Converter](https://foo123.github.io/examples/modelview/temperature-converter.html) based on [Two Way Data Binding](http://n12v.com/2-way-data-binding/)
* [TodoMVC with ModelView](https://foo123.github.io/examples/modelview/todomvc.html) based on [TodoMVC by Addy Osmani](http://todomvc.com)

#### JavaScript and Browser Support

**JavaScript:** ES5

**Browser:** All browsers that support `<template>` tag.
