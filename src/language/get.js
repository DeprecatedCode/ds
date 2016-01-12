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

    var proto;

    switch (typeof scopes[i]) {
      case 'number':
        proto = Number;
        break;
      case 'boolean':
        proto = Boolean;
        break;
      case 'string':
        proto = String;
        break;
      case 'function':
        proto = Function;
        break;
      case 'object':
        proto = Object.getPrototypeOf(scopes[i]);
        break;
      default:
        throw new Error('Invalid scope type: ' + (typeof scopes[i]));
    }

    if ((typeof scopes[i] === 'object' && (key in scopes[i])) ||
        (proto && (key in proto))) {
      var val = scopes[i][key];
      if (typeof val === 'function') {
        val = val.bind(scopes[i]);
      }
      return val;
    }
  }

  if (key[0] === '@') {
    var globalKey = key.substr(1);
    if (globalKey in DefaultScript.global) {
      return DefaultScript.global[globalKey];
    }
  }

  throw new Error;

  throw DefaultScript.error(new Error(key + ' is not defined'), step, stepName);
};
