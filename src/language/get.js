DefaultScript.get = function (scopes, step, stepName) {
  var key = step[SOURCE];
  var value;

  for (var i = 0; i < scopes.length; i++) {
    if (key in scopes[i]) {
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
