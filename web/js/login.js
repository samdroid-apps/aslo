var SERVER = 'http://comments.aslo.cf';

var i18n = require('./i18n.js');
var animations = require('./animations.js');
var xo = require('./xoPerson.js');

exports.requestLogin = function () {
  $('.login-popover').removeClass('hide');
};

exports.isLoggedIn = function () {
  return $('body').data('login') !== undefined;
};

exports.getInfo = function () {
  return $('body').data('login');
};

exports.setup = function () {
  $('.close-login-popover').click(function () {
    $('.login-popover').addClass('hide');
  });

  $('nav .login').click(exports.requestLogin);

  xo.refreshBar();
  $('.shuffle-xo-bar').click(function () {
    xo.refreshBar();
  });

  $('button.login').click(function () {
    animations.loading();

    postData = {
      username: $('.login-form .username').val(),
      password: $('.login-form .password').val()
    };

    $.post(SERVER + '/login', postData).done(function (data) {
      $('.login-form .error').css('display', data.error ? 'block' : 'none');

      if (data.error) {
        $('.login-form .error .content').html(i18n.get(data.msg));
      } else {
        $('body').data('login', {
          username: postData.username,
          token: data.token
        });

        $('nav .login').html(i18n.get('Signed In'));
        $('.login-popover').addClass('hide');
        animations.done();
      }
    });
  });

  $('button.signup').click(function () {
    animations.loading();

    postData = {
      username: $('.signup-form .username').val(),
      password: $('.signup-form .password').val(),
      secret: $('.signup-form .secret').val(),
      colors: xo.getSelected()
    };

    $.post(SERVER + '/signup', postData).done(function (data) {
      $('.signup-form .error').css('display', data.error ? 'block' : 'none');
      if (data.error) {
        $('.signup-form .error .content').html(i18n.get(data.msg));
      } else {
        $('body').data('login', {
          username: postData.username,
          token: data.token
        });

        $('nav .login').html(i18n.get('Signed In'));
        $('.login-popover').addClass('hide');
        animations.done();
      }
    });
  });
};
