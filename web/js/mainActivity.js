var util = require( "./util.js" );
var comments = require( "./comments.js" );

exports.load = function ( data, bundleId, setUrl ) {
  window.location.changedByProgram = true;
  if ( setUrl ) {
    window.location.hash = "!/view/" + bundleId;
  }
  window.scrollTo( 0, 0 );

  var container = $( ".detail" );
  container.removeClass( "hide" );

  $( ".close", container ).click( function () {
    container.addClass( "hide" );
  });

  $( ".title", container ).html( util.trans( data.title ) );
  $( ".icon", container ).attr( "src", data.icon );
  $( ".description", container ).html( util.trans( data.description ) );

  $( ".github", container ).hide();
  if ( data.github_url !== undefined ) {
    $( ".github", container ).show();
    $( ".github", container ).attr( "href", "https://www.github.com/" + data.github_url );
  }

  var versionData = null
  if ( util.getSugarVersion() >=
       util.sugarVersionToInt( data.minSugarVersion ) ) {
    versionData = data;
  } else {
    for ( i in data.releases ) {
       if ( util.getSugarVersion() >=
            util.sugarVersionToInt( data.releases[ i ].minSugarVersion ) ) {
         versionData = data.releases[ i ];
         break;
       }
    }
  }
  $( ".noversion" ).hide();
  if ( versionData === null ) {
    $( ".noversion" ).show();
    versionData = data;
  }

  $( ".download", container ).attr( "href", versionData.xo_url );
  if ( $( util.trans( versionData.whats_new ) ).text() ) {
    $( ".whatsnewlabel" ).show();
    $( ".whatsnew", container ).html( util.trans( versionData.whats_new ) );
  } else {
    $( ".whatsnewlabel" ).hide();
    $( ".whatsnew" ).html( "" );
  }
  $( ".minversion", container ).html( versionData.minSugarVersion );

  $( ".screenshots", container ).html( "" );
  screenshots = util.trans( versionData.screenshots );
  for ( i in screenshots ) {
    var ele = $( "<img>" );
    var imageSrc = screenshots[ i ]
    ele.addClass( "screenshot" );
    ele.attr( "src", imageSrc );
    $( ".screenshots", container ).append( ele );
  }

  if ( screenshots === "" || screenshots.length === 1 ) {
   $( ".icon", container ).hide();
  } else {
   $( ".icon", container ).show();
  }

  $( ".icon", container ).click( function () {
    var s = $( ".screenshots", container );
    s.toggleClass( "closed" );
  });

  $( ".download-devel", container ).hide();
  if ( data.xo_url_latest ) {
    $( ".download-devel", container ).show();
    $( ".download-devel", container ).attr( "href", data.xo_url_latest );
  }

  $( ".by", container).html( "" );
  for ( i in data.by ) {
    var ele = $( "<a>" );
    var person  = data.by[ i ];
    ele.attr( "href", person.page );
    ele.html( person.name );
    $( ".by", container ).append( ele );
  }

  comments.load( bundleId );
};
