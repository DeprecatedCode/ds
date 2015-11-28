DefaultScript.set = function (scopes, step, stepName, key, value) {
  // always call next at resolve end
  // next(55);
  console.log('SET', key, value);
  // return DefaultScript.pause if needed during resolve walk
  return;
}
