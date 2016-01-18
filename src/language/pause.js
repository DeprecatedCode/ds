DefaultScript.pause = function (wait) {
  var done;
  var noResume = new Error('Nothing to do when resuming pause');

  wait(function $resume$() {
    if (typeof done !== 'function') {
      console.error((new Error).stack);
      throw noResume;
    }

    done.apply(null, Array.prototype.slice.call(arguments));
  });

  return function $pause$(_done_) {
    done = _done_;
  };
};
