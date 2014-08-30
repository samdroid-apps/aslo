var colors = [
    '#00588c',
    '#5e008c',
    '#807500',
    '#008009',
    '#9a5200',
    '#b20008',
    '#005fe4',
    '#7f00bf',
    '#be9e00',
    '#00b20d',
    '#c97e00',
    '#e6000a',
    '#bccdff',
    '#d1a3ff',
    '#fffa00',
    '#8bff7a',
    '#ffc169',
    '#ffadce'
  ];
var svgTemplate = '<svg enable-background="new 0 0 55 55" height="55px" version="1.1" viewBox="0 0 55 55" width="55px" x="0px" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" y="0px"><g display="block" id="stock-xo_1_"><path style="fill: FILL; stroke: STROKE" d="M33.233,35.1l10.102,10.1c0.752,0.75,1.217,1.783,1.217,2.932 c0,2.287-1.855,4.143-4.146,4.143c-1.145,0-2.178-0.463-2.932-1.211L27.372,40.961l-10.1,10.1c-0.75,0.75-1.787,1.211-2.934,1.211 c-2.284,0-4.143-1.854-4.143-4.141c0-1.146,0.465-2.184,1.212-2.934l10.104-10.102L11.409,24.995 c-0.747-0.748-1.212-1.785-1.212-2.93c0-2.289,1.854-4.146,4.146-4.146c1.143,0,2.18,0.465,2.93,1.214l10.099,10.102l10.102-10.103 c0.754-0.749,1.787-1.214,2.934-1.214c2.289,0,4.146,1.856,4.146,4.145c0,1.146-0.467,2.18-1.217,2.932L33.233,35.1z"  stroke-width="3.5"/><circle style="fill: FILL; stroke: STROKE" cx="27.371" cy="10.849" r="8.122" stroke-width="3.5"/></g></svg>';
var makeIcon = function (stroke, fill, selectable) {
  var svgText = svgTemplate.replace(/STROKE/g, stroke).replace(/FILL/g, fill);
  var ele = $('<span>' + svgText + '</span>');
  ele.data('color', stroke + ',' + fill);
  if (selectable) {
    ele.click(function () {
      $('.xo-person-bar svg').removeClass('selected');
      $('body').data('xoBarSelected', $(this).data('color'));
      $(this).addClass('selected');
    });
  }
  return ele;
};
exports.makeIcon = makeIcon;
exports.refreshBar = function (stroke, fill) {
  var random = function () {
    return Math.floor(Math.random() * (colors.length + 1));
  };
  var bar = $('.xo-person-bar');
  bar.html('');
  if (window.sugarUser !== undefined) {
    bar.append(makeIcon(window.sugarUser.stroke, window.sugarUser.fill, true));
  }
  for (var i = 0; i < 5; i++) {
    bar.append(makeIcon(colors[random()], colors[random()], true));
  }
};
exports.getSelected = function () {
  var b = $('body');
  return b.data('xoBarSelected');
};