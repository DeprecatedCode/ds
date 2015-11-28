DefaultScript.walk = function (source, name, each, done) {
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

  var next = function () {
    if (typeof i === 'undefined') {
      i = 0;
    }

    if (i >= source.length) {
      done(resolve);
    }

    else {
      var handler = each(source[i], name);
      i += 1;

      if (typeof handler === 'function') {
        handler(next);
        paused = true;
      }

      else {
        next();
      }
    }
  };

  next();

  if (!paused) {
    return value;
  }

  return DefaultScript.pause(function (_resume_) {
    resume = _resume_;
  });
};
