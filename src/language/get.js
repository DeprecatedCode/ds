DefaultScript.get = function (scopes, step, stepName, overrideKey) {
  if (step[TYPE] !== NAME && typeof overrideKey !== 'string') {
    throw new SyntaxError('Cannot get value');
  }

  var key = overrideKey || step[SOURCE];
  var value;

  for (var i = 0; i < scopes.length; i++) {
    if (typeof scopes[i] === 'undefined') {
      throw new TypeError('cannot get property ' + key + ' of undefined');
    }

    if (scopes[i] === null) {
      throw new TypeError('cannot get property ' + key + ' of null');
    }

    if (typeof scopes[i] === 'object' && (key in scopes[i])) {
      var val = scopes[i][key];
      if (DefaultScript.global.type(val) === 'function') {
        val = val.bind(scopes[i]);
      }
      return val;
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

    if (proto && (key in proto)) {
      var val = scopes[i][key];
      if (DefaultScript.global.type(val) === 'function') {
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
};
