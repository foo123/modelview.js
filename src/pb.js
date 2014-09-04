    //
    // PublishSubscribe (Interface)
    var PublishSubscribe = {
    
        $PB: null
        ,namespace: null
        
        ,initPubSub: function( ) {
            var self = this;
            // use a jQuery object as simple PubSub
            self.$PB = $( {} );
            return self;
        }
        
        ,disposePubSub: function( ) {
            var self = this;
            // unbind all namespaced events on this pubsub
            self.$PB.off( NSEvent('') ); 
            self.$PB = null;
            return self;
        }
        
        ,trigger: function( message, data, namespace ) {
            var self = this;
            if ( self.namespace )
                namespace = namespace ? [self.namespace].concat(namespace) : [self.namespace];
            
            self.$PB.trigger( NSEvent(message, namespace), data );
            return self;
        }
        
        ,on: function( message, callback, namespace ) {
            var self = this;
            if ( is_type( callback, T_FUNC ) )
            {
                if ( self.namespace )
                    namespace = namespace ? [self.namespace].concat(namespace) : [self.namespace];
            
                self.$PB.on( NSEvent(message, namespace), callback );
            }
            return self;
        }
        
        ,onTo: function( pubSub, message, callback, namespace ) {
            var self = this;
            if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
            pubSub.on( message, callback, namespace );
            return self;
        }
        
        ,off: function( message, callback, namespace ) {
            var self = this;
            if ( self.namespace )
                namespace = namespace ? [self.namespace].concat(namespace) : [self.namespace];
            
            if ( is_type( callback, T_FUNC ) ) 
                self.$PB.off( NSEvent(message, namespace), callback );
            else 
                self.$PB.off( NSEvent(message, namespace) );
            return self;
        }
        
        ,offFrom: function( pubSub, message, callback, namespace ) {
            var self = this;
            if ( is_type( callback, T_FUNC ) ) callback = bindF( callback, self );
            pubSub.off( message, callback, namespace );
            return self;
        }
    };
    // aliases
    PublishSubscribe.publish = PublishSubscribe.trigger;
