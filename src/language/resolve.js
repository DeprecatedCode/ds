DefaultScript.resolve = function (scopes, step, triggerStepName, stack) {
  const STATE_DOT = 0;
  const STATE_NAME = 1;

  // DefaultScript.global.log('Resolve:', stack);
  var value = EMPTY;
  var state = EMPTY;

  return DefaultScript.walk(stack, triggerStepName, function (step, stepName) {
    if (step[TYPE] === OPERATOR && step[SOURCE] === '.') {
      if (state === EMPTY) {
        console.log(value)
      }
      state = STATE_DOT;
    }

    else if ((state === STATE_DOT || state === EMPTY) && step[TYPE] === NAME) {

      if (state === EMPTY && /^\d+$/.test(step[SOURCE])) {
        value = parseInt(step[SOURCE], 10);
      }

      else {
        state = STATE_NAME;
        return DefaultScript.get(value === EMPTY ? scopes : value, step, stepName, function (_value_) {
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
      console.log(step)
      throw new Error('Invalid step to resolve');
    }
  }, function (resolve) {
    resolve(value);
  });
};
