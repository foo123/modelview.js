
//
// DOM Events polyfils and delegation

// adapted from https://github.com/jonathantneal/EventListener
if (!HTMLElement.prototype.addEventListener) !function(){

    function addToPrototype(name, method)
    {
        Window.prototype[name] = HTMLDocument.prototype[name] = HTMLElement.prototype[name] = Element.prototype[name] = method;
    }

    // add
    addToPrototype("addEventListener", function (type, listener) {
        var
        target = this,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        // if no events exist, attach the listener
        if (!typeListeners.length) {
            typeListeners.event = function (event) {
                var documentElement = target.document && target.document.documentElement || target.documentElement || { scrollLeft: 0, scrollTop: 0 };

                // polyfill w3c properties and methods
                event.currentTarget = target;
                event.pageX = event.clientX + documentElement.scrollLeft;
                event.pageY = event.clientY + documentElement.scrollTop;
                event.preventDefault = function () { event.returnValue = false };
                event.relatedTarget = event.fromElement || null;
                event.stopImmediatePropagation = function () { immediatePropagation = false; event.cancelBubble = true };
                event.stopPropagation = function () { event.cancelBubble = true };
                event.target = event.srcElement || target;
                event.timeStamp = +new Date;

                // create an cached list of the master events list (to protect this loop from breaking when an event is removed)
                for (var i = 0, typeListenersCache = [].concat(typeListeners), typeListenerCache, immediatePropagation = true; immediatePropagation && (typeListenerCache = typeListenersCache[i]); ++i) {
                    // check to see if the cached event still exists in the master events list
                    for (var ii = 0, typeListener; typeListener = typeListeners[ii]; ++ii) {
                        if (typeListener == typeListenerCache) {
                            typeListener.call(target, event);

                            break;
                        }
                    }
                }
            };
            if ( target.attachEvent ) target.attachEvent("on" + type, typeListeners.event);
            else target["on" + type] = typeListeners.event;
        }

        // add the event to the master event list
        typeListeners.push(listener);
    });

    // remove
    addToPrototype("removeEventListener", function (type, listener) {
        var
        target = this,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        // remove the newest matching event from the master event list
        for (var i = typeListeners.length - 1, typeListener; typeListener = typeListeners[i]; --i) {
            if (typeListener == listener) {
                typeListeners.splice(i, 1);

                break;
            }
        }

        // if no events exist, detach the listener
        if (!typeListeners.length && typeListeners.event) {
            if ( target.detachEvent ) target.detachEvent("on" + type, typeListeners.event);
            else target["on" + type] = false;
        }
    });

    // dispatch
    addToPrototype("dispatchEvent", function (eventObject) {
        var
        target = this,
        type = eventObject.type,
        listeners = target.addEventListener.listeners = target.addEventListener.listeners || {},
        typeListeners = listeners[type] = listeners[type] || [];

        try {
            return target.fireEvent("on" + type, eventObject);
        } catch (error) {
            if (typeListeners.event) {
                typeListeners.event(eventObject);
            }

            return;
        }
    });
}( );

// namespaced events, play nice with possible others
function NSEvent(evt, namespace)
{
    var nsevent = [( evt || "" ), NAMESPACE];
    if (namespace) nsevent = nsevent.concat(namespace);
    return nsevent.join('.')
}

// adapted from https://github.com/ftlabs/ftdomdelegate
var EVENTSTOPPED = "DOMEVENT_STOPPED",
    captureEvts = ['blur', 'error', 'focus', 'focusin', 'focusout', 'load', 'resize', 'scroll']
;
function captureForType(eventType){ return -1 < captureEvts.indexOf( eventType ); }
function matchesRoot(root, element){ return root === element; }
function matchesTag(tagName, element){ return tagName.toLowerCase() === element.tagName.toLowerCase(); }
function matchesId(id, element){ return id === element.id; }
function matchesSelector(selector, element){ return element[MATCHES](selector); }

