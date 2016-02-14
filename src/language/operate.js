DefaultScript.operate = function (scopes, step, stepName, leftValue, operation, right, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  if (step === END) {
    throw new Error('Cannot provide END as step to operate()');
  }

  // DEBUG
  DefaultScript.global.console.log('Operate left, operation, right:');
  DefaultScript.global.log(leftValue, operation, right);

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
      console.log(leftValue, rightValue)
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

    else if (combinedOperator === '<>') {
      return leftValue !== rightValue;
    }

    else if (combinedOperator === '&') {
      /**
       * Rules:
       * {& foo} .............. evaluate logic foo in context
       * {foo &} .............. merge context into foo
       * foo {&} .............. evaluate logic foo (@it) in context
       * {bar & foo} .......... evaluate logic foo in bar
       * foo {bar &} .......... evaluate logic foo (@it) in bar
       * foo {& bar} .......... evaluate logic bar in context, providing foo as @it to bar

       * foo [1, 2, &, 4] ..... concat array foo in context
       * [1, 2, & foo, 4] ..... concat array foo in context
       * [1, 2, foo &, 4] ..... append context values to foo
       * foo & [1, 2, 3] ...... concat context onto foo
       * [1, 2, 3] & foo ...... concat foo into context
       */
      if (leftType === 'empty') {
        leftValue = scopes[0];
        leftType = DefaultScript.global.type(leftValue);
      }

      var merge = function (mergeValue, mergeType) {
        if (leftType === 'array') {
          if (mergeType !== 'array') {
            throw new Error('& merge: value must be of type array, not ' + mergeType);
          }
          leftValue.push.apply(leftValue, mergeValue);
          return EMPTY;
        }

        else if (leftType === 'object') {
          if (mergeType !== 'logic') {
            throw new Error('& merge: value must be of type logic, not ' + mergeType);
          }
          return mergeValue([leftValue].concat(scopes), step, stepName, undefined, onException);
        }

        else {
          throw new Error;
        }
      };

      if (rightType === 'empty') {
        return transformPossiblePause(DefaultScript.get(scopes, step, stepName, '@it', onException), function (value) {
          return merge(value, DefaultScript.global.type(value));
        });
      }

      return merge(rightValue, rightType);
    }

    else {
      throw new Error('Operation ' + combinedOperator + ' not implemented');
    }
  };

  if (operation.length > 0 && operation[0][SOURCE] === '!') {
    leftValue = !leftValue;
    operation.shift();
  }

  if (operation.length === 0) {
    if (right.length === 0) {
      return leftValue;
    }

    return resolveRight(function (rightType, rightValue) {
      // DefaultScript.global.log('Operate:', leftValue, operation, rightValue)

      if (rightType === 'logic') {
        return rightValue(scopes, step, stepName, leftValue, onException);
      }

      else if (rightType === 'array' && leftType === 'number') {
        return rightValue[leftValue];
      }

      else if (rightType === 'function') {
        return rightValue(leftValue);
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
