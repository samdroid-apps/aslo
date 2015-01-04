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

var cache = require('./cache.js');

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
var langsAvaliable = ['id', 'es', 'fr', 'hi', 'pt', 'bn', 'de', 'ar', 'ms'];

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
  cache.get(url, function (data) {
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