function DOMEvent(el)
{
    var self = this;
    if (!(self instanceof DOMEvent)) return new DOMEvent(el);
    if (el) self.element(el);
    self.$handle = DOMEvent.Handler.bind(self);
}
DOMEvent.Handler = function(event) {
    if (event[EVENTSTOPPED]) return;

    var self = this, i, l, listeners,
        type = event.type, target = event.target/*?event.target:event.srcElement*/,
        root, phase, listener, returned, listenerList = [ ];

    // Hardcode value of Node.TEXT_NODE
    // as not defined in IE8
    if (target && 3 === target.nodeType) target = target.parentNode;

    root = self.$element;
    listeners = root.$listeners;
    phase = event.eventPhase || (event.target !== event.currentTarget ? 3 : 2);

    switch (phase)
    {
        case 1: //Event.CAPTURING_PHASE:
            listenerList = listeners[1][type];
            break;
        case 2: //Event.AT_TARGET:
            if (listeners[0] && listeners[0][type]) listenerList = listenerList.concat(listeners[0][type]);
            if (listeners[1] && listeners[1][type]) listenerList = listenerList.concat(listeners[1][type]);
            break;
        case 3: //Event.BUBBLING_PHASE:
            listenerList = listeners[0][type];
            break;
    }
    if (!listenerList) return;

    // Need to continuously check
    // that the specific list is
    // still populated in case one
    // of the callbacks actually
    // causes the list to be destroyed.
    l = listenerList.length;
    while (l && target)
    {
        for (i=0; i<l; i++)
        {
            if (!listenerList) return;
            listener = listenerList[i];
            if (!listener) break;

            if (listener.matcher(listener.matcherParam, target))
            {
                returned = listener.handler.call(target, event, target);
            }

            // Stop propagation to subsequent
            // callbacks if the callback returned
            // false
            if (false === returned || false === event.returnValue)
            {
                event[EVENTSTOPPED] = true;
                event.preventDefault();
                return;
            }
        }

        // TODO:MCG:20120117: Need a way to
        // check if event#stopPropagation
        // was called. If so, break looping
        // through the DOM. Stop if the
        // delegation root has been reached
        if (/*event.isPropagationStopped( ) ||*/ root === target)  break;
        l = listenerList.length;
        target = target.parentElement;
    }
};
DOMEvent.Dispatch = function(event, element, data) {
    var evt; // The custom event that will be created
    if (document.createEvent)
    {
        evt = document.createEvent("HTMLEvents");
        evt.initEvent(event, true, true);
        evt.eventName = event;
        if (null != data) evt.data = data;
        element.dispatchEvent(evt);
    }
    else
    {
        evt = document.createEventObject();
        evt.eventType = event;
        evt.eventName = event;
        if (null != data) evt.data = data;
        element.fireEvent("on" + evt.eventType, evt);
    }
};

