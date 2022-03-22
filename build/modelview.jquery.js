/**
*
*   ModelView jQuery Plugin
*   https://github.com/foo123/modelview.js
*
**/
!function(root, name, factory) {
"use strict";
if (('object' === typeof module) && module.exports) /* CommonJS */
    module.exports = factory.call(root, require(/\.min(\.js)?$/i.test(__filename) ? './modelview.min' : './modelview'));
else if (('function' === typeof define) && define.amd && ('function' === typeof require) && ('function' === typeof require.specified) && (require.specified(name) || require.specified('ModelView'))) /* AMD */
    define(name, ['ModelView'], function(ModelView) {return factory.call(root,ModelView);});
else /* Browser/WebWorker/.. */
    (factory.call(root, root['ModelView'])) && ('function' === typeof define) && define.amd && define(function() {return root['ModelView'];});
}(  /* current root */          'undefined' !== typeof self ? self : this,
    /* module name */           'ModelViewjQuery',
    /* module factory */        function(ModelView) {
"use strict";
ModelView.jquery = function($) {
"use strict";

if (!$.ModelView)
{
    // add it to root jQuery object as a jQuery reference
    $.ModelView = ModelView;

    var slice = Function.prototype.call.bind(Array.prototype.slice),
        extend = $.extend, View = ModelView.View, Model = ModelView.Model;

    // modelview jQuery plugin
    $.fn.modelview = function(arg0, arg1, arg2) {
        var argslen = arguments.length,
            method = argslen ? arg0 : null, options = arg0,
            isInit = true, optionsParsed = false, map = []
        ;

        // apply for each matched element (better use one element per time)
        this.each(function() {

            var $dom = $(this), model, view, defaultModel, defaultOptions, o;

            // modelview already set on element
            if ($dom.data('modelview'))
            {
                isInit = false;

                view = $dom.data('modelview');
                model = view.model();

                // methods
                if ('view' === method)
                {
                    map.push(view);
                }
                else if ('model' === method)
                {
                    if (argslen > 1)
                    {
                        view.model(arg1);
                        return this;
                    }
                    map.push(model);
                }
                else if ('data' === method)
                {
                    if (argslen > 1)
                    {
                        model.data(arg1);
                        return this;
                    }
                    map.push(model.data());
                }
                else if ('sync' === method)
                {
                    view.sync();
                }
                else if ('dispose' === method)
                {
                    $dom.data('modelview', null);
                    view.dispose();
                }
                return this;
            }

            if (!optionsParsed)
            {
                defaultModel = {
                    id: 'model'
                    ,data: { }
                    ,types: { }
                    ,validators: { }
                    ,getters: { }
                    ,setters: { }
                    ,dependencies: { }
                };
                defaultOptions = {
                    viewClass: View
                    ,modelClass: Model

                    ,id: 'view'
                    ,livebind: false
                    ,autobind: false
                    ,autovalidate: true
                    ,events: null
                    ,precompile: false
                    ,autoSync: true

                    ,model: null
                    ,template: null
                    ,attribute: ''
                    ,options: { }
                    ,actions: { }
                    ,context: { }
                    ,handlers: { }
                    ,shortcuts: { }
                    ,components: { }
                };
                // parse options once
                options = extend({}, defaultOptions, options);

                if (options.model && !(options.model instanceof Model))
                {
                    options.model = extend({}, defaultModel, options.model);
                }

                optionsParsed = true;
            }

            if (!options.model) return this;

            model = (options.model instanceof Model)
                    ? options.model
                    : new options.modelClass(
                        options.model.id,
                        options.model.data,
                        options.model.types,
                        options.model.validators,
                        options.model.getters,
                        options.model.setters,
                        options.model.dependencies
                    )
                ;

            view = new options.viewClass(options.id)
                .model(model)
                // custom view event handlers
                .events(options.handlers)
                // custom view hotkeys/keyboard shortcuts
                .shortcuts(options.shortcuts)
                // custom view actions
                .actions(options.actions)
                // custom view global context (eg funcs and vars)
                .context(options.context)
                // custom view components
                .components(options.components)
            ;
            for (o in options.options)
                view.option(o, options.options[o]);
            // init view
            view
                .autovalidate(options.autovalidate)
                .option('view.autobind', options.autobind)
                .option('view.livebind', options.livebind)
                .option('view.attr', options.attribute || '')
                .bind(options.events, $dom[0])
            ;
            // custom view template renderer
            if (null != options.template) view.template(options.template);
            $dom.data('modelview', view);
            if (options.precompile) view.precompile();
            if (options.autoSync) view.sync();
        });

        // chainable or values return
        return !isInit && map.length ? (1 == this.length ? map[0] : map) : this;
    };
}

// add modelview as a jQueryUI widget as well if jQueryuI is loaded
// to create state-full, self-contained, full-MVVM widgets (e.g calendars, grids, etc..)
if ($.widget && (!$.mvvm || !$.mvvm.ModelViewWidget))
{
    $.widget('mvvm.ModelViewWidget', {

        options: {},
        $view: null,

        _create: function() {
            var self = this;
            self.$view = self.element.modelview(self.options).modelview('view');
        },

        value: function(k, v) {
            var self = this;
            if (1 < arguments.length)
            {
                self.$view.model().set(k, v, true);
                return self.element;
            }
            return self.$view.model().get(k);
        },

        view: function() {
            return this.$view;
        },

        model: function() {
            return this.$view.model();
        },

        _destroy: function() {
            var self = this.
            self.$view = null;
            self.element.modelview('dispose');
        }
    });
}
};

// add to jQuery if available/accesible now
if ('undefined' !== typeof window.jQuery) ModelView.jquery(window.jQuery);
});
