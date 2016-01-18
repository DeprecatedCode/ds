DefaultScript.group = function (scopes, block, name, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  if (!Array.isArray(scopes)) {
    throw new TypeError('Invalid use of group([scope, ...])');
  }

  var stack = [];
  var key = [];
  var expectKey = false;
  var returnValue = EMPTY;

  var isNameOrDot = function (step) {
    return step[TYPE] === NAME || (
      step[TYPE] === OPERATOR && step[SOURCE] === '.'
    );
  };

  return DefaultScript.walk(block[SOURCE], name, function (step, stepName) {
    if (step[TYPE] === BREAK) {
      if (expectKey) {
        throw new Error('Key expected');
      }

      return transformPossiblePause(DefaultScript.expression(scopes, step, stepName, stack, onException), function (value) {
        stack = [];

        if (key.length === 0) {
          returnValue = value;
        }

        else {
          return transformPossiblePause(DefaultScript.set(scopes, step, stepName, key, value, onException), function () {
            key = [];
          });
        }
      });
    }

    else if (step[TYPE] === OPERATOR && step[SOURCE] === ':') {
      if (expectKey || key.length > 0) {
        throw new Error('Unexpected :');
      }

      if (stack.length === 0) {
        expectKey = true;
      }

      else {
        key = stack;
        stack = [];
      }
    }

    else if (expectKey && isNameOrDot(step)) {
      key.push(step);
    }

    else if (expectKey && key.length === 0) {
      key.push(step);
      expectKey = false;
    }

    else {
      expectKey = false;
      stack.push(step);
    }

    return DefaultScript.pause(function (resume) {
      setTimeout(resume, 10);
    });
  }, function (resolve) {
    resolve(returnValue !== EMPTY ? returnValue : undefined);
  }, onException);
};
