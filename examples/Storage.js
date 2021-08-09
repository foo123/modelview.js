!function( window ) {
    
    // HTML5 local storage manager
    // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Storage
    var Storage = window.Storage = {
        isSupported: (function( ) {
            try {
                return 'localStorage' in window && null !== window['localStorage'];
            } catch ( e ) {
                return false;
            }
        })( )
        
        ,has: function( key ) {
            return !!(key && window.localStorage.getItem( key ));
        }
        
        ,size: function( ) {
            return window.localStorage.length;
        }
        
        ,key: function( index ) {
            return window.localStorage.key( index || 0 );
        }
        
        ,get: function( key, asJSON ) {
            if ( key )
            {
                asJSON = false !== asJSON;
                var val = window.localStorage.getItem( key );
                if ( val && asJSON ) val = JSON.parse( val );
                return val;
            }
            return null;
        }
        
        ,set: function( key, val, asJSON ) {
            if ( key )
            {
                asJSON = false !== asJSON;
                if ( asJSON ) val = JSON.stringify( val );
                window.localStorage.setItem( key, val );
            }
            return Storage;
        }
        
        ,del: function( key ) {
            if ( key )
            {
                window.localStorage.removeItem( key );
            }
            return Storage;
        }
        
        ,clear: function( ) {
            window.localStorage.clear( );
            return Storage;
        }
    };
    
}( window );