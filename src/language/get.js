DefaultScript.get = function (scopes, step, stepName, next) {
  var key = step[SOURCE];
  var value;

  for (var i = 0; i < scopes.length; i++) {
    if (key in scopes[i]) {
      value = scopes[i][key];
      if (typeof next === 'function') {
        next(value);
      }
      return value;
    }
  }

  if (key[0] === '@') {
    var globalKey = key.substr(1);
    if (globalKey in DefaultScript.global) {
      value = scopes[i][globalKey];
      if (typeof next === 'function') {
        next(value);
      }
      return value;
    }
  }

  throw DefaultScript.error(new Error(key + ' is not defined'), step, stepName);
};
