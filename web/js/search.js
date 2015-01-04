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
