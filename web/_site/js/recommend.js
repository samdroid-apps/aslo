var SERVER = "http://" + window.location.hostname + ":5002/recommend";
var MAX = 10;

var activityList = require( "./activityList.js" );

exports.r = function ( account ) {
  $.post( SERVER, { email: account.email } )
    .done( function ( data ) {

      $( ".recommended-activities-container" ).show();
      $( ".recommended-activities" ).html( "" );

      for ( i in data ) {
        item = data[ i ];
        if ( i > MAX || item.confidence <= 0) {
          return;
        }
        activityList.add( ".recommended-activities", item.bundleId );
      }
    });
};
