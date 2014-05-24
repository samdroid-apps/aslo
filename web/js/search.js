var lastQuery = "";

var util = require( "./util.js" );

exports.setup = function () {
  $( "input.search" ).on( "input", function () {
    term = $( "input.search" ).val().toLowerCase();

    if ( term === "" ) {
      $( ".activities li" ).each( function (index) {
        $( this ).show();
      });
    } else {

      if ( term.indexOf( lastQuery ) === 0 ) {
        // If they just appended to the query the results
        // will be a subset of what is seen now
        var ele = $( ".activities li:visible" );
      } else
        var ele = $( ".activities li" );

      ele.each( function (index) {
        var found = $( this ).data( "searchString" ).indexOf( term ) !== -1
        if ( found )
          $( this ).show()
        else
          $( this ).hide();
      });
    };

    lastQuery = term;
  });
};

exports.makeSearchString = function ( data ) {
  return util.trans( data.title ).toLowerCase() +
         util.trans( data.description ).toLowerCase;
}
