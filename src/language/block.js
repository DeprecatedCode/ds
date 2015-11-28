DefaultScript.block = function (type, position) {
  if (type !== GROUP && type !== LOGIC && type !== ARRAY) {
    throw new Error('Invalid block type');
  }
  var block = [];
  block[TYPE] = type;
  block[SOURCE] = [];
  block[POSITION] = position;
  block.$type$ = 'block';
  return block;
};
