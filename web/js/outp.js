(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./mainActivity.js":5,"./search.js":7,"./util.js":8}],2:[function(require,module,exports){
exports.done = function () {
  var ele = $( "<span class='done'></span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 2000);
}

exports.loading = function () {
  var ele = $( "<span class='done load'></span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 2000);
}

var defaultNewCommentText = "New Comment - Scroll Up to See";
exports.addComment = function () {
  var ele = $( "<span class='new-item'>" +
               $( "body" ).data( "newCommentText" ) || defaultNewCommentText +
               "</span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 3000);
}

},{}],3:[function(require,module,exports){
var account = undefined;
var SERVER = "http://" + window.location.hostname + ":5000";
var WS_SERVER = 'ws://' + window.location.hostname + ':9999';
var OPTIONS = {
  siteName:
    "Sugar Labs Activities",
  termsOfService:
    "https://www.github.com/samdroid-apps/aslo/blob/master/TOS.md",
  privacyPolicy:
    "https://www.github.com/samdroid-apps/aslo/blob/master/PP.md"
}

var animations = require( "./animations.js" );
var util = require( "./util.js" );
var recommend = require( "./recommend.js" );

navigator.id.watch({
  onlogin: function ( assertion ) {
    $.post( SERVER + "/login", { assertion: assertion } )
      .done( function ( data ) {
		$( ".login" ).html( "Logged in" );
        account = JSON.parse( data );
        account.code = assertion;
		recommend.r( account );
      });
  },
  onlogout: function () {
    account = undefined;
  }
});

exports.setup = function () {
  $( ".login" ).click( function () { navigator.id.request(OPTIONS); } )

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

    animations.loading();
    $.post( SERVER + "/comments/post", {
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
        animations.done();
        commentsSetup($( ".comments .add" ).data( "bundleId" ));
        recommend.r( account );
      });
  });

  connectCommentWS();
  setupSelectors();
};

var connectCommentWS = function () {
  var socket = new WebSocket( WS_SERVER );

  socket.onmessage = function ( info ) {
    var data = JSON.parse( info.data );
    console.log( data )
    if ( data.event == "add_comment" ) {
      if ( $( ".comments ul #" + data.data.id ).length == 0 ) {
        addComment( data.data );
        animations.addComment();
      }

    } else if ( data.event == "remove_comment" ) {
      console.log( "rm", data )
      $( ".comments ul #" + data.data ).remove();

    } else { console.log( "Unknown WS message: ", data ); };
  };
};

var setupSelectors = function () {
  $( ".comments .types i" ).click( function () {
    $( ".comments .types i" ).removeClass( "checked" );
    $( this ).addClass( "checked" );
    var type = $( this ).attr( "value" );

    if ( type !== "reply" ) {
      $( ".comments > blockquote" ).hide();
      $( ".comments .types i[value=reply]" ).removeClass( "checked" ).hide();
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
};

exports.load = function ( bundleId ) {
  $( ".comments > blockquote" ).hide();
  $( ".comments .types i[value=reply]" ).removeClass( "checked" ).hide();

  $.post( SERVER + "/comments/get/" + bundleId)  // We don't want to GET cached stuff
    .done( function ( strData ) {
    var container = $( ".comments ul" );
    container.html( "" );
    
    var data = JSON.parse( strData );
    for ( i in data ) {
      var item = data[ i ];
      addComment( item );
    }

    var focusOn = $( "body" ).data( "focusOnComment" );
    if ( focusOn !== undefined ) {
        $( "html, body" ).animate( {
	      scrollTop: $( ".comments ul li#" + focusOn ).offset().top - 10
        }, 500 );
        focusOn = null
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
    util.repeatS( "<i class='fa fa-star'></i>", item.rating ) +
    util.repeatS( "<i class='fa fa-star-o'></i>", 5 - item.rating ) +
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
    $.post( SERVER + "/comments/report", { id: report.data( "id" ) } );
    animations.done();
    $( this ).attr( "disabled", "true" );
    $( this ).parent().addClass( "reported" );
  });
  ele.append( report );
  
  var link = $( "<a><i class='fa fa-link' style='margin-right: 5px;'></i></a>" );
  var bundleId = $( ".comments .add" ).data( "bundleId" );
  link.attr( "href", "/#!/view/" + bundleId + "/comment=>" + item.id );
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
    $( ".comments > .star-sel" ).hide();
    $( ".comments > .bug-tip" ).hide();

    $( ".comments > blockquote" ).show();
    $( ".comments > blockquote" ).data( "id", $( this ).data( "id" ) );
    $( ".comments > blockquote" ).html(
      $( this ).data( "text" ).replace(
        /<blockquote class=\"reply-content\">.*<\/blockquote>/, "" )
    );

    $( ".comments .types i" ).removeClass( "checked" );
    $( ".comments .types i[value=reply]" ).addClass( "checked" ).show();
    
    $( "html, body" ).animate( {
      scrollTop: $( ".comments > blockquote" ).offset().top - 10
    }, 500 );
  });
  ele.append( reply );
  
  ele.prependTo( $( ".comments ul" ) );
};

},{"./animations.js":2,"./recommend.js":6,"./util.js":8}],4:[function(require,module,exports){
var activityList = require( "./activityList.js" );
var mainActivity = require( "./mainActivity.js" );
var search = require( "./search.js" );
var comments = require( "./comments.js" );

var goBasedOnUrl = function () {
  if ( window.location.hash && !window.location.changedByProgram ) {
    var testString = window.location.hash;

    var r = /!\/view\/([^\/]*)$/;
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1]
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      mainActivity.load( itemData, bundleId );
      return;
    }
      
    var r = /!\/view\/([^\/]*)\/comment=>([0-9a-zA-Z\-]*)$/
    match = r.exec(testString);
    if ( match ) {
      var bundleId = match[1]
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      focusOnActivity( itemData, bundleId );

      $( "body" ).data( "focusOnComment", match[2] );
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
    $( "body" ).data( "activitiesData", data.activities );
    activityList.setup();

    goBasedOnUrl();
  });
  window.onhashchange = goBasedOnUrl;
  
  search.setup();
  comments.setup();
});

i18n.init({ fallbackLng: "en" }, function(t) {
  $( "body" ).i18n();
  
  if ( t( "ui.search" ) !== "ui.search" )
    $( ".search" ).attr( "placeholder", t( "ui.search" ) );

  if ( t( "ui.newCommentText" ) !== "ui.newCommentText" )
    $( "body" ).data( "newCommentText", t( "ui.newCommentText" ) );
});

},{"./activityList.js":1,"./comments.js":3,"./mainActivity.js":5,"./search.js":7}],5:[function(require,module,exports){
var util = require( "./util.js" );
var comments = require( "./comments.js" );

exports.load = function ( data, bundleId ) {
  window.location.changedByProgram = true;
  window.location.hash = "!/view/" + bundleId;
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
  if ( versionData.whats_new ) {
    $( ".whatsnewlabel" ).show();
    $( ".whatsnew", container ).html( util.trans( versionData.whats_new ) );
  } else {
    $( ".whatsnewlabel" ).hide();
  }
  $( ".minversion", container ).html( versionData.minSugarVersion );

  $( ".screenshots", container ).html( "" );
  ss = util.trans( versionData.screenshots );
  for ( i in ss ) {
    var ele = $( "<img>" );
    var imageSrc = util.trans( versionData.screenshots )[ i ]
    ele.addClass( "screenshot" );
    ele.attr( "src", imageSrc );
    $( ".screenshots", container ).append( ele );
  }

  $( ".download-devel", container ).hide();
  if ( data.xo_url_latest ) {
    $( ".download-devel", container ).show();
    $( ".download-devel", container ).attr( "href", data.xo_url_latest );
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

  comments.load( bundleId );
};

},{"./comments.js":3,"./util.js":8}],6:[function(require,module,exports){
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
        if ( i > MAX || item.confidence <= 0)
          return;
        activityList.add( ".recommended-activities", item.bundleId );
      }
    });
};

},{"./activityList.js":1}],7:[function(require,module,exports){
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

},{"./util.js":8}],8:[function(require,module,exports){
exports.repeatS = function (s, t) {
  var r = "";
  for ( var i = 0; i < t; i++ ) {
    r += s;
  }
  return r;
}

exports.trans = function ( obj ) {
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

exports.getSugarVersion = function () {
  var r = /SugarLabs\/0\.([0-9]+)/
  match = r.exec(navigator.userAgent);
  if ( match )
    return parseInt( match[1] );
  return 86;  // Default version
}

exports.sugarVersionToInt = function ( vString ) {
  var r = /0\.([0-9]+)/
  match = r.exec(vString);
  if ( match )
    return parseInt( match[1] );
  return 86;
}

},{}]},{},[4])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvdXNyL2xpYi9ub2RlX21vZHVsZXMvd2F0Y2hpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Jyb3dzZXItcGFjay9fcHJlbHVkZS5qcyIsIi9ob21lL3NhbS9yZW1vdGVBc2xvV2ViL2pzL2FjdGl2aXR5TGlzdC5qcyIsIi9ob21lL3NhbS9yZW1vdGVBc2xvV2ViL2pzL2FuaW1hdGlvbnMuanMiLCIvaG9tZS9zYW0vcmVtb3RlQXNsb1dlYi9qcy9jb21tZW50cy5qcyIsIi9ob21lL3NhbS9yZW1vdGVBc2xvV2ViL2pzL21haW4uanMiLCIvaG9tZS9zYW0vcmVtb3RlQXNsb1dlYi9qcy9tYWluQWN0aXZpdHkuanMiLCIvaG9tZS9zYW0vcmVtb3RlQXNsb1dlYi9qcy9yZWNvbW1lbmQuanMiLCIvaG9tZS9zYW0vcmVtb3RlQXNsb1dlYi9qcy9zZWFyY2guanMiLCIvaG9tZS9zYW0vcmVtb3RlQXNsb1dlYi9qcy91dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpfXZhciBmPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChmLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGYsZi5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgdXRpbCA9IHJlcXVpcmUoIFwiLi91dGlsLmpzXCIgKTtcbnZhciBtYWluQWN0aXZpdHkgPSByZXF1aXJlKCBcIi4vbWFpbkFjdGl2aXR5LmpzXCIgKTtcbnZhciBzZWFyY2ggPSByZXF1aXJlKCBcIi4vc2VhcmNoLmpzXCIgKTtcblxuZXhwb3J0cy5hZGQgPSBmdW5jdGlvbiAoIGNvbnRhaW5lciwgYnVuZGxlSWQgKSB7XG4gIHZhciBlbGUgPSAkKCBcIjxsaSBjbGFzcz0nYWN0aXZpdHknPlwiICk7XG5cbiAgYWN0aXZpdGllc0RhdGEgPSAkKCBcImJvZHlcIiApLmRhdGEoIFwiYWN0aXZpdGllc0RhdGFcIiApO1xuICB2YXIgZGF0YSA9IGFjdGl2aXRpZXNEYXRhWyBidW5kbGVJZCBdO1xuICBcbiAgdmFyIGljb24gPSAkKCBcIjxpbWcgY2xhc3M9J2ljb24nIC8+XCIgKTtcbiAgaWNvbi5hdHRyKCBcInNyY1wiLCBkYXRhLmljb24gKTtcbiAgZWxlLmFwcGVuZCggaWNvbiApO1xuICBcbiAgdmFyIHRpdGxlID0gJCggXCI8c3BhbiBjbGFzcz0ndGl0bGUnPlwiICsgXG4gICAgICAgICAgICAgICAgIHV0aWwudHJhbnMoIGRhdGEudGl0bGUgKSArIFwiPC9zcGFuPlwiICk7XG4gIGVsZS5hcHBlbmQoIHRpdGxlICk7XG4gICAgICBcbiAgJCggY29udGFpbmVyICkuYXBwZW5kKCBlbGUgKTtcbiAgICAgIFxuICBlbGUuZGF0YSggXCJqc29uXCIsIGRhdGEgKTtcbiAgZWxlLmRhdGEoIFwiYnVuZGxlSWRcIiwgYnVuZGxlSWQgKTtcbiAgZWxlLmRhdGEoIFwic2VhcmNoU3RyaW5nXCIsIHNlYXJjaC5tYWtlU2VhcmNoU3RyaW5nKCBkYXRhICkgKTtcbiAgZWxlLmNsaWNrKCBmdW5jdGlvbiAoKSB7XG4gICAgbWFpbkFjdGl2aXR5LmxvYWQoICQoIHRoaXMgKS5kYXRhKCBcImpzb25cIiApLCAkKCB0aGlzICkuZGF0YSggXCJidW5kbGVJZFwiICkgKTtcbiAgfSk7XG59XG5cbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiAoKSB7XG4gIGFjdGl2aXRpZXNEYXRhID0gJCggXCJib2R5XCIgKS5kYXRhKCBcImFjdGl2aXRpZXNEYXRhXCIgKTtcblxuICBmb3IgKCB2YXIga2V5IGluIGFjdGl2aXRpZXNEYXRhICkge1xuICAgIGlmICggYWN0aXZpdGllc0RhdGEuaGFzT3duUHJvcGVydHkoIGtleSApICkge1xuICAgICAgZXhwb3J0cy5hZGQoIFwiLmFjdGl2aXRpZXNcIiwga2V5IClcbiAgICB9XG4gIH1cbn07XG4iLCJleHBvcnRzLmRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBlbGUgPSAkKCBcIjxzcGFuIGNsYXNzPSdkb25lJz48L3NwYW4+XCIgKTtcbiAgJCggXCJib2R5XCIgKS5hcHBlbmQoIGVsZSApO1xuXG4gIHNldFRpbWVvdXQoIGZ1bmN0aW9uICgpIHtcbiAgICBlbGUucmVtb3ZlKCk7XG4gIH0sIDIwMDApO1xufVxuXG5leHBvcnRzLmxvYWRpbmcgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBlbGUgPSAkKCBcIjxzcGFuIGNsYXNzPSdkb25lIGxvYWQnPjwvc3Bhbj5cIiApO1xuICAkKCBcImJvZHlcIiApLmFwcGVuZCggZWxlICk7XG5cbiAgc2V0VGltZW91dCggZnVuY3Rpb24gKCkge1xuICAgIGVsZS5yZW1vdmUoKTtcbiAgfSwgMjAwMCk7XG59XG5cbnZhciBkZWZhdWx0TmV3Q29tbWVudFRleHQgPSBcIk5ldyBDb21tZW50IC0gU2Nyb2xsIFVwIHRvIFNlZVwiO1xuZXhwb3J0cy5hZGRDb21tZW50ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgZWxlID0gJCggXCI8c3BhbiBjbGFzcz0nbmV3LWl0ZW0nPlwiICtcbiAgICAgICAgICAgICAgICQoIFwiYm9keVwiICkuZGF0YSggXCJuZXdDb21tZW50VGV4dFwiICkgfHwgZGVmYXVsdE5ld0NvbW1lbnRUZXh0ICtcbiAgICAgICAgICAgICAgIFwiPC9zcGFuPlwiICk7XG4gICQoIFwiYm9keVwiICkuYXBwZW5kKCBlbGUgKTtcblxuICBzZXRUaW1lb3V0KCBmdW5jdGlvbiAoKSB7XG4gICAgZWxlLnJlbW92ZSgpO1xuICB9LCAzMDAwKTtcbn1cbiIsInZhciBhY2NvdW50ID0gdW5kZWZpbmVkO1xudmFyIFNFUlZFUiA9IFwiaHR0cDovL1wiICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgXCI6NTAwMFwiO1xudmFyIFdTX1NFUlZFUiA9ICd3czovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnOjk5OTknO1xudmFyIE9QVElPTlMgPSB7XG4gIHNpdGVOYW1lOlxuICAgIFwiU3VnYXIgTGFicyBBY3Rpdml0aWVzXCIsXG4gIHRlcm1zT2ZTZXJ2aWNlOlxuICAgIFwiaHR0cHM6Ly93d3cuZ2l0aHViLmNvbS9zYW1kcm9pZC1hcHBzL2FzbG8vYmxvYi9tYXN0ZXIvVE9TLm1kXCIsXG4gIHByaXZhY3lQb2xpY3k6XG4gICAgXCJodHRwczovL3d3dy5naXRodWIuY29tL3NhbWRyb2lkLWFwcHMvYXNsby9ibG9iL21hc3Rlci9QUC5tZFwiXG59XG5cbnZhciBhbmltYXRpb25zID0gcmVxdWlyZSggXCIuL2FuaW1hdGlvbnMuanNcIiApO1xudmFyIHV0aWwgPSByZXF1aXJlKCBcIi4vdXRpbC5qc1wiICk7XG52YXIgcmVjb21tZW5kID0gcmVxdWlyZSggXCIuL3JlY29tbWVuZC5qc1wiICk7XG5cbm5hdmlnYXRvci5pZC53YXRjaCh7XG4gIG9ubG9naW46IGZ1bmN0aW9uICggYXNzZXJ0aW9uICkge1xuICAgICQucG9zdCggU0VSVkVSICsgXCIvbG9naW5cIiwgeyBhc3NlcnRpb246IGFzc2VydGlvbiB9IClcbiAgICAgIC5kb25lKCBmdW5jdGlvbiAoIGRhdGEgKSB7XG5cdFx0JCggXCIubG9naW5cIiApLmh0bWwoIFwiTG9nZ2VkIGluXCIgKTtcbiAgICAgICAgYWNjb3VudCA9IEpTT04ucGFyc2UoIGRhdGEgKTtcbiAgICAgICAgYWNjb3VudC5jb2RlID0gYXNzZXJ0aW9uO1xuXHRcdHJlY29tbWVuZC5yKCBhY2NvdW50ICk7XG4gICAgICB9KTtcbiAgfSxcbiAgb25sb2dvdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICBhY2NvdW50ID0gdW5kZWZpbmVkO1xuICB9XG59KTtcblxuZXhwb3J0cy5zZXR1cCA9IGZ1bmN0aW9uICgpIHtcbiAgJCggXCIubG9naW5cIiApLmNsaWNrKCBmdW5jdGlvbiAoKSB7IG5hdmlnYXRvci5pZC5yZXF1ZXN0KE9QVElPTlMpOyB9IClcblxuICAkKCBcIi5jb21tZW50cyAuYWRkXCIgKS5jbGljayggZnVuY3Rpb24gKCkge1xuICAgIGlmICggYWNjb3VudCA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgbmF2aWdhdG9yLmlkLnJlcXVlc3QoT1BUSU9OUylcbiAgICAgIHJldHVybjtcbiAgICB9XG5cblxuICAgIHZhciB0ZXh0ID0gJCggXCIuY29tbWVudHMgLmFkZC1jb250ZW50XCIgKS52YWwoKTtcbiAgICB2YXIgcmF0aW5nID0gJCggXCIuc3Rhci1zZWxcIiApLmRhdGEoIFwic2VsZWN0ZWRcIiApO1xuICAgIHZhciB0eXBlID0gJCggXCIuY29tbWVudHMgLnR5cGVzIGkuY2hlY2tlZFwiICkuYXR0ciggXCJ2YWx1ZVwiICk7XG5cbiAgICB2YXIgcmVwbHlDb250ZW50LCByZXBseUlkO1xuICAgIGlmICggdHlwZSA9PT0gXCJyZXBseVwiICkge1xuICAgICAgcmVwbHlDb250ZW50ID0gJCggXCIuY29tbWVudHMgPiBibG9ja3F1b3RlXCIgKS5odG1sKCk7XG4gICAgICByZXBseUlkID0gJCggXCIuY29tbWVudHMgPiBibG9ja3F1b3RlXCIgKS5kYXRhKCBcImlkXCIgKTtcbiAgICB9XG4gICAgXG4gICAgaWYgKCAkKCBcIi5jb21tZW50cyAuYWRkXCIgKS5kYXRhKCBcImJ1bmRsZUlkXCIgKSA9PT0gdW5kZWZpbmVkIClcbiAgICAgIHJldHVyblxuXG4gICAgYW5pbWF0aW9ucy5sb2FkaW5nKCk7XG4gICAgJC5wb3N0KCBTRVJWRVIgKyBcIi9jb21tZW50cy9wb3N0XCIsIHtcbiAgICAgICAgICBlbWFpbDogYWNjb3VudC5lbWFpbCxcbiAgICAgICAgICBjb2RlOiBhY2NvdW50LmNvZGUsXG4gICAgICAgICAgYnVuZGxlX2lkOiAkKCBcIi5jb21tZW50cyAuYWRkXCIgKS5kYXRhKCBcImJ1bmRsZUlkXCIgKSxcblxuICAgICAgICAgIGNvbnRlbnQ6IHRleHQsXG4gICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICByYXRpbmc6IHJhdGluZyxcblxuICAgICAgICAgIGxhbmc6IG5hdmlnYXRvci5sYW5ndWFnZSB8fCBuYXZpZ2F0b3IudXNlckxhbmd1YWdlLFxuICAgICAgICAgIHJlcGx5X2NvbnRlbnQ6IHJlcGx5Q29udGVudCxcbiAgICAgICAgICByZXBseV9pZDogcmVwbHlJZCxcbiAgICB9IClcbiAgICAgIC5kb25lKCBmdW5jdGlvbiAoIF8gKSB7XG4gICAgICAgIGFuaW1hdGlvbnMuZG9uZSgpO1xuICAgICAgICBjb21tZW50c1NldHVwKCQoIFwiLmNvbW1lbnRzIC5hZGRcIiApLmRhdGEoIFwiYnVuZGxlSWRcIiApKTtcbiAgICAgICAgcmVjb21tZW5kLnIoIGFjY291bnQgKTtcbiAgICAgIH0pO1xuICB9KTtcblxuICBjb25uZWN0Q29tbWVudFdTKCk7XG4gIHNldHVwU2VsZWN0b3JzKCk7XG59O1xuXG52YXIgY29ubmVjdENvbW1lbnRXUyA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNvY2tldCA9IG5ldyBXZWJTb2NrZXQoIFdTX1NFUlZFUiApO1xuXG4gIHNvY2tldC5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoIGluZm8gKSB7XG4gICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKCBpbmZvLmRhdGEgKTtcbiAgICBjb25zb2xlLmxvZyggZGF0YSApXG4gICAgaWYgKCBkYXRhLmV2ZW50ID09IFwiYWRkX2NvbW1lbnRcIiApIHtcbiAgICAgIGlmICggJCggXCIuY29tbWVudHMgdWwgI1wiICsgZGF0YS5kYXRhLmlkICkubGVuZ3RoID09IDAgKSB7XG4gICAgICAgIGFkZENvbW1lbnQoIGRhdGEuZGF0YSApO1xuICAgICAgICBhbmltYXRpb25zLmFkZENvbW1lbnQoKTtcbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAoIGRhdGEuZXZlbnQgPT0gXCJyZW1vdmVfY29tbWVudFwiICkge1xuICAgICAgY29uc29sZS5sb2coIFwicm1cIiwgZGF0YSApXG4gICAgICAkKCBcIi5jb21tZW50cyB1bCAjXCIgKyBkYXRhLmRhdGEgKS5yZW1vdmUoKTtcblxuICAgIH0gZWxzZSB7IGNvbnNvbGUubG9nKCBcIlVua25vd24gV1MgbWVzc2FnZTogXCIsIGRhdGEgKTsgfTtcbiAgfTtcbn07XG5cbnZhciBzZXR1cFNlbGVjdG9ycyA9IGZ1bmN0aW9uICgpIHtcbiAgJCggXCIuY29tbWVudHMgLnR5cGVzIGlcIiApLmNsaWNrKCBmdW5jdGlvbiAoKSB7XG4gICAgJCggXCIuY29tbWVudHMgLnR5cGVzIGlcIiApLnJlbW92ZUNsYXNzKCBcImNoZWNrZWRcIiApO1xuICAgICQoIHRoaXMgKS5hZGRDbGFzcyggXCJjaGVja2VkXCIgKTtcbiAgICB2YXIgdHlwZSA9ICQoIHRoaXMgKS5hdHRyKCBcInZhbHVlXCIgKTtcblxuICAgIGlmICggdHlwZSAhPT0gXCJyZXBseVwiICkge1xuICAgICAgJCggXCIuY29tbWVudHMgPiBibG9ja3F1b3RlXCIgKS5oaWRlKCk7XG4gICAgICAkKCBcIi5jb21tZW50cyAudHlwZXMgaVt2YWx1ZT1yZXBseV1cIiApLnJlbW92ZUNsYXNzKCBcImNoZWNrZWRcIiApLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIHR5cGUgIT09IFwicmV2aWV3XCIgKSB7XG4gICAgICAkKCBcIi5jb21tZW50cyA+IC5zdGFyLXNlbFwiICkuaGlkZSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAkKCBcIi5jb21tZW50cyA+IC5zdGFyLXNlbFwiICkuc2hvdygpO1xuICAgIH1cblxuICAgIGlmICggdHlwZSAhPT0gXCJwcm9ibGVtXCIgKSB7XG4gICAgICAkKCBcIi5jb21tZW50cyA+IC5idWctdGlwXCIgKS5oaWRlKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoIFwiLmNvbW1lbnRzID4gLmJ1Zy10aXBcIiApLnNob3coKTtcbiAgICB9XG4gIH0pO1xuXG4gICQoIFwiLnN0YXItc2VsXCIgKS5kYXRhKCBcInNlbGVjdGVkXCIsIDEgKTtcbiAgJCggXCIuc3Rhci1zZWwgaVwiICkuY2xpY2soIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgbiA9IHBhcnNlSW50KCAkKCB0aGlzICkuYXR0ciggXCJpZFwiICkgKVxuICAgICQoIFwiLnN0YXItc2VsXCIgKS5kYXRhKCBcInNlbGVjdGVkXCIsIG4gKTtcbiAgXG4gICAgJCggXCIuc3Rhci1zZWwgaVwiICkucmVtb3ZlQ2xhc3MoIFwiZmEtc3RhclwiICk7XG4gICAgJCggXCIuc3Rhci1zZWwgaVwiICkuYWRkQ2xhc3MoIFwiZmEtc3Rhci1vXCIgKTtcbiAgXG4gICAgd2hpbGUgKCBuID4gMCApIHtcbiAgICAgICQoIFwiLnN0YXItc2VsIGkjXCIgKyBuICkucmVtb3ZlQ2xhc3MoIFwiZmEtc3Rhci1vXCIgKTtcbiAgICAgICQoIFwiLnN0YXItc2VsIGkjXCIgKyBuICkuYWRkQ2xhc3MoIFwiZmEtc3RhclwiICk7XG4gICAgICBuLS07XG4gICAgfVxuICB9KTtcbn07XG5cbmV4cG9ydHMubG9hZCA9IGZ1bmN0aW9uICggYnVuZGxlSWQgKSB7XG4gICQoIFwiLmNvbW1lbnRzID4gYmxvY2txdW90ZVwiICkuaGlkZSgpO1xuICAkKCBcIi5jb21tZW50cyAudHlwZXMgaVt2YWx1ZT1yZXBseV1cIiApLnJlbW92ZUNsYXNzKCBcImNoZWNrZWRcIiApLmhpZGUoKTtcblxuICAkLnBvc3QoIFNFUlZFUiArIFwiL2NvbW1lbnRzL2dldC9cIiArIGJ1bmRsZUlkKSAgLy8gV2UgZG9uJ3Qgd2FudCB0byBHRVQgY2FjaGVkIHN0dWZmXG4gICAgLmRvbmUoIGZ1bmN0aW9uICggc3RyRGF0YSApIHtcbiAgICB2YXIgY29udGFpbmVyID0gJCggXCIuY29tbWVudHMgdWxcIiApO1xuICAgIGNvbnRhaW5lci5odG1sKCBcIlwiICk7XG4gICAgXG4gICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKCBzdHJEYXRhICk7XG4gICAgZm9yICggaSBpbiBkYXRhICkge1xuICAgICAgdmFyIGl0ZW0gPSBkYXRhWyBpIF07XG4gICAgICBhZGRDb21tZW50KCBpdGVtICk7XG4gICAgfVxuXG4gICAgdmFyIGZvY3VzT24gPSAkKCBcImJvZHlcIiApLmRhdGEoIFwiZm9jdXNPbkNvbW1lbnRcIiApO1xuICAgIGlmICggZm9jdXNPbiAhPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAkKCBcImh0bWwsIGJvZHlcIiApLmFuaW1hdGUoIHtcblx0ICAgICAgc2Nyb2xsVG9wOiAkKCBcIi5jb21tZW50cyB1bCBsaSNcIiArIGZvY3VzT24gKS5vZmZzZXQoKS50b3AgLSAxMFxuICAgICAgICB9LCA1MDAgKTtcbiAgICAgICAgZm9jdXNPbiA9IG51bGxcbiAgICB9XG4gIH0pO1xuICBcbiAgJCggXCIuY29tbWVudHMgLmFkZFwiICkuZGF0YSggXCJidW5kbGVJZFwiLCBidW5kbGVJZCApO1xufTtcblxudmFyIGFkZENvbW1lbnQgPSBmdW5jdGlvbiAoIGl0ZW0gKSB7XG4gIHZhciBlbGUgPSAkKCBcIjxsaT5cIiApO1xuICBlbGUuYXR0ciggXCJpZFwiLCBpdGVtLmlkICk7XG4gIFxuICB2YXIgaW1nID0gJCggXCI8aW1nIGNsYXNzPSdwZXJzb24nLz5cIiApO1xuICBpbWcuYXR0ciggXCJzcmNcIiwgXCJodHRwOi8vd3d3LmdyYXZhdGFyLmNvbS9hdmF0YXIvXCIgKyBpdGVtLmVtYWlsX2hhc2ggKyBcIj9kPW1vbnN0ZXJpZFwiICk7XG4gIGVsZS5hcHBlbmQoIGltZyApO1xuICBcbiAgdmFyIHR5cGUgPSAkKCBcIjxzcGFuIGNsYXNzPSd0eXBlLWljb24nPjwvc3Bhbj5cIiApO1xuICB0eXBlLmFkZENsYXNzKCBpdGVtLnR5cGUgKTtcbiAgZWxlLmFwcGVuZCggdHlwZSApO1xuICBcbiAgaWYgKCBpdGVtLnR5cGUgPT09IFwicmVwbHlcIiApIHtcbiAgICB2YXIgYnEgPSAkKCBcIjxibG9ja3F1b3RlIGNsYXNzPSdyZXBseS1jb250ZW50Jz5cIiApO1xuICAgIGJxLmh0bWwoIGl0ZW0ucmVwbHlfY29udGVudCApO1xuICAgIGVsZS5hcHBlbmQoIGJxICk7XG4gIH1cbiAgXG4gIGlmICggaXRlbS50eXBlID09PSBcInJldmlld1wiIHx8IGl0ZW0udHlwZSA9PT0gdW5kZWZpbmVkICkge1xuICAgIHZhciBzdGFycyA9ICQoIFwiPHNwYW4gY2xhc3M9J3N0YXJzJz5cIiArXG4gICAgdXRpbC5yZXBlYXRTKCBcIjxpIGNsYXNzPSdmYSBmYS1zdGFyJz48L2k+XCIsIGl0ZW0ucmF0aW5nICkgK1xuICAgIHV0aWwucmVwZWF0UyggXCI8aSBjbGFzcz0nZmEgZmEtc3Rhci1vJz48L2k+XCIsIDUgLSBpdGVtLnJhdGluZyApICtcbiAgICBcIjwvc3Bhbj5cIiApO1xuICAgICQoIFwiaW5wdXRbdmFsdWU9XCIgKyBpdGVtLnJhdGluZy50b1N0cmluZygpICsgXCJdXCIsIHN0YXJzICkuYXR0ciggXCJjaGVja2VkXCIsIFwiXCIgKTtcbiAgICBlbGUuYXBwZW5kKCBzdGFycyApO1xuICB9XG4gIFxuICB2YXIgdGV4dCA9ICQoIFwiPHA+XCIgKTtcbiAgdGV4dC5odG1sKCBpdGVtLnRleHQgKTtcbiAgZWxlLmFwcGVuZCggdGV4dCApO1xuICBcbiAgdmFyIHJlcG9ydCA9ICQoIFwiPGkgY2xhc3M9J2ZhIGZhLWZsYWcnIHN0eWxlPSdtYXJnaW4tcmlnaHQ6IDVweDsnPjwvaT5cIiApO1xuICByZXBvcnQuZGF0YSggXCJpZFwiLCBpdGVtLmlkICk7XG4gIHJlcG9ydC5jbGljayggZnVuY3Rpb24gKCkge1xuICAgICQucG9zdCggU0VSVkVSICsgXCIvY29tbWVudHMvcmVwb3J0XCIsIHsgaWQ6IHJlcG9ydC5kYXRhKCBcImlkXCIgKSB9ICk7XG4gICAgYW5pbWF0aW9ucy5kb25lKCk7XG4gICAgJCggdGhpcyApLmF0dHIoIFwiZGlzYWJsZWRcIiwgXCJ0cnVlXCIgKTtcbiAgICAkKCB0aGlzICkucGFyZW50KCkuYWRkQ2xhc3MoIFwicmVwb3J0ZWRcIiApO1xuICB9KTtcbiAgZWxlLmFwcGVuZCggcmVwb3J0ICk7XG4gIFxuICB2YXIgbGluayA9ICQoIFwiPGE+PGkgY2xhc3M9J2ZhIGZhLWxpbmsnIHN0eWxlPSdtYXJnaW4tcmlnaHQ6IDVweDsnPjwvaT48L2E+XCIgKTtcbiAgdmFyIGJ1bmRsZUlkID0gJCggXCIuY29tbWVudHMgLmFkZFwiICkuZGF0YSggXCJidW5kbGVJZFwiICk7XG4gIGxpbmsuYXR0ciggXCJocmVmXCIsIFwiLyMhL3ZpZXcvXCIgKyBidW5kbGVJZCArIFwiL2NvbW1lbnQ9PlwiICsgaXRlbS5pZCApO1xuICBsaW5rLmRhdGEoIFwiaWRcIiwgaXRlbS5pZCApO1xuICBsaW5rLmNsaWNrKCBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGlkID0gJCggdGhpcyApLmRhdGEoIFwiaWRcIiApO1xuICAgICQoIFwiaHRtbCwgYm9keVwiICkuYW5pbWF0ZSgge1xuICAgICAgc2Nyb2xsVG9wOiAkKCBcIi5jb21tZW50cyB1bCBsaSNcIiArIGlkICkub2Zmc2V0KCkudG9wIC0gMTBcbiAgICB9LCA1MDAgKTtcbiAgfSk7XG4gIGVsZS5hcHBlbmQoIGxpbmsgKVxuICBcbiAgdmFyIHJlcGx5ID0gJChcIjxpIGNsYXNzPSdmYSBmYS1yZXBseSc+PC9pPlwiKTtcbiAgcmVwbHkuZGF0YSggXCJpZFwiLCBpdGVtLmlkICk7XG4gIHJlcGx5LmRhdGEoIFwidGV4dFwiLCBlbGUuaHRtbCgpICk7XG4gIHJlcGx5LmNsaWNrKCBmdW5jdGlvbiAoKSB7XG4gICAgJCggXCIuY29tbWVudHMgPiAuc3Rhci1zZWxcIiApLmhpZGUoKTtcbiAgICAkKCBcIi5jb21tZW50cyA+IC5idWctdGlwXCIgKS5oaWRlKCk7XG5cbiAgICAkKCBcIi5jb21tZW50cyA+IGJsb2NrcXVvdGVcIiApLnNob3coKTtcbiAgICAkKCBcIi5jb21tZW50cyA+IGJsb2NrcXVvdGVcIiApLmRhdGEoIFwiaWRcIiwgJCggdGhpcyApLmRhdGEoIFwiaWRcIiApICk7XG4gICAgJCggXCIuY29tbWVudHMgPiBibG9ja3F1b3RlXCIgKS5odG1sKFxuICAgICAgJCggdGhpcyApLmRhdGEoIFwidGV4dFwiICkucmVwbGFjZShcbiAgICAgICAgLzxibG9ja3F1b3RlIGNsYXNzPVxcXCJyZXBseS1jb250ZW50XFxcIj4uKjxcXC9ibG9ja3F1b3RlPi8sIFwiXCIgKVxuICAgICk7XG5cbiAgICAkKCBcIi5jb21tZW50cyAudHlwZXMgaVwiICkucmVtb3ZlQ2xhc3MoIFwiY2hlY2tlZFwiICk7XG4gICAgJCggXCIuY29tbWVudHMgLnR5cGVzIGlbdmFsdWU9cmVwbHldXCIgKS5hZGRDbGFzcyggXCJjaGVja2VkXCIgKS5zaG93KCk7XG4gICAgXG4gICAgJCggXCJodG1sLCBib2R5XCIgKS5hbmltYXRlKCB7XG4gICAgICBzY3JvbGxUb3A6ICQoIFwiLmNvbW1lbnRzID4gYmxvY2txdW90ZVwiICkub2Zmc2V0KCkudG9wIC0gMTBcbiAgICB9LCA1MDAgKTtcbiAgfSk7XG4gIGVsZS5hcHBlbmQoIHJlcGx5ICk7XG4gIFxuICBlbGUucHJlcGVuZFRvKCAkKCBcIi5jb21tZW50cyB1bFwiICkgKTtcbn07XG4iLCJ2YXIgYWN0aXZpdHlMaXN0ID0gcmVxdWlyZSggXCIuL2FjdGl2aXR5TGlzdC5qc1wiICk7XG52YXIgbWFpbkFjdGl2aXR5ID0gcmVxdWlyZSggXCIuL21haW5BY3Rpdml0eS5qc1wiICk7XG52YXIgc2VhcmNoID0gcmVxdWlyZSggXCIuL3NlYXJjaC5qc1wiICk7XG52YXIgY29tbWVudHMgPSByZXF1aXJlKCBcIi4vY29tbWVudHMuanNcIiApO1xuXG52YXIgZ29CYXNlZE9uVXJsID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIHdpbmRvdy5sb2NhdGlvbi5oYXNoICYmICF3aW5kb3cubG9jYXRpb24uY2hhbmdlZEJ5UHJvZ3JhbSApIHtcbiAgICB2YXIgdGVzdFN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoO1xuXG4gICAgdmFyIHIgPSAvIVxcL3ZpZXdcXC8oW15cXC9dKikkLztcbiAgICBtYXRjaCA9IHIuZXhlYyh0ZXN0U3RyaW5nKTtcbiAgICBpZiAoIG1hdGNoICkge1xuICAgICAgdmFyIGJ1bmRsZUlkID0gbWF0Y2hbMV1cbiAgICAgIHZhciBpdGVtRGF0YSA9ICQoIFwiYm9keVwiICkuZGF0YSggXCJhY3Rpdml0aWVzRGF0YVwiIClbIGJ1bmRsZUlkIF07XG4gICAgICBtYWluQWN0aXZpdHkubG9hZCggaXRlbURhdGEsIGJ1bmRsZUlkICk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgICAgXG4gICAgdmFyIHIgPSAvIVxcL3ZpZXdcXC8oW15cXC9dKilcXC9jb21tZW50PT4oWzAtOWEtekEtWlxcLV0qKSQvXG4gICAgbWF0Y2ggPSByLmV4ZWModGVzdFN0cmluZyk7XG4gICAgaWYgKCBtYXRjaCApIHtcbiAgICAgIHZhciBidW5kbGVJZCA9IG1hdGNoWzFdXG4gICAgICB2YXIgaXRlbURhdGEgPSAkKCBcImJvZHlcIiApLmRhdGEoIFwiYWN0aXZpdGllc0RhdGFcIiApWyBidW5kbGVJZCBdO1xuICAgICAgZm9jdXNPbkFjdGl2aXR5KCBpdGVtRGF0YSwgYnVuZGxlSWQgKTtcblxuICAgICAgJCggXCJib2R5XCIgKS5kYXRhKCBcImZvY3VzT25Db21tZW50XCIsIG1hdGNoWzJdICk7XG4gICAgfVxuICB9XG4gIHdpbmRvdy5sb2NhdGlvbi5jaGFuZ2VkQnlQcm9ncmFtID0gZmFsc2U7XG59XG5cbnZhciBkYXRhVXJsID0gXCJodHRwOi8vYXNsby1ib3QtbWFzdGVyLnN1Z2FybGFicy5vcmcvZGF0YS5qc29uXCI7XG4kKGRvY3VtZW50KS5yZWFkeSggZnVuY3Rpb24gKCkge1xuICB2YXIgbGlzdCA9ICQoXCIuYWN0aXZpdGllc1wiKTtcbiAgdmFyIGRldGFpbCA9ICQoXCIuZGV0YWlsXCIpO1xuICBcbiAgJC5hamF4KHtcbiAgICB1cmw6IGRhdGFVcmxcbiAgfSkuZG9uZSggZnVuY3Rpb24gKCBkYXRhICkge1xuICAgICQoIFwiYm9keVwiICkuZGF0YSggXCJhY3Rpdml0aWVzRGF0YVwiLCBkYXRhLmFjdGl2aXRpZXMgKTtcbiAgICBhY3Rpdml0eUxpc3Quc2V0dXAoKTtcblxuICAgIGdvQmFzZWRPblVybCgpO1xuICB9KTtcbiAgd2luZG93Lm9uaGFzaGNoYW5nZSA9IGdvQmFzZWRPblVybDtcbiAgXG4gIHNlYXJjaC5zZXR1cCgpO1xuICBjb21tZW50cy5zZXR1cCgpO1xufSk7XG5cbmkxOG4uaW5pdCh7IGZhbGxiYWNrTG5nOiBcImVuXCIgfSwgZnVuY3Rpb24odCkge1xuICAkKCBcImJvZHlcIiApLmkxOG4oKTtcbiAgXG4gIGlmICggdCggXCJ1aS5zZWFyY2hcIiApICE9PSBcInVpLnNlYXJjaFwiIClcbiAgICAkKCBcIi5zZWFyY2hcIiApLmF0dHIoIFwicGxhY2Vob2xkZXJcIiwgdCggXCJ1aS5zZWFyY2hcIiApICk7XG5cbiAgaWYgKCB0KCBcInVpLm5ld0NvbW1lbnRUZXh0XCIgKSAhPT0gXCJ1aS5uZXdDb21tZW50VGV4dFwiIClcbiAgICAkKCBcImJvZHlcIiApLmRhdGEoIFwibmV3Q29tbWVudFRleHRcIiwgdCggXCJ1aS5uZXdDb21tZW50VGV4dFwiICkgKTtcbn0pO1xuIiwidmFyIHV0aWwgPSByZXF1aXJlKCBcIi4vdXRpbC5qc1wiICk7XG52YXIgY29tbWVudHMgPSByZXF1aXJlKCBcIi4vY29tbWVudHMuanNcIiApO1xuXG5leHBvcnRzLmxvYWQgPSBmdW5jdGlvbiAoIGRhdGEsIGJ1bmRsZUlkICkge1xuICB3aW5kb3cubG9jYXRpb24uY2hhbmdlZEJ5UHJvZ3JhbSA9IHRydWU7XG4gIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gXCIhL3ZpZXcvXCIgKyBidW5kbGVJZDtcbiAgd2luZG93LnNjcm9sbFRvKCAwLCAwICk7XG4gIFxuICB2YXIgY29udGFpbmVyID0gJCggXCIuZGV0YWlsXCIgKTtcbiAgY29udGFpbmVyLnJlbW92ZUNsYXNzKCBcImhpZGVcIiApO1xuICBcbiAgJCggXCIuY2xvc2VcIiwgY29udGFpbmVyICkuY2xpY2soIGZ1bmN0aW9uICgpIHtcbiAgICBjb250YWluZXIuYWRkQ2xhc3MoIFwiaGlkZVwiICk7XG4gIH0pO1xuICBcbiAgJCggXCIudGl0bGVcIiwgY29udGFpbmVyICkuaHRtbCggdXRpbC50cmFucyggZGF0YS50aXRsZSApICk7XG4gICQoIFwiLmljb25cIiwgY29udGFpbmVyICkuYXR0ciggXCJzcmNcIiwgZGF0YS5pY29uICk7XG4gICQoIFwiLmRlc2NyaXB0aW9uXCIsIGNvbnRhaW5lciApLmh0bWwoIHV0aWwudHJhbnMoIGRhdGEuZGVzY3JpcHRpb24gKSApO1xuXG4gICQoIFwiLmdpdGh1YlwiLCBjb250YWluZXIgKS5oaWRlKCk7XG4gIGlmICggZGF0YS5naXRodWJfdXJsICE9PSB1bmRlZmluZWQgKSB7XG4gICAgJCggXCIuZ2l0aHViXCIsIGNvbnRhaW5lciApLnNob3coKTtcbiAgICAkKCBcIi5naXRodWJcIiwgY29udGFpbmVyICkuYXR0ciggXCJocmVmXCIsIFwiaHR0cHM6Ly93d3cuZ2l0aHViLmNvbS9cIiArIGRhdGEuZ2l0aHViX3VybCApO1xuICB9XG5cbiAgdmFyIHZlcnNpb25EYXRhID0gbnVsbFxuICBpZiAoIHV0aWwuZ2V0U3VnYXJWZXJzaW9uKCkgPj1cbiAgICAgICB1dGlsLnN1Z2FyVmVyc2lvblRvSW50KCBkYXRhLm1pblN1Z2FyVmVyc2lvbiApICkge1xuICAgIHZlcnNpb25EYXRhID0gZGF0YTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKCBpIGluIGRhdGEucmVsZWFzZXMgKSB7XG4gICAgICAgaWYgKCB1dGlsLmdldFN1Z2FyVmVyc2lvbigpID49XG4gICAgICAgICAgICB1dGlsLnN1Z2FyVmVyc2lvblRvSW50KCBkYXRhLnJlbGVhc2VzWyBpIF0ubWluU3VnYXJWZXJzaW9uICkgKSB7XG4gICAgICAgICB2ZXJzaW9uRGF0YSA9IGRhdGEucmVsZWFzZXNbIGkgXTtcbiAgICAgICAgIGJyZWFrO1xuICAgICAgIH1cbiAgICB9XG4gIH1cbiAgJCggXCIubm92ZXJzaW9uXCIgKS5oaWRlKCk7XG4gIGlmICggdmVyc2lvbkRhdGEgPT09IG51bGwgKSB7XG4gICAgJCggXCIubm92ZXJzaW9uXCIgKS5zaG93KCk7XG4gICAgdmVyc2lvbkRhdGEgPSBkYXRhO1xuICB9XG5cbiAgJCggXCIuZG93bmxvYWRcIiwgY29udGFpbmVyICkuYXR0ciggXCJocmVmXCIsIHZlcnNpb25EYXRhLnhvX3VybCApO1xuICBpZiAoIHZlcnNpb25EYXRhLndoYXRzX25ldyApIHtcbiAgICAkKCBcIi53aGF0c25ld2xhYmVsXCIgKS5zaG93KCk7XG4gICAgJCggXCIud2hhdHNuZXdcIiwgY29udGFpbmVyICkuaHRtbCggdXRpbC50cmFucyggdmVyc2lvbkRhdGEud2hhdHNfbmV3ICkgKTtcbiAgfSBlbHNlIHtcbiAgICAkKCBcIi53aGF0c25ld2xhYmVsXCIgKS5oaWRlKCk7XG4gIH1cbiAgJCggXCIubWludmVyc2lvblwiLCBjb250YWluZXIgKS5odG1sKCB2ZXJzaW9uRGF0YS5taW5TdWdhclZlcnNpb24gKTtcblxuICAkKCBcIi5zY3JlZW5zaG90c1wiLCBjb250YWluZXIgKS5odG1sKCBcIlwiICk7XG4gIHNzID0gdXRpbC50cmFucyggdmVyc2lvbkRhdGEuc2NyZWVuc2hvdHMgKTtcbiAgZm9yICggaSBpbiBzcyApIHtcbiAgICB2YXIgZWxlID0gJCggXCI8aW1nPlwiICk7XG4gICAgdmFyIGltYWdlU3JjID0gdXRpbC50cmFucyggdmVyc2lvbkRhdGEuc2NyZWVuc2hvdHMgKVsgaSBdXG4gICAgZWxlLmFkZENsYXNzKCBcInNjcmVlbnNob3RcIiApO1xuICAgIGVsZS5hdHRyKCBcInNyY1wiLCBpbWFnZVNyYyApO1xuICAgICQoIFwiLnNjcmVlbnNob3RzXCIsIGNvbnRhaW5lciApLmFwcGVuZCggZWxlICk7XG4gIH1cblxuICAkKCBcIi5kb3dubG9hZC1kZXZlbFwiLCBjb250YWluZXIgKS5oaWRlKCk7XG4gIGlmICggZGF0YS54b191cmxfbGF0ZXN0ICkge1xuICAgICQoIFwiLmRvd25sb2FkLWRldmVsXCIsIGNvbnRhaW5lciApLnNob3coKTtcbiAgICAkKCBcIi5kb3dubG9hZC1kZXZlbFwiLCBjb250YWluZXIgKS5hdHRyKCBcImhyZWZcIiwgZGF0YS54b191cmxfbGF0ZXN0ICk7XG4gIH1cblxuICBcbiAgaWYgKCBzcyA9PT0gXCJcIiB8fCBzcy5sZW5ndGggPT09IDEgKSB7XG4gICAkKCBcIi5pY29uXCIsIGNvbnRhaW5lciApLmhpZGUoKTtcbiAgfSBlbHNlIHtcbiAgICQoIFwiLmljb25cIiwgY29udGFpbmVyICkuc2hvdygpO1xuICB9XG4gICAgICBcbiAgXG4gICQoIFwiLmljb25cIiwgY29udGFpbmVyICkuY2xpY2soIGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgcyA9ICQoIFwiLnNjcmVlbnNob3RzXCIsIGNvbnRhaW5lciApO1xuICAgIHMudG9nZ2xlQ2xhc3MoIFwiY2xvc2VkXCIgKTtcbiAgfSk7XG5cbiAgJCggXCIuYnlcIiwgY29udGFpbmVyKS5odG1sKCBcIlwiICk7XG4gIGZvciAoIGkgaW4gZGF0YS5ieSApIHtcbiAgICB2YXIgZWxlID0gJCggXCI8YT5cIiApO1xuICAgIHZhciBwZXJzb24gID0gZGF0YS5ieVsgaSBdO1xuICAgIGVsZS5hdHRyKCBcImhyZWZcIiwgcGVyc29uLnBhZ2UgKTtcbiAgICBlbGUuaHRtbCggcGVyc29uLm5hbWUgKTtcbiAgICAkKCBcIi5ieVwiLCBjb250YWluZXIgKS5hcHBlbmQoIGVsZSApO1xuICB9XG5cbiAgY29tbWVudHMubG9hZCggYnVuZGxlSWQgKTtcbn07XG4iLCJ2YXIgU0VSVkVSID0gXCJodHRwOi8vXCIgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyBcIjo1MDAyL3JlY29tbWVuZFwiO1xudmFyIE1BWCA9IDEwO1xuXG52YXIgYWN0aXZpdHlMaXN0ID0gcmVxdWlyZSggXCIuL2FjdGl2aXR5TGlzdC5qc1wiICk7XG5cbmV4cG9ydHMuciA9IGZ1bmN0aW9uICggYWNjb3VudCApIHtcbiAgJC5wb3N0KCBTRVJWRVIsIHsgZW1haWw6IGFjY291bnQuZW1haWwgfSApXG4gICAgLmRvbmUoIGZ1bmN0aW9uICggZGF0YSApIHtcblxuICAgICAgJCggXCIucmVjb21tZW5kZWQtYWN0aXZpdGllcy1jb250YWluZXJcIiApLnNob3coKTtcbiAgICAgICQoIFwiLnJlY29tbWVuZGVkLWFjdGl2aXRpZXNcIiApLmh0bWwoIFwiXCIgKTtcblxuICAgICAgZm9yICggaSBpbiBkYXRhICkge1xuICAgICAgICBpdGVtID0gZGF0YVsgaSBdO1xuICAgICAgICBpZiAoIGkgPiBNQVggfHwgaXRlbS5jb25maWRlbmNlIDw9IDApXG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICBhY3Rpdml0eUxpc3QuYWRkKCBcIi5yZWNvbW1lbmRlZC1hY3Rpdml0aWVzXCIsIGl0ZW0uYnVuZGxlSWQgKTtcbiAgICAgIH1cbiAgICB9KTtcbn07XG4iLCJ2YXIgbGFzdFF1ZXJ5ID0gXCJcIjtcblxudmFyIHV0aWwgPSByZXF1aXJlKCBcIi4vdXRpbC5qc1wiICk7XG5cbmV4cG9ydHMuc2V0dXAgPSBmdW5jdGlvbiAoKSB7XG4gICQoIFwiaW5wdXQuc2VhcmNoXCIgKS5vbiggXCJpbnB1dFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgdGVybSA9ICQoIFwiaW5wdXQuc2VhcmNoXCIgKS52YWwoKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgaWYgKCB0ZXJtID09PSBcIlwiICkge1xuICAgICAgJCggXCIuYWN0aXZpdGllcyBsaVwiICkuZWFjaCggZnVuY3Rpb24gKGluZGV4KSB7XG4gICAgICAgICQoIHRoaXMgKS5zaG93KCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuXG4gICAgICBpZiAoIHRlcm0uaW5kZXhPZiggbGFzdFF1ZXJ5ICkgPT09IDAgKSB7XG4gICAgICAgIC8vIElmIHRoZXkganVzdCBhcHBlbmRlZCB0byB0aGUgcXVlcnkgdGhlIHJlc3VsdHNcbiAgICAgICAgLy8gd2lsbCBiZSBhIHN1YnNldCBvZiB3aGF0IGlzIHNlZW4gbm93XG4gICAgICAgIHZhciBlbGUgPSAkKCBcIi5hY3Rpdml0aWVzIGxpOnZpc2libGVcIiApO1xuICAgICAgfSBlbHNlXG4gICAgICAgIHZhciBlbGUgPSAkKCBcIi5hY3Rpdml0aWVzIGxpXCIgKTtcblxuICAgICAgZWxlLmVhY2goIGZ1bmN0aW9uIChpbmRleCkge1xuICAgICAgICB2YXIgZm91bmQgPSAkKCB0aGlzICkuZGF0YSggXCJzZWFyY2hTdHJpbmdcIiApLmluZGV4T2YoIHRlcm0gKSAhPT0gLTFcbiAgICAgICAgaWYgKCBmb3VuZCApXG4gICAgICAgICAgJCggdGhpcyApLnNob3coKVxuICAgICAgICBlbHNlXG4gICAgICAgICAgJCggdGhpcyApLmhpZGUoKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsYXN0UXVlcnkgPSB0ZXJtO1xuICB9KTtcbn07XG5cbmV4cG9ydHMubWFrZVNlYXJjaFN0cmluZyA9IGZ1bmN0aW9uICggZGF0YSApIHtcbiAgcmV0dXJuIHV0aWwudHJhbnMoIGRhdGEudGl0bGUgKS50b0xvd2VyQ2FzZSgpICtcbiAgICAgICAgIHV0aWwudHJhbnMoIGRhdGEuZGVzY3JpcHRpb24gKS50b0xvd2VyQ2FzZTtcbn1cbiIsImV4cG9ydHMucmVwZWF0UyA9IGZ1bmN0aW9uIChzLCB0KSB7XG4gIHZhciByID0gXCJcIjtcbiAgZm9yICggdmFyIGkgPSAwOyBpIDwgdDsgaSsrICkge1xuICAgIHIgKz0gcztcbiAgfVxuICByZXR1cm4gcjtcbn1cblxuZXhwb3J0cy50cmFucyA9IGZ1bmN0aW9uICggb2JqICkge1xuICBpZiAoIG9iaiA9PT0gdW5kZWZpbmVkIClcbiAgICByZXR1cm4gXCJcIjtcblxuICB2YXIgdWwgPSBuYXZpZ2F0b3IubGFuZ3VhZ2UgfHwgbmF2aWdhdG9yLnVzZXJMYW5ndWFnZTtcbiAgaWYgKCBvYmpbIHVsIF0gIT09IHVuZGVmaW5lZCApICAvLyBTYW1lXG4gICAgcmV0dXJuIG9ialsgdWwgXTtcbiAgXG4gIGZvciAoIGtleSBpbiBvYmogKSAgLy8gU2FtZSBsYW5nLCBkaWZmZXJlbnQgY291bnRyeVxuICAgIGlmICggb2JqLmhhc093blByb3BlcnR5KCBrZXkgKSApXG4gICAgICBpZiAoIGtleS5zdWJzdHIoIDAsIDIgKSA9PSB1bC5zdWJzdHIoIDAsIDIgKSApXG4gICAgICAgIHJldHVybiBvYmpbIGtleSBdO1xuXG4gIGlmICggXCJlbi1VU1wiIGluIG9iaiApXG4gICAgcmV0dXJuIG9ialsgXCJlbi1VU1wiIF07IFxuXG4gIGZvciAoIGtleSBpbiBvYmogKSAgLy8gQW55dGhpbmdcbiAgICBpZiAoIG9iai5oYXNPd25Qcm9wZXJ0eSgga2V5ICkgKVxuICAgICAgcmV0dXJuIG9ialsga2V5IF07XG59O1xuXG5leHBvcnRzLmdldFN1Z2FyVmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHIgPSAvU3VnYXJMYWJzXFwvMFxcLihbMC05XSspL1xuICBtYXRjaCA9IHIuZXhlYyhuYXZpZ2F0b3IudXNlckFnZW50KTtcbiAgaWYgKCBtYXRjaCApXG4gICAgcmV0dXJuIHBhcnNlSW50KCBtYXRjaFsxXSApO1xuICByZXR1cm4gODY7ICAvLyBEZWZhdWx0IHZlcnNpb25cbn1cblxuZXhwb3J0cy5zdWdhclZlcnNpb25Ub0ludCA9IGZ1bmN0aW9uICggdlN0cmluZyApIHtcbiAgdmFyIHIgPSAvMFxcLihbMC05XSspL1xuICBtYXRjaCA9IHIuZXhlYyh2U3RyaW5nKTtcbiAgaWYgKCBtYXRjaCApXG4gICAgcmV0dXJuIHBhcnNlSW50KCBtYXRjaFsxXSApO1xuICByZXR1cm4gODY7XG59XG4iXX0=
