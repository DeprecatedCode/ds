DefaultScript.walk = function (sourceSteps, sourceName, each, next, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  var i = 0;
  var value;
  var lastStep;
  var resolved = false;
  var resolve = function (_value_) {
    resolved = true;
    value = _value_;
  };

  var nextStep = function () {
    try {
      if (typeof i === 'undefined') {
        i = 0;
      }

      if (i >= sourceSteps.length) {
        return transformPossiblePause(next(), resolve);
      }

      else {
        if (sourceSteps[i] !== END) {
          lastStep = sourceSteps[i];
        }

        return transformPossiblePause(each(sourceSteps[i], sourceName), function () {
          i += 1;
          return nextStep();
        });
      }
    }

    catch (e) {
      onException(e, lastStep, sourceName);
    }
  };

  var possiblePause = transformPossiblePause(nextStep(), function () {
    return value;
  });

  if (resolved) {
    return value;
  }

  return possiblePause;
};
