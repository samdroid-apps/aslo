var activitiesData = {};
var myUrl = window.location.origin;
var host = window.location.hostname;

var doneAnimation = function () {
  var ele = $( "<span class='done'></span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 2000);
}

var loadingAnimation = function () {
  var ele = $( "<span class='done load'></span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 2000);
}

var newCommentText = "New Comment - Scroll Up to See";
var addCommentAnimation = function () {
  var ele = $( "<span class='new-item'>" + newCommentText + "</span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 3000);
}

var repeatS = function (s, t) {
  var r = "";
  for ( var i = 0; i < t; i++ ) {
    r += s;
  }
  return r;
}

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

  if ( "en-US" in obj )
    return obj[ "en-US" ]; 

  for ( key in obj )  // Anything
    if ( obj.hasOwnProperty( key ) )
      return obj[ key ];
};

var account = undefined;
var authServer = "http://" + host + ":5000"
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

var suggestServer = "http://" + host + ":5002/recommend";
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
    if ( account === undefined ) {
      navigator.id.request(OPTIONS)
      return;
    }


    var text = $( ".comments .add-content" ).val();
    var rating = $( ".star-sel" ).data( "selected" );
    var type = $( ".comments .types i.checked" ).attr( "value" );

    var replyContent, replyId;
    if ( type === "reply" ) {
      replyContent = $( ".comments > blockquote" ).html();
      replyId = $( ".comments > blockquote" ).data( "id" );
    }
    
    if ( $( ".comments .add" ).data( "bundleId" ) === undefined )
      return

    loadingAnimation();
    $.post( authServer + "/comments/post", {
          email: account.email,
          code: account.code,
          bundle_id: $( ".comments .add" ).data( "bundleId" ),

          content: text,
          type: type,
          rating: rating,

          lang: navigator.language || navigator.userLanguage,
          reply_content: replyContent,
          reply_id: replyId,
    } )
      .done( function ( _ ) {
        doneAnimation()
        commentsSetup($( ".comments .add" ).data( "bundleId" ));
        loadSuggestions()
      });
  });
};

var socketIOUrl = 'ws://' + host + ':9999';
var connectCommentWS = function () {
  var socket = new WebSocket( socketIOUrl );

  socket.onmessage = function ( info ) {
    var data = JSON.parse( info.data );
    console.log( data )
    if ( data.event == "add_comment" ) {
      if ( $( ".comments ul #" + event.data.id ).length == 0 ) {
        addComment( data.data );
        addCommentAnimation();
      }

    } else if ( data.event == "remove_comment" ) {
      console.log( "rm", data )
      $( ".comments ul #" + data.data ).remove();

    } else { console.log( "Unknown WS message: ", data ); };
  };
}

var focusOnComment = null;
var commentsSetup = function ( bundleId ) {
  $( ".comments > blockquote" ).hide();
  $( ".comments .types i[value=reply]" ).removeClass( "checked" );

  $.post( authServer + "/comments/get/" + bundleId)  // We don't want to GET cached stuff
    .done( function ( strData ) {
    var container = $( ".comments ul" );
    container.html( "" );
    
    var data = JSON.parse( strData );
    for ( i in data ) {
      var item = data[ i ];
      addComment( item );
    }

    if ( focusOnComment !== null ) {
        $( "html, body" ).animate( {
	      scrollTop: $( ".comments ul li#" + focusOnComment ).offset().top - 10
        }, 500 );
        focusOnComment = null
    }
  });
  
  $( ".comments .add" ).data( "bundleId", bundleId );
};

