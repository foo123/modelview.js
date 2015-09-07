
//
// Data Types / Validators for Models (Static)
var 
    ModelField = function ModelField( modelField ) {
        if ( !is_instance(this, ModelField) ) return new ModelField( modelField );
        this.f = modelField || null;
    },
    
    CollectionEach = function CollectionEach( f ) {
        if ( !is_instance(this, CollectionEach) ) return new CollectionEach( f );
        this.f = f || null;
        this.fEach = 1;
    },
    
    floor = Math.floor, round = Math.round, abs = Math.abs,
    
    by_length_desc = function( a, b ) {
        return b.length - a.length;
    },
    
    get_alternate_pattern = function( alts ) {
        return map( alts.sort( by_length_desc ), esc_re ).join( '|' );
    },
    
    pad = function( s, len, ch ) {
        var sp = s.toString( ), n = len-sp.length;
        return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
    },

    // adapted from https://github.com/foo123/DateX
    date_locale_default = {
    meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
    ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
    timezone: [ 'UTC','EST','MDT' ],
    timezone_short: [ 'UTC','EST','MDT' ],
    day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
    day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
    month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
    month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
    },
    
    // (php) date formats
    // http://php.net/manual/en/function.date.php
    date_patterns = {
    // Day --
    // Day of month w/leading 0; 01..31
     d: function( locale, dto ) {
         if ( !dto[HAS]('d') )
         {
            dto.d = '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01)';
         }
        return dto.d;
     }
    // Shorthand day name; Mon...Sun
    ,D: function( locale, dto ) {
         if ( !dto[HAS]('D') )
         {
            dto.D = '(' + get_alternate_pattern( locale.day_short.slice() ) + ')';
         }
         return dto.D;
    }
    // Full day name; Monday...Sunday
    ,l: function( locale, dto ) {
         if ( !dto[HAS]('l') )
         {
            dto.l = '(' + get_alternate_pattern( locale.day.slice() ) + ')';
         }
         return dto.l;
    }
    // Day of month; 1..31
    ,j: function( locale, dto ) {
         if ( !dto[HAS]('j') )
         {
            dto.j = '(31|30|29|28|27|26|25|24|23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1)';
         }
         return dto.j;
    }
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    ,N: function( locale, dto ) {
         if ( !dto[HAS]('N') )
         {
            dto.N = '([1-7])';
         }
         return dto.N;
    }
    // Ordinal suffix for day of month; st, nd, rd, th
    ,S: function( locale, dto ) {
         if ( !dto[HAS]('S') )
         {
            // Ordinal suffix for day of month; st, nd, rd, th
            var lord = locale.ordinal.ord, lords = [], i;
            for (i in lord) if ( lord[HAS](i) ) lords.push( lord[i] );
            lords.push( locale.ordinal.nth );
            dto.S = '(' + get_alternate_pattern( lords ) + ')';
         }
         return dto.S;
    }
    // Day of week; 0[Sun]..6[Sat]
    ,w: function( locale, dto ) {
         if ( !dto[HAS]('w') )
         {
            dto.w = '([0-6])';
         }
         return dto.w;
    }
    // Day of year; 0..365
    ,z: function( locale, dto ) {
         if ( !dto[HAS]('z') )
         {
            dto.z = '([1-3]?[0-9]{1,2})';
         }
         return dto.z;
    }

    // Week --
    // ISO-8601 week number
    ,W: function( locale, dto ) {
         if ( !dto[HAS]('W') )
         {
            dto.W = '([0-5]?[0-9])';
         }
         return dto.W;
    }

    // Month --
    // Full month name; January...December
    ,F: function( locale, dto ) {
         if ( !dto[HAS]('F') )
         {
            dto.F = '(' + get_alternate_pattern( locale.month.slice() ) + ')';
         }
         return dto.F;
    }
    // Shorthand month name; Jan...Dec
    ,M: function( locale, dto ) {
         if ( !dto[HAS]('M') )
         {
            dto.M = '(' + get_alternate_pattern( locale.month_short.slice() ) + ')';
         }
         return dto.M;
    }
    // Month w/leading 0; 01...12
    ,m: function( locale, dto ) {
         if ( !dto[HAS]('m') )
         {
            dto.m = '(12|11|10|09|08|07|06|05|04|03|02|01)';
         }
         return dto.m;
    }
    // Month; 1...12
    ,n: function( locale, dto ) {
         if ( !dto[HAS]('n') )
         {
            dto.n = '(12|11|10|9|8|7|6|5|4|3|2|1)';
         }
         return dto.n;
    }
    // Days in month; 28...31
    ,t: function( locale, dto ) {
         if ( !dto[HAS]('t') )
         {
            dto.t = '(31|30|29|28)';
         }
         return dto.t;
    }
    
    // Year --
    // Is leap year?; 0 or 1
    ,L: function( locale, dto ) {
         if ( !dto[HAS]('L') )
         {
            dto.L = '([01])';
         }
         return dto.L;
    }
    // ISO-8601 year
    ,o: function( locale, dto ) {
         if ( !dto[HAS]('o') )
         {
            dto.o = '(\\d{2,4})';
         }
         return dto.o;
    }
    // Full year; e.g. 1980...2010
    ,Y: function( locale, dto ) {
         if ( !dto[HAS]('Y') )
         {
            dto.Y = '([12][0-9]{3})';
         }
         return dto.Y;
    }
    // Last two digits of year; 00...99
    ,y: function( locale, dto ) {
         if ( !dto[HAS]('y') )
         {
            dto.y = '([0-9]{2})';
         }
         return dto.y;
    }

    // Time --
    // am or pm
    ,a: function( locale, dto ) {
         if ( !dto[HAS]('a') )
         {
            dto.a = '(' + get_alternate_pattern( [
                locale.meridian.am /*|| date_locale_default.meridian.am*/,
                locale.meridian.pm /*|| date_locale_default.meridian.pm*/
            ] ) + ')';
         }
         return dto.a;
    }
    // AM or PM
    ,A: function( locale, dto ) {
         if ( !dto[HAS]('A') )
         {
            dto.A = '(' + get_alternate_pattern( [
                locale.meridian.AM /*|| date_locale_default.meridian.AM*/,
                locale.meridian.PM /*|| date_locale_default.meridian.PM*/
            ] ) + ')';
         }
         return dto.A;
    }
    // Swatch Internet time; 000..999
    ,B: function( locale, dto ) {
         if ( !dto[HAS]('B') )
         {
            dto.B = '([0-9]{3})';
         }
         return dto.B;
    }
    // 12-Hours; 1..12
    ,g: function( locale, dto ) {
         if ( !dto[HAS]('g') )
         {
            dto.g = '(12|11|10|9|8|7|6|5|4|3|2|1)';
         }
         return dto.g;
    }
    // 24-Hours; 0..23
    ,G: function( locale, dto ) {
         if ( !dto[HAS]('G') )
         {
            dto.G = '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1|0)';
         }
         return dto.G;
    }
    // 12-Hours w/leading 0; 01..12
    ,h: function( locale, dto ) {
         if ( !dto[HAS]('h') )
         {
            dto.h = '(12|11|10|09|08|07|06|05|04|03|02|01)';
         }
         return dto.h;
    }
    // 24-Hours w/leading 0; 00..23
    ,H: function( locale, dto ) {
         if ( !dto[HAS]('H') )
         {
            dto.H = '(23|22|21|20|19|18|17|16|15|14|13|12|11|10|09|08|07|06|05|04|03|02|01|00)';
         }
         return dto.H;
    }
    // Minutes w/leading 0; 00..59
    ,i: function( locale, dto ) {
         if ( !dto[HAS]('i') )
         {
            dto.i = '([0-5][0-9])';
         }
         return dto.i
    }
    // Seconds w/leading 0; 00..59
    ,s: function( locale, dto ) {
         if ( !dto[HAS]('s') )
         {
            dto.s = '([0-5][0-9])';
         }
         return dto.s;
    }
    // Microseconds; 000000-999000
    ,u: function( locale, dto ) {
         if ( !dto[HAS]('u') )
         {
            dto.u = '([0-9]{6})';
         }
         return dto.u;
    }

    // Timezone --
    // DST observed?; 0 or 1
    ,I: function( locale, dto ) {
         if ( !dto[HAS]('I') )
         {
            dto.I = '([01])';
         }
         return dto.I;
    }
    // Difference to GMT in hour format; e.g. +0200
    ,O: function( locale, dto ) {
         if ( !dto[HAS]('O') )
         {
            dto.O = '([+-][0-9]{4})';
         }
         return dto.O;
    }
    // Difference to GMT w/colon; e.g. +02:00
    ,P: function( locale, dto ) {
         if ( !dto[HAS]('P') )
         {
            dto.P = '([+-][0-9]{2}:[0-9]{2})';
         }
         return dto.P;
    }
    // Timezone offset in seconds (-43200...50400)
    ,Z: function( locale, dto ) {
         if ( !dto[HAS]('Z') )
         {
            dto.Z = '(-?[0-9]{5})';
         }
         return dto.Z;
    }
    // Timezone identifier; e.g. Atlantic/Azores, ...
    ,e: function( locale, dto ) {
         if ( !dto[HAS]('e') )
         {
            dto.e = '(' + get_alternate_pattern( locale.timezone /*|| date_locale_default.timezone*/ ) + ')';
         }
         return dto.e;
    }
    // Timezone abbreviation; e.g. EST, MDT, ...
    ,T: function( locale, dto ) {
         if ( !dto[HAS]('T') )
         {
            dto.T = '(' + get_alternate_pattern( locale.timezone_short /*|| date_locale_default.timezone_short*/ ) + ')';
         }
         return dto.T;
    }

    // Full Date/Time --
    // Seconds since UNIX epoch
    ,U: function( locale, dto ) {
         if ( !dto[HAS]('U') )
         {
            dto.U = '([0-9]{1,8})';
         }
         return dto.U;
    }
    // ISO-8601 date. Y-m-d\\TH:i:sP
    ,c: function( locale, dto ) {
         if ( !dto[HAS]('c') )
         {
            dto.c = date_patterns.Y(locale, dto)+'-'+date_patterns.m(locale, dto)+'-'+date_patterns.d(locale, dto)+'\\\\'+date_patterns.T(locale, dto)+date_patterns.H(locale, dto)+':'+date_patterns.i(locale, dto)+':'+date_patterns.s(locale, dto)+date_patterns.P(locale, dto);
         }
         return dto.c;
    }
    // RFC 2822 D, d M Y H:i:s O
    ,r: function( locale, dto ) {
         if ( !dto[HAS]('r') )
         {
            dto.r = date_patterns.D(locale, dto)+',\\s'+date_patterns.d(locale, dto)+'\\s'+date_patterns.M(locale, dto)+'\\s'+date_patterns.Y(locale, dto)+'\\s'+date_patterns.H(locale, dto)+':'+date_patterns.i(locale, dto)+':'+date_patterns.s(locale, dto)+'\\s'+date_patterns.O(locale, dto);
         }
         return dto.r;
    }
    },
    
    // (php) date formats
    // http://php.net/manual/en/function.date.php
    date_parsers = {
    // Day --
    // Day of month w/leading 0; 01..31
     d: function( d, locale, dto ) {
         d = parseInt('0' === d.charAt(0) ? d.slice(1) : d, 10);
         if ( d < 1 || d > 31 ) return false;
         if ( dto[HAS]('day') && d !== dto.day ) return false;
         dto.day = d;
     }
    // Shorthand day name; Mon...Sun
    ,D: function( D, locale, dto ) {
         D = locale.day_short.indexOf( D );
         if ( D < 0 ) return false;
         if ( dto[HAS]('day_week') && D !== dto.day_week ) return false;
         dto.day_week = D;
     }
    // Day of month; 1..31
    ,j: function( j, locale, dto ) {
         j = parseInt(j, 10);
         if ( j < 1 || j > 31 ) return false;
         if ( dto[HAS]('day') && j !== dto.day ) return false;
         dto.day = j;
     }
    // Full day name; Monday...Sunday
    ,l: function( l, locale, dto ) {
         l = locale.day.indexOf( l );
         if ( l < 0 ) return false;
         if ( dto[HAS]('day_week') && l !== dto.day_week ) return false;
         dto.day_week = l;
     }
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    ,N: function( N, locale, dto ) {
         N = parseInt(N, 10);
         if ( N < 1 || N > 7 ) return false;
         if ( 7 === N ) N = 0;
         if ( dto[HAS]('day_week') && N !== dto.day_week ) return false;
         dto.day_week = N;
     }
    // Ordinal suffix for day of month; st, nd, rd, th
    ,S: null
    // Day of week; 0[Sun]..6[Sat]
    ,w: function( w, locale, dto ) {
         w = parseInt(w, 10);
         if ( w < 0 || w > 6 ) return false;
         if ( dto[HAS]('day_week') && w !== dto.day_week ) return false;
         dto.day_week = w;
     }
    // Day of year; 0..365(6)
    ,z: function( z, locale, dto ) {
         z = parseInt(z, 10);
         if ( z < 0 || z > 366 ) return false;
         if ( dto[HAS]('day_year') && z !== dto.day_year ) return false;
         dto.day_year = z;
     }

    // Week --
    // ISO-8601 week number
    ,W: function( W, locale, dto ) {
         W = parseInt(W, 10);
         if ( W < 1 || W > 53 ) return false;
         if ( dto[HAS]('week_year') && W !== dto.week_year ) return false;
         dto.week_year = W;
     }

    // Month --
    // Full month name; January...December
    ,F: function( F, locale, dto ) {
         F = locale.month.indexOf( F );
         if ( F < 0 ) return false;
         if ( dto[HAS]('month') && F+1 !== dto.month ) return false;
         dto.month = F+1;
     }
    // Month w/leading 0; 01...12
    ,m: function( m, locale, dto ) {
         m = parseInt('0' === m.charAt(0) ? m.slice(1) : m, 10);
         if ( m < 1 || m > 12 ) return false;
         if ( dto[HAS]('month') && m !== dto.month ) return false;
         dto.month = m;
     }
    // Shorthand month name; Jan...Dec
    ,M: function( M, locale, dto ) {
         M = locale.month_short.indexOf( M );
         if ( M < 0 ) return false;
         if ( dto[HAS]('month') && M+1 !== dto.month ) return false;
         dto.month = M+1;
     }
    // Month; 1...12
    ,n: function( n, locale, dto ) {
         n = parseInt(n, 10);
         if ( n < 1 || n > 12 ) return false;
         if ( dto[HAS]('month') && n !== dto.month ) return false;
         dto.month = n;
     }
    // Days in month; 28...31
    ,t: function( t, locale, dto ) {
         t = parseInt(t, 10);
         if ( t < 28 || t > 31 ) return false;
         if ( dto[HAS]('days_month') && t !== dto.days_month ) return false;
         dto.days_month = t;
     }
    
    // Year --
    // Is leap year?; 0 or 1
    ,L: function( L, locale, dto ) {
         if ( '0' === L ) dto.leap = 0;
         else if ( '1' === L ) dto.leap = 1;
         else return false;
     }
    // ISO-8601 year
    ,o: null
    // Full year; e.g. 1980...2010
    ,Y: function( Y, locale, dto ) {
         Y = parseInt(Y, 10);
         if ( Y < 1000 || Y > 3000 ) return false;
         if ( dto[HAS]('year') && Y !== dto.year ) return false;
         dto.year = Y;
     }
    // Last two digits of year; 00...99
    ,y: function( y, locale, dto ) {
         if ( 2 === y.length )
         {
            // http://php.net/manual/en/function.strtotime.php
            if ( '00' <= y && '69' >= y ) y = '20' + y;
            else if ( '70' <= y && '99' >= y ) y = '19' + y;
         }
         y = parseInt(y , 10);
         if ( y < 1000 || y > 3000 ) return false;
         if ( dto[HAS]('year') && y !== dto.year ) return false;
         dto.year = y;
     }

    // Time --
    // am or pm
    ,a: function( a, locale, dto ) {
        if ( locale.meridian.am === a ) a = 'am';
        else if ( locale.meridian.pm === a ) a = 'pm';
        else return false;
        if ( dto[HAS]('meridian') && a !== dto.meridian ) return false;
        dto.meridian = a;
     }
    // AM or PM
    ,A: function( A, locale, dto ) {
        if ( locale.meridian.AM === A ) A = 'am';
        else if ( locale.meridian.PM === A ) A = 'pm';
        else return false;
        if ( dto[HAS]('meridian') && A !== dto.meridian ) return false;
        dto.meridian = A;
     }
    // Swatch Internet time; 000..999
    ,B: null
    // 12-Hours; 1..12
    ,g: function( g, locale, dto ) {
        g = parseInt(g, 10);
        if ( g < 1 || g > 12 ) return false;
        if ( dto[HAS]('hour_12') && g !== dto.hour_12 ) return false;
        dto.hour_12 = g;
     }
    // 24-Hours; 0..23
    ,G: function( G, locale, dto ) {
        G = parseInt(G, 10);
        if ( G < 0 || G > 23 ) return false;
        if ( dto[HAS]('hour') && G !== dto.hour ) return false;
        dto.hour = G;
     }
    // 12-Hours w/leading 0; 01..12
    ,h: function( h, locale, dto ) {
        h = parseInt('0' === h.charAt(0) ? h.slice(1) : h, 10);
        if ( h < 1 || h > 12 ) return false;
        if ( dto[HAS]('hour_12') && h !== dto.hour_12 ) return false;
        dto.hour_12 = h;
     }
    // 24-Hours w/leading 0; 00..23
    ,H: function( H, locale, dto ) {
        H = parseInt('0' === H.charAt(0) ? H.slice(1) : H, 10);
        if ( H < 0 || H > 23 ) return false;
        if ( dto[HAS]('hour') && H !== dto.hour ) return false;
        dto.hour = H;
     }
    // Minutes w/leading 0; 00..59
    ,i: function( i, locale, dto ) {
        i = parseInt('0' === i.charAt(0) ? i.slice(1) : i, 10);
        if ( i < 0 || i > 59 ) return false;
        if ( dto[HAS]('minute') && i !== dto.minute ) return false;
        dto.minute = i;
     }
    // Seconds w/leading 0; 00..59
    ,s: function( s, locale, dto ) {
        s = parseInt('0' === s.charAt(0) ? s.slice(1) : s, 10);
        if ( s < 0 || s > 59 ) return false;
        if ( dto[HAS]('second') && s !== dto.second ) return false;
        dto.second = s;
     }
    // Microseconds; 000000-999000
    ,u: function( u, locale, dto ) {
        var p = 0;
        while (u.length > 1 && '0'===u.charAt(p)) p++;
        u = parseInt(u.slice(p), 10);
        u = ~~(u/1000);
        if ( u < 0 || u > 999 ) return false;
        if ( dto[HAS]('ms') && u !== dto.ms ) return false;
        dto.ms = u;
     }

    // Timezone --
    // Timezone identifier; e.g. Atlantic/Azores, ...
    ,e: null
    // DST observed?; 0 or 1
    ,I: null
    // Difference to GMT in hour format; e.g. +0200
    ,O: null
    // Difference to GMT w/colon; e.g. +02:00
    ,P: null
    // Timezone abbreviation; e.g. EST, MDT, ...
    ,T: null
    // Timezone offset in seconds (-43200...50400)
    ,Z: null

    // Full Date/Time --
    // Seconds since UNIX epoch
    ,U: function( U, locale, dto ) {
        U = parseInt(U, 10);
        if ( U < 0 ) return false;
        U *= 1000;
        if ( dto[HAS]('time') && U !== dto.time ) return false;
        dto.time = U;
     }
    // ISO-8601 date. Y-m-d\\TH:i:sP
    ,c: null // added below
    // RFC 2822 D, d M Y H:i:s O
    ,r: null // added below
    },
    
    date_formatters = { 
    // 24-Hours; 0..23
    G: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('G') ) 
        {
            dto.G = jsdate.getHours( );
        }
        return dto.G;
    }
    // Day of month; 1..31
    ,j: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('j') ) 
        {
            dto.j = jsdate.getDate( );
            dto.jmod10 = dto.j%10;
        }
        return dto.j;
    }
    // Month; 1...12
    ,n: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('n') ) 
        {
            dto.n = jsdate.getMonth( )+1;
        }
        return dto.n;
    }
    // Full year; e.g. 1980...2010
    ,Y: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('Y') ) 
        {
            dto.Y = jsdate.getFullYear( );
        }
        return dto.Y;
    }
    // Day of week; 0[Sun]..6[Sat]
    ,w: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('w') ) 
        {
            dto.w = jsdate.getDay( );
        }
        return dto.w;
    }
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    ,N: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('N') ) 
        {
            dto.N = date_formatters.w(jsdate, locale, dto)||7;
        }
        return dto.N;
    }
    // Day of month w/leading 0; 01..31
    ,d: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('d') ) 
        {
            dto.d = pad(date_formatters.j(jsdate, locale, dto), 2, '0');
        }
        return dto.d;
    }
    // Shorthand day name; Mon...Sun
    ,D: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('D') ) 
        {
            dto.D = locale.day_short[ date_formatters.w(jsdate, locale, dto) ];
        }
        return dto.D;
    }
    // Full day name; Monday...Sunday
    ,l: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('l') ) 
        {
            dto.l = locale.day[ date_formatters.w(jsdate, locale, dto) ];
        }
        return dto.l;
    }
    // Ordinal suffix for day of month; st, nd, rd, th
    ,S: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('S') ) 
        {
            var j = date_formatters.j(jsdate, locale, dto), jmod10 = dto.jmod10;
            dto.S = locale.ordinal.ord[ j ] ? locale.ordinal.ord[ j ] : (locale.ordinal.ord[ jmod10 ] ? locale.ordinal.ord[ jmod10 ] : locale.ordinal.nth);
        }
        return dto.S;
    }
    // Day of year; 0..365
    ,z: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('z') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,m = date_formatters.n(jsdate, locale, dto)
            ,j = date_formatters.j(jsdate, locale, dto);
            dto.z = round((new Date(Y, m-1, j) - new Date(Y, 0, 1)) / 864e5);
        }
        return dto.z;
    }
    // ISO-8601 week number
    ,W: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('W') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,m = date_formatters.n(jsdate, locale, dto)
            ,N = date_formatters.N(jsdate, locale, dto)
            ,j = date_formatters.j(jsdate, locale, dto);
            dto.W = pad(1 + round((new Date(Y, m-1, j - N + 3) - new Date(Y, 0, 4)) / 864e5 / 7), 2, '0');
        }
        return dto.W;
    }
    // Full month name; January...December
    ,F: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('F') ) 
        {
            var m = date_formatters.n(jsdate, locale, dto);
            dto.F = locale.month[ m-1 ];
        }
        return dto.F;
    }
    // Month w/leading 0; 01...12
    ,m: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('m') ) 
        {
            var n = date_formatters.n(jsdate, locale, dto);
            dto.m = pad(n, 2, '0');
        }
        return dto.m;
    }
    // Shorthand month name; Jan...Dec
    ,M: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('M') ) 
        {
            var m = date_formatters.n(jsdate, locale, dto);
            dto.M = locale.month_short[ m-1 ];
        }
        return dto.M;
    }
    // Days in month; 28...31
    ,t: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('t') ) 
        {
            var m = date_formatters.n(jsdate, locale, dto), Y = date_formatters.Y(jsdate, locale, dto);
            dto.t = (new Date(Y, m, 0)).getDate( );
        }
        return dto.t;
    }
    // Is leap year?; 0 or 1
    ,L: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('L') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto);
            dto.L = (Y % 4 === 0) & (Y % 100 !== 0) | (Y % 400 === 0);
        }
        return dto.L;
    }
    // ISO-8601 year
    ,o: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('o') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto), m = date_formatters.n(jsdate, locale, dto),
                W = date_formatters.W(jsdate, locale, dto);
            dto.o = Y + (12 === m && W < 9 ? 1 : (1 === m && W > 9 ? -1 : 0));
        }
        return dto.o;
    }
    // Last two digits of year; 00...99
    ,y: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('y') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto);
            dto.y = Y.toString( ).slice(-2);
        }
        return dto.y;
    }
    // am or pm
    ,a: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('a') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.a = G > 11 ? locale.meridian.pm : locale.meridian.am;
        }
        return dto.a;
    }
    // AM or PM
    ,A: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('A') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.A = G > 11 ? locale.meridian.PM : locale.meridian.AM;
        }
        return dto.A;
    }
    // Swatch Internet time; 000..999
    ,B: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('B') ) 
        {
            dto.B = pad(floor((jsdate.getUTCHours( ) * 36e2 + jsdate.getUTCMinutes( ) * 60 + jsdate.getUTCSeconds( ) + 36e2) / 86.4) % 1e3, 3, '0');
        }
        return dto.B;
    }
    // 12-Hours; 1..12
    ,g: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('g') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.g = (G % 12) || 12;
        }
        return dto.g;
    }
    // 12-Hours w/leading 0; 01..12
    ,h: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('h') ) 
        {
            var g = date_formatters.g(jsdate, locale, dto);
            dto.h = pad(g, 2, '0');
        }
        return dto.h;
    }
    // 24-Hours w/leading 0; 00..23
    ,H: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('H') ) 
        {
            var G = date_formatters.G(jsdate, locale, dto);
            dto.H = pad(G, 2, '0');
        }
        return dto.H;
    }
    // Minutes w/leading 0; 00..59
    ,i: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('i') ) 
        {
            dto.i = pad(jsdate.getMinutes( ), 2, '0');
        }
        return dto.i;
    }
    // Seconds w/leading 0; 00..59
    ,s: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('s') ) 
        {
            dto.s = pad(jsdate.getSeconds( ), 2, '0');
        }
        return dto.s;
    }
    // Microseconds; 000000-999000
    ,u: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('u') ) 
        {
            dto.u = pad(jsdate.getMilliseconds( ) * 1000, 6, '0');
        }
        return dto.u;
    }
    // Timezone identifier; e.g. Atlantic/Azores, ...
    // The following works, but requires inclusion of the very large
    // timezone_abbreviations_list() function.
    /*              return that.date_default_timezone_get();
    */
    ,e: function( jsdate, locale, dto ) {
        return '';
    }
    // DST observed?; 0 or 1
    ,I: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('I') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto);
            dto.I = ((new Date(Y, 0) - Date.UTC(Y, 0)) !== (new Date(Y, 6) - Date.UTC(Y, 6))) ? 1 : 0;
        }
        return dto.I;
    }
    // Difference to GMT in hour format; e.g. +0200
    ,O: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('O') ) 
        {
            var tzo = jsdate.getTimezoneOffset( ), atzo = abs(tzo);
            dto.O = (tzo > 0 ? "-" : "+") + pad(floor(atzo / 60) * 100 + atzo % 60, 4, '0');
        }
        return dto.O;
    }
    // Difference to GMT w/colon; e.g. +02:00
    ,P: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('P') ) 
        {
            var O = date_formatters.O(jsdate, locale, dto);
            dto.P = O.substr(0, 3) + ":" + O.substr(3, 2);
        }
        return dto.P;
    }
    // Timezone abbreviation; e.g. EST, MDT, ...
    ,T: function( jsdate, locale, dto ) {
        return 'UTC';
    }
    // Timezone offset in seconds (-43200...50400)
    ,Z: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('Z') ) 
        {
            dto.Z = -jsdate.getTimezoneOffset( ) * 60;
        }
        return dto.Z;
    }
    // Seconds since UNIX epoch
    ,U: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('U') ) 
        {
            dto.U = jsdate / 1000 | 0;
        }
        return dto.U;
    }
    // ISO-8601 date. 'Y-m-d\\TH:i:sP'
    ,c: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('c') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,m = date_formatters.m(jsdate, locale, dto)
            ,d = date_formatters.d(jsdate, locale, dto)
            ,T = date_formatters.T(jsdate, locale, dto)
            ,H = date_formatters.H(jsdate, locale, dto)
            ,u = date_formatters.i(jsdate, locale, dto)
            ,s = date_formatters.s(jsdate, locale, dto)
            ,P = date_formatters.P(jsdate, locale, dto);
            dto.c = [ Y,'-',m,'-',d,'\\',T,H,':',i,':',s,P ].join('');
        }
        return dto.c;
    }
    // RFC 2822 'D, d M Y H:i:s O'
    ,r: function( jsdate, locale, dto ) {
        if ( !dto[HAS]('r') ) 
        {
            var Y = date_formatters.Y(jsdate, locale, dto)
            ,M = date_formatters.M(jsdate, locale, dto)
            ,D = date_formatters.D(jsdate, locale, dto)
            ,d = date_formatters.d(jsdate, locale, dto)
            ,H = date_formatters.H(jsdate, locale, dto)
            ,u = date_formatters.i(jsdate, locale, dto)
            ,s = date_formatters.s(jsdate, locale, dto)
            ,O = date_formatters.O(jsdate, locale, dto);
            dto.r = [ D,', ',d,' ',M,' ',Y,' ',H,':',i,':',s,' ',O ].join('');
        }
        return dto.r;
    }
    },
    
    get_date_pattern = function( format, locale ) {
        locale = locale || date_locale_default;
        var re = '', f, i, l, group = 0, dto={};
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            re += date_patterns[HAS](f) ? date_patterns[f]( locale, dto ) : esc_re( f );
        }
        return new RegExp('^'+re+'$','');
    },

    get_date_parser = function( format, locale ) {
        locale = locale || date_locale_default;
        var date_pattern = get_date_pattern( format, locale ), 
            f, i, l, j, group = 0, capture = {};
        for (i=0,l=format.length; i<l; i++)
        {
            f = format.charAt( i );
            if ( date_parsers[HAS](f) )
            {
                if ( date_parsers[f] )
                {
                    if ( date_parsers[f].push )
                    {
                        for (j=0; j<date_parsers[f].length; j++)
                        {
                            if ( null === date_parsers[f][j] )
                            {
                                // just skip a group
                                ++group;
                            }
                            else
                            {
                                capture[++group] = date_parsers[f][j];
                            }
                        }
                    }
                    else
                    {
                        capture[++group] = date_parsers[f];
                    }
                }
                else
                {
                    // just skip a group
                    ++group;
                }
            }
        }
        return function( date_string ) {
            var i, r, m = date_string.match( date_pattern ), dto;
            if ( !m ) return false;
            dto = {};
            for (i=1; i<m.length; i++)
            {
                if ( capture[HAS](i) )
                {
                    r = capture[i]( m[i], locale, dto );
                    if ( false === r ) return false;
                }
            }
            return check_and_create_date( dto );
        };
    },

    get_date_formatter = function( format, locale ) {
        locale = locale || date_locale_default;
        return function( d ) {
            var formatted_datetime, f, i, l, jsdate, dto;
            if ( d.substr ) return d; // already string format, return it
            // undefined
            if ( null == d ) jsdate = new Date( );
            // JS Date
            else if ( d instanceof Date ) jsdate = new Date( d );
            // UNIX timestamp (auto-convert to int)
            else if ( "number" === typeof d ) jsdate =  new Date(d * 1000);
            formatted_datetime = '';
            dto = {};
            for (i=0,l=format.length; i<l; i++)
            {
                f = format.charAt( i );
                formatted_datetime += date_formatters[HAS](f) ? date_formatters[f]( jsdate, locale, dto ) : f;
            }
            return formatted_datetime;
        };
    },

    check_and_create_date = function( dto, defaults ) {
        var year, month, day, 
            hour, minute, second, ms,
            leap=0, days_in_month=[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
            date=null, time=null, now=new Date( );
        
        defaults = defaults || {};
        
        if ( dto[HAS]('time') ) 
        {
            time = new Date( dto.time );
            // only time given create full date from unix time
            if ( !dto[HAS]('year') && !dto[HAS]('month') && !dto[HAS]('day') ) 
                date = new Date( time );
        }
        
        if ( null === date )
        {
        if ( dto[HAS]('ms') ) ms = dto.ms;
        else if ( defaults[HAS]('ms') ) ms = defaults.ms;
        else ms = 0;
        if ( dto[HAS]('second') ) second = dto.second;
        else if ( defaults[HAS]('second') ) second = defaults.second;
        else second = 0;
        if ( dto[HAS]('minute') ) minute = dto.minute;
        else if ( defaults[HAS]('minute') ) minute = defaults.minute;
        else minute = 0;
        if ( dto[HAS]('hour') ) hour = dto.hour;
        else
        {
            if ( dto[HAS]('hour_12') )
                hour = 'pm' === dto.meridian ? 11+dto.hour_12 : dto.hour_12-1;
            else if ( defaults[HAS]('hour') ) hour = defaults.hour;
            else hour = 'pm' === dto.meridian ? 12 : 0;
        }
        
        if ( dto[HAS]('day') ) day = dto.day;
        else if ( defaults[HAS]('day') ) day = defaults.day;
        else day = now.getDate( );
        if ( dto[HAS]('month') ) month = dto.month;
        else if ( defaults[HAS]('month') ) month = defaults.month;
        else month = now.getMonth( )+1;
        if ( dto[HAS]('year') ) year = dto.year;
        else if ( defaults[HAS]('year') ) year = defaults.year;
        else year = now.getFullYear( );
        
        // http://php.net/manual/en/function.checkdate.php
        if ( 0 > ms || 999 < ms ) return false;
        if ( 0 > second || 59 < second ) return false;
        if ( 0 > minute || 59 < minute ) return false;
        if ( 0 > hour || 23 < hour ) return false;
        
        if ( 1 > year || year > 32767 ) return false;
        leap = (year%4 === 0) & (year%100 !== 0) | (year%400 === 0);
        if ( dto[HAS]('leap') && leap !== dto.leap ) return false;
        days_in_month[1]+=leap;
        if ( 1 > month || month > 12 ) return false;
        if ( 1 > day || day > days_in_month[month-1] ) return false;
        
        date = new Date(year, month-1, day, hour, minute, second, ms);
        
        if ( dto[HAS]('day_week') && dto.day_week !== date.getDay() ) return false;
        if ( dto[HAS]('day_year') && dto.day_year !== round((new Date(year, month-1, day) - new Date(year, 0, 1)) / 864e5) ) return false;
        if ( dto[HAS]('days_month') && dto.days_month !== days_in_month[month-1] ) return false;
        if ( dto[HAS]('meridian') && ((hour > 11 && 'am' === dto.meridian) || (hour <= 11 && 'pm' === dto.meridian)) ) return false;
        
        if ( null !== time )
        {
            if ( date.getFullYear() !== time.getFullYear() ) return false;
            if ( date.getMonth() !== time.getMonth() ) return false;
            if ( date.getDate() !== time.getDate() ) return false;
            if ( date.getHours() !== time.getHours() ) return false;
            if ( date.getHours() !== time.getHours() ) return false;
            if ( date.getMinutes() !== time.getMinutes() ) return false;
            if ( date.getSeconds() !== time.getSeconds() ) return false;
        }
        }
        
        return date;
    },
    
    tpl_$0_re = /\$0/g,
    
    // Validator Compositor
    VC = function VC( V ) {
        
        V.NOT = function( ) { 
            return VC(function( v, k ) { 
                return !V.call(this, v, k); 
            }); 
        };
        
        V.AND = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this;
                return V.call(self, v, k) && V2.call(self, v, k);
            }); 
        };
        
        V.OR = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this;
                return V.call(self, v, k) || V2.call(self, v, k);
            }); 
        };

        V.XOR = function( V2 ) { 
            return VC(function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return (r1 && !r2) || (r2 && !r1);
            }); 
        };
        
        V.EQ = function( V2, strict ) { 
            return VC(false !== strict
            ? function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 === r2;
            }
            : function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 == r2;
            }); 
        };
        
        V.NEQ = function( V2, strict ) { 
            return VC(false !== strict
            ? function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 !== r2;
            }
            : function( v, k ) { 
                var self = this, r1 = V.call(self, v, k), r2 = V2.call(self, v, k);
                return r1 != r2;
            }); 
        };
        
        return V;
    },
    
