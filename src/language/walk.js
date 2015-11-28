DefaultScript.walk = function (sourceSteps, sourceName, each, next) {
  var i = 0;
  var paused = false;
  var resume;
  var value;
  var resolve = function (_value_) {
    value = _value_;
    if (resume) {
      resume(value);
    }
  };

  var nextStep = function () {
    if (typeof i === 'undefined') {
      i = 0;
    }

    if (i >= sourceSteps.length) {
      next(resolve);
    }

    else {
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
  };

  nextStep();

  if (!paused) {
    return value;
  }

  return DefaultScript.pause(function (_resume_) {
    resume = _resume_;
  });
};
