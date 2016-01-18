DefaultScript.expression = function (scopes, step, triggerStepName, expression, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  var stack = [];
  var left = [];
  var right = [];
  var operation = [];
  var value = EMPTY;
  var lastStep;
  var lastStepName;
  expression.push(END);

  // DEBUG
  // DefaultScript.global.log('');
  // DefaultScript.global.log('');
  // DefaultScript.global.log('');
  // DefaultScript.global.log('');
  // DefaultScript.global.log('EXPRESSION', expression);

  return DefaultScript.walk(expression, triggerStepName, function (step, stepName) {
    if (step !== END) {
      lastStep = step;
      lastStepName = stepName;
    }
    var reset = function (_value_) {
      left = [];
      right = [];
      operation = [];
      value = _value_;

      if (step[TYPE] === OPERATOR) {
        operation.push(step);
      }

      else if (step !== END && step[TYPE] !== BREAK) {
        left.push(step);
      }
    };

    var operate = function (leftValue) {
      return transformPossiblePause(
        DefaultScript.operate(scopes, lastStep, lastStepName, leftValue, operation, right, onException),
        reset
      );
    };

    var stepIsValue = step[TYPE] !== OPERATOR && step[TYPE] !== BREAK;

    // DEBUG
    // DefaultScript.global.log('');
    // var x = function (y) { return y[SOURCE]; };
    // DefaultScript.global.log('V', value, '  L =', left.map(x), '  O =', operation.map(x), '  R =', right.map(x), '  S =', x(step));

    if (step !== END && (stepIsValue || (step[TYPE] === OPERATOR && step[SOURCE] === '.'))) {
      var lastLeft = left.length > 0 ? left[left.length - 1] : null;
      var lastRight = right.length > 0 ? right[right.length - 1] : null;
      var lastLeftIsValue = lastLeft && lastLeft[TYPE] !== OPERATOR && lastLeft[TYPE] !== BREAK;
      var lastRightIsValue = lastRight && lastRight[TYPE] !== OPERATOR && lastRight[TYPE] !== BREAK;

      var leftDotOrName = lastLeft === null ||
        (step[TYPE] === OPERATOR && step[SOURCE] === '.' && lastLeftIsValue) ||
        (lastLeft[TYPE] === OPERATOR && lastLeft[SOURCE] === '.' && stepIsValue);

      var rightDotOrName = lastRight === null ||
        (step[TYPE] === OPERATOR && step[SOURCE] === '.' && lastRightIsValue) ||
        (lastRight[TYPE] === OPERATOR && lastRight[SOURCE] === '.' && stepIsValue);

      if (leftDotOrName && operation.length === 0 && right.length === 0) {
        left.push(step);
      }

      else if (value !== EMPTY && operation.length === 0 && right.length === 0) {
        return transformPossiblePause(
          DefaultScript.operate(scopes, lastStep, lastStepName, value, operation, left, onException),
          reset
        );
      }

      else if (rightDotOrName) {
        right.push(step);
      }

      else {
        return transformPossiblePause(
          DefaultScript.resolve(scopes, step, stepName, left, false, onException),
          function (leftValue) {
            return operate(leftValue);
          }
        );
      }
    }

    else if ((step[TYPE] === OPERATOR && right.length > 0) || step === END || step[TYPE] === BREAK) {
      if (left.length > 0) {
        if (value !== EMPTY) {
          if (operation.length || right.length) {
            throw new SyntaxError('Incomplete expression');
          }

          return transformPossiblePause(
            DefaultScript.operate(scopes, lastStep, lastStepName, value, [], left, onException),
            reset
          );
        }

        return transformPossiblePause(
          DefaultScript.resolve(scopes, step, stepName, left, false, onException),
          function (leftValue) {
            return operate(leftValue);
          }
        );
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
  }, function () {
    return value;
  }, onException);
};
