DefaultScript.resolve = function (scopes, step, triggerStepName, stack) {
  const STATE_DOT = 0;
  const STATE_NAME = 1;
  const STATE_NUMBER = 2;
  const STATE_DECIMAL = 3;

  // DefaultScript.global.log('Resolve:', stack);
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
        throw DefaultScript.error(new SyntaxError('Invalid .'), step, stepName);
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
        return transformPossiblePause(DefaultScript.get(value === EMPTY ? scopes : [value], step, stepName), function (_value_) {
          value = _value_;
        });
      }
    }

    else if (state !== EMPTY) {
      throw new Error('Invalid state');
    }

    else if (step[TYPE] === STRING) {
      value = step[SOURCE];
    }

    else if (step[TYPE] === LOGIC) {
      value = DefaultScript.logic(step, stepName);
    }

    else {
      throw new Error('Invalid step to resolve: ' + JSON.stringify(step));
    }
  }, function (resolve) {
    resolve(value);
  });
};
