DefaultScript.pause = function (wait) {
  var done;
  var noResume = new Error('Nothing to do when resuming pause');

  wait(function $resume$() {
    if (typeof done !== 'function') {
      throw noResume;
    }
    done();
  });

  return function $pause$(_done_) {
    done = _done_;
  };
};
