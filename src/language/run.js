DefaultScript.run = function () {
  if (isNode) {
    if (isMain) {
      var result;
      var name = process.argv[2];

      if (typeof name !== 'string') {
        throw new Error('Usage: ds source.ds');
      }

      if (name === '--help') {
        resumeCallback(DefaultScript.import('lib/help', [], DefaultScript.onException))(function (value) {
          // Don't care about the result, but we need to handle this
          // DefaultScript.global.log('Result:', value);
        });
      }

      else {
        resumeCallback(DefaultScript.import(name, [], DefaultScript.onException))(function (value) {
          // Don't care about the result, but we need to handle this
          // DefaultScript.global.log('Result:', value);
        });
      }
    }

    else {
      module.exports = function (source, name) {
        throw new Error('Not implemented');
        var logic = DefaultScript.logic([], DefaultScript.parse(source, DefaultScript.onException), name);
        var scopes = [DefaultScript.global.scope()];
        DefaultScript.global.log('E', logic)
        return resumeCallback(logic(scopes, null, name, undefined, DefaultScript.onException));
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
