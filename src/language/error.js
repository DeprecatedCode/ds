DefaultScript.error = function (err, step, stepName) {
  var desc;

  if (!step || !stepName) {
    throw new Error('Invalid use of DefaultScript.error');
  }

  if (typeof step[SOURCE] === 'string' && step[SOURCE].length > 0) {
    desc = '`' + step[SOURCE] + '`';
  }

  else {
    desc = DefaultScript.tokenTypes[step[TYPE]].toLowerCase();
  }

  err.stack = [];

  err.name = '@' + err.name;

  err.message = err.message + ' near ' + desc + ' at ' + step[POSITION]() +
     '\n' + step[POSITION].getSource(true);

  return err;
};
