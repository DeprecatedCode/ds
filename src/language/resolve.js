DefaultScript.resolve = function (scopes, step, triggerStepName, stack, next) {
  const STATE_DOT = 0;
  const STATE_NAME = 1;

  DefaultScript.global.log('Resolve:', stack);
  var value = EMPTY;
  var state = EMPTY;

  DefaultScript.walk(stack, triggerStepName, function (step, stepName) {
    if (state === STATE_NAME && step[TYPE] === OPERATOR && step[SOURCE] === '.') {
      state = STATE_DOT;
    }

    else if ((state === STATE_DOT || state === EMPTY) && step[TYPE] === NAME) {
      state = STATE_NAME;
      return DefaultScript.get(value === EMPTY ? scopes : value, step, stepName, function (_value_) {
        value = _value_;
      });
    }

    else {
      throw new Error('Invalid state');
    }
  }, function (resolve) {
    if (typeof next === 'function') {
      next(55);
    }
    return 55;
  });
};