var addComment = function ( item ) {
  var ele = $( "<li>" );
  ele.attr( "id", item.id );
  
  var img = $( "<img class='person'/>" );
  img.attr( "src", "http://www.gravatar.com/avatar/" + item.email_hash + "?d=monsterid" );
  ele.append( img );
  
  var type = $( "<span class='type-icon'></span>" );
  type.addClass( item.type );
  ele.append( type );
  
  if ( item.type === "reply" ) {
    var bq = $( "<blockquote class='reply-content'>" );
    bq.html( item.reply_content );
    ele.append( bq );
  }
  
  if ( item.type === "review" || item.type === undefined ) {
    var stars = $( "<span class='stars'>" +
    repeatS( "<i class='fa fa-star'></i>", item.rating ) +
    repeatS( "<i class='fa fa-star-o'></i>", 5 - item.rating ) +
    "</span>" );
    $( "input[value=" + item.rating.toString() + "]", stars ).attr( "checked", "" );
    ele.append( stars );
  }
  
  var text = $( "<p>" );
  text.html( item.text );
  ele.append( text );
  
  var report = $( "<i class='fa fa-flag' style='margin-right: 5px;'></i>" );
  report.data( "id", item.id );
  report.click( function () {
    $.post( authServer + "/comments/report", { id: report.data( "id" ) } );
    doneAnimation();
    $( this ).attr( "disabled", "true" );
    $( this ).parent().addClass( "reported" );
  });
  ele.append( report );
  
  var link = $( "<a><i class='fa fa-link' style='margin-right: 5px;'></i></a>" );
  var bundleId = $( ".comments .add" ).data( "bundleId" );
  link.attr( "href", myUrl + "/#!/view/" + bundleId + "/comment=>" + item.id );
  link.data( "id", item.id );
  link.click( function () {
    var id = $( this ).data( "id" );
    $( "html, body" ).animate( {
      scrollTop: $( ".comments ul li#" + id ).offset().top - 10
    }, 500 );
  });
  ele.append( link )
  
  var reply = $("<i class='fa fa-reply'></i>");
  reply.data( "id", item.id );
  reply.data( "text", ele.html() );
  reply.click( function () {
    $( ".comments > blockquote" ).show();
    $( ".comments > blockquote" ).data( "id", $( this ).data( "id" ) );
    $( ".comments > blockquote" ).html(
    $( this ).data( "text" ).replace(
    /<blockquote class=\"reply-content\">.*<\/blockquote>/, "" )
    );
    $( ".comments .types i" ).removeClass( "checked" );
    $( ".comments .types i[value=reply]" ).addClass( "checked" );
    
    $( "html, body" ).animate( {
      scrollTop: $( ".comments > blockquote" ).offset().top - 10
    }, 500 );
  });
  ele.append( reply );
  
  ele.prependTo( $( ".comments ul" ) );
};

var focusOnActivity = function ( data, bundleId ) {
  window.location.changedByProgram = true;
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

var goBasedOnUrl = function () {
  if ( window.location.hash && !window.location.changedByProgram ) {
    var testString = window.location.hash;

    var r = /!\/view\/([^\/]*)$/;
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1]
      var itemData = activitiesData[ bundleId ];
      focusOnActivity( itemData, bundleId );
      return;
    }
      
    var r = /!\/view\/([^\/]*)\/comment=>([0-9a-zA-Z\-]*)$/
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1]
      var itemData = activitiesData[ bundleId ];
      focusOnActivity( itemData, bundleId );

      focusOnComment = match[2]
    }
  }
  window.location.changedByProgram = false;
}

var dataUrl = "http://aslo-bot-master.sugarlabs.org/data.json";
$(document).ready( function () {
  var list = $(".activities");
  var detail = $(".detail");
  
  $.ajax({
    url: dataUrl
  }).done( function ( data ) {
    activitiesData = data.activities;
    setupActivityList();

    goBasedOnUrl();
  });
  window.onhashchange = goBasedOnUrl;
  
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
  connectCommentWS();

  $( ".comments .types i" ).click( function () {
    $( ".comments .types i" ).removeClass( "checked" );
    $( this ).addClass( "checked" );
    var type = $( this ).attr( "value" );

    if ( type !== "reply" ) {
      $( ".comments > blockquote" ).hide();
    }

    if ( type !== "review" ) {
      $( ".comments > .star-sel" ).hide();
    } else {
      $( ".comments > .star-sel" ).show();
    }

    if ( type !== "problem" ) {
      $( ".comments > .bug-tip" ).hide();
    } else {
      $( ".comments > .bug-tip" ).show();
    }
  });

  $( ".star-sel" ).data( "selected", 1 );
  $( ".star-sel i" ).click( function () {
    var n = parseInt( $( this ).attr( "id" ) )
    $( ".star-sel" ).data( "selected", n );
  
    $( ".star-sel i" ).removeClass( "fa-star" );
    $( ".star-sel i" ).addClass( "fa-star-o" );
  
    while ( n > 0 ) {
      $( ".star-sel i#" + n ).removeClass( "fa-star-o" );
      $( ".star-sel i#" + n ).addClass( "fa-star" );
      n--;
    }
  });
});

i18n.init({ fallbackLng: "en" }, function(t) {
  $( "body" ).i18n();
  
  if ( t( "ui.search" ) !== "ui.search" )
    $( ".search" ).attr( "placeholder", t( "ui.search" ) );

  if ( t( "ui.newCommentText" ) !== "ui.newCommentText" )
    newCommentText = $( "ui.newCommentText" );
});
