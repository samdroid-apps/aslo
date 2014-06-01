var util = require( "./util.js" );
var mainActivity = require( "./mainActivity.js" );
var search = require( "./search.js" );

exports.add = function ( container, bundleId ) {
  var ele = $( "<li class='activity'>" );

  activitiesData = $( "body" ).data( "activitiesData" );
  var data = activitiesData[ bundleId ];
  
  var icon = $( "<img class='icon' />" );
  icon.attr( "src", data.icon );
  ele.append( icon );
  
  var title = $( "<span class='title'>" + 
                 util.trans( data.title ) + "</span>" );
  ele.append( title );
      
  $( container ).append( ele );

  var l = data.categories || [];
  for ( i in l )
    ele.addClass( "category-" + data.categories[i] );
      
  ele.data( "json", data );
  ele.data( "bundleId", bundleId );
  ele.data( "searchString", search.makeSearchString( data ) );
  ele.click( function () {
    mainActivity.load( $( this ).data( "json" ), $( this ).data( "bundleId" ) );
  });
}

exports.setup = function () {
  activitiesData = $( "body" ).data( "activitiesData" );

  for ( var key in activitiesData ) {
    if ( activitiesData.hasOwnProperty( key ) ) {
      exports.add( ".activities", key )
    }
  }
};
