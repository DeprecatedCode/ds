DefaultScript.global.test = remember(null, '@test', function $trap$(scopes, step, stepName, description) {
  if (DefaultScript.global.type(description) !== 'string') {
    throw new TypeError('string description must follow @test');
  }

  var label = '@test(' + description + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, block) {
    if (DefaultScript.global.type(block) !== 'logic') {
      throw new TypeError('logic block must follow @test');
    }

    return block(scopes, step, stepName);
  });
});
