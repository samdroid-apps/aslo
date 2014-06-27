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

  var l = data.categories || [];
  for ( i in l ) {
    ele.addClass( "category-" + data.categories[i] );
  }

  ele.data( "json", data );
  ele.data( "bundleId", bundleId );
  ele.data( "searchString", search.makeSearchString( data ) );
  ele.click( function () {
    mainActivity.load( $( this ).data( "json" ),
                       $( this ).data( "bundleId" ),
                       true );
  });
}

exports.setup = function () {
  activitiesData = $( "body" ).data( "activitiesData" );

  for ( var key in activitiesData ) {
    if ( activitiesData.hasOwnProperty( key ) ) {
      exports.add( ".activities", key );
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

  var trans = $( "body" ).data( "commentIconsTitles" );

  var report = $( "<i class='fa fa-flag' style='margin-right: 5px;'></i>" );
  report.attr( "title", trans.flag );
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
  link.attr( "title", trans.link );
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
  reply.attr( "title", trans.reply );
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

},{"./activityList.js":1,"./comments.js":3,"./mainActivity.js":5,"./search.js":7}],5:[function(require,module,exports){
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
        if ( i > MAX || item.confidence <= 0) {
          return;
        }
        activityList.add( ".recommended-activities", item.bundleId );
      }
    });
};

},{"./activityList.js":1}],7:[function(require,module,exports){
var lastQuery = "";
var lastCategory = "";
var currentCategory = "any";

var util = require( "./util.js" );

var doSearch = function () {
  term = $( "input.search" ).val().toLowerCase();

  var catTerm = "";
  if ( currentCategory !== "any" ) {
    catTerm = "CATEGORY:" + currentCategory;
  }

  if ( term === "" && catTerm === "" ) {
    $( ".activities li" ).each( function (index) {
      $( this ).show();
    });
  } else {
    if ( term.indexOf( lastQuery ) === 0 && catTerm === lastCategory) {
      // If they just appended to the query the results
      // will be a subset of what is seen now
      var ele = $( ".activities li:visible" );
    } else {
      var ele = $( ".activities li" );
    };

    var termList = ( catTerm + " " + term ).split( " " );
    console.log( termList );
    ele.each( function ( index ) {
      var ss = $( this ).data( "searchString" ) || "";
      if ( ss === "" ) {
        $( this ).hide();
      }

      var found = true;
      var i = 0;
      while ( found && i < termList.length ) {
          found = ( ss.indexOf( termList[ i ] ) !== -1 ) && found;
          i++;
      };

      if ( found ) {
        $( this ).show()
      } else {
        $( this ).hide();
      }
    });
  };
  lastCategory = catTerm;
  lastQuery = term;
};

exports.setup = function () {
  $( "input.search" ).on( "input", doSearch );

  $( ".categories i" ).click( function () {
    $( ".categories i" ).removeClass( "checked" );
    $( this ).addClass( "checked" );
    currentCategory = $( this ).attr( "filter" );
    doSearch();
  });
};

exports.makeSearchString = function ( data ) {
  catString = "";
  for ( i in ( data.categories || [] ) ) {
    catString += " CATEGORY:" + data.categories[ i ];
  }

  return util.trans( data.title ).toLowerCase() +
         "  " +
         util.trans( data.description ).toLowerCase() +
         catString;
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
  if ( obj === undefined ) {
    return "";
  }

  var ul = navigator.language || navigator.userLanguage;
  if ( obj[ ul ] !== undefined ) {  // Same lang, same country
    return obj[ ul ];
  }

  for ( key in obj ) {  // Same lang, different country
    if ( obj.hasOwnProperty( key ) ) {
      if ( key.substr( 0, 2 ) == ul.substr( 0, 2 ) ) {
        return obj[ key ];
      }
    }
  }

  if ( "en-US" in obj ) {
    return obj[ "en-US" ];
  }

  for ( key in obj ) {  // Anything
    if ( obj.hasOwnProperty( key ) ) {
      return obj[ key ];
    }
  }
};

var DEFAULT_SUGAR = 86;

exports.getSugarVersion = function () {
  var r = /SugarLabs\/0\.([0-9]+)/;
  match = r.exec(navigator.userAgent);
  if ( match ) {
    return parseInt( match[1] );
  }
  return DEFAULT_SUGAR;  // Default version
}

exports.sugarVersionToInt = function ( vString ) {
  var r = /0\.([0-9]+)/;
  match = r.exec(vString);
  if ( match ) {
    return parseInt( match[1] );
  }
  return DEFAULT_SUGAR;
}

},{}]},{},[4])