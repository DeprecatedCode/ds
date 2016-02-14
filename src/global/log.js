DefaultScript.global.log = function (first) {
  Array.prototype.slice.call(arguments).forEach(function (arg) {
    console.log(DefaultScript.global.format(arg));
  });
  return first;
};
