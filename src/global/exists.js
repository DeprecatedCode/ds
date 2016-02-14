DefaultScript.global.exists = remember(null, '@exists', function $logic$(scopes, step, stepName, key, onException) {
  if (typeof key !== 'string') {
    throw new SyntaxError('Cannot determine if name exists');
  }


  for (var i = 0; i < scopes.length; i++) {
    var itemType = DefaultScript.global.type(scopes[i]);
    if (itemType === 'undefined') {
      return false;
    }

    if (scopes[i] === null) {
      return false;
    }

    if (itemType === 'object' && (key in scopes[i])) {
      var val = scopes[i][key];
      if (DefaultScript.global.type(val) === 'function') {
        val = val.bind(scopes[i]);
      }
      return val !== undefined;
    }

    if (itemType in DefaultScript.protoOverrides) {
      var property = DefaultScript.protoOverrides[itemType][key];

      if (typeof property === 'string') {
        val = scopes[i][property];
        if (DefaultScript.global.type(val) === 'function') {
          val = val.bind(scopes[i]);
        }
        return val !== undefined;;
      }

      else if (typeof property === 'function') {
        return true;
      }

      else {
        continue;
      }
    }

    var proto;

    switch (itemType) {
      case 'logic':
        return false;
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
      return val !== undefined;
    }
  }

  if (key[0] === '@') {
    var globalKey = key.substr(1);
    if (globalKey in DefaultScript.global) {
      return globalKey in DefaultScript.global;
    }
  }

  return false;
});
