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
