
//
// Cache with max duration and max size conditions
var Cache = function( cacheSize, refreshInterval ) {
    var self = this, argslen = arguments.length;
    self.$store = { };
    self.$size = INF;
    self.$interval = INF;
    if ( argslen > 0 && cacheSize > 0 ) self.$size = cacheSize;
    if ( argslen > 1 && refreshInterval > 0 ) self.$interval = refreshInterval;
};
Cache[proto] = {
    
    constructor: Cache
    
    ,$store: null
    ,$size: null
    ,$interval: null
    
    ,dispose: function( ) {
        var self = this;
        self.$store = null;
        self.$size = null;
        self.$interval = null;
        return self;
    }

    ,reset: function( ) {
        this.$store = { };
        return this;
    }
    
    ,size: function( size ) {
        if ( arguments.length )
        {
            if ( size > 0 ) this.$size = size;
            return this;
        }
        return this.$size;
    }
    
    ,interval: function( interval ) {
        if ( arguments.length )
        {
            if ( interval > 0 ) this.$interval = interval;
            return this;
        }
        return this.$interval;
    }
    
    ,has: function( key ) {
        var self = this, sk = key ? self.$store[ key ] : null;
        return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
    }
    
    ,get: function( key ) {
        if ( key )
        {
            var self = this, sk = self.$store[ key ];
            if ( sk )
            {
                if ( ( NOW( ) - sk.time ) > self.$interval )
                {
                    delete self.$store[ key ];
                    return undef;
                }
                else
                {
                    return sk.data;
                }
            }
        }
        return undef;
    }
    
    ,set: function( key, val ) {
        var self = this, store, size, storekeys;
        if ( key )
        {
            store = self.$store; size = self.$size; storekeys = Keys( store );
            // assuming js hash-keys maintain order in which they were added
            // then this same order is also chronological
            // and can remove top-k elements which should be the k-outdated also
            while ( storekeys.length >= size ) delete store[ storekeys.shift( ) ];
            store[ key ] = { data: val, time: NOW( ) };
        }
        return self;
    }
    
    ,del: function( key ) {
        if ( key && this.$store[ key ] ) delete this.$store[ key ];
        return this;
    }

    ,toString: function( ) {
        return '[ModelView.Cache]';
    }
};
