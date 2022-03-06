/**
*
*   ModelView.js
*   @version: @@VERSION@@
*   @built on @@DATE@@
*
*   A simple, light-weight, versatile and fast isomorphic MVVM JavaScript framework (Browser and Server)
*   https://github.com/foo123/modelview.js
*
**/
!function(root, name, factory) {
"use strict";
if (('object' === typeof module) && module.exports) 
    module.exports = factory.call(root); /* CommonJS */
else if (('function' === typeof define) && define.amd && ('function' === typeof require) && ('function' === typeof require.specified) && require.specified(name))
    define(name, function() {return factory.call(root);}); /* AMD */
else if (!(name in root)) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root) || 1) && (('function' === typeof define) && define.amd) && define(function() {return root[name];});
}(  /* current root */          'undefined' !== typeof self ? self : this, 
    /* module name */           "ModelView",
    /* module factory */        function ModuleFactory__ModelView() {
/* main code starts here */
"use strict";

var HASDOC = ('undefined' !== typeof window) && ('undefined' !== typeof document);

/**[DOC_MARKDOWN]
### ModelView API

**Version @@VERSION@@**

### Contents

* [Types](#types)
* [Validators](#validators)
* [Model](#model)
* [View](#view)
* [Examples](#examples)

[/DOC_MARKDOWN]**/