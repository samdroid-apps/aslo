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
