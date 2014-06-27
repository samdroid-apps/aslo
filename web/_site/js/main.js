var activityList = require( "./activityList.js" );
var mainActivity = require( "./mainActivity.js" );
var search = require( "./search.js" );
var comments = require( "./comments.js" );

var goBasedOnUrl = function () {
  if ( !window.location.hash ) {
    $( "detail" ).addClass( "hide" );
  }

  if ( window.location.hash && !window.location.changedByProgram ) {
    var testString = window.location.hash;

    var r = /!\/view\/([^\/]*)$/;
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1]
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      mainActivity.load( itemData, bundleId, false );
      return;
    }

    var r = /!\/view\/([^\/]*)\/comment=>([0-9a-zA-Z\-]*)$/;
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1]
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      mainActivity.load( itemData, bundleId, false );

      $( "body" ).data( "focusOnComment", match[2] );
    }
  }
  window.location.changedByProgram = false;
}

var dataUrl = "http://aslo-bot-master.sugarlabs.org/data.json";
$(document).ready( function () {
  if ( window.location.pathname === "/" ) {
    var list = $(".activities");
    var detail = $(".detail");

    $.ajax({
      url: dataUrl
    }).done( function ( data ) {
      $( "body" ).data( "activitiesData", data.activities );
      activityList.setup();

      goBasedOnUrl();
    });
    window.onhashchange = goBasedOnUrl;

    search.setup();
    comments.setup();
  }

  // Fix blog titles
  StyleFix.styleAttribute( $( ".activity-bg" )[0] );

});

if ( window.location.pathname === "/" ) {
i18n.init({ fallbackLng: "en" }, function(t) {
  $( "body" ).i18n();

  if ( t( "ui.search" ) !== "ui.search" ) {
    $( ".search" ).attr( "placeholder", t( "ui.search" ) );
  }

  if ( t( "ui.newCommentText" ) !== "ui.newCommentText" ) {
    $( "body" ).data( "newCommentText", t( "ui.newCommentText" ) );
  }

  var obj;
  if ( t( "comment.flag" ) !== "comment.flag" ) {
    obj = {"flag":  t( "comment.flag" ),
           "link":  t( "comment.link" ),
           "reply": t( "comment.reply" )};
  } else {
    obj = {"flag":  "Flag this comment for review",
           "link":  "Link to this comment",
           "reply": "Reply to this comment"};
  };
  $( "body" ).data( "commentIconsTitles", obj );

});
}
