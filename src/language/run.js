DefaultScript.run = function () {
  if (isNode) {
    if (require.main === module) {
      var result;
      var name = process.argv[2];

      if (typeof name !== 'string') {
        throw new Error('Usage: ds source.ds');
      }

      if (name === '--help') {
        resumeCallback(DefaultScript.import('lib/help'))(function (value) {
          // Don't care about the result, but we need to handle this
          // console.log('Result:', value);
        });
      }

      else {
        resumeCallback(DefaultScript.import(name))(function (value) {
          // Don't care about the result, but we need to handle this
          // console.log('Result:', value);
        });
      }
    }

    else {
      module.exports = function (source, name) {
        throw new Error('Not implemented');
        var logic = DefaultScript.logic(name, DefaultScript.parse(source));
        var scopes = [DefaultScript.global.scope()];
        console.log(logic)
        return resumeCallback(logic(scopes, null, name, EMPTY));
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
