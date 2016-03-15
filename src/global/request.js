if (isBrowser) {
  DefaultScript.global.request = function (config, data) {
    /**
     * https://gist.github.com/Xeoncross/7663273
     * IE 5.5+, Firefox, Opera, Chrome, Safari XHR object
     */
    if (typeof config !== 'object') {
      config = {url: config, method: 'GET'};
    }

    if (typeof data !== 'undefined') {
      config.data = data;
      config.method = 'POST';
    }

    var x = new(window.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
    x.open(config.method, config.url, 1);
    x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    x.send(config.data);

    return function (callback) {
      if (typeof callback !== 'function') {
        throw new Error('Invalid use of @request');
      }
      x.onreadystatechange = function () {
        x.readyState > 3 && callback(x.responseText, x);
      };
    };
  };
}

else if (isNode) {
  var http = require('http');
  DefaultScript.global.request = function () {
    throw new Error('not implemented');
  };
}

else {
  throw new Error('No request client available');
}
