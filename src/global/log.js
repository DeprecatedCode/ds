DefaultScript.global.log = function () {
  Array.prototype.slice.call(arguments).forEach(function (arg) {
    console.log(DefaultScript.global.format(arg));
  });
};