/**[DOC_MARKDOWN]
####Types 
**(used with Models)**

```javascript
// modelview.js type casters

[/DOC_MARKDOWN]**/
    Type = {
        
        TypeCaster: function( typecaster ){ return typecaster; }
        
        // default type casters
        ,Cast: {
/**[DOC_MARKDOWN]
// functionaly compose typeCasters, i.e final TypeCaster = TypeCaster1(TypeCaster2(...(value)))
ModelView.Type.Cast.COMPOSITE( TypeCaster1, TypeCaster2 [, ...] );

[/DOC_MARKDOWN]**/
            // composite type caster
            COMPOSITE: function( ) {
                var args = arguments;
                if ( is_type(args[ 0 ], T_ARRAY) ) args = args[ 0 ];
                return function( v, k ) {
                   var l = args.length;
                   while ( l-- ) v = args[l].call(this, v, k);
                   return v;
                };
            },
            
/**[DOC_MARKDOWN]
// cast to "eachTypeCaster" for each element in a collection (see examples)
ModelView.Type.Cast.EACH( eachTypeCaster );

[/DOC_MARKDOWN]**/
            // collection for each item type caster
            EACH: CollectionEach,
            
/**[DOC_MARKDOWN]
// cast fields of an object with a FIELDS TypeCaster
ModelView.Type.Cast.FIELDS({
    'field1': ModelView.Type.Cast.STR,
    'field2': ModelView.Type.Cast.BOOL,
    'field3': ModelView.Type.TypeCaster(function(v) { return v; }) // a custom type caster
    // etc..
});

[/DOC_MARKDOWN]**/
            // type caster for each specific field of an object
            FIELDS: function( typesPerField ) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                typesPerField = Merge( {}, typesPerField || {} );
                return function( v ) { 
                    var self = this, field, type, val, l, i;
                    for ( field in typesPerField )
                    {
                        if ( typesPerField[HAS](field) )
                        {
                            type = typesPerField[ field ]; val = v[ field ];
                            if ( type.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) val[ i ] = type.f.call( self, val[ i ] );
                               v[ field ] = val;
                            }
                            else
                            {
                                v[ field ] = type.call( self, val );
                            }
                        }
                    }
                    return v;
                }; 
            },
            
