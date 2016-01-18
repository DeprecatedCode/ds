DefaultScript.onException = function (err, step, stepName) {
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
