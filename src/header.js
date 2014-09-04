/**
*
*   ModelView.js
*   @version: @@VERSION@@
*   @@DEPENDENCIES@@
*
*   A micro-MV* (MVVM) jQuery-based framework for complex (UI) screens
*   https://github.com/foo123/modelview.js
*
**/
// jQuery should be already loaded, it is a dependency
!function( exports, $, undef ) {
    
    "use strict";
    
    /**
    *   uses concepts from various MV* frameworks like:
    *       knockoutjs 
    *       agility.js
    *       backbone.js 
    **/

    ///////////////////////////////////////////////////////////////////////////////////////
    //
    //
    // utility functions
    //
    //
    ///////////////////////////////////////////////////////////////////////////////////////
    
    var bindF = function( f, scope ) { return f.bind(scope); },
        proto = "prototype", Arr = Array, AP = Arr[proto], Regex = RegExp, Num = Number,
        Obj = Object, OP = Obj[proto], Create = Obj.create, Keys = Obj.keys,
        Func = Function, FP = Func[proto], Str = String, SP = Str[proto], FPCall = FP.call,
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
        hasProp = bindF(FPCall, OP.hasOwnProperty), toStr = bindF(FPCall, OP.toString), slice = bindF(FPCall, AP.slice),
        
        is_instance = function( o, T ){ return o instanceof T; }, //typeOff = function( v ){ return typeof(v); },
        
        INF = Infinity, rnd = Math.random, parse_float = parseFloat, 
        parse_int = parseInt, is_nan = isNaN, is_finite = isFinite,
        
        fromJSON = JSON.parse, toJSON = JSON.stringify,
        
        // jQuery methods
        Event = $.Event, extend = $.extend
    ;
    
    // use native methods and abbreviation aliases if available
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim
    if ( !SP.trim ) SP.trim = function( ) { return this.replace(/^\s+|\s+$/g, ''); };
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
    if ( !SP.startsWith ) SP.startsWith = function( prefix, pos ) { pos=pos||0; return ( prefix === this.substr(pos, prefix.length+pos) ); };
    SP.tR = SP.trim; SP.sW = SP.startsWith;