/**[DOC_MARKDOWN]
// cast to defaultValue if value not set or empty string
ModelView.Type.Cast.DEFAULT( defaultValue );

[/DOC_MARKDOWN]**/
            DEFAULT: function( defaultValue ) {  
                return function( v ) { 
                    var T = get_type( v );
                    if ( (T_UNDEF & T) || ((T_STR & T) && !trim(v).length)  ) v = defaultValue;
                    return v;
                }; 
            },
/**[DOC_MARKDOWN]
// cast to boolean
ModelView.Type.Cast.BOOL;

[/DOC_MARKDOWN]**/
            BOOL: function( v ) { 
                // handle string representation of booleans as well
                if ( is_type(v, T_STR) && v.length )
                {
                    var vs = v.toLowerCase( );
                    return "true" === vs || "on" === vs || "1" === vs;
                }
                return !!v; 
            },
/**[DOC_MARKDOWN]
// cast to integer
ModelView.Type.Cast.INT;

[/DOC_MARKDOWN]**/
            INT: function( v ) { 
                // convert NaN to 0 if needed
                return parseInt(v, 10) || 0;
            },
/**[DOC_MARKDOWN]
// cast to float
ModelView.Type.Cast.FLOAT;

[/DOC_MARKDOWN]**/
            FLOAT: function( v ) { 
                // convert NaN to 0 if needed
                return parseFloat(v, 10) || 0;
            },
