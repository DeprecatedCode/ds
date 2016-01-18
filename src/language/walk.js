DefaultScript.walk = function (sourceSteps, sourceName, each, next, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  var i = 0;
  var paused = false;
  var resume;
  var value;
  var lastStep;
  var resolve = function (_value_) {
    value = _value_;
    if (resume) {
      resume(value);
    }
  };

  var nextStep = function () {
    try {
      if (typeof i === 'undefined') {
        i = 0;
      }

      if (i >= sourceSteps.length) {
        next(resolve);
      }

      else {
        if (sourceSteps[i] !== END) {
          lastStep = sourceSteps[i];
        }

        var handler = each(sourceSteps[i], sourceName);
        i += 1;

        if (typeof handler === 'function' && handler.name === '$pause$') {
          handler(nextStep);
          paused = true;
        }

        else {
          nextStep();
        }
      }
    }

    catch (e) {
      onException(e, lastStep, sourceName);
    }
  };

  nextStep();

  if (!paused) {
    return value;
  }

  return DefaultScript.pause(function (_resume_) {
    resume = _resume_;
  });
};
