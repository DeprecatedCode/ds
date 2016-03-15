DefaultScript.global.expect = remember(null, '@expect', function $logic$(scopes, step, stepName, actualValue, onException) {
  var label = '@expect(actual: ' + DefaultScript.global.type(actualValue) + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, expectedValue, onException) {
    if (actualValue !== expectedValue) {
      return onException(new Error('Woah'));
    }
    DefaultScript.global.log('QSNMQSKQNMSQS');
  });
});