/**[DOC_MARKDOWN]
// min if value is less than
ModelView.Type.Cast.MIN( min );

[/DOC_MARKDOWN]**/
            MIN: function( m ) {  
                return function( v ) { return (v < m) ? m : v; }; 
            },
/**[DOC_MARKDOWN]
// max if value is greater than
ModelView.Type.Cast.MAX( max );

[/DOC_MARKDOWN]**/
            MAX: function( M ) {  
                return function( v ) { return (v > M) ? M : v; }; 
            },
/**[DOC_MARKDOWN]
// clamp between min-max (included)
ModelView.Type.Cast.CLAMP( min, max );

[/DOC_MARKDOWN]**/
            CLAMP: function( m, M ) {  
                // swap
                if ( m > M ) { var tmp = M; M = m; m = tmp; }
                return function( v ) { return (v < m) ? m : ((v > M) ? M : v); }; 
            },
/**[DOC_MARKDOWN]
// cast to trimmed string of spaces
ModelView.Type.Cast.TRIM;

[/DOC_MARKDOWN]**/
            TRIM: function( v ) { 
                return trim(Str(v));
            },
/**[DOC_MARKDOWN]
// cast to lowercase string
ModelView.Type.Cast.LCASE;

[/DOC_MARKDOWN]**/
            LCASE: function( v ) { 
                return Str(v).toLowerCase( );
            },
