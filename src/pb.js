//
// PublishSubscribe (Interface)
var 
    CAPTURING_PHASE                = 1,
    AT_TARGET                      = 2,
    BUBBLING_PHASE                 = 3;
var PBEvent = function( evt, target, namespace ) {
    var self = this;
    if ( !(self instanceof PBEvent) ) return new PBEvent( evt, target, namespace );
    // http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-Event
    self.type = evt;
    self.target = target;
    self.currentTarget = target;
    self.timeStamp = NOW( );
    self.eventPhase = AT_TARGET;
    self.bubbles = false;
    self.cancelable = false;
    self.namespace = namespace || null;
};
PBEvent[proto] = {
    constructor: PBEvent,
    
    type: null,
    target: null,
    currentTarget: null,
    timeStamp: null,
    eventPhase: AT_TARGET,
    bubbles: false,
    cancelable: false,
    namespace: null,
    
    stopPropagation: function( ) {
        this.bubbles = false;
    },
    preventDefault: function( ) {
    }
};
var PublishSubscribe = {

    $PB: null
    
    ,initPubSub: function( ) {
        var self = this;
        self.$PB = { };
        return self;
    }
    
    ,disposePubSub: function( ) {
        var self = this;
        self.$PB = null;
        return self;
    }
    
    ,trigger: function( evt, data ) {
        var self = this, PB = self.$PB, queue, i, l;
        if ( (queue=PB[evt]) && (l=queue.length) )
        {
            evt = PBEvent( evt, self );
            for (i=0; i<l; i++) queue[ i ]( evt, data );
        }
        return self;
    }
    
    ,on: function( evt, callback ) {
        var self = this;
        if ( is_type( callback, T_FUNC ) )
        {
            if ( !self.$PB[evt] ) self.$PB[evt] = [ ];
            self.$PB[evt].push( callback );
        }
        return self;
    }
    
    ,onTo: function( pubSub, evt, callback ) {
        var self = this;
        if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
        pubSub.on( evt, callback );
        return self;
    }
    
    ,off: function( evt, callback ) {
        var self = this, queue, i, l, PB = self.$PB;
        if ( !evt )
        {
            for (i in PB) delete PB[evt];
        }
        else if ( (queue=PB[evt]) && (l=queue.length) )
        {
            if ( is_type( callback, T_FUNC ) ) 
            {
                for (i=l-1; i>=0; i--)
                {
                    if ( callback === queue[i] ) queue.splice(i, 1);
                }
            }
            else 
            {
                PB[evt] = [ ];
            }
        }
        return self;
    }
    
    ,offFrom: function( pubSub, evt, callback ) {
        var self = this;
        if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
        pubSub.off( evt, callback );
        return self;
    }
};
// aliases
PublishSubscribe.publish = PublishSubscribe.trigger;
