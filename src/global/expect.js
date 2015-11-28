DefaultScript.global.expect = remember(null, '@expect', function $logic$(scopes, step, stepName, actualValue) {
  var label = '@expect(actual: ' + DefaultScript.global.type(actualValue) + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, expectedValue) {
    if (actualValue !== expectedValue) {
      throw new Error('Woah');
    }
    console.log('QSNMQSKQNMSQS');
  });
});
