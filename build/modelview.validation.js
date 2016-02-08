/**
*
*   ModelView Extra Validation Methods add-on
*
*   A simple/extendable MV* (MVVM) framework
*   optionaly integrates into both jQuery as MVVM plugin and jQueryUI as MVC widget
*   https://github.com/foo123/modelview.js
*
**/
!function( root, name, factory ) {
"use strict";
var m;
if ( ('object'===typeof module)&&module.exports ) /* CommonJS */
    module.exports = factory.call( root, require(/\.min(\.js)?/i.test(__filename) ? './modelview.min' : './modelview') );
else if ( ('function'===typeof define)&&define.amd&&('function'===typeof require)&&('function'===typeof require.specified)&&(require.specified(name)||require.specified('ModelView')) ) /* AMD */
    define(name,['ModelView'],function(ModelView){return factory.call(root,ModelView);});
else if ( !(name in root) ) /* Browser/WebWorker/.. */
    (root[ name ] = (m=factory.call(root,root.ModelView)))&&('function'===typeof(define))&&define.amd&&define(function(){return m;} );
}(  /* current root */          this, 
    /* module name */           "ModelViewValidation",
    /* module factory */        function( ModelView ) {
"use strict";

var HAS = 'hasOwnProperty',
    Type = ModelView.Type.Cast,
    Typecaster = ModelView.Type.TypeCaster,
    Validate = ModelView.Validation.Validate,
    Validator = ModelView.Validation.Validator
;

if ( !Type[HAS]('LCASE') )
{
    Type['LCASE'] = Typecaster(function( v ) { 
        return String(v).toLowerCase( );
    });
}

if ( !Type[HAS]('UCASE') )
{
    Type['LCASE'] = Typecaster(function( v ) { 
        return String(v).toUpperCase( );
    });
}

if ( !Type[HAS]('PAD') )
{
    Type['PAD'] = function( pad_char, pad_size, pad_type ) { 
        pad_type = pad_type || 'L';
        return Typecaster(function( v ) {
            var vs = String(v), len = vs.length, n = pad_size-len, l, r;
            if ( n > 0 )
            {
                if ( 'LR' === pad_type )
                {
                    r = ~~(n/2); l = n-r;
                    vs = new Array(l+1).join(pad_char)+vs+new Array(r+1).join(pad_char);
                }
                else if ( 'R' === pad_type )
                {
                    vs += new Array(n+1).join(pad_char);
                }
                else if ( 'L' === pad_type )
                {
                    vs = new Array(n+1).join(pad_char) + vs;
                }
            }
            return vs;
        });
    };
}

if ( !Type[HAS]('FORMAT') )
{
    Type['FORMAT'] = function( tpl ) {
        if ( 'string' === typeof tpl ) 
        {
            tpl = new ModelView.Tpl(tpl, ModelView.Type.tpl_$0);
            return Typecaster(function( v ) { return tpl.render( {$0:v} ); });
        }
        else if ( tpl instanceof ModelView.Tpl ) 
            return Typecaster(function( v ) { return tpl.render( v ); });
        else if ( 'function' === typeof tpl ) 
            return Typecaster(function( v ) { return tpl( v ); });
        else return Typecaster(function( v ) { return String(v); });
    };
}

if ( !Validate[HAS]('DATETIME') )
{
    // adapted from DateX, custom implementation removed
    Validate['DATETIME'] = function( format, locale ){
        if ( 'function' === typeof DateX )
        {
            var date_parse = DateX.getParser( format, locale || DateX.defaultLocale );
            return Validator(function( datetime ) {
                return !!datetime && false !== date_parse( datetime );
            });
        }
        else
        {
            return Validator(function( datetime ) {
                return true;
            });
        }
    };
}

if ( !Validate[HAS]('EMAIL') )
{
    Validate['EMAIL']  = (function( email_pattern ){
        return Validator(function( v ) {
            return email_pattern.test( String(v) );
        }); 
    })(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
}

if ( !Validate[HAS]('URL') )
{
    Validate['URL']  = (function( url_pattern ){
        return Validator(function( v ) {
            return url_pattern.test( String(v) );
        }); 
    })(new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$','i'));
}

if ( !Validate[HAS]('MIN_ITEMS') )
{
    Validate['MIN_ITEMS'] = function( limit, item_filter ) {
        limit = parseInt(limit, 10)||0;
        if ( 'function' === typeof item_filter )
            return Validator(function( v ) {
                return v.length >= limit && v.filter( item_filter ).length >= limit;
            });
        else
            return Validator(function( v ) {
                return v.length >= limit;
            });
    };
}
    
if ( !Validate[HAS]('MAX_ITEMS') )
{
    Validate['MAX_ITEMS'] = function( limit, item_filter ) {
        limit = parseInt(limit, 10)||0;
        if ( 'function' === typeof item_filter )
            return Validator(function( v ) {
                return v.filter( item_filter ).length <= limit;
            });
        else
            return Validator(function( v ) {
                return v.length <= limit;
            });
    };
}

if ( !Validate[HAS]('MIN_FILES') )
{
    Validate['MIN_FILES']  = function( limit, item_filter ){
        limit = parseInt( limit, 10 ) || 0;
        return Validator('function' === typeof item_filter 
        ? function( fileList ) {
            return !!fileList && fileList.length > 0 ? (Array.prototype.filter.call(fileList, item_filter).length >= limit) : (0 >= limit);
        }
        : function( fileList ) {
            return !!fileList && fileList.length >= limit;
        });
    };
}

if ( !Validate[HAS]('MAX_FILES') )
{
    Validate['MAX_FILES']  = function( limit, item_filter ){
        limit = parseInt( limit, 10 ) || 0;
        return Validator('function' === typeof item_filter 
        ? function( fileList ) {
            return !!fileList && fileList.length > 0 ? (Array.prototype.filter.call(fileList, item_filter).length <= limit) : (0 <= limit);
        }
        : function( fileList ) {
            return !fileList || fileList.length <= limit;
        });
    };
}

if ( !Validate[HAS]('FILESIZE') )
{
    Validate['FILESIZE']  = function( limit ){
        limit = parseInt( limit, 10 ) || 0;
        return Validator(function( fileList ) {
            if ( !fileList || !fileList.length ) return true;
            for (var i=0,l=fileList.length; i<l; i++)
                if ( fileList[i].size > limit ) return false;
            return true;
        });
    };
}

// adapted from jquery.validation
if ( !Validate[HAS]('FILETYPE') )
{
    Validate['FILETYPE']  = function( accept_types ) {
        if ( !(accept_types instanceof RegExp) )
        {
            // Split mime on commas in case we have multiple types we can accept
            accept_types = 'string' === typeof accept_types ? accept_types.replace( /\s/g, "" ) : "image/*";
            // Escape string to be used in the regex
            // see: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
            // Escape also "/*" as "/.*" as a wildcard
            accept_types = new RegExp( ".?(" + accept_types.replace( /[\-\[\]\/\{\}\(\)\+\?\.\\\^\$\|]/g, "\\$&" ).replace( /,/g, "|" ).replace( "\/*", "/.*" ) + ")$", "i" );
        }
        return Validator(function( fileList ) {
            if ( !fileList || !fileList.length ) return true;
            for (var i=0,l=fileList.length; i<l; i++)
                if ( !fileList[ i ].type.match( accept_types ) ) return false;
            return true;
        }); 
    };
}

if ( !Validate[HAS]('IPV4') )
{
    Validate['IPV4']  = (function( ipv4_pattern ){
        return Validator(function( v ) {
            return ipv4_pattern.test( String(v) );
        }); 
    })(/^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/i);
}

if ( !Validate[HAS]('IPV6') )
{
    Validate['IPV6']  = (function( ipv6_pattern ){
        return Validator(function( v ) {
            return ipv6_pattern.test( String(v) );
        }); 
    })(/^((([0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}:[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){5}:([0-9A-Fa-f]{1,4}:)?[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){4}:([0-9A-Fa-f]{1,4}:){0,2}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){3}:([0-9A-Fa-f]{1,4}:){0,3}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){2}:([0-9A-Fa-f]{1,4}:){0,4}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){6}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(([0-9A-Fa-f]{1,4}:){0,5}:((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|(::([0-9A-Fa-f]{1,4}:){0,5}((\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b)\.){3}(\b((25[0-5])|(1\d{2})|(2[0-4]\d)|(\d{1,2}))\b))|([0-9A-Fa-f]{1,4}::([0-9A-Fa-f]{1,4}:){0,5}[0-9A-Fa-f]{1,4})|(::([0-9A-Fa-f]{1,4}:){0,6}[0-9A-Fa-f]{1,4})|(([0-9A-Fa-f]{1,4}:){1,7}:))$/i);
}
if ( !Validate[HAS]('IP') )
{
    Validate['IP']  = Validate['IPV4'];
}

if ( !Validate[HAS]('BIC') )
{
    Validate['BIC']  = (function( bic_pattern ) {
        return Validator(function( v ) {
            return bic_pattern.test( String(v) );
        });
    })(/^([A-Z]{6}[A-Z2-9][A-NP-Z1-2])(X{3}|[A-WY-Z0-9][A-Z0-9]{2})?$/);
}

if ( !Validate[HAS]('IBAN') )
{
    Validate['IBAN']  = (function( bbancountrypatterns ) {
        return Validator(function( v ) {
            // Remove spaces and to upper case
            var iban = String(v).replace( / /g, '' ).toUpperCase( ),
                ibancheckdigits = '', leadingZeroes = true, cRest = '', cOperator = '',
                countrycode, ibancheck, charAt, cChar, bbanpattern, bbancountrypatterns, ibanregexp, i, l, p;

            // Check the country code and find the country specific format
            countrycode = iban.substring( 0, 2 );

            // As new countries will start using IBAN in the
            // future, we only check if the countrycode is known.
            // This prevents false negatives, while almost all
            // false positives introduced by this, will be caught
            // by the checksum validation below anyway.
            // Strict checking should return FALSE for unknown
            // countries.
            if ( 'undefined' === typeof bbancountrypatterns[ countrycode ] ) return false;
            
            bbanpattern = bbancountrypatterns[ countrycode ];
            ibanregexp = new RegExp( "^[A-Z]{2}\\d{2}" + bbanpattern + "$", "" );
            if ( !( ibanregexp.test( iban ) ) ) return false; // Invalid country specific format

            // Now check the checksum, first convert to digits
            ibancheck = iban.substring( 4, iban.length ) + iban.substring( 0, 4 );
            for ( i = 0,l = ibancheck.length; i < l; i++ )
            {
                charAt = ibancheck.charAt( i );
                if ( '0' != charAt ) leadingZeroes = false;
                if ( !leadingZeroes )
                    ibancheckdigits += "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf( charAt );
            }

            // Calculate the result of: ibancheckdigits % 97
            for ( p = 0, l = ibancheckdigits.length; p < l; p++ )
            {
                cChar = ibancheckdigits.charAt( p );
                cOperator = "" + cRest + "" + cChar;
                cRest = cOperator % 97;
            }
            return 1 === cRest;
        });
    })({
		"AL": "\\d{8}[\\dA-Z]{16}",
		"AD": "\\d{8}[\\dA-Z]{12}",
		"AT": "\\d{16}",
		"AZ": "[\\dA-Z]{4}\\d{20}",
		"BE": "\\d{12}",
		"BH": "[A-Z]{4}[\\dA-Z]{14}",
		"BA": "\\d{16}",
		"BR": "\\d{23}[A-Z][\\dA-Z]",
		"BG": "[A-Z]{4}\\d{6}[\\dA-Z]{8}",
		"CR": "\\d{17}",
		"HR": "\\d{17}",
		"CY": "\\d{8}[\\dA-Z]{16}",
		"CZ": "\\d{20}",
		"DK": "\\d{14}",
		"DO": "[A-Z]{4}\\d{20}",
		"EE": "\\d{16}",
		"FO": "\\d{14}",
		"FI": "\\d{14}",
		"FR": "\\d{10}[\\dA-Z]{11}\\d{2}",
		"GE": "[\\dA-Z]{2}\\d{16}",
		"DE": "\\d{18}",
		"GI": "[A-Z]{4}[\\dA-Z]{15}",
		"GR": "\\d{7}[\\dA-Z]{16}",
		"GL": "\\d{14}",
		"GT": "[\\dA-Z]{4}[\\dA-Z]{20}",
		"HU": "\\d{24}",
		"IS": "\\d{22}",
		"IE": "[\\dA-Z]{4}\\d{14}",
		"IL": "\\d{19}",
		"IT": "[A-Z]\\d{10}[\\dA-Z]{12}",
		"KZ": "\\d{3}[\\dA-Z]{13}",
		"KW": "[A-Z]{4}[\\dA-Z]{22}",
		"LV": "[A-Z]{4}[\\dA-Z]{13}",
		"LB": "\\d{4}[\\dA-Z]{20}",
		"LI": "\\d{5}[\\dA-Z]{12}",
		"LT": "\\d{16}",
		"LU": "\\d{3}[\\dA-Z]{13}",
		"MK": "\\d{3}[\\dA-Z]{10}\\d{2}",
		"MT": "[A-Z]{4}\\d{5}[\\dA-Z]{18}",
		"MR": "\\d{23}",
		"MU": "[A-Z]{4}\\d{19}[A-Z]{3}",
		"MC": "\\d{10}[\\dA-Z]{11}\\d{2}",
		"MD": "[\\dA-Z]{2}\\d{18}",
		"ME": "\\d{18}",
		"NL": "[A-Z]{4}\\d{10}",
		"NO": "\\d{11}",
		"PK": "[\\dA-Z]{4}\\d{16}",
		"PS": "[\\dA-Z]{4}\\d{21}",
		"PL": "\\d{24}",
		"PT": "\\d{21}",
		"RO": "[A-Z]{4}[\\dA-Z]{16}",
		"SM": "[A-Z]\\d{10}[\\dA-Z]{12}",
		"SA": "\\d{2}[\\dA-Z]{18}",
		"RS": "\\d{18}",
		"SK": "\\d{20}",
		"SI": "\\d{15}",
		"ES": "\\d{20}",
		"SE": "\\d{20}",
		"CH": "\\d{5}[\\dA-Z]{12}",
		"TN": "\\d{20}",
		"TR": "\\d{5}[\\dA-Z]{17}",
		"AE": "\\d{3}\\d{16}",
		"GB": "[A-Z]{4}\\d{14}",
		"VG": "[\\dA-Z]{4}\\d{16}"
	});
}

if ( !Validate[HAS]('CURRENCY') )
{
    Validate['CURRENCY']  = function( symbol, suffixed, optional ) {
        symbol = "[" + symbol.replace( /,/g, "" ) + "]" + (optional ? "?" : "");
        currency_pattern = new RegExp( "^" + (!suffixed?symbol:'') + "([1-9]{1}[0-9]{0,2}(\\,[0-9]{3})*(\\.[0-9]{0,2})?|[1-9]{1}[0-9]{0,}(\\.[0-9]{0,2})?|0(\\.[0-9]{0,2})?|(\\.[0-9]{1,2})?)" + (suffixed?symbol:'') + "$" );
        return Validator(function( v ) {
            return currency_pattern.test( String(v) );
        });
    };
}

if ( !Validate[HAS]('CREDITCARDNUMBER') )
{
    // based on http://en.wikipedia.org/wiki/Luhn_algorithm
    Validate['CREDITCARDNUMBER'] = Validator(function( v ) {
        v = String( v );
        // Accept only spaces, digits and dashes
        if ( /[^0-9 \-]+/.test( v ) ) return false;

        var nCheck = 0,
            nDigit = 0,
            bEven = false,
            n, cDigit;

        v = v.replace( /\D/g, "" );

        // Basing min and max length on
        // http://developer.ean.com/general_info/Valid_Credit_Card_Types
        if ( v.length < 13 || v.length > 19 ) return false;

        for ( n = v.length - 1; n >= 0; n-- )
        {
            cDigit = v.charAt( n );
            nDigit = parseInt( cDigit, 10 );
            if ( bEven )
            {
                if ( ( nDigit *= 2 ) > 9 ) nDigit -= 9;
            }
            nCheck += nDigit;
            bEven = !bEven;
        }
        return 0 === ( nCheck % 10 );
    });
}

if ( !Validate[HAS]('CREDITCARDTYPE') )
{
    Validate['CREDITCARDTYPE'] = function( type ) {
        var validTypes = 0x0000;
        if ( type.mastercard || type.MASTERCARD ) validTypes |= 0x0001;
        if ( type.visa || type.VISA ) validTypes |= 0x0002;
        if ( type.amex || type.AMEX ) validTypes |= 0x0004;
        if ( type.dinersclub || type.DINERSCLUB ) validTypes |= 0x0008;
        if ( type.enroute || type.ENROUTE ) validTypes |= 0x0010;
        if ( type.discover || type.DISCOVER ) validTypes |= 0x0020;
        if ( type.jcb || type.JCB ) validTypes |= 0x0040;
        if ( type.unknown || type.UNKNOWN ) validTypes |= 0x0080;
        if ( type.all || type.ALL ) validTypes = 0x0001 | 0x0002 | 0x0004 | 0x0008 | 0x0010 | 0x0020 | 0x0040 | 0x0080;
        return Validator(function( v ) {
            v = String( v );
            if ( /[^0-9\-]+/.test( v ) ) return false;
            v = v.replace( /\D/g, "" );
            if ( (validTypes & 0x0001) && /^(5[12345])/.test( v ) )
            {
                // Mastercard
                return 16 === v.length;
            }
            if ( (validTypes & 0x0002) && /^(4)/.test( v ) )
            {
                // Visa
                return 16 === v.length;
            }
            if ( (validTypes & 0x0004) && /^(3[47])/.test( v ) )
            {
                // Amex
                return 15 === v.length;
            }
            if ( (validTypes & 0x0008) && /^(3(0[012345]|[68]))/.test( v ) )
            {
                // Dinersclub
                return 14 === v.length;
            }
            if ( (validTypes & 0x0010) && /^(2(014|149))/.test( v ) )
            {
                // Enroute
                return 15 === v.length;
            }
            if ( (validTypes & 0x0020) && /^(6011)/.test( v ) )
            {
                // Discover
                return 16 === v.length;
            }
            if ( (validTypes & 0x0040) && /^(3)/.test( v ) )
            {
                // Jcb
                return 16 === v.length;
            }
            if ( (validTypes & 0x0040) && /^(2131|1800)/.test( value ) )
            {
                // Jcb
                return 15 === v.length;
            }
            if ( validTypes & 0x0080 )
            {
                // Unknown
                return true;
            }
            return false;
        });
    };
}

/* export the module */
return 1; // loaded
});