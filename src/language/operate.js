DefaultScript.operate = function (scopes, step, stepName, leftValue, operation, right, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  if (step === END) {
    throw new Error('Cannot provide END as step to operate()');
  }

  // DEBUG
  // DefaultScript.global.log('Operate:');
  // DefaultScript.global.log('Left = ', leftValue);
  // DefaultScript.global.log('Operation:', operation);
  // DefaultScript.global.log('Right = ', right);

  if (DefaultScript.global.type(leftValue) === 'logic' && leftValue.name === '$trap$') {
    DefaultScript.global.log('B', right);
    return DefaultScript.resolve(scopes, step, stepName, right, function (rightValue) {
      return leftValue(scopes, step, stepName, rightValue);
    });
  }

  var leftType = DefaultScript.global.type(leftValue);

  var resolveRight = function (fn) {
    return transformPossiblePause(DefaultScript.resolve(scopes, step, stepName, right, false, onException), function (rightValue) {
      var rightType = DefaultScript.global.type(rightValue);
      return fn(rightType, rightValue);
    });
  };

  var afterRightResolution = function (combinedOperator, rightType, rightValue) {
    if (combinedOperator === '+') {
      return leftValue + rightValue;
    }

    else if (combinedOperator === '-') {
      return leftValue - rightValue;
    }

    else if (combinedOperator === '*') {
      return leftValue * rightValue;
    }

    else if (combinedOperator === '/') {
      return leftValue / rightValue;
    }

    else if (combinedOperator === '=') {
      return leftValue === rightValue;
    }

    else if (combinedOperator === '!=') {
      return leftValue !== rightValue;
    }

    else if (combinedOperator === '&') {
      if (leftType === 'empty') {
        if (rightType === 'empty') {
          return transformPossiblePause(DefaultScript.get(scopes, step, stepName, '@it'), function (mergeValue) {
            var mergeType = DefaultScript.global.type(mergeValue);
            if (mergeType !== 'logic') {
              throw new Error('& merge: @it must be of type logic, not ' + mergeType);
            }
            return mergeValue(scopes, step, stepName, undefined, onException);
          });
        }

        else {
          throw new Error;
        }
      }

      else {
        throw new Error;
      }
    }

    else {
      throw new Error('Operation ' + combinedOperator + ' not implemented');
    }
  };

  if (operation.length === 0) {
    if (right.length === 0) {
      return leftValue;
    }

    return resolveRight(function (rightType, rightValue) {
      // DefaultScript.global.log('Operate:', leftValue, operation, rightValue)

      if (rightType === 'logic') {
        return rightValue(scopes, step, stepName, leftValue, onException);
      }

      else if (rightType === 'function') {
        try {
          return rightValue(leftValue);
        }

        catch (e) {
          onException(e, step, stepName);
        }
      }

      else if (leftType === 'string') {
        return leftValue + String(rightValue);
      }

      else {
        DefaultScript.global.log('Left:', leftValue);
        DefaultScript.global.log('Right:', rightValue);
        throw new Error('Invalid combination, ' + leftType + ' and ' + rightType);
      }
    });
  }

  else {
    var combinedOperator = operation.map(function (op) {
      return op[SOURCE];
    }).join('');

    if (combinedOperator.length > 1 && combinedOperator[combinedOperator.length - 1] === '-') {
      combinedOperator = combinedOperator.substr(0, combinedOperator.length - 1);

      return resolveRight(function (rightType, rightValue) {
        if (rightType !== 'number') {
          throw new Error('Cannot negate a value of type ' + rightType);
        }
        return afterRightResolution(combinedOperator, rightType, -1 * rightValue);
      });
    }

    return resolveRight(function (rightType, rightValue) {
      return afterRightResolution(combinedOperator, rightType, rightValue);
    });
  }
};
