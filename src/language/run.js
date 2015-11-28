DefaultScript.run = function () {
  if (isNode) {
    if (require.main === module) {
      var result;
      var name = process.argv[2];
      if (typeof name !== 'string') {
        throw new Error('Usage: node ds source.ds');
      }
      if (name === '--help') {
        result = DefaultScript.import('lib/help');
        if (typeof result === 'function' && result.name === '$pause$') {
          result(function (value) {
            // @todo what to do when logic pauses?
          });
        }
      }
      else {
        result = DefaultScript.import(name);
        if (typeof result === 'function' && result.name === '$pause$') {
          result(function (value) {
            // @todo what to do when logic pauses?
          });
        }
      }
    }

    else {
      module.exports = function (source, name) {
        var logic = DefaultScript.logic(name, DefaultScript.parse(source));
        var scopes = [DefaultScript.global.scope()];
        var result = logic(scopes);
        return function (done) {
          if (typeof result === 'function' && result.name === '$pause$') {
            result(done);
          }
          else {
            done(result);
          }
        };
      };
    }
  }

  else if (isBrowser) {
    window.DefaultScript = DefaultScript;
  }

  else {
    throw new Error('No valid environment found');
  }
};
