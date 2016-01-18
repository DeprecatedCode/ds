DefaultScript.set = function (scopes, step, stepName, key, value, onException) {
  if (typeof onException !== 'function') {
    throw new TypeError('onException must be provided');
  }

  /**
   * Goals of set:
   * 1. Get the parent context from scopes as possible
   * 2. Set the new property on that parent
   */
  if (key.length === 1) {
    scopes[0][key[0][SOURCE]] = value;
    return;
  }

  var lastDot = key[key.length - 2];
  var lastKey = key[key.length - 1];

  if (lastDot[TYPE] !== OPERATOR || lastDot[SOURCE] !== '.') {
    throw new SyntaxError('Invalid key');
  }

  var contextStack = key.slice(0, key.length - 2);

  return transformPossiblePause(DefaultScript.resolve(scopes, step, stepName, contextStack, true), function (context) {
    context[lastKey[SOURCE]] = value;
  });
};
