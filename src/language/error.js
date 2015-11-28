DefaultScript.error = function (err, step) {
  var desc;

  if ('value' in step) {
    desc = '`' + step[VALUE] + '`';
  }

  else {
    desc = [
      'break',
      'name',
      'operator',
      'group',
      'logic',
      'array',
      'string'
    ][step[TYPE]];
  }

  err.stack = [];

  err.name = '@' + err.name;

  err.message = err.message + ' near ' + desc + ' at ' + step[POSITION]() +
     '\n' + step[POSITION].getSource(true);

  return err;
};
