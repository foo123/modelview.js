
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
        var self = this, sk = key ? self.$store[ '_'+key ] : null;
        return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
    }
    
    ,get: function( key ) {
        if ( key )
        {
            var self = this, store = self.$store, k = '_'+key, sk;
            if ( store[HAS]( k ) )
            {
                sk = store[ k ];
                if ( ( NOW( ) - sk.time ) > self.$interval )
                {
                    delete store[ k ];
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
        var self = this, store, size, storekeys, k;
        if ( key )
        {
            k = '_'+key;
            store = self.$store; size = self.$size; storekeys = Keys( store );
            // assuming js hash-keys maintain order in which they were added
            // then this same order is also chronological
            // and can remove top-k elements which should be the k-outdated also
            while ( storekeys.length >= size ) delete store[ storekeys.shift( ) ];
            store[ k ] = { key: key, data: val, time: NOW( ) };
        }
        return self;
    }
    
    ,del: function( key ) {
        var k = key ? ('_'+key) : null;
        if ( k && this.$store[HAS]( k ) ) delete this.$store[ k ];
        return this;
    }

    ,toString: function( ) {
        return '[ModelView.Cache]';
    }
};
