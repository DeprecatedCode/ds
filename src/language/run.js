DefaultScript.run = function () {
  var onException = function (err, step, stepName) {
    if (step === END) {
      throw new Error('Cannot provide END as step to error()');
    }


    var desc;

    if (!step || !stepName) {
      throw new Error('Must provide step and stepName to onException');
    }

    if (typeof step[SOURCE] === 'string' && step[SOURCE].length > 0) {
      desc = '`' + step[SOURCE] + '`';
    }

    else {
      desc = DefaultScript.tokenTypes[step[TYPE]].toLowerCase();
    }

    DefaultScript.beforeUnload(err);

    console.error('[ds] No receiver for raised event: \n' + step[POSITION].getSource(true) + '\n@' + err.name + ': ' +
      err.message + ' near ' + desc + ' at ' + step[POSITION]());

    if (isNode) {
      console.error('\n[ds] Node.js implementation details:');
      console.error(err.stack);
      process.exit(1);
    }
  };

  if (isNode) {
    if (isMain) {
      var result;
      var name = process.argv[2];

      if (typeof name !== 'string') {
        throw new Error('Usage: ds source.ds');
      }

      if (name === '--help') {
        resumeCallback(DefaultScript.import('lib/help', [], onException))(function (value) {
          // Don't care about the result, but we need to handle this
          // DefaultScript.global.log('Result:', value);
        });
      }

      else {
        resumeCallback(DefaultScript.import(name, [], onException))(function (value) {
          // Don't care about the result, but we need to handle this
          // DefaultScript.global.log('Result:', value);
        });
      }
    }

    else {
      module.exports = function (source, name) {
        throw new Error('Not implemented');
        var logic = DefaultScript.logic([], DefaultScript.parse(source, onException), name);
        var scopes = [DefaultScript.global.scope()];
        DefaultScript.global.log('E', logic)
        return resumeCallback(logic(scopes, null, name, undefined, onException));
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
