var activitiesData = {};

var getLang = function ( obj ) {
  var ul = navigator.language || navigator.userLanguage;
  if ( obj[ ul ] !== undefined )  // Same
    return obj[ ul ];
  
  for ( key in obj )  // Same lang, different country
    if ( obj.hasOwnProperty( key ) )
      if ( key.substr( 0, 2 ) == ul.substr( 0, 2 ) )
        return obj[ key ];
  
  for ( key in obj )  // Anything
    if ( obj.hasOwnProperty( key ) )
      return obj[ key ];
};

var account = undefined;
var authServer = "http://localhost:5000"
navigator.id.watch({
  onlogin: function ( assertion ) {
    $.post( authServer + "/login", { assertion: assertion } )
      .done( function ( data ) {
        account = JSON.parse( data );
        account.code = assertion;
        commentsSetup($( ".comments .add" ).data( "bundleId" ));
      });
  },
  onlogout: function () {
    account = undefined;
  }
});
  

var commentsSetupEvents = function () {
  $( ".comments .add" ).click( function () {
    var text = $( ".comments .add-content" ).val();
    var rating = $( ".comments input[name=rating-i]:checked" ).attr( "value" );
    if ( account === undefined ) {
      navigator.id.request()
      return;
    }
    
    if ( $( ".comments .add" ).data( "bundleId" ) === undefined )
      return
      
    $.post( authServer + "/comments/post", {
          email: account.email,
          code: account.code,
          content: text,
          bundle_id: $( ".comments .add" ).data( "bundleId" ),
          rating: rating,
    } )
      .done( function ( _ ) {
        commentsSetup($( ".comments .add" ).data( "bundleId" ));
      });
  });
};

var commentsSetup = function ( bundleId ) {
  $.post( authServer + "/comments/get/" + bundleId)  // We don't want to GET cached stuff
    .done( function ( strData ) {
    var container = $( ".comments ul" );
    container.html( "" );
    
    var data = JSON.parse( strData );
    for ( i in data ) {
      var item = data[ i ];
      var ele = $( "<li>" );
      
      var img = $( "<img class='person'/>" );
      img.attr( "src", "http://www.gravatar.com/avatar/" + item.email_hash + "?d=monsterid" );
      ele.append( img );
      
      var stars = $( "<span class='star-rating'>" +
                     "<input disabled type='radio' name='rating' value='1'><i></i>" +
                     "<input disabled type='radio' name='rating' value='2'><i></i>" +
                     "<input disabled type='radio' name='rating' value='3'><i></i>" +
                     "<input disabled type='radio' name='rating' value='4'><i></i>" +
                     "<input disabled type='radio' name='rating' value='5'><i></i></span>" );
      $( "input[value=" + item.rating.toString() + "]", stars ).attr( "checked", "" );
      ele.append( stars );
      
      var text = $( "<p>" );
      text.html( item.text );
      ele.append( text );
      
      var report = $( "<button class='report'>Report</button>" );
      report.data( "id", item.id );
      report.click( function () {
        $.post( authServer + "/comments/report", { id: report.data( "id" ) } );
        $( this ).html( "Reported" );
        $( this ).attr( "disabled", "true" );
        $( this ).parent().addClass( "reported" );
      });
      ele.append( report );
      
      if ( account !== undefined ) {
        if ( md5( account.email ) === item.email_hash ) {
          ele.prependTo( $( ".comments ul" ) );
          return;
        }
      }
      ele.appendTo( $( ".comments ul" ) );
    }
  });
  
  $( ".comments .add" ).data( "bundleId", bundleId );
};

var focusOnActivity = function ( data, bundleId ) {
  window.location.hash = "!/view/" + bundleId;
  
  var container = $( ".detail" );
  container.show();
  
  $( ".title", container ).html( getLang( data.title ) );
  $( ".icon", container ).attr( "src", data.icon );
  $( ".description", container ).html( getLang( data.description ) );
  $( ".whatsnew", container ).html( getLang( data.whats_new ) );
  $( ".minversion", container ).html( data.minSugarVersion );

  $( ".github", container ).hide();
  if ( data.github_url !== undefined ) {
    $( ".github", container ).show();
    $( ".github", container ).attr( "href", "https://www.github.com/" + data.github_url );
  }

  $( ".download", container ).attr( "href", data.xo_url );

  $( ".download-devel", container ).hide();
  if ( data.xo_url_latest ) {
    $( ".download-devel", container ).show();
    $( ".download-devel", container ).attr( "href", data.xo_url_latest );
  }

  $( ".screenshots", container).html( "" );
  for ( i in getLang( data.screenshots ) ) {
    var ele = $( "<img>" );
    var imageSrc = getLang( data.screenshots )[ i ]
    ele.addClass( "screenshot" );
    ele.attr( "src", imageSrc );
    $( ".screenshots", container ).append( ele );
  }

  $( ".by", container).html( "" );
  for ( i in data.by ) {
    var ele = $( "<a>" );
    var person  = data.by[ i ];
    ele.attr( "href", person.page );
    ele.html( person.name );
    $( ".by", container ).append( ele );
  }

  commentsSetup( bundleId );
};

var setupActivityList = function () {
  for ( var key in activitiesData ) {
    if ( activitiesData.hasOwnProperty( key ) ) {
      var ele = $( "<li>" );
      var data = activitiesData[ key ];
      
      var title = $( "<h2>" +  getLang( data.title ) + "</h2>" );
      ele.append( title );
      
      $( ".activities").append( ele );
      
      ele.data( "json", data );
      ele.data( "bundleId", key );
      ele.data( "searchString", getLang( data.title ).toLowerCase() );
      ele.click( function () {
        focusOnActivity( $( this ).data( "json" ), $( this ).data( "bundleId" ) );
      });
    }
  }
};

$(document).ready( function () {
  var list = $(".activities");
  var detail = $(".detail");
  
  $.ajax({
    url: "data.json"
  }).done( function ( data ) {
    activitiesData = data.activities;
    setupActivityList();
    
    if ( window.location.hash ) {
      var bundleId = window.location.hash.substr( "!/view/".length + 1 );
      var itemData = activitiesData[ bundleId ];
      focusOnActivity( itemData, bundleId );
    }
  });
  
  var lastQuery = "";
  $( "input.search" ).on( "input", function () {
    term = $( "input.search" ).val().toLowerCase();
    if ( term === "" ) {
      $( ".activities li" ).each( function (index) {
        $( this ).show();
      });
    } else {
      if ( term.indexOf( lastQuery ) === 0 ) {
        // If they just appended to the query the results will be a subset of what is seen now
        var ele = $( ".activities li:visible" );
      } else { var ele = $( ".activities li" ); }
      ele.each( function (index) {
        ( $( this ).data( "searchString" ).indexOf( term ) !== -1 )? $( this ).show() : $( this ).hide();
      });
    }
    lastQuery = term;
  });
  
  commentsSetupEvents();
});