DOMEvent[proto] = {
    constructor: DOMEvent,

    $element: null,
    $handle: null,

    dispose: function() {
        var self = this;
        self.off().element();
        self.$element = null;
        self.$handle = null;
        return self;
    },

    element: function(el) {
        var self = this, listeners, element = self.$element,
            eventTypes, k;

        // Remove master event listeners
        if (element)
        {
            listeners = element.$listeners;
            eventTypes = Keys( listeners[1] );
            for (k=0; k<eventTypes.length; k++ )
                element.removeEventListener(eventTypes[k], self.$handle, true);
            eventTypes = Keys( listeners[0] );
            for (k=0; k<eventTypes.length; k++ )
                element.removeEventListener(eventTypes[k], self.$handle, false);
            element.$listeners = undef;
        }

        // If no root or root is not
        // a dom node, then remove internal
        // root reference and exit here
        if (!el || !el.addEventListener)
        {
            self.$element = null;
            return self;
        }

        self.$element = el;
        el.$listeners = el.$listeners || [{}, {}];

        return self;
    },

    on: function(eventType, selector, handler, useCapture) {
        var self = this, root, listeners, matcher, i, l, matcherParam, eventTypes, capture;

        root = self.$element; if (!root) return self;

        if (!eventType)
            throw new TypeError('Invalid event type: ' + eventType);

        eventTypes = eventType.split( SPACES ).map( getNS );
        if (!eventTypes.length) return self;

        // handler can be passed as
        // the second or third argument
        if ('function' === typeof selector)
        {
            useCapture = handler;
            handler = selector;
            selector = null;
        }

        if ('function' !== typeof handler)
            throw new TypeError('Handler must be a type of Function');

        // Add master handler for type if not created yet
        for (i=0,l=eventTypes.length; i<l; i++)
        {
            // Fallback to sensible defaults
            // if useCapture not set
            if (undef === useCapture)
                capture = captureForType( eventTypes[i][0] );
            else
                capture = !!useCapture;
            listeners = root.$listeners[capture ? 1 : 0];

            if (!listeners[eventTypes[i][0]])
            {
                listeners[ eventTypes[i][0] ] = [ ];
                root.addEventListener( eventTypes[i][0], self.$handle, capture );
            }

            if (!selector)
            {
                matcherParam = root;
                matcher = matchesRoot;
            }
            else if (/^[a-z]+$/i.test(selector))
            {
                // Compile a matcher for the given selector
                matcherParam = selector;
                matcher = matchesTag;
            }
            else if (/^#[a-z0-9\-_]+$/i.test(selector))
            {
                matcherParam = selector.slice(1);
                matcher = matchesId;
            }
            else
            {
                matcherParam = selector;
                matcher = matchesSelector;
            }

            // Add to the list of listeners
            listeners[ eventTypes[i][0] ].push({
                selector: selector,
                handler: handler,
                matcher: matcher,
                matcherParam: matcherParam,
                namespace: eventTypes[ i ][ 1 ].join('.')
            });
        }
        return self;
    },

    off: function(eventType, selector, handler, useCapture) {
        var self = this, i, listener, listeners, listenerList, e, c,
            root = self.$element,
            singleEventType, singleEventNS, nsMatcher, eventTypes, allCaptures = false;

        if (!root) return self;

        // Handler can be passed as
        // the second or third argument
        if ('function' === typeof selector)
        {
            useCapture = handler;
            handler = selector;
            selector = null;
        }

        // If useCapture not set, remove
        // all event listeners
        if (undef === useCapture) allCaptures = [0, 1];
        else allCaptures = useCapture ? [1] : [0];

        eventTypes = eventType ? eventType.split( /\s+/g ).map( getNS ) : [ ];

        if (!eventTypes.length)
        {
            for (c=0; c<allCaptures.length; c++)
            {
                listeners = root.$listeners[allCaptures[c]];
                for (singleEventType in listeners)
                {
                    listenerList = listeners[ singleEventType ];
                    if (!listenerList || !listenerList.length) continue;
                    // Remove only parameter matches
                    // if specified
                    for (i=listenerList.length-1; i>=0; i--)
                    {
                        listener = listenerList[ i ];
                        if ((!selector || selector === listener.selector) &&
                            (!handler || handler === listener.handler))
                            listenerList.splice( i, 1 );
                    }
                    // All listeners removed
                    if (!listenerList.length)
                    {
                        delete listeners[ singleEventType ];
                        // Remove the main handler
                        root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                    }
                }
            }
        }
        else
        {
            for (c=0; c<allCaptures.length; c++)
            {
                listeners = root.$listeners[ allCaptures[c] ];
                for (e=0; e<eventTypes.length; e++)
                {
                    singleEventNS = eventTypes[e][1];
                    singleEventType = eventTypes[e][0];
                    nsMatcher = getNSMatcher( singleEventNS );
                    if (singleEventType.length)
                    {
                        listenerList = listeners[ singleEventType ];
                        if (!listenerList || !listenerList.length) continue;
                        // Remove only parameter matches
                        // if specified
                        for (i=listenerList.length-1; i>=0; i--)
                        {
                            listener = listenerList[ i ];
                            if (
                                (!selector || selector === listener.selector) &&
                                (!handler || handler === listener.handler) &&
                                (!nsMatcher || nsMatcher.test(listener.namespace))
                            )
                                listenerList.splice( i, 1 );
                        }
                        // All listeners removed
                        if (!listenerList.length)
                        {
                            delete listeners[ singleEventType ];
                            // Remove the main handler
                            root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                        }
                    }
                    else
                    {
                        for (singleEventType in listeners)
                        {
                            listenerList = listeners[ singleEventType ];
                            if (!listenerList || !listenerList.length) continue;
                            // Remove only parameter matches
                            // if specified
                            for (i=listenerList.length-1; i>=0; i--)
                            {
                                listener = listenerList[ i ];
                                if (
                                    (!selector || selector === listener.selector) &&
                                    (!handler || handler === listener.handler) &&
                                    (!nsMatcher || nsMatcher.test(listener.namespace))
                                )
                                    listenerList.splice( i, 1 );
                            }
                            // All listeners removed
                            if (!listenerList.length)
                            {
                                delete listeners[ singleEventType ];
                                // Remove the main handler
                                root.removeEventListener( singleEventType, self.$handle, !!allCaptures[c] );
                            }
                        }
                    }
                }
            }
        }
        return self;
    }
};
