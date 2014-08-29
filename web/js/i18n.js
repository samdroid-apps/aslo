/*
|======================|
| i18n VS util.getLang |
|======================|
| i18n translates the  |
| ui.  GetLang is for  |
| getting activity     |
| data in the users    |
| current language.    |
|======================|
*/

// Add avaliable languages here
var langsAvaliable = ['id'];

exports.getLangToUse = function ( langList ) {
  if ( langList === undefined ) {
    var langList = langsAvaliable;
  }

  if ( localStorage['testlang'] !== "undefined"
       && localStorage['testlang'] !== undefined ) {
    return localStorage['testlang']
  }

  var ul = navigator.language || navigator.userLanguage;

  if ( langList.indexOf( ul ) !== -1 ) {
    return ul;
  };

  for ( var i in langList ) {
    var l = langList[i];
    if ( l.substr( 0, 2 ) == ul.substr( 0, 2 ) ) {
      return l;
    };
  }

  return null;
};

exports.setup = function () {
  l = exports.getLangToUse();
  if ( l === null ) {
    return;
  };

  var url = "/translations/" + l + ".json";
  $.get( url ).done( function ( data ) {
    $( "body" ).data( "translations", data );
	translateBody( data );
  });
};

var translateBody = function ( tdata ) {
  $( "*[i18n-content]" ).each( function () {
    var e = $( this );
    if ( e.html().trim() in tdata) {
      e.html( tdata[e.html().trim()] )
    };
  });

  $( "*[i18n-title]" ).each( function () {
    var e = $( this )
    if ( e.attr( "title" ).trim() in tdata) {
      e.attr( "title", tdata[e.attr( "title" ).trim()] )
    };
  });

  $( "*[i18n-placeholder]" ).each( function () {
    var e = $( this )
    if ( e.attr( "placeholder" ).trim() in tdata) {
      e.attr( "placeholder", tdata[e.attr( "placeholder" ).trim()] )
    };
  });
};

exports.get = function ( text ) {
  var data = $( "body" ).data( "translations" );
  if ( data === undefined ) {
    return text.trim();
  }
  if ( text.trim() in data ) {
    return data[text.trim()];
  }
  return text.trim();
}
