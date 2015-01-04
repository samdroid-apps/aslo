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
  container.append(ele);

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
  var activitiesData = $('body').data('activitiesData');
  var oldContainer = $('ul.activities');
  var container = $('<ul class="activities">');
  container.hide();

  for (var key in activitiesData) {
    if (activitiesData.hasOwnProperty(key)) {
      exports.add(container, key);
    }
  }

  $('.all-activities').append(container);
  container.show();
  oldContainer.remove();

  featured.load($('body').data('featuredData'), activitiesData);
};