/**[DOC_MARKDOWN]
// cast to uppercase string
ModelView.Type.Cast.UCASE;

[/DOC_MARKDOWN]**/
            UCASE: function( v ) { 
                return Str(v).toUpperCase( );
            },
/**[DOC_MARKDOWN]
// cast to padded string (pad type can be "L"=LEFT, "R"=RIGHT, "LR"=LEFT-RIGHT)
ModelView.Type.Cast.PAD(pad_char, pad_size, pad_type="L");

[/DOC_MARKDOWN]**/
            PAD: function( pad_char, pad_size, pad_type ) { 
                pad_type = pad_type || 'L';
                return function( v ) {
                    var vs = Str(v), len = vs.length, n = pad_size-len, l, r;
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
                };
            },
/**[DOC_MARKDOWN]
// cast to string
ModelView.Type.Cast.STR;

[/DOC_MARKDOWN]**/
            STR: function( v ) { 
                return (''+v); 
            },
/**[DOC_MARKDOWN]
// cast to (localised) datetime-formatted string [datetime php formats](http://php.net/manual/en/function.date.php)
ModelView.Type.Cast.DATETIME( format="Y-m-d H:i:s", locale=default_locale );

// default locale is:
 
{
    meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
    ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
    timezone: [ 'UTC','EST','MDT' ],
    timezone_short: [ 'UTC','EST','MDT' ],
    day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
    day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
    month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
    month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
}

[/DOC_MARKDOWN]**/
            DATETIME: function( format, locale ) {
                return get_date_formatter( format || "Y-m-d H:i:s", locale || date_locale_default );
            },
