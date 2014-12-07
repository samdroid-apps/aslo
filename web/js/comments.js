var SHFR = 'https://use-socialhelp.sugarlabs.org';
var SOCIALHELP = 'https://socialhelp.sugarlabs.org';

var i18n = require('./i18n.js');

exports.load = function (bundleId) {
  $('.comments').hide();
  $('.no-comments').hide();

  var url = SHFR + '/goto/' + bundleId + '.json';
  $.get(url).done(function (request) {
    if (!request.success) {
      //  TODO
      return;
    }

    var data = request.data;
    if (data.length === 0) {
      $('.comments').hide();
      $('.no-comments').show();

      $('.no-comments a.start-conversation').attr('href',
                                                  SHFR + '/goto/' + bundleId);
      return;
    } else {
      $('.no-comments').hide();
      $('.comments').show();

      $('.comments-header a').attr('href', SHFR + '/goto/' + bundleId);

      var count = i18n.get('{} comments')
                      .replace('{}', request.count.toString());
      $('.comments-header .count').text(count);
    }

    $('.comments-list').html('')

    for (var i = 0; i < data.length; i++) {
      var li = makeCommentItem(data[i]);
      $('.comments-list').append(li);
    }
  }).fail(downloadCommentsError);
};

var makeCommentItem = function (data) {
  var li = $('<li>');

  var link = $('<a>');
  link.attr('href', SOCIALHELP + '/t/' + data.s);
  li.append(link);

  var title = $('<span class="comment-title">');
  title.text(data.t);
  link.append(title);

  var heartCount = $('<span class="heart-count">');
  heartCount.text(data.l.toString());
  heartCount.prepend($('<i class="fa fa-heart">'));
  link.append(heartCount);

  var postCount = $('<span class="post-count">');
  postCount.text(data.l.toString());
  postCount.prepend($('<i class="fa fa-comment">'));
  link.append(postCount);

  return li;
}

var downloadCommentsError = function () {
    // TODO
}
