DefaultScript.expression = function (scopes, step, triggerStepName, expression) {
  var stack = [];
  var left = [];
  var right = [];
  var operation = [];
  var value = EMPTY;
  expression.push(END);

  return DefaultScript.walk(expression, triggerStepName, function (step, stepName) {
    if (step !== END && (step[TYPE] === NAME || (step[TYPE] === OPERATOR && step[SOURCE] === '.'))) {
      var lastLeft = left.length > 0 ? left[left.length - 1] : null;
      console.log(value, operation, right);
      if ((value === EMPTY && operation.length === 0 && right.length === 0) &&
          (lastLeft === null || lastLeft[TYPE] === OPERATOR)) {
        left.push(step);
      }
      else {
        right.push(step);
      }
    }

    else if (step === END || step[TYPE] === BREAK || right.length > 0) {
      var operate = function (leftValue) {
        return transformPossiblePause(DefaultScript.operate(scopes, step, stepName, leftValue, operation, right), function (_value_) {
          left = [];
          right = [];
          operation = [];
          value = _value_;

          if (step !== END && step[TYPE] !== BREAK) {
            right.push(step);
          }
        });
      };

      if (left.length > 0) {
        if (value !== EMPTY) {
          throw new Error('Invalid situation');
        }

        return transformPossiblePause(DefaultScript.resolve(scopes, step, stepName, left), function (leftValue) {
          return operate(leftValue);
        });
      }

      return operate(value);
    }

    else if (step[TYPE] === OPERATOR) {
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
