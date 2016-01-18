var sequence = 0;

DefaultScript.pause = function (wait) {
  var noResume = new Error('Nothing to do when resuming pause');
  var tooManyPause = new Error('Pause resume cannot return another pause');

  var pause = function $pause$() {
    throw new Error('Use pause.onResume()')
  };

  pause.onResume = function (done) {
    pause.done = done;
  };

  // pause.pauseId = ++sequence;
  // DefaultScript.global.log('paused', pause.pauseId);
  // if (pause.pauseId === 57) {
  //   debugger;
  // }

  wait(function $resume$() {
    if (typeof pause.done !== 'function') {
      // // DEBUG
      // DefaultScript.global.log('cannot resume', pause.pauseId);
      // DefaultScript.global.log('Was resumed by', wait.toString());
      // DefaultScript.global.log((new Error).stack);
      throw noResume;
    }

    var result = pause.done.apply(null, Array.prototype.slice.call(arguments));

    // If the result is a pause, we did something wrong
    if (typeof result === 'function' && result.name === '$pause$') {
      debugger

      throw tooManyPause;
    }
  });

  return pause;
};