/**[DOC_MARKDOWN]
// cast to formatted output based on given template
ModelView.Type.Cast.FORMAT( String | ModelView.Tpl | Function tpl );

[/DOC_MARKDOWN]**/
            FORMAT: function( tpl ) {
                if ( is_type(tpl, T_STR) ) 
                {
                    tpl = new Tpl(tpl, tpl_$0_re);
                    return function( v ) { return tpl.render( {$0:v} ); };
                }
                else if ( tpl instanceof Tpl ) 
                    return function( v ) { return tpl.render( v ); };
                else if ( is_type(tpl, T_FUNC) ) 
                    return function( v ) { return tpl( v ); };
                else return function( v ) { return Str(v); };
            }
        }
        
/**[DOC_MARKDOWN]
// add a custom typecaster
ModelView.Type.add( name, typeCaster );

[/DOC_MARKDOWN]**/
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Type.Cast[ type ] = handler;
            return Type;
        }
        
/**[DOC_MARKDOWN]
// delete custom typecaster
ModelView.Type.del( name );

[/DOC_MARKDOWN]**/
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Type.Cast[HAS]( type ) ) delete Type.Cast[ type ];
            return Type;
        }
    
        ,toString: function( ) {
            return '[ModelView.Type]';
        }
    },
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
    
