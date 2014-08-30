modelview.js
============

A simple / extendable / light-weight (~26 kB minified) mv* (MVVM) framework based on jQuery


**Version 0.24**


**see also:**  

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node/JS, PHP and Python
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for Node/JS, PHP and Python
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a flexible Publish-Subscribe implementation for Node/JS, PHP and Python
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript


###Contents

* [Live Examples](#live-examples)
* [MV* Patterns and MVVM](#mv-patterns-and-mvvm)
* [ModelView.js](#modelviewjs-1)
* [API Reference](/manual.md)
* [Performance](#performance)
* [Todo](#todo)




####Live Examples

[ModelView TodoMVC example](https://foo123.github.io/examples/modelview-todomvc) (with routing and localStorage support)

[![ModelView TodoMVC](https://github.com/foo123/modelview.js/raw/master/screenshots/modelviewtodomvc.png)](https://foo123.github.io/examples/modelview-todomvc)



####MV* Patterns and MVVM


**MV* Patterns** 

MV* (MVC, MVP, MVVM, etc..) patterns were inspired by and developed for use in Graphical User Interfaces.
Graphical User Interfaces are **asynchronous** and can be **complex**. In sequential/procedural code (which mostly runs synchronously or parallel), the program state is relatively constant and can be managed procedurally more easily.


However for GUI development, the asynchronous and relatively complex  (user-defined) interactions (frequently) cause the sequential/procedural approach to become "spaghetti". As a matter of fact both **Object-Oriented Paradigm** and various **Design Patterns** around that paradigm (of which **MVC** is one) were *triggered* (pun intended) by GUI development issues.


**MVC** is a pattern for separating presentation from underlying data and logic in a clean, maintainable, way with minimum coupling and dependencies between modules / components. A way for minimum coupling to be implemented is **Design-by-Contract** , or **Design-by-Interface** , meaning modules define interfaces of input / output mappings and not specific implementations  (which can vary accross both time and space). Additionaly the **Chain-of-Responsibility** or **Publish/Subscribe** or **Observer** patterns are used in order to further minify inter-dependencies and allow multiple participants to receive / respond to events and event flow between modules.  Furthermore MVC is (in most implementations) an **Inversion of Control** (IoC) design pattern.


One of the defining features of MVC is that the same data (model) can be viewed in many different ways (views) and this connection can also be done in various ways (controllers). In fact models should not care about views and vice-versa (same model can be used with multiple different views and also same view can display multiple different models). Models should be View-agnostic and Views should be Model-agnostic (should not assume too much, apart the needed input/output interfaces)


The **M** (model) part handles the data and various operations that relate to this data (eg types, valid values, etc).


The **V** (view) part handles the presentation of given data. What the user actually sees and interacts with.


The **C** (controller) part handles the connection and event flow between a view and a model.


**MVVM** is a variation of MVC, where **C** is replaced by **VM** (viewmodel).


In MVC the **view** is usually procedurally generated in code (eg. a Java Swing View), whereas in MVVM the **view** is declaratively built (eg. markup). Thus the MVVM Controller is not an exact counterpart of an MVC Controller (at least in some implementations).


The ViewModel controller binds a model to a specific (declarative) view. Which brings the next topic, **Declarative Data Bindings** and MVVM for HTML and JavaScript.



**Declarative Data Bindings**


Declarative Data Bindings are a way to define/declare in the ui markup how a specific ui element relates (binds) to the underlying model and logic.


Ok, so why is it good to mix logic and markup (again) after so much trouble for clean separation of markup and logic??


This is a good question and will attempt an answer.


Why is this:

```html

<div data-bind='{"click": "openPopup"}' class="button"></div>

```


Better than this:

```html

<div onclick="openPopup(this)" class="button"></div>

```


and why should a designer (who designs the UI) be involved in this??



**Answer**

1. True, the basic "form" of both examples above is the same, adding an action to an event directly on the element markup (leave aside the fact that giants like Google Angular use same form).

2. The first example (although relevant to modelview.js) is more generic than the javascript handler added directly on the element in the second example. The reason is twofold, first more events (even other click events) can still be added to the element unlike the direct handler case. Also there is not actual **javascript** code, just an **identifier** of a behaviour (an action in this case) and when (event type) this should be triggered.

3. A designer has much to say about how the ui/markup element binds and behaves. The simplest answer is that markup elements that are clicked (a behaviour issue) can have different design (css/markup etc..) than markup elements that are just hovered (a design issue). So the designer may be more relevant to define/declare the data-binding for the event type and behaviour identifier (which requires no extra knowledge of the implementation/logic of the behaviour, how the action is going to be implemented). Consider the following:

```html

<div class="ui-button"></div>

```

```javascript

$('.ui-button').button();

```

This can be seen as (behavioral) "data-binding", since the "class" assigned to the element, defines how it is going to be rendered and interacted with (it becomes a UIButton in the code logic). The designer need not be concerned about the implementation of the UIButton, but the designer knows that this **is** a button eventually (it is going to be clicked) and is designed with that in mind.


Arguably declarative (2-way) data bindings are the closest thing (at present) to dynamic (interactive) markup design. Meaning markup that defines apart from static attributes, dynamic behavioral attributes. *(sth i find conceptually clean)*  see also the readme at [components.css](https://github.com/foo123/components.css) about declarative over procedural separation of concerns and modularity



Specificaly for HTML and Javascript, the MVVM pattern has this association related to the MVC pattern


<table>
<thead><tr><td>MVC</td><td>MVVM</td></tr></thead>
<tbody> 
    <tr>       
        <td><strong>Model:</strong> actual data</td>
        <td><strong>Model:</strong> actual data</td>
    </tr>
    <tr>       
        <td><strong>View:</strong> procedurally generated / templates</td>
        <td><strong>UI(View):</strong> actual markup UI (with declarative data bindings) / templates</td>
    </tr>
    <tr>       
        <td><strong>Controller:</strong> binds View to Model</td>
        <td><strong>ViewModel:</strong> binds UI (view) to Model</td>
    </tr>
</tbody>
</table>



####ModelView.js

ModelView.js is an attempt at using sth like the MVVM pattern in a light-weight, yet extendable and generic way.
Inspired mainly by Knockoutjs, Agility and Backbone.js, it is an attempt to combine certain things without repeating everything for some custom projects that can greatly benefit from such an approach.


modelview.js uses JSON format for declarative data binding which is relevant to web (and not only) development. Also modelview.js does not implement every possible interaction and action (some default actions are implemented nevertheless), but can easily define new subclasses of both model and view to have more functionality out of the box.


Current work is focusing on (model) collections and using the **composite pattern** to define composite models and composite views (which can contain submodels and subviews). This way more complexity (especially collections of objects) can be handled in a more abstract, clean and generic way. Apart from that, current work extends the **type-casting**, **validation** framework in an *algebraic/functional* way, which makes more intuitive and easier to apply types and validation to model data.

Also focus is on enabling dynamic templates (in an engine-agnostic way) directly inside the markup handled by modelview.js and dynamic data-bind update (this is sth that is already handled using 'data-bind' attributes, however it can become cumbersome)


####Performance

Some tests with ModelView 0.24, latest backboneJS and emberJS (on models get/set) on [jsperf here](http://jsperf.com/js-mvc-frameworks/11).

ModelView is (consistently) 2nd place (note Ember and Backbone do not support get/set on nested keys by default)

![jsperf-model-getset](/screenshots/jsperf-model-getset.png)