    // main
    // export it
    exports['@@MODULE_NAME@@'] = {
    
        VERSION: "@@VERSION@@"
        
        ,UUID: uuid
        
        ,Extend: Mixin
        
        ,Field: ModelField
        
        ,Type: Type
        
        ,Validation: Validation
        
        ,Cache: Cache
        
        ,Model: Model
        
        ,View: View
    };
}(@@EXPORTS@@, jQuery);