/**[DOC_MARKDOWN]
####Validators 
**(used with Models)**

```javascript
// modelview.js validators

[/DOC_MARKDOWN]**/
    Validation = {
        
        Validator: VC
        
        // default validators
        ,Validate: {
/**[DOC_MARKDOWN]
// validate each element in a collection using "eachValidator"
ModelView.Validation.Validate.EACH( eachValidator );

[/DOC_MARKDOWN]**/
            // collection for each item validator
            EACH: CollectionEach,
            
/**[DOC_MARKDOWN]
// validate fields of an object with a FIELDS Validator
ModelView.Validation.Validate.FIELDS({
    'field1': ModelView.Validation.Validate.GREATER_THAN( 0 ),
    'field2': ModelView.Validation.Validate.BETWEEN( v1, v2 ),
    'field3': ModelView.Validation.Validator(function(v) { return true; }) // a custom validator
    // etc..
});

[/DOC_MARKDOWN]**/
            // validator for each specific field of an object
            FIELDS: function( validatorsPerField ) {
                //var notbinded = true;
                // http://jsperf.com/function-calls-direct-vs-apply-vs-call-vs-bind/48
                validatorsPerField = Merge( {}, validatorsPerField || {} );
                return VC(function( v ) { 
                    var self = this, field, validator, val, l, i;
                    for ( field in validatorsPerField )
                    {
                        if ( validatorsPerField[HAS](field) )
                        {
                            validator = validatorsPerField[ field ]; val = v[ field ];
                            if ( validator.fEach && is_type(val, T_ARRAY) )
                            {
                               l = val.length;
                               for (i=0; i<l; i++) if ( !validator.f.call( self, val[ i ] ) )  return false;
                            }
                            else
                            {
                                if ( !validator.call( self, val ) ) return false;
                            }
                        }
                    }
                    return true;
                }); 
            },

/**[DOC_MARKDOWN]
// validate (string) is numeric
ModelView.Validation.Validate.NUMERIC;

[/DOC_MARKDOWN]**/
            NUMERIC: VC(function( v ) { 
                return is_numeric( v ); 
            }),
/**[DOC_MARKDOWN]
// validate (string) empty (can be used as optional)
ModelView.Validation.Validate.EMPTY;

[/DOC_MARKDOWN]**/
            EMPTY: VC(function( v ){
                return !v || !trim(Str(v)).length;
            }),
/**[DOC_MARKDOWN]
// validate (string) not empty
ModelView.Validation.Validate.NOT_EMPTY;

[/DOC_MARKDOWN]**/
            NOT_EMPTY: VC(function( v ) { 
                return !!( v && (0 < trim(Str(v)).length) ); 
            }),
/**[DOC_MARKDOWN]
// validate (string) maximum length
ModelView.Validation.Validate.MAXLEN( len=0 );

[/DOC_MARKDOWN]**/
            MAXLEN: function( len ) {
                return VC(newFunc("v", "return v.length <= "+(len||0)+";")); 
            },
/**[DOC_MARKDOWN]
// validate (string) minimum length
ModelView.Validation.Validate.MINLEN( len=0 );

[/DOC_MARKDOWN]**/
            MINLEN: function( len ) {
                return VC(newFunc("v", "return v.length >= "+(len||0)+";")); 
            },
/**[DOC_MARKDOWN]
// validate value matches regex pattern
ModelView.Validation.Validate.MATCH( regex );

[/DOC_MARKDOWN]**/
            MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return regex_pattern.test( v ); }); 
            },
/**[DOC_MARKDOWN]
// validate value not matches regex pattern
ModelView.Validation.Validate.NOT_MATCH( regex );

[/DOC_MARKDOWN]**/
            NOT_MATCH: function( regex_pattern ) { 
                return VC(function( v ) { return !regex_pattern.test( v ); }); 
            },
/**[DOC_MARKDOWN]
// validate equal to value (or model field)
ModelView.Validation.Validate.EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "===" : "==")+" v;")); 
                return false !== strict 
                    ? VC(function( v ) { return val === v; })
                    : VC(function( v ) { return val == v; })
                ; 
            },
/**[DOC_MARKDOWN]
// validate not equal to value (or model field)
ModelView.Validation.Validate.NOT_EQUAL( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            NOT_EQUAL: function( val, strict ) { 
                if ( is_instance(val, ModelField) ) 
                    return VC(newFunc("v", "return this.$data."+val.f+" "+(false !== strict ? "!==" : "!=")+" v;"));
                return false !== strict 
                    ? VC(function( v ) { return val !== v; })
                    : VC(function( v ) { return val != v; })
                ; 
            },
/**[DOC_MARKDOWN]
// validate greater than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.GREATER_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            GREATER_THAN: function( m, strict ) { 
                if ( is_instance(m, ModelField) ) m = "this.$data."+m.f;
                else if ( is_type(m, T_STR) ) m = '"' + m + '"';
                return VC(newFunc("v", "return "+m+" "+(false !== strict ? "<" : "<=")+" v;")); 
            },
/**[DOC_MARKDOWN]
// validate less than (or equal if "strict" is false) to value (or model field)
ModelView.Validation.Validate.LESS_THAN( value | Model.Field("a.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            LESS_THAN: function( M, strict ) { 
                if ( is_instance(M, ModelField) ) M = "this.$data."+M.f;
                else if ( is_type(M, T_STR) ) M = '"' + M + '"';
                return VC(newFunc("v", "return "+M+" "+(false !== strict ? ">" : ">=")+" v;")); 
            },
/**[DOC_MARKDOWN]
// validate between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            BETWEEN: function( m, M, strict ) {  
                if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                
                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict 
                    ? VC(newFunc("v", "return ( "+m+" < v ) && ( "+M+" > v );"))
                    : VC(newFunc("v", "return ( "+m+" <= v ) && ( "+M+" >= v );"))
                ; 
            },
/**[DOC_MARKDOWN]
// validate not between (or equal if "strict" is false) the interval [value1, value2]
ModelView.Validation.Validate.NOT_BETWEEN( value1 | Model.Field("a.model.field"), value2 | Model.Field("another.model.field") [, strict=true] );

[/DOC_MARKDOWN]**/
            NOT_BETWEEN: function( m, M, strict ) {  
                if ( is_type(m, T_ARRAY) ) { strict = M; M = m[1]; m=m[0]; }
                
                var tmp, is_m_field = is_instance(m, ModelField), is_M_field = is_instance(M, ModelField);
                // swap
                if ( !is_m_field && !is_M_field && m > M ) { tmp = M; M = m; m = tmp; }
                m = is_m_field ? ("this.$data."+m.f) : (is_type(m, T_STR) ? ('"'+m+'"') : m);
                M = is_M_field ? ("this.$data."+M.f) : (is_type(M, T_STR) ? ('"'+M+'"') : M);
                return false !== strict 
                    ? VC(newFunc("v", "return ( "+m+" > v ) || ( "+M+" < v );"))
                    : VC(newFunc("v", "return ( "+m+" >= v ) || ( "+M+" <= v );"))
                ; 
            },
