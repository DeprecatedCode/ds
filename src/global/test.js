DefaultScript.global.test = remember(null, '@test', function $trap$(scopes, step, stepName, description) {
  if (DefaultScript.global.type(description) !== 'string') {
    throw DefaultScript.error(
      new TypeError('string description must follow @test'), step, stepName
    );
  }

  var label = '@test(' + description + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, block) {
    if (DefaultScript.global.type(block) !== 'logic') {
      throw DefaultScript.error(
        new TypeError('logic block must follow @test'), step, stepName
      );
    }

    return block(scopes, step, stepName);
  });
});
