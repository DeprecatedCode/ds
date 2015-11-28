DefaultScript.logic = function (block, name) {
  return remember(block, name, function $logic$(scopes, step, stepName, value) {
    var stack = [];
    var key = [];
    var expectKey = false;
    var lastValue = EMPTY;

    var isNameOrDot = function (step) {
      return step[TYPE] === NAME || (
        step[TYPE] === OPERATOR && step[SOURCE] === '.'
      );
    };

    return DefaultScript.walk(block[SOURCE], name, function (step, stepName) {

      if (step[TYPE] === BREAK) {
        if (expectKey) {
          throw DefaultScript.error(new Error('Key expected'), step);
        }

        stack.push(step);

        return DefaultScript.expression(scopes, step, stepName, stack, function (value) {
          stack = [];

          if (key.length === 0) {
            lastValue = value;
          }

          else {
            return DefaultScript.set(scopes, step, stepName, key, value, function () {
              key = [];
            });
          }

        });
      }

      else if (step[TYPE] === OPERATOR && step[SOURCE] === ':') {
        if (expectKey || key.length > 0) {
          throw DefaultScript.error(new Error('Unexpected :'), step);
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
    }, function (resolve) {
      resolve(lastValue !== EMPTY ? lastValue : scopes);
    });
  });
};
