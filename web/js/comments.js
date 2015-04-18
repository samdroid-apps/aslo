/*
* Copyright (C) Sam Parkinson 2014
*
* This file is part of ASLO.
*
* ASLO is free software: you can redistribute it and/or modify it under
* the terms of the GNU Affero General Public License as published by
* the Free Software Foundation, either version 3 of the License, or
* (at your option) any later version.
*
* ASLO is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with ASLO.  If not, see <http://www.gnu.org/licenses/>.
*/

var SHFR = 'https://use-socialhelp.sugarlabs.org';
var SOCIALHELP = 'https://socialhelp.sugarlabs.org';

var i18n = require('./i18n.js');
var cache = require('./cache.js');

exports.load = function (bundleId) {
  $('.comments').hide();
  $('.no-comments').hide();

  var url = SHFR + '/goto/' + bundleId + '.json';
  cache.get(url, function (request) {
    if (!request.success) {
      //  TODO
      return;
    }

    $('.comments-bubble').removeClass('hide');

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
  });
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
  postCount.text(data.p.toString());
  postCount.prepend($('<i class="fa fa-comment">'));
  link.append(postCount);

  return li;
}

var downloadCommentsError = function () {
    // TODO
}
