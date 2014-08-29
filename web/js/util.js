exports.repeatS = function (s, t) {
  var r = "";
  for ( var i = 0; i < t; i++ ) {
    r += s;
  }
  return r;
}

exports.trans = function ( obj ) {
  if ( obj === undefined || obj === null ) {
    return "";
  }

  var ul = navigator.language || navigator.userLanguage;
  if ( obj[ ul ] !== undefined ) {  // Same lang, same country
    return obj[ ul ];
  }

  for ( key in obj ) {  // Same lang, different country
    if ( obj.hasOwnProperty( key ) ) {
      if ( key.substr( 0, 2 ) == ul.substr( 0, 2 ) ) {
        return obj[ key ];
      }
    }
  }

  if ( "en-US" in obj ) {
    return obj[ "en-US" ];
  }

  for ( key in obj ) {  // Anything
    if ( obj.hasOwnProperty( key ) ) {
      return obj[ key ];
    }
  }
};

var DEFAULT_SUGAR = 86;

exports.getSugarVersion = function () {
  var r = /SugarLabs\/0\.([0-9]+)/;
  match = r.exec(navigator.userAgent);
  if ( match ) {
    return parseInt( match[1] );
  }
  return DEFAULT_SUGAR;  // Default version
}

exports.sugarVersionToInt = function ( vString ) {
  var r = /0\.([0-9]+)/;
  match = r.exec(vString);
  if ( match ) {
    return parseInt( match[1] );
  }
  return DEFAULT_SUGAR;
}
