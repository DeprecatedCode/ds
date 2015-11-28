DefaultScript.expression = function (scopes, step, triggerStepName, expression) {
  var stack = [];
  var left = [];
  var right = [];
  var operation = [];
  var value = EMPTY;

  return DefaultScript.walk(expression, triggerStepName, function (step, stepName) {
    if (step[TYPE] === BREAK || right.length > 0) {
      var operate = function (leftValue) {

        return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, function (_value_) {
          if (value.stepName === '@expect(actual: number)') {
            throw new Error(String(_value_));
          }

          left = [];
          right = [];
          operation = [];
          value = _value_;

          if (step[TYPE] !== BREAK) {
            right.push(step);
          }
        });
      };

      if (left.length > 0) {
        if (value !== EMPTY) {
          throw new Error('Invalid situation');
        }

        return DefaultScript.resolve(scopes, step, stepName, left, function (leftValue) {
          return operate(leftValue);
        });
      }

      return operate(value);
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
};
