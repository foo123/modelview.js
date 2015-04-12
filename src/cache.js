/**[DOC_MARKDOWN]
####Cache

ModelView.Cache is a cache class for caching key/values for limited time and space. Used internaly by ModelView.View and ModelView.Model, but also available as public class via ModelView.Cache.

```javascript
// modelview.js cache methods

var cache = new ModelView.Cache( Number cacheSize=Infinity, Number refreshInterval=Infinity );

[/DOC_MARKDOWN]**/
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
    
/**[DOC_MARKDOWN]
// dispose cache
cache.dispose( );

[/DOC_MARKDOWN]**/
    ,dispose: function( ) {
        var self = this;
        self.$store = null;
        self.$size = null;
        self.$interval = null;
        return self;
    }

/**[DOC_MARKDOWN]
// reset cache, clear key/value store
cache.reset( );

[/DOC_MARKDOWN]**/
    ,reset: function( ) {
        this.$store = { };
        return this;
    }
    
/**[DOC_MARKDOWN]
// get/set cache  key/value store size
cache.size( [Number size] );

[/DOC_MARKDOWN]**/
    ,size: function( size ) {
        if ( arguments.length )
        {
            if ( size > 0 ) this.$size = size;
            return this;
        }
        return this.$size;
    }
    
/**[DOC_MARKDOWN]
// get/set cache  key/value store refresh interval
cache.interval( [Number interval] );

[/DOC_MARKDOWN]**/
    ,interval: function( interval ) {
        if ( arguments.length )
        {
            if ( interval > 0 ) this.$interval = interval;
            return this;
        }
        return this.$interval;
    }
    
/**[DOC_MARKDOWN]
// whether cache has given key
cache.has( key );

[/DOC_MARKDOWN]**/
    ,has: function( key ) {
        var self = this, sk = key ? self.$store[ '_'+key ] : null;
        return !!(sk && ( NOW( ) - sk.time ) <= self.$interval);
    }
    
/**[DOC_MARKDOWN]
// get cache key (if exists and valid)
cache.get( key );

[/DOC_MARKDOWN]**/
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
    
/**[DOC_MARKDOWN]
// set cache key to val
cache.set( key, val );

[/DOC_MARKDOWN]**/
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
    
/**[DOC_MARKDOWN]
// delete cache key (if exists)
cache.del( key );

[/DOC_MARKDOWN]**/
    ,del: function( key ) {
        var k = key ? ('_'+key) : null;
        if ( k && this.$store[HAS]( k ) ) delete this.$store[ k ];
        return this;
    }

    ,toString: function( ) {
        return '[ModelView.Cache]';
    }
};
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
