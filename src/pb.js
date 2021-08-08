
//
// PublishSubscribe (Interface)
var CAPTURING_PHASE = 1, AT_TARGET = 2, BUBBLING_PHASE = 3,

    PBEvent = function(evt, target, ns) {
        var self = this;
        if (!(self instanceof PBEvent)) return new PBEvent(evt, target, ns);
        // http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Event
        self.type = evt;
        self.target = target;
        self.currentTarget = target;
        self.timeStamp = NOW( );
        self.eventPhase = AT_TARGET;
        self.namespace = ns || null;
    }
;
PBEvent[proto] = {
    constructor: PBEvent

    ,type: null
    ,target: null
    ,currentTarget: null
    ,timeStamp: null
    ,eventPhase: AT_TARGET
    ,bubbles: false
    ,cancelable: false
    ,namespace: null

    ,stopPropagation: function() {
        this.bubbles = false;
    }
    ,preventDefault: function() {
    }
};
var PublishSubscribe = {

    $PB: null
    ,namespace: null

    ,initPubSub: function() {
        var self = this;
        self.$PB = {};
        return self;
    }

    ,disposePubSub: function() {
        var self = this;
        self.$PB = null;
        return self;
    }

    ,trigger: function(evt, data) {
        var self = this, PB = self.$PB, queue, q, qq, i, l, ns, ns_evt;
        ns = getNS( evt ); evt = ns[ 0 ]; ns_evt = 'evt_' + evt;
        if (HAS.call(PB,ns_evt) && (queue=PB[ns_evt]) && (l=queue.length))
        {
            q = queue.slice( 0 ); ns = ns[1].join('.');
            evt = new PBEvent(evt, self, ns);
            for (i=0; i<l; i++)
            {
                qq = q[ i ];
                // oneOff and already called
                if (qq[ 2 ] && qq[ 3 ]) continue;
                qq[ 3 ] = 1; // handler called
                if (false === qq[ 0 ]( evt, data )) break;
            }
            if (HAS.call(PB,ns_evt) && (queue=PB[ns_evt]) && (l=queue.length))
            {
                // remove any oneOffs that were called this time
                if (queue.oneOffs > 0)
                {
                    for (i=l-1; i>=0; i--)
                    {
                        q = queue[ i ];
                        if (q[2] && q[3])
                        {
                            queue.splice(i, 1);
                            queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                        }
                    }
                }
                else
                {
                    queue.oneOffs = 0;
                }
            }
        }
        return self;
    }

    ,on: function(evt, callback, oneOff/*, thisRef*/) {
        var self = this, PB = self.$PB, ns, evts, ns_evt, i, l;
        if (evt && evt.length && is_type(callback, T_FUNC))
        {
            oneOff = !!oneOff;
            evts = evt.split( SPACES ).map( getNS );
            if (!(l=evts.length)) return self;
            for (i=0; i<l; i++)
            {
                evt = evts[ i ][ 0 ]; ns = evts[ i ][ 1 ].join('.');
                ns_evt = 'evt_' + evt;
                if (!HAS.call(PB,ns_evt))
                {
                    PB[ns_evt] = [ ];
                    PB[ns_evt].oneOffs = 0;
                }
                PB[ns_evt].push( [callback, ns, oneOff, 0/*, thisRef||null*/] );
                if (oneOff) PB[ns_evt].oneOffs++;
            }
        }
        return self;
    }

    ,onTo: function(pubSub, evt, callback, oneOff) {
        var self = this;
        //if (is_type(callback, T_FUNC)) callback = bindF(callback, self);
        pubSub.on(evt, callback, oneOff);
        return self;
    }

    ,off: function(evt, callback) {
        var self = this, queue, e, i, l, q, PB = self.$PB, ns, isFunc, evts, j, jl, ns_evt;
        if (!evt || !evt.length)
        {
            for (e in PB)
            {
                if (HAS.call(PB,e)) delete PB[ e ];
            }
        }
        else
        {
            isFunc = is_type( callback, T_FUNC );
            evts = evt.split( SPACES ).map( getNS );
            for (j=0,jl=evts.length; j<jl; j++)
            {
                evt = evts[ j ][ 0 ]; ns = getNSMatcher( evts[ j ][ 1 ] );
                if (evt.length)
                {
                    ns_evt = 'evt_' + evt;
                    if (HAS.call(PB,ns_evt) && (queue=PB[ns_evt]) && (l=queue.length))
                    {
                        for (i=l-1; i>=0; i--)
                        {
                            q = queue[ i ];
                            if (
                                (!isFunc || callback === q[0]) &&
                                (!ns || ns.test(q[1]))
                            )
                            {
                                // oneOff
                                if (q[ 2 ]) queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                                queue.splice( i, 1 );
                            }
                        }
                    }
                }
                else if (isFunc || ns)
                {
                    for (e in PB)
                    {
                        if (HAS.call(PB,e))
                        {
                            queue = PB[ e ];
                            if (!queue || !(l=queue.length)) continue;
                            for (i=l-1; i>=0; i--)
                            {
                                q = queue[ i ];
                                if (
                                    (!isFunc || callback === q[0]) &&
                                    (!ns || ns.test(q[1]))
                                )
                                {
                                    // oneOff
                                    if (q[ 2 ]) queue.oneOffs = queue.oneOffs > 0 ? (queue.oneOffs-1) : 0;
                                    queue.splice( i, 1 );
                                }
                            }
                        }
                    }
                }
            }
        }
        return self;
    }

    ,offFrom: function(pubSub, evt, callback) {
        var self = this;
        //if (is_type(callback, T_FUNC)) callback = bindF(callback, self);
        pubSub.off(evt, callback);
        return self;
    }
};
// aliases
PublishSubscribe.publish = PublishSubscribe.trigger;
