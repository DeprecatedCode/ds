DefaultScript.resolve = function (scopes, step, triggerStepName, stack, createOnEmpty, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  const STATE_DOT = 0;
  const STATE_NAME = 1;
  const STATE_VALUE = 2;
  const STATE_NUMBER = 3;
  const STATE_DECIMAL = 4;

  // DEBUG
  // DefaultScript.global.log('Resolve:', stack.map(function (s) {
  //   return s[SOURCE];
  // }));

  var value = EMPTY;
  var state = EMPTY;

  return DefaultScript.walk(stack, triggerStepName, function (step, stepName) {
    if (step[TYPE] === OPERATOR && step[SOURCE] === '.') {
      if (state === EMPTY) {
        value = 0;
        state = STATE_DECIMAL;
      }

      else if (state === STATE_NUMBER) {
        state = STATE_DECIMAL;
      }

      else if (state === STATE_DOT) {
        throw new SyntaxError('Invalid .');
      }

      else {
        state = STATE_DOT;
      }
    }

    else if ((state === STATE_DECIMAL || state === STATE_DOT || state === EMPTY) &&
             step[TYPE] === NAME) {
      if (/^\d+$/.test(step[SOURCE])) {
        if (state === STATE_DECIMAL) {
          value = parseFloat(String(value) + '.' + step[SOURCE], 10);
        }
        else {
          value = parseInt(step[SOURCE], 10);
        }
        state = STATE_NUMBER;
      }

      else {
        state = STATE_NAME;
        return transformPossiblePause(DefaultScript.get(value === EMPTY ? scopes : [value], step, stepName, undefined, onException), function (_value_) {
          if (typeof _value_ === 'undefined') {
            // DEBUG
            // DefaultScript.global.log('Value:', value);
            // DefaultScript.global.log('Scopes:', scopes);

            throw new Error(step[SOURCE] + ' is not defined');
          }
          value = _value_;
        });
      }
    }

    else if (state !== EMPTY) {
      throw new Error('Invalid state');
    }

    else if (step[TYPE] === STRING) {
      state = STATE_VALUE;
      value = step[SOURCE];
    }

    else if (step[TYPE] === GROUP) {
      state = STATE_VALUE;
      return transformPossiblePause(DefaultScript.group(scopes, step, stepName, onException), function (_value_) {
        value = _value_;
      });
    }

    else if (step[TYPE] === LOGIC) {
      state = STATE_VALUE;
      value = DefaultScript.logic(scopes, step, stepName);
    }

    else if (step[TYPE] === ARRAY) {
      state = STATE_VALUE;
      return transformPossiblePause(DefaultScript.array(scopes, step, stepName, onException), function (_value_) {
        value = _value_;
      });
    }

    else {
      throw new Error('Invalid step to resolve: ' + JSON.stringify(step));
    }
  }, function () {
    return value;
  }, onException);
};
