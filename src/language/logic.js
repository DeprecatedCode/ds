DefaultScript.logic = function (createdScopes, block, name) {
  block.push(END);

  if (!Array.isArray(createdScopes)) {
    throw new TypeError('Invalid use of logic([scope, ...])');
  }

  return remember(block, name, function $logic$(scopes, step, stepName, value, onException) {
    if (typeof onException !== 'function') {
      throw new TypeError('onException must be provided');
    }

    if (!Array.isArray(scopes)) {
      throw new TypeError('Invalid use of $logic$([scope, ...])');
    }

    var stack = [];
    var key = [];
    var expectKey = false;
    var returnValue = EMPTY;

    var valueScopes = typeof value !== 'undefined' ? [{'@it': value}] : [];
    var allScopes = valueScopes.concat(scopes, createdScopes);

    // DEBUG
    // DefaultScript.global.beforeUnload(function (err) {
    //   DefaultScript.global.log(allScopes);
    // });

    var isNameOrDot = function (step) {
      return step[TYPE] === NAME || (
        step[TYPE] === OPERATOR && step[SOURCE] === '.'
      );
    };

    var lastStep;
    var lastStepName;
    var suppressEvaluation;

    return DefaultScript.walk(block[SOURCE], name, function (step, stepName) {
      if (step !== END) {
        lastStep = step;
        lastStepName = stepName;
      }

      if (suppressEvaluation) {
        if (step === END || step[TYPE] === BREAK) {
          stack = [];
          key = [];
          expectKey = false;
          suppressEvaluation = false;
        }
        return;
      }

      if (step === END || step[TYPE] === BREAK) {
        if (expectKey) {
          if (key.length && stack.length === 0) {
            stack = key.slice();
            expectKey = false;
          }

          else {
            throw new Error('Key expected');
          }
        }

        return transformPossiblePause(DefaultScript.expression(allScopes, lastStep, lastStepName, stack, EMPTY, onException), function (value) {
          stack = [];

          if (key.length === 0) {
            returnValue = value;
          }

          else {
            return transformPossiblePause(DefaultScript.set(allScopes, lastStep, lastStepName, key, value, onException), function () {
              key = [];
            });
          }
        });
      }

      else if (step[TYPE] === OPERATOR && step[SOURCE] === '?') {
        if (stack.length > 0) {
          // auto-prepend = when first stack item before ? is not an operator
          var firstStackItem = stack[0];
          if (firstStackItem[TYPE] !== OPERATOR) {
            var impliedEqualsOperator = [];
            impliedEqualsOperator[POSITION] = firstStackItem[POSITION];
            impliedEqualsOperator[TYPE] = OPERATOR;
            impliedEqualsOperator[SOURCE] = '=';
            stack.unshift(impliedEqualsOperator);
          }
        }
        return transformPossiblePause(DefaultScript.expression(allScopes, lastStep, lastStepName, stack, value, onException), function (conditionValue) {
          stack = [];
          if (!conditionValue) {
            suppressEvaluation = true;
          }
        });
      }

      else if (step[TYPE] === OPERATOR && step[SOURCE] === ':') {
        if (expectKey || key.length > 0) {
          throw new Error('Unexpected :');
        }

        if (stack.length === 0) {
          expectKey = true;
        }

        else {
          key = stack;
          stack = [];
        }
      }

      else if (expectKey && isNameOrDot(step)) {
        key.push(step);
      }

      else if (expectKey && key.length === 0) {
        key.push(step);
        expectKey = false;
      }

      else {
        expectKey = false;
        stack.push(step);
      }

      if (DefaultScript.tickCallback) {
        return DefaultScript.pause(DefaultScript.tickCallback);
      }
    }, function () {
      return returnValue !== EMPTY ? returnValue : scopes[0];
    }, onException);
  });
};
