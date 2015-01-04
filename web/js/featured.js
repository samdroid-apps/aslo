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
