DefaultScript.global.print = function (first) {
  Array.prototype.slice.call(arguments).forEach(function (arg) {
    console.log(arg);
  });
  return first;
};
