var SERVER = 'http://comments.aslo.cf';
var WS_SERVER = 'ws://comments.aslo.cf/comments/stream';

var animations = require('./animations.js');
var util = require('./util.js');
var i18n = require('./i18n.js');
var login = require('./login.js');
var xo = require('./xoPerson.js');

exports.setup = function () {
  $('.comments .add').click(function () {
    if (!login.isLoggedIn()) {
      login.requestLogin();
      return;
    }

    var text = $('.comments .add-content').val();
    var rating = $('.star-sel').data('selected');
    var type = $('.comments .types i.checked').attr('value');
    var replyContent, replyId;

    if (type === 'reply') {
      replyContent = $('.comments > blockquote').html();
      replyId = $('.comments > blockquote').data('id');
    }

    if ($('.comments .add').data('bundleId') === undefined) {
      return;
    }

    animations.loading();
    $.post(SERVER + '/comments/post', {
      username: login.getInfo().username,
      token: login.getInfo().token,
      bundle_id: $('.comments .add').data('bundleId'),
      content: text,
      type: type,
      rating: rating,
      lang: navigator.language || navigator.userLanguage,
      reply_content: replyContent,
      reply_id: replyId
    }).done(function (_) {
      animations.done();
      exports.load($('.comments .add').data('bundleId'));
    });
  });

  connectCommentWS();
  setupSelectors();
};

var connectCommentWS = function () {
  var socket = new WebSocket(WS_SERVER);

  socket.onmessage = function (info) {
    var data = JSON.parse(info.data);

    if (data.event == 'add_comment') {
      if ($('.comments ul #' + data.data.id).length == 0) {
        addComment(data.data);
        animations.addComment();
      }
    } else if (data.event == 'remove_comment') {
      console.log('rm', data);
      $('.comments ul #' + data.data).remove();
    } else {
      console.log('Unknown WS message: ', data);
    }
  };
};

var setupSelectors = function () {
  $('.comments .types i').click(function () {
    $('.comments .types i').removeClass('checked');
    $(this).addClass('checked');

    var type = $(this).attr('value');
    if (type !== 'reply') {
      $('.comments > blockquote').hide();
      $('.comments .types i[value=reply]').removeClass('checked').hide();
    }

    if (type !== 'review') {
      $('.comments > .star-sel').hide();
    } else {
      $('.comments > .star-sel').show();
    }

    if (type !== 'problem') {
      $('.comments > .bug-tip').hide();
    } else {
      $('.comments > .bug-tip').show();
    }
  });

  $('.star-sel').data('selected', 1);
  $('.star-sel i').click(function () {
    var n = parseInt($(this).attr('id'));
    $('.star-sel').data('selected', n);

    $('.star-sel i').removeClass('fa-star');
    $('.star-sel i').addClass('fa-star-o');

    while (n > 0) {
      $('.star-sel i#' + n).removeClass('fa-star-o');
      $('.star-sel i#' + n).addClass('fa-star');
      n--;
    }
  });
};
exports.load = function (bundleId) {
  $('.comments > blockquote').hide();
  $('.comments .types i[value=reply]').removeClass('checked').hide();

  $.post(SERVER + '/comments/get/' + bundleId).done(function (strData) {
    var container = $('.comments ul');
    container.html('');

    var data = JSON.parse(strData);
    for (i in data) {
      var item = data[i];
      addComment(item);
    }

    var focusOn = $('body').data('focusOnComment');
    if (focusOn !== undefined) {
      $('html, body').animate({ scrollTop: $('.comments ul li#' + focusOn).offset().top - 10 }, 500);
      focusOn = null;
    }
  });

  $('.comments .add').data('bundleId', bundleId);
};

var addComment = function (item) {
  var ele = $('<li>');
  ele.attr('id', item.id);

  var colors = item.colors.split(',') || [
      '',
      ''
    ];
  var person = xo.makeIcon(colors[0], colors[1], false);
  person.attr('title', item.user);
  ele.append(person);

  var type = $('<span class=\'type-icon\'></span>');
  type.addClass(item.type);
  ele.append(type);

  if (item.type === 'reply') {
    var bq = $('<blockquote class=\'reply-content\'>');
    bq.html(item.reply_content);
    ele.append(bq);
  }

  if (item.type === 'review' || item.type === undefined) {
    var stars = $('<span class=\'stars\'>' + util.repeatS('<i class=\'fa fa-star\'></i>', item.rating) + util.repeatS('<i class=\'fa fa-star-o\'></i>', 5 - item.rating) + '</span>');
    $('input[value=' + item.rating.toString() + ']', stars).attr('checked', '');
    ele.append(stars);
  }

  var text = $('<p>');
  text.html(item.text);
  ele.append(text);

  var report = $('<i class=\'fa fa-flag\' style=\'margin-right: 5px;\'></i>');
  report.attr('title', i18n.get('Flag this comment for review'));
  report.data('id', item.id);
  report.click(function () {
    $.post(SERVER + '/comments/report', { id: report.data('id') });
    animations.done();
    $(this).attr('disabled', 'true');
    $(this).parent().addClass('reported');
  });
  ele.append(report);

  var link = $('<a><i class=\'fa fa-link\' style=\'margin-right: 5px;\'></i></a>');
  var bundleId = $('.comments .add').data('bundleId');
  link.attr('title', i18n.get('Link to this comment'));
  link.attr('href', '/view/' + bundleId + '/comment=' + item.id);
  link.data('id', item.id);
  link.click(function (event) {
    var id = $(this).data('id');
    $('html, body').animate({ scrollTop: $('.comments ul li#' + id).offset().top - 10 }, 500);
    history.pushState(null, null, $(this).attr('href'));
    event.preventDefault();
  });
  ele.append(link);

  var reply = $('<i class=\'fa fa-reply\'></i>');
  reply.attr('title', i18n.get('Reply to this comment'));
  reply.data('id', item.id);
  reply.data('text', ele.html());
  reply.click(function () {
    $('.comments > .star-sel').hide();
    $('.comments > .bug-tip').hide();

    $('.comments > blockquote').show();
    $('.comments > blockquote').data('id', $(this).data('id'));
    $('.comments > blockquote').html($(this).data('text').replace(/<blockquote class=\"reply-content\">.*<\/blockquote>/, ''));

    $('.comments .types i').removeClass('checked');
    $('.comments .types i[value=reply]').addClass('checked').show();
    $('html, body').animate({ scrollTop: $('.comments > blockquote').offset().top - 10 }, 500);
  });

  ele.append(reply);
  ele.prependTo($('.comments ul'));
};
