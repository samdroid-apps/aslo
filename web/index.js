var activitiesData = {};

var getLang = function ( obj ) {
  if ( obj === undefined )
    return "";

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
var OPTIONS = {
  siteName: "Sugar Labs Activities",
  termsOfService: "https://www.github.com/samdroid-apps/aslo/blob/master/TOS.md",
  privacyPolicy: "https://www.github.com/samdroid-apps/aslo/blob/master/PP.md"
}
navigator.id.watch({
  onlogin: function ( assertion ) {
    $.post( authServer + "/login", { assertion: assertion } )
      .done( function ( data ) {
		$( ".login" ).html( "Logged in" );
        account = JSON.parse( data );
        account.code = assertion;
		loadSuggestions();
        commentsSetup( $( ".comments .add" ).data( "bundleId" ) );
      });
  },
  onlogout: function () {
    account = undefined;
  }
});

var suggestServer = "http://localhost:5002/recommend";
var MAX_RECOMMENDED = 10;
var loadSuggestions = function () {
  $.post( suggestServer, { email: account.email } )
    .done( function ( data ) {

      $( ".recommended-activities-container" ).show();
      $( ".recommended-activities" ).html( "" );

      for ( i in data ) {
        item = data[ i ];
        if ( i > MAX_RECOMMENDED || item.confidence <= 0)
          return;
        addActivityToList( ".recommended-activities", item.bundleId );
      }
    });
};
  

var commentsSetupEvents = function () {
  $( ".comments .add" ).click( function () {
    var text = $( ".comments .add-content" ).val();
    var rating = $( ".comments input[name=rating-i]:checked" ).attr( "value" );
    if ( account === undefined ) {
      navigator.id.request(OPTIONS)
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
          lang: navigator.language || navigator.userLanguage,
    } )
      .done( function ( _ ) {
        commentsSetup($( ".comments .add" ).data( "bundleId" ));
        loadSuggestions()
      });
  });
};

var reported = "Reported";
var youCannotReply = "You can not reply to that comment as you did not make the activity (says the by data)";
var commentsSetup = function ( bundleId ) {
  $.post( authServer + "/comments/get/" + bundleId)  // We don't want to GET cached stuff
    .done( function ( strData ) {
    var container = $( ".comments ul" );
    container.html( "" );
    
    var data = JSON.parse( strData );
    data.reverse()
    for ( i in data ) {
      var item = data[ i ];
      var ele = $( "<li>" );
      
      var img = $( "<img class='person'/>" );
      img.attr( "src", "http://www.gravatar.com/avatar/" + item.email_hash + "?d=monsterid" );
      ele.append( img );
      
      var stars = $( "<span class='star-rating'>" +
                     "<input disabled type='radio' name='rating" + i + "' value='1'><i></i>" +
                     "<input disabled type='radio' name='rating" + i + "' value='2'><i></i>" +
                     "<input disabled type='radio' name='rating" + i + "' value='3'><i></i>" +
                     "<input disabled type='radio' name='rating" + i + "' value='4'><i></i>" +
                     "<input disabled type='radio' name='rating" + i + "' value='5'><i></i></span>" );
      $( "input[value=" + item.rating.toString() + "]", stars ).attr( "checked", "" );
      ele.append( stars );
      
      var text = $( "<p>" );
      text.html( item.text );
      ele.append( text );
      
      var report = $( "<i class='fa fa-flag' style='margin-right: 5px;'></i>" );
      report.data( "id", item.id );
      report.click( function () {
        $.post( authServer + "/comments/report", { id: report.data( "id" ) } );
        $( this ).html( reported );
        $( this ).attr( "disabled", "true" );
        $( this ).parent().addClass( "reported" );
      });
      ele.append( report );
      
      var reply = $("<i class='fa fa-reply'></i>");
      reply.data( "id", item.id );
      reply.data( "text", item.text );
      reply.click( function () {
        if ( account === undefined ) {
          navigator.id.request(OPTIONS);
          return;
        }
        
        var d = $( ".comment-reply-popup" );
        d.show();
        window.scrollTo( 0, 0 )
        
        $( ".comment", d ).html( $( this ).data( "text" ) );
        $( ".cancel", d ).click( function () {
          d.hide();
        });
        
        var id = $( this ).data( "id" );
        $( ".send", d ).click( function () {
          var sending = $( ".sending", d )
          sending.show()
          
          $.post( authServer + "/comments/reply", {
            email: account.email,
            code: account.code,
            content: $( ".reply", d ).val(),
            id: id
          }).always( function () {
            d.hide();
            sending.hide();
          }).fail( function () {
            alert( youCannotReply );
          });
        });
      });
      ele.append( reply );
      
      ele.appendTo( $( ".comments ul" ) );
    }
  });
  
  $( ".comments .add" ).data( "bundleId", bundleId );
};

var focusOnActivity = function ( data, bundleId ) {
  window.location.hash = "!/view/" + bundleId;
  window.scrollTo( 0, 0 );
  
  var container = $( ".detail" );
  container.removeClass( "hide" );
  
  $( ".close", container ).click( function () {
    container.addClass( "hide" );
  });
  
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

  $( ".screenshots", container ).html( "" );
  ss = getLang( data.screenshots );
  for ( i in ss ) {
    var ele = $( "<img>" );
    var imageSrc = getLang( data.screenshots )[ i ]
    ele.addClass( "screenshot" );
    ele.attr( "src", imageSrc );
    $( ".screenshots", container ).append( ele );
  }
  if ( ss === "" || ss.length === 1 ) {
   $( ".icon", container ).hide();
  } else {
   $( ".icon", container ).show();
  }
      
  
  $( ".icon", container ).click( function () {
    var s = $( ".screenshots", container );
    s.toggleClass( "closed" );
  });

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

var addActivityToList = function (container, bundleId) {
  var ele = $( "<li class='activity'>" );
  var data = activitiesData[ bundleId ];
  
  var icon = $( "<img class='icon' />" );
  icon.attr( "src", data.icon );
  ele.append( icon );
  
  var title = $( "<span class='title'>" +  getLang( data.title ) + "</span>" );
  ele.append( title );
      
  $( container ).append( ele );
      
  ele.data( "json", data );
  ele.data( "bundleId", bundleId );
  ele.data( "searchString", getLang( data.title ).toLowerCase() );
  ele.click( function () {
    focusOnActivity( $( this ).data( "json" ), $( this ).data( "bundleId" ) );
  });
}

var setupActivityList = function () {
  for ( var key in activitiesData ) {
    if ( activitiesData.hasOwnProperty( key ) ) {
      addActivityToList( ".activities", key )
    }
  }
};

var dataUrl = "http://aslo-bot-master.sugarlabs.org/data.json";
$(document).ready( function () {
  var list = $(".activities");
  var detail = $(".detail");
  
  $.ajax({
    url: dataUrl
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
  
  $( ".login" ).click( function () { navigator.id.request(OPTIONS); } )

  commentsSetupEvents();
});

i18n.init({ fallbackLng: 'en' }, function(t) {
  $( "body" ).i18n();
  
  if ( t( "ui.search" ) !== "ui.search" )
    $( ".search" ).attr( "placeholder", t( "ui.search" ) );
  
  if ( t( "reply.cannot" ) !== "reply.cannot" )
    youCannotReply = t( "reply.cannot" );
  
  if ( t( "ui.reported" ) !== "ui.reported" )
    reported = t( "ui.reported" );
});