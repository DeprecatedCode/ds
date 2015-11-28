DefaultScript.set = function (scopes, step, stepName, key, value, done) {
  // always call done at resolve end
  done(55);
  console.log(key, value);
  // return DefaultScript.pause if needed during resolve walk
  return;
}
