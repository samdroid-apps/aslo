exports.get = function (url, callback) {
  var key = 'HTTP_CACHE' + url;
  if (localStorage[key] !== undefined) {
    callback(JSON.parse(localStorage[key]));
  };

  $.get(url).done(function (response) {
    localStorage[key] = JSON.stringify(response);
    callback(response);
  });
};
