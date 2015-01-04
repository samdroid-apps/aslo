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

exports.done = function () {
  var ele = $('<span class=\'done\'></span>');
  $('body').append(ele);
  setTimeout(function () {
    ele.remove();
  }, 2000);
};

exports.loading = function () {
  var ele = $('<span class=\'done load\'></span>');
  $('body').append(ele);
  setTimeout(function () {
    ele.remove();
  }, 2000);
};

var defaultNewCommentText = 'New Comment - Scroll Up to See';
exports.addComment = function () {
  var ele = $('<span class=\'new-item\'>' + i18n.get(defaultNewCommentText) + '</span>');
  $('body').append(ele);
  setTimeout(function () {
    ele.remove();
  }, 3000);
};
