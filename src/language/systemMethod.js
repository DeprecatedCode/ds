DefaultScript.systemMethod = function (name, source) {
  var tree = DefaultScript.parse(source + '\n', name, DefaultScript.onException);
  return DefaultScript.logic([], tree, name);
};
