var util = require( "./util.js" );
var mainActivity = require( "./mainActivity.js" );
var search = require( "./search.js" );
var featured = require( "./featured.js" );

exports.add = function ( container, bundleId ) {
  var ele = $( "<a class='activity'>" );

  activitiesData = $( "body" ).data( "activitiesData" );
  var data = activitiesData[ bundleId ];

  var icon = $( "<img class='icon' />" );
  icon.attr( "src", data.icon );
  ele.append( icon );

  var title = $( "<span class='title'>" +
                 util.trans( data.title ) + "</span>" );
  ele.append( title );

  $( container ).append( ele );

  var l = ( data.categories || [ "none" ] ).reverse();
  ele.addClass( "category-" + l[ 1 ] );

  ele.attr( "href", "/view/" + bundleId );

  ele.data( "json", data );
  ele.data( "bundleId", bundleId );
  ele.data( "searchString", search.makeSearchString( data ) );
  ele.click( function ( e ) {
    e.preventDefault();
    mainActivity.downloadAndLoad(
      $( this ).data( "json" ), $( this ).data( "bundleId" ), true );
  });
}

exports.setup = function () {
  activitiesData = $( "body" ).data( "activitiesData" );

  for ( var key in activitiesData ) {
    if ( activitiesData.hasOwnProperty( key ) ) {
      exports.add( ".activities", key );
    }
  }

  featured.load( $( "body" ).data( "featuredData" ), activitiesData )
};
