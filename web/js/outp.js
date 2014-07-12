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

  var l = ( data.categories || [ "none" ] ).reverse();
  ele.addClass( "category-" + l[ 1 ] );

  ele.data( "json", data );
  ele.data( "bundleId", bundleId );
  ele.data( "searchString", search.makeSearchString( data ) );
  ele.click( function ( e ) {
    mainActivity.load( $( this ).data( "json" ),
                       $( this ).data( "bundleId" ),
                       true );
    e.preventDefault();
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

},{"./mainActivity.js":7,"./search.js":8,"./util.js":9}],2:[function(require,module,exports){
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
               i18n.get( defaultNewCommentText ) +
               "</span>" );
  $( "body" ).append( ele );

  setTimeout( function () {
    ele.remove();
  }, 3000);
}

},{}],3:[function(require,module,exports){
var account = undefined;
var SERVER = "http://comments.aslo.cf";
var WS_SERVER = "ws://comments.aslo.cf/comments/stream";

var animations = require( "./animations.js" );
var util = require( "./util.js" );
var i18n = require( "./i18n.js" );
var login = require( "./login.js" );
var xo = require( "./xoPerson.js" );

exports.setup = function () {
  $( ".comments .add" ).click( function () {
    if ( !login.isLoggedIn() ) {
      login.requestLogin();
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
          username: login.getInfo().username,
          token: login.getInfo().token,
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
        exports.load($( ".comments .add" ).data( "bundleId" ));
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

  var colors = item.colors.split( "," ) || [ "", "" ];
  var person = xo.makeIcon( colors[0], colors[1], false )
  person.attr( "title", item.user );
  ele.append( person );

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
  report.attr( "title", i18n.get( "Flag this comment for review" ) );
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
  link.attr( "title", i18n.get( "Link to this comment" ) );
  link.attr( "href", "/view/" + bundleId + "/comment=" + item.id );
  link.data( "id", item.id );
  link.click( function () {
    var id = $( this ).data( "id" );
    $( "html, body" ).animate( {
      scrollTop: $( ".comments ul li#" + id ).offset().top - 10
    }, 500 );
  });
  ele.append( link )

  var reply = $("<i class='fa fa-reply'></i>");
  reply.attr( "title", i18n.get( "Reply to this comment" ) );
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

},{"./animations.js":2,"./i18n.js":4,"./login.js":5,"./util.js":9,"./xoPerson.js":10}],4:[function(require,module,exports){
/*
|======================|
| i18n VS util.getLang |
|======================|
| i18n translates the  |
| ui.  GetLang is for  |
| getting activity     |
| data in the users    |
| current language.    |
|======================|
*/

// Add avaliable languages here
var langsAvaliable = [];

var getLangToUse = function () {
  var ul = navigator.language || navigator.userLanguage;

  if ( langsAvaliable.indexOf( ul ) !== -1 ) {
    return ul;
  };

  for ( var i in langsAvaliable ) {
    var l = langsAvaliable[i];
    if ( l.substr( 0, 2 ) == ul.substr( 0, 2 ) ) {
      return l;
    };
  }

  return null;
};

exports.setup = function () {
  l = getLangToUse();
  if ( l === null ) {
    return;
  };

  var url = "translations/" + l + ".json";
  $.get( url ).done( function ( data ) {
    $( "body" ).data( "translations", data );
	translateBody( data );
  });
};

var translateBody = function ( tdata ) {
  $( "*[i18n-content]" ).each( function () {
    var e = $( this );
    if ( e.html().trim() in tdata) {
      e.html( tdata[e.html().trim()] )
    };
  });

  $( "*[i18n-title]" ).each( function () {
    var e = $( this )
    if ( e.attr( "title" ).trim() in tdata) {
      e.attr( "title", tdata[e.attr( "title" ).trim()] )
    };
  });

  $( "*[i18n-placeholder]" ).each( function () {
    var e = $( this )
    if ( e.attr( "placeholder" ).trim() in tdata) {
      e.attr( "placeholder", tdata[e.attr( "placeholder" ).trim()] )
    };
  });
};

exports.get = function ( text ) {
  var data = $( "body" ).data( "translations" );
  if ( data === undefined ) {
    return text.trim();
  }
  if ( text.trim() in data ) {
    return data[text.trim()];
  }
  return text.trim();
}

},{}],5:[function(require,module,exports){
var SERVER = "http://comments.aslo.cf";
var i18n = require( "./i18n.js" );
var animations = require( "./animations.js" );
var xo = require( "./xoPerson.js" );

exports.requestLogin = function () {
  $( ".login-popover" ).removeClass( "hide" );
}

exports.isLoggedIn = function () {
  return $( "body" ).data( "login" ) !== undefined;
}

exports.getInfo = function () {
  return $( "body" ).data( "login" );
}

exports.setup = function () {
  $( ".close-login-popover" ).click( function () {
    $( ".login-popover" ).addClass( "hide" );
  });

  $( "nav .login" ).click( exports.requestLogin );

  xo.refreshBar();
  $( ".shuffle-xo-bar" ).click( function () {
    xo.refreshBar();
  });

  $( "button.login" ).click( function () {
    animations.loading();
    postData = {
      username: $( ".login-form .username" ).val(),
      password: $( ".login-form .password" ).val()
    }
    $.post( SERVER + "/login", postData )
     .done( function ( data ) {
       $( ".login-form .error" ).css( "display", data.error? "block":"none" );
       if ( data.error ) {
         $( ".login-form .error .content" ).html( i18n.get( data.msg ) );
       } else {
         $( "body" ).data( "login",
                           { username: postData.username, token: data.token } );
         $( "nav .login" ).html( i18n.get( "Signed In" ) );
         $( ".login-popover" ).addClass( "hide" );
         animations.done();
       }
     });
  });

  $( "button.signup" ).click( function () {
    animations.loading();
    postData = {
      username: $( ".signup-form .username" ).val(),
      password: $( ".signup-form .password" ).val(),
      secret: $( ".signup-form .secret" ).val(),
      colors: xo.getSelected()
    }
    $.post( SERVER + "/signup", postData )
     .done( function ( data ) {
       $( ".signup-form .error" ).css( "display", data.error? "block":"none" );
       if ( data.error ) {
         $( ".signup-form .error .content" ).html( i18n.get( data.msg ) );
       } else {
         $( "body" ).data( "login",
                           { username: postData.username, token: data.token } );
         $( "nav .login" ).html( i18n.get( "Signed In" ) );
         $( ".login-popover" ).addClass( "hide" );
         animations.done();
       }
     });
  });
}

},{"./animations.js":2,"./i18n.js":4,"./xoPerson.js":10}],6:[function(require,module,exports){
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
      var bundleId = match[1]
      var itemData = $( "body" ).data( "activitiesData" )[ bundleId ];
      mainActivity.load( itemData, bundleId, false );
      return;
    }

    var r = /\/view\/([^\/]*)\/comment=([0-9a-zA-Z\-]*)$/;
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

},{"./activityList.js":1,"./comments.js":3,"./i18n.js":4,"./login.js":5,"./mainActivity.js":7,"./search.js":8}],7:[function(require,module,exports){
var util = require( "./util.js" );
var comments = require( "./comments.js" );
var i18n = require("./i18n.js" );

exports.load = function ( data, bundleId, setUrl ) {
  if ( setUrl ) {
    history.pushState(null, null, "/view/" + bundleId);
    window.location.changedByProgram = true;
  }
  document.title = util.trans( data.title )
                   + " - " + i18n.get( "Sugar Activities" );
  window.scrollTo( 0, 0 );

  var container = $( ".detail" );
  container.removeClass( "hide" );

  $( ".close", container ).click( function () {
    history.pushState(null, null, "/");
    document.title = i18n.get( "Sugar Activities" );
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

},{"./comments.js":3,"./i18n.js":4,"./util.js":9}],8:[function(require,module,exports){
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

},{"./util.js":9}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
var colors = [ "#00588c", "#5e008c", "#807500", "#008009", "#9a5200",
               "#b20008", "#005fe4", "#7f00bf", "#be9e00", "#00b20d",
               "#c97e00", "#e6000a", "#bccdff", "#d1a3ff", "#fffa00",
               "#8bff7a", "#ffc169", "#ffadce" ]

var svgTemplate = '<svg enable-background="new 0 0 55 55" height="55px" version="1.1" viewBox="0 0 55 55" width="55px" x="0px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" y="0px"><g display="block" id="stock-xo_1_"><path style="fill: FILL; stroke: STROKE" d="M33.233,35.1l10.102,10.1c0.752,0.75,1.217,1.783,1.217,2.932 c0,2.287-1.855,4.143-4.146,4.143c-1.145,0-2.178-0.463-2.932-1.211L27.372,40.961l-10.1,10.1c-0.75,0.75-1.787,1.211-2.934,1.211 c-2.284,0-4.143-1.854-4.143-4.141c0-1.146,0.465-2.184,1.212-2.934l10.104-10.102L11.409,24.995 c-0.747-0.748-1.212-1.785-1.212-2.93c0-2.289,1.854-4.146,4.146-4.146c1.143,0,2.18,0.465,2.93,1.214l10.099,10.102l10.102-10.103 c0.754-0.749,1.787-1.214,2.934-1.214c2.289,0,4.146,1.856,4.146,4.145c0,1.146-0.467,2.18-1.217,2.932L33.233,35.1z"  stroke-width="3.5"/><circle style="fill: FILL; stroke: STROKE" cx="27.371" cy="10.849" r="8.122" stroke-width="3.5"/></g></svg>'

var makeIcon = function ( stroke, fill, selectable ) {
  var svgText = svgTemplate.replace( /STROKE/g, stroke ).replace( /FILL/g, fill );
  var ele = $( "<span>" + svgText + "</span>" );
  ele.data( "color", stroke + "," + fill );
  if ( selectable ) {
    ele.click( function () {
      $( ".xo-person-bar svg" ).removeClass( "selected" );
      $( "body" ).data( "xoBarSelected", $( this ).data( "color" ) );
      $( this ).addClass( "selected" );
    });
  }
  return ele;
}
exports.makeIcon = makeIcon

exports.refreshBar = function ( stroke, fill ) {
  var random = function () { return Math.floor( Math.random() * (colors.length + 1) ) };
  var bar = $( ".xo-person-bar" );
  bar.html( "" );

  if ( window.sugarUser !== undefined ) {
    bar.append( makeIcon( window.sugarUser.stroke, window.sugarUser.fill, true ) );
  }
  for ( var i = 0; i < 5; i++ ) {
    bar.append( makeIcon( colors[random()], colors[random()], true ) );
  }
}


exports.getSelected = function () {
  var b = $( "body" );
  return b.data( "xoBarSelected" );
}

},{}]},{},[6])