DefaultScript.expression = function (scopes, step, triggerStepName, expression, done) {
  var stack = [];
  var left = [];
  var right = [];
  var operation = [];
  var value = EMPTY;

  return DefaultScript.walk(expression, triggerStepName, function (step, stepName) {
    if (step[TYPE] === BREAK || right.length > 0) {
      var leftValue;

      if (left.length > 0) {
        if (value !== EMPTY) {
          throw new Error('Invalid situation');
        }

        leftValue = DefaultScript.resolve(scopes, step, stepName, left);
      }

      return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, function (_value_) {
        left = [];
        right = [];
        operation = [];
        value = _value_;
      });
    }

    else if (step[TYPE] === OPERATOR && step[SOURCE] !== '.') {
      operation.push(step);
    }

    else if (value === EMPTY && left.length === 0 && operation.length === 0) {
      left.push(step);
    }

    else /* has value or operation.length > 0 */ {
      right.push(step);
    }
  }, function (resolve) {
    resolve(value);
  });
}
