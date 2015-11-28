DefaultScript.token = function (type, position, value) {
  if (type !== BREAK && type !== NAME && type !== OPERATOR && type !== STRING) {
    throw new Error('Invalid token type');
  }
  var token = [];
  token[TYPE] = type;
  token[SOURCE] = value || '';
  token[POSITION] = position;
  token.$type$ = 'token';
  return token;
};
