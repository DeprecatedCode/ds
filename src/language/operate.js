DefaultScript.operate = function (scopes, step, stepName, leftValue, operation, right) {

  if (DefaultScript.global.type(leftValue) === 'logic' && leftValue.name === '$trap$') {
    return DefaultScript.resolve(scopes, step, stepName, right, function (rightValue) {
      return leftValue(scopes, step, stepName, rightValue, next);
    });
  }

  // DefaultScript.global.log('\n\nOperate:', leftValue, operation, right, '\n\n');

  var leftType = DefaultScript.global.type(leftValue);

  var resolveRight = function (fn) {
    return DefaultScript.resolve(scopes, step, stepName, right, function (rightValue) {
      var rightType = DefaultScript.global.type(rightValue);
      return fn(rightType, rightValue);
    });
  }

  if (operation.length === 0) {
    return resolveRight(function (rightType, rightValue) {
      console.log('###', leftValue, operation, rightValue)
      if (rightType === 'logic') {
        return rightValue(scopes, step, stepName, leftValue, next);
      }

      else if (rightType === 'function') {
        try {
          return rightValue(leftValue);
        }

        catch (e) {
          throw new DefaultScript.error(e, step, stepName);
        }
      }

      else {
        var message = 'Invalid combination, ' + leftType + ' and ' + rightType;
        throw DefaultScript.error(
          new Error(message), step, stepName
        );
      }
    });
  }

  else if (operation[operation.length - 1][SOURCE] === '!') {
    leftValue = !leftValue;
    operation.pop();
    return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, next);
  }

  else if (operation.length > 1 && operation[0][SOURCE] === '-') {
    leftValue = -1 * leftValue;
    operation.pop();
    return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, next);
  }

  else {
    var combinedOperator = operation.map(function (op) {
      return op[SOURCE];
    }).join('');

    if (combinedOperator === '+') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue + rightValue;
      });
    }

    else if (combinedOperator === '-') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue - rightValue;
      });
    }

    else if (combinedOperator === '*') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue * rightValue;
      });
    }

    else if (combinedOperator === '/') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue / rightValue;
      });
    }

    throw new Error('Operation ' + combinedOperator + ' not implemented');
  }
};