/**[DOC_MARKDOWN]
// validate value is one of value1, value2, ...
ModelView.Validation.Validate.IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
            IN: function( /* vals,.. */ ) { 
                var vals = slice.call( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return -1 < vals.indexOf( v ); 
                }); 
            },
/**[DOC_MARKDOWN]
// validate value is not one of value1, value2, ...
ModelView.Validation.Validate.NOT_IN( value1, value2 [, ...] );

[/DOC_MARKDOWN]**/
            NOT_IN: function( /* vals,.. */ ) { 
                var vals = slice.call( arguments ); 
                if ( is_type(vals[ 0 ], T_ARRAY) ) vals = vals[ 0 ];
                return VC(function( v ) { 
                    return 0 > vals.indexOf( v ); 
                }); 
            },
/**[DOC_MARKDOWN]
// validate array/collection of items contains at least 'limit' items (use optional item_filter to only filtered items)
ModelView.Validation.Validate.MIN_ITEMS( limit [, item_filter] );

[/DOC_MARKDOWN]**/
            MIN_ITEMS: function( limit, item_filter ) {
                limit = parseInt(limit, 10);
                if ( T_FUNC === get_type(item_filter) )
                    return VC(function( v ) {
                        return v.length >= limit && filter( v, item_filter ).length >= limit;
                    });
                else
                    return VC(function( v ) {
                        return v.length >= limit;
                    });
            },
/**[DOC_MARKDOWN]
// validate array/collection of items contains at maximum 'limit' items (use optional item_filter to only filtered items)
ModelView.Validation.Validate.MAX_ITEMS( limit [, item_filter] );

[/DOC_MARKDOWN]**/
            MAX_ITEMS: function( limit, item_filter ) {
                limit = parseInt(limit, 10);
                if ( T_FUNC === get_type(item_filter) )
                    return VC(function( v ) {
                        return filter( v, item_filter ).length <= limit;
                    });
                else
                    return VC(function( v ) {
                        return v.length <= limit;
                    });
            },
/**[DOC_MARKDOWN]
// validate value is valid email pattern
ModelView.Validation.Validate.EMAIL;

[/DOC_MARKDOWN]**/
            EMAIL: (function( email_pattern ){
                return VC(function( v ) { return email_pattern.test( v ); }); 
            })(/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/),
/**[DOC_MARKDOWN]
// validate value is valid url pattern (including mailto|http|https|ftp)
ModelView.Validation.Validate.URL;

[/DOC_MARKDOWN]**/
            URL: (function( url_pattern ){
                return VC(function( v ) { return url_pattern.test( v ); }); 
            })(new Regex('^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i')),
/**[DOC_MARKDOWN]
// validate (string) value is valid (localised) datetime pattern according to [format](http://php.net/manual/en/function.date.php)
ModelView.Validation.Validate.DATETIME( format="Y-m-d H:i:s", locale=default_locale );

// default locale is:
 
{
    meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' },
    ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' },
    timezone: [ 'UTC','EST','MDT' ],
    timezone_short: [ 'UTC','EST','MDT' ],
    day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ],
    day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ],
    month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ],
    month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
}

[/DOC_MARKDOWN]**/
            DATETIME: function( format, locale ) { 
                var date_parser = get_date_parser( format || "Y-m-d H:i:s", locale || date_locale_default );
                return VC(function( v ) { return false !== date_parser( v ); });
            }
        }
        
/**[DOC_MARKDOWN]
// add a custom validator
ModelView.Validation.add( name, validator );

[/DOC_MARKDOWN]**/
        ,add: function( type, handler ) {
            if ( is_type( type, T_STR ) && is_type( handler, T_FUNC ) ) 
                Validation.Validate[ type ] = is_type( handler.XOR, T_FUNC ) ? handler : VC( handler );
            return Validation;
        }
        
/**[DOC_MARKDOWN]
// delete custom validator
ModelView.Validation.del( name );

[/DOC_MARKDOWN]**/
        ,del: function( type ) {
            if ( is_type( type, T_STR ) && Validation.Validate[HAS]( type ) ) delete Validation.Validate[ type ];
            return Validation;
        }
    
        ,toString: function( ) {
            return '[ModelView.Validation]';
        }
    }
/**[DOC_MARKDOWN]

```

[/DOC_MARKDOWN]**/
;

date_parsers.c = [
     date_parsers.Y
    ,date_parsers.m
    ,date_parsers.d
    ,null
    ,date_parsers.H
    ,date_parsers.i
    ,date_parsers.s
    ,null
];
date_parsers.r = [
     date_parsers.D
    ,date_parsers.d
    ,date_parsers.M
    ,date_parsers.Y
    ,date_parsers.H
    ,date_parsers.i
    ,date_parsers.s
    ,null
];

/**[DOC_MARKDOWN]
**example**
```javascript

// example

$dom.modelview({

    id: 'view',
    
    autobind: true,
    bindAttribute: 'data-bind',
    events: [ 'change', 'click' ],
    
    model: {
        
        id: 'model',
        
        data: {
            // model data here ..
            
            mode: 'all',
            user: 'foo',
            collection: [ ]
        },
        
        types: {
            // data type-casters here ..
            
            mode: $.ModelView.Type.Cast.STR,
            user: $.ModelView.Type.Cast.STR,
            
            // support wildcard assignment of typecasters
            'collection.*': $.ModelView.Type.Cast.FIELDS({
                // type casters can be composed in an algebraic/functional way..
                
                'field1': $.ModelView.Type.Cast.COMPOSITE($.ModelView.Type.Cast.DEFAULT( "default" ), $.ModelView.Type.Cast.STR),
                
                'field2': $.ModelView.Type.Cast.BOOL
            })
            // this is equivalent to:
            //'collection': $.ModelView.Type.Cast.EACH($.ModelView.Type.Cast.FIELDS( .. ))
        },
        
        validators: {
            // data validators here ..
            
            mode: $.ModelView.Validation.Validate.IN( 'all', 'active', 'completed' ),
            
            // support wildcard assignment of validators
            'collection.*': $.ModelView.Validation.Validate.FIELDS({
                // validators can be combined (using AND/OR/NOT/XOR) in an algebraic/functional way
                
                'field1': $.ModelView.Validation.Validate.NOT_EMPTY.AND( $.ModelView.Validation.Validate.MATCH( /item\d+/ ) ),
                
                'field2': $.ModelView.Validation.Validate.BETWEEN( v1, v2 ).OR( $.ModelView.Validation.Validate.GREATER_THAN( v3 ) )
            })
            // this is equivalent to:
            //'collection': $.ModelView.Validation.Validate.EACH($.ModelView.Validation.Validate.FIELDS( .. ))
        },
        
        dependencies: {
            // data inter-dependencies (if any) here..
            
            // 'mode' field value depends on 'user' field value, e.g by a custom getter
            mode: ['user']
        }
    },
    
    actions: { 
        // custom view actions (if any) here ..
    }
});


```
[/DOC_MARKDOWN]**/
