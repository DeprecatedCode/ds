DefaultScript.pause = function (how) {
  var done;

  how(function () {
    if (typeof done !== 'function') {
      throw new Error('Nothing to do when resuming pause');
    }
    done();
  });

  return function $pause$(_done_) {
    done = _done_;
  };
};
