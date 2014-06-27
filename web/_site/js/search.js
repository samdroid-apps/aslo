var lastQuery = "";
var lastCategory = "";
var currentCategory = "any";

var util = require( "./util.js" );

var doSearch = function () {
  term = $( "input.search" ).val().toLowerCase();

  var catTerm = "";
  if ( currentCategory !== "any" ) {
    catTerm = "CATEGORY:" + currentCategory;
  }

  if ( term === "" && catTerm === "" ) {
    $( ".activities li" ).each( function (index) {
      $( this ).show();
    });
  } else {
    if ( term.indexOf( lastQuery ) === 0 && catTerm === lastCategory) {
      // If they just appended to the query the results
      // will be a subset of what is seen now
      var ele = $( ".activities li:visible" );
    } else {
      var ele = $( ".activities li" );
    };

    var termList = ( catTerm + " " + term ).split( " " );
    console.log( termList );
    ele.each( function ( index ) {
      var ss = $( this ).data( "searchString" ) || "";
      if ( ss === "" ) {
        $( this ).hide();
      }

      var found = true;
      var i = 0;
      while ( found && i < termList.length ) {
          found = ( ss.indexOf( termList[ i ] ) !== -1 ) && found;
          i++;
      };

      if ( found ) {
        $( this ).show()
      } else {
        $( this ).hide();
      }
    });
  };
  lastCategory = catTerm;
  lastQuery = term;
};

exports.setup = function () {
  $( "input.search" ).on( "input", doSearch );

  $( ".categories i" ).click( function () {
    $( ".categories i" ).removeClass( "checked" );
    $( this ).addClass( "checked" );
    currentCategory = $( this ).attr( "filter" );
    doSearch();
  });
};

exports.makeSearchString = function ( data ) {
  catString = "";
  for ( i in ( data.categories || [] ) ) {
    catString += " CATEGORY:" + data.categories[ i ];
  }

  return util.trans( data.title ).toLowerCase() +
         "  " +
         util.trans( data.description ).toLowerCase() +
         catString;
}
