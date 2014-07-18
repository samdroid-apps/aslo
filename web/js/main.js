var activityList = require( "./activityList.js" );
var mainActivity = require( "./mainActivity.js" );
var search = require( "./search.js" );
var comments = require( "./comments.js" );
var login = require( "./login.js" );
var i18n = require( "./i18n.js" );
i18n.setup()

var goBasedOnUrl = function () {
  if ( $( "body" ).data( "oldPathname" ) === window.location.pathname ) {
    return;
  } else {
    $( "body" ).data( "oldPathname", window.location.pathname );
  }

  if ( !window.location.pathname || window.location.pathname === "/" ) {
    document.title = i18n.get( "Sugar Activities" );
    var container = $( ".detail" );
    container.addClass( "hide" );
  }

  if ( window.location.pathname && !window.location.changedByProgram ) {
    var testString = window.location.pathname;

    var r = /\/view\/([^\/]*)$/;
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1];
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      mainActivity.load( itemData, bundleId, false );
      return;
    }

    var r = /\/view\/([^\/]*)\/comment=([0-9a-zA-Z\-]*)$/;
    match = r.exec(testString);
    if ( match ) {
      $( "body" ).data( "focusOnComment", match[2] );

      var bundleId = match[1];
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      mainActivity.load( itemData, bundleId, false );
    }
  }
  window.location.changedByProgram = false;
}

var dataUrl = "/data.json";
$( document ).ready( function () {
  if ( window.location.pathname === "/"
       || window.location.pathname.startsWith( "/view" ) ) {
    var list = $(".activities");
    var detail = $(".detail");

    $.ajax({
      url: dataUrl
    }).done( function ( data ) {
      $( "body" ).data( "activitiesData", data.activities );
      activityList.setup();

      goBasedOnUrl();
      setInterval( goBasedOnUrl, 750 );
    });

    search.setup();
    login.setup();
    comments.setup();
  }

  // Fix blog titles
  StyleFix.styleAttribute( $( ".activity-bg" )[0] );

});
