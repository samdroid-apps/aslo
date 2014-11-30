(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var util = require('./util.js');
var mainActivity = require('./mainActivity.js');
var search = require('./search.js');
var featured = require('./featured.js');

exports.add = function (container, bundleId) {
  var ele = $('<a class=\'activity\'>');
  activitiesData = $('body').data('activitiesData');
  var data = activitiesData[bundleId];

  var icon = $('<img class=\'icon\' />');
  icon.attr('src', data.icon);
  ele.append(icon);

  var title = $('<span class=\'title\'>' + util.trans(data.title) + '</span>');
  ele.append(title);
  $(container).append(ele);

  var l = (data.categories || ['none']).reverse();
  ele.addClass('category-' + l[1]);

  ele.attr('href', '/view/' + bundleId);
  ele.data('json', data);
  ele.data('bundleId', bundleId);
  ele.data('searchString', search.makeSearchString(data));
  ele.click(function (e) {
    e.preventDefault();
    mainActivity.downloadAndLoad($(this).data('json'), $(this).data('bundleId'), true);
  });
};

exports.setup = function () {
  activitiesData = $('body').data('activitiesData');
  for (var key in activitiesData) {
    if (activitiesData.hasOwnProperty(key)) {
      exports.add('.activities', key);
    }
  }

  featured.load($('body').data('featuredData'), activitiesData);
};

},{"./featured.js":3,"./mainActivity.js":6,"./search.js":7,"./util.js":8}],2:[function(require,module,exports){
var SHFR = 'https://use-socialhelp.sugarlabs.org';
var SOCIALHELP = 'https://socialhelp.sugarlabs.org';

exports.load = function (bundleId) {
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
                                                  SHFR + '/goto/' + bundleId)
      return;
    } else {
      $('.no-comments').hide();
      $('.comments').show();

      $('.comments-header a').attr('href', SHFR + '/goto/' + bundleId)
    }

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

},{}],3:[function(require,module,exports){
var mainActivity = require('./mainActivity.js');
var i18n = require('./i18n.js');

exports.load = function (all, activities) {
  var lang = i18n.getLangToUse(Object.keys(all));

  if (lang === null) {
    $('.featured').hide();
    return;
  }

  var data = all[lang];

  $('.featured > a').attr('href', '/view/' + data.id);
  $('.featured > a').click(function (e) {
    e.preventDefault();
    mainActivity.downloadAndLoad(activities[data.id], data.id, true);

  });
  $('.featured').css('background', data.bg);
  $('.featured').css('background-size', data.bg_size);
  StyleFix.styleAttribute($('.featured')[0]);

  $('.featured h1').html(data.title);
  $('.featured .description').html(data.description);
  $('.featured img').attr('src', activities[data.id].icon);
};

},{"./i18n.js":4,"./mainActivity.js":6}],4:[function(require,module,exports){
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
var langsAvaliable = ['id'];
exports.getLangToUse = function (langList) {
  if (langList === undefined) {
    var langList = langsAvaliable;
  }

  try {
    if (localStorage.testlang !== 'undefined' && localStorage.testlang !== undefined) {
      return localStorage.testlang;
    }
  } catch (e) {
    // Edge case for when the local storage database dies in firefox
  }

  var ul = navigator.language || navigator.userLanguage;
  if (langList.indexOf(ul) !== -1) {
    return ul;
  }

  for (var i in langList) {
    var l = langList[i];
    if (l.substr(0, 2) == ul.substr(0, 2)) {
      return l;
    }
  }

  return null;
};

exports.setup = function () {
  l = exports.getLangToUse();
  if (l === null) {
    return;
  }

  var url = '/translations/' + l + '.json';
  $.get(url).done(function (data) {
    $('body').data('translations', data);
    translateBody(data);
  });
};

var translateBody = function (tdata) {
  $('*[i18n-content]').each(function () {
    var e = $(this);
    if (e.html().trim() in tdata) {
      e.html(tdata[e.html().trim()]);
    }
  });

  $('*[i18n-title]').each(function () {
    var e = $(this);
    if (e.attr('title').trim() in tdata) {
      e.attr('title', tdata[e.attr('title').trim()]);
    }
  });

  $('*[i18n-placeholder]').each(function () {
    var e = $(this);
    if (e.attr('placeholder').trim() in tdata) {
      e.attr('placeholder', tdata[e.attr('placeholder').trim()]);
    }
  });
};

exports.get = function (text) {
  var data = $('body').data('translations');

  if (data === undefined) {
    return text.trim();
  }

  if (text.trim() in data) {
    return data[text.trim()];
  }

  return text.trim();
};

},{}],5:[function(require,module,exports){
var activityList = require('./activityList.js');
var mainActivity = require('./mainActivity.js');
var search = require('./search.js');

var i18n = require('./i18n.js');
i18n.setup();

var goBasedOnUrl = function () {
  if ($('body').data('oldPathname') === window.location.pathname) {
    return;
  } else {
    $('body').data('oldPathname', window.location.pathname);
  }

  if (!window.location.pathname || window.location.pathname === '/') {
    document.title = i18n.get('Sugar Activities');
    var container = $('.detail');
    container.addClass('hide');
  }

  if (window.location.pathname && !window.location.changedByProgram) {
    var testString = window.location.pathname;
    var r = /\/view\/([^\/]*)$/;
    match = r.exec(testString);
    if (match) {
      var bundleId = match[1];
      $.ajax({ url: '/data/' + bundleId + '.json' }).done(function (data) {
        mainActivity.load(data, bundleId, false, true);
      });
    }
  }
  window.location.changedByProgram = false;
};

var dataUrl = '/data.json';
$(document).ready(function () {
  if (window.location.pathname === '/' || window.location.pathname.substr(0, 5) === '/view') {
    var list = $('.activities');
    var detail = $('.detail');

    goBasedOnUrl();
    $.ajax({ url: dataUrl }).done(function (data) {
      $('body').data('activitiesData', data.activities);
      $('body').data('featuredData', data.featured);
      activityList.setup();
      setInterval(goBasedOnUrl, 750);
    });

    search.setup();
  }
});

},{"./activityList.js":1,"./i18n.js":4,"./mainActivity.js":6,"./search.js":7}],6:[function(require,module,exports){
var util = require('./util.js');
var comments = require('./comments.js');
var i18n = require('./i18n.js');

exports.downloadAndLoad = function (dataSoFar, bundleId, setUrl) {
  exports.load(dataSoFar, bundleId, setUrl, true);
  $.ajax({ url: '/data/' + bundleId + '.json' }).done(function (data) {
    exports.load(data, bundleId, false, false);
  });
};

exports.load = function (data, bundleId, setUrl, loadComments) {
  if (setUrl) {
    history.pushState(null, null, '/view/' + bundleId);
    window.location.changedByProgram = true;
  }

  document.title = util.trans(data.title) + ' - ' + i18n.get('Sugar Activities');

  window.scrollTo(0, 0);

  var container = $('.detail');
  container.removeClass('hide');

  $('.close', container).click(function () {
    history.pushState(null, null, '/');
    document.title = i18n.get('Sugar Activities');
    container.addClass('hide');
  });

  $('.title', container).html(util.trans(data.title));
  // $('img.icon', container).attr('src', data.icon);
  $('.description', container).html(util.trans(data.description));

  $('.github', container).hide();
  if (data.github_url !== undefined) {
    $('.github', container).show();
    $('.github', container).attr('href', 'https://www.github.com/' + data.github_url);
  }

  var versionData = null;
  if (util.getSugarVersion() >= util.sugarVersionToInt(data.minSugarVersion)) {
    versionData = data;
  } else {
    for (i in data.releases) {
      if (util.getSugarVersion() >= util.sugarVersionToInt(data.releases[i].minSugarVersion)) {
        versionData = data.releases[i];
        break;
      }
    }
  }

  $('.noversion').hide();
  if (versionData === null) {
    $('.noversion').show();
    versionData = data;
  }

  $('.download', container).attr('href', versionData.xo_url);

  if ($(util.trans(versionData.whats_new)).text()) {
    $('.whatsnewlabel').show();
    $('.whatsnew', container).html(util.trans(versionData.whats_new));
  } else {
    $('.whatsnewlabel').hide();
    $('.whatsnew').html('');
  }

  $('.minversion', container).html(versionData.minSugarVersion);

  $('.screenshots', container).html('');
  screenshots = util.trans(versionData.screenshots);
  for (i in screenshots) {
    var ele = $('<img>');
    var imageSrc = screenshots[i];
    ele.addClass('screenshot');
    ele.attr('src', imageSrc);
    $('.screenshots', container).append(ele);
  }

  if (screenshots === '' || screenshots.length === 1) {
    $('i.icon', container).hide();
  } else {
    $('i.icon', container).show();
  }

  $('i.icon', container).click(function () {
    var s = $('.screenshots', container);
    s.toggleClass('closed');
  });

  $('.download-devel', container).hide();
  if (data.xo_url_latest) {
    $('.download-devel', container).show();
    $('.download-devel', container).attr('href', data.xo_url_latest);
  }

  $('.by', container).html('');
  for (i in data.by) {
    var ele = $('<a>');
    var person = data.by[i];
    ele.attr('href', person.page);
    ele.html(person.name);
    $('.by', container).append(ele);
  }

  if (loadComments) {
    comments.load(bundleId);
  }
};

},{"./comments.js":2,"./i18n.js":4,"./util.js":8}],7:[function(require,module,exports){
var lastQuery = '';
var lastCategory = '';
var currentCategory = 'any';

var util = require('./util.js');

var doSearch = function () {
  term = $('input.search').val().toLowerCase();

  var catTerm = '';

  if (currentCategory !== 'any') {
    catTerm = 'CATEGORY:' + currentCategory;
  }

  if (term === '' && catTerm === '') {
    $('.activities a').each(function (index) {
      $(this).show();
    });
  } else {
    if (term.indexOf(lastQuery) === 0 && catTerm === lastCategory) {
      // If they just appended to the query the results
      // will be a subset of what is seen now
      var ele = $('.activities a:visible');
    } else {
      var ele = $('.activities a');
    }

    var termList = (catTerm + ' ' + term).split(' ');
    ele.each(function (index) {
     var ss = $(this).data('searchString') || '';
      if (ss === '') {
        $(this).hide();
      }

      var found = true;
      var i = 0;
      while (found && i < termList.length) {
        found = ss.indexOf(termList[i]) !== -1 && found;
        i++;
      }

      if (found) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  }

  lastCategory = catTerm;
  lastQuery = term;
};

exports.setup = function () {
  $('input.search').on('input', doSearch);

  $('.categories i').click(function () {
    $('.categories i').removeClass('checked');
    $(this).addClass('checked');
    currentCategory = $(this).attr('filter');
    doSearch();
  });
};

exports.makeSearchString = function (data) {
  catString = '';

  for (i in data.categories || []) {
    catString += ' CATEGORY:' + data.categories[i];
  }

  return util.trans(data.title).toLowerCase() + '  ' + util.trans(data.description).toLowerCase() + catString;
};

},{"./util.js":8}],8:[function(require,module,exports){
exports.repeatS = function (s, t) {
  var r = '';
  for (var i = 0; i < t; i++) {
    r += s;
  }
  return r;
};

exports.trans = function (obj) {
  if (obj === undefined || obj === null) {
    return '';
  }

  var ul = navigator.language || navigator.userLanguage;
  if (obj[ul] !== undefined) {
    // Same lang, same country
    return obj[ul];
  }

  for (key in obj) {
    // Same lang, different country
    if (obj.hasOwnProperty(key)) {
      if (key.substr(0, 2) == ul.substr(0, 2)) {
        return obj[key];
      }
    }
  }

  if ('en-US' in obj) {
    return obj['en-US'];
  }

  for (key in obj) {
    // Anything
    if (obj.hasOwnProperty(key)) {
      return obj[key];
    }
  }
};

var DEFAULT_SUGAR = 86;
exports.getSugarVersion = function () {
  var r = /SugarLabs\/0\.([0-9]+)/;
  match = r.exec(navigator.userAgent);
  if (match) {
    return parseInt(match[1]);
  }
  return DEFAULT_SUGAR;  // Default version
};

exports.sugarVersionToInt = function (vString) {
  var r = /0\.([0-9]+)/;
  match = r.exec(vString);
  if (match) {
    return parseInt(match[1]);
  }
  return DEFAULT_SUGAR;
};

},{}]},{},[5])