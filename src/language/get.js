DefaultScript.get = function (scopes, step, stepName, overrideKey, onException) {
  if (step[TYPE] !== NAME && typeof overrideKey !== 'string') {
    throw new SyntaxError('Cannot get value');
  }

  var key = overrideKey || step[SOURCE];
  var value;

  for (var i = 0; i < scopes.length; i++) {
    var itemType = DefaultScript.global.type(scopes[i]);
    if (itemType === 'undefined') {
      throw new TypeError('cannot get property ' + key + ' of undefined');
    }

    if (scopes[i] === null) {
      throw new TypeError('cannot get property ' + key + ' of null');
    }

    if (itemType === 'object' && (key in scopes[i])) {
      var val = scopes[i][key];
      if (DefaultScript.global.type(val) === 'function') {
        val = val.bind(scopes[i]);
      }
      return val;
    }

    if ((itemType in DefaultScript.protoOverrides) && (key in DefaultScript.protoOverrides[itemType])) {
      return DefaultScript.protoOverrides[itemType][key]([], step, stepName, scopes[i], onException);
    }

    var proto;

    switch (itemType) {
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
      case 'array':
        proto = Object.getPrototypeOf(scopes[i]);
        break;
      default:
        throw new Error('Invalid scope type: ' + itemType);
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
