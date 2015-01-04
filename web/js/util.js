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
