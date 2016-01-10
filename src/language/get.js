DefaultScript.get = function (scopes, step, stepName) {
  var key = step[SOURCE];
  var value;

  for (var i = 0; i < scopes.length; i++) {
    if (typeof scopes[i] === 'undefined') {
      throw DefaultScript.error(new TypeError('cannot get property ' + key + ' of undefined'), step, stepName);
    }

    if (scopes[i] === null) {
      throw DefaultScript.error(new TypeError('cannot get property ' + key + ' of null'), step, stepName);
    }

    var proto = Object.getPrototypeOf(scopes[i]);
    if ((typeof scopes[i] === 'object' && (key in scopes[i])) ||
        (proto && (key in proto))) {
      return scopes[i][key];
    }
  }

  if (key[0] === '@') {
    var globalKey = key.substr(1);
    if (globalKey in DefaultScript.global) {
      return DefaultScript.global[globalKey];
    }
  }

  throw DefaultScript.error(new Error(key + ' is not defined'), step, stepName);
};
