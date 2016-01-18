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
    var allScopes = scopes.concat(valueScopes, createdScopes);

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
          suppressEvaluation = false;
        }
      }

      if (step === END || step[TYPE] === BREAK) {
        if (expectKey) {
          throw new Error('Key expected');
        }

        return transformPossiblePause(DefaultScript.expression(allScopes, lastStep, lastStepName, stack, onException), function (value) {
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
        return transformPossiblePause(DefaultScript.expression(allScopes, lastStep, lastStepName, stack, onException), function (conditionValue) {
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

      return DefaultScript.pause(function (resume) {
        setTimeout(resume, 10);
      });
    }, function () {
      return returnValue !== EMPTY ? returnValue : scopes[0];
    }, onException);
  });
};
