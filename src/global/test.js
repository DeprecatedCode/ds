DefaultScript.global.test = remember(null, '@test', function $trap$(scopes, step, stepName, description, onException) {
  if (DefaultScript.global.type(description) !== 'string') {
    return onException(new TypeError('string description must follow @test'));
  }

  var label = '@test(' + description + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, block, onException) {
    if (DefaultScript.global.type(block) !== 'logic') {
      return onException(TypeError('logic block must follow @test "description"'));
    }

    return block(scopes, step, stepName, undefined, onException);
  });
});
