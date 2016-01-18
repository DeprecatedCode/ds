var beforeUnload = [];

DefaultScript.global.beforeUnload = function (item) {
  beforeUnload.push(item);
};

DefaultScript.beforeUnload = function (err) {
  beforeUnload.forEach(function (item) {
    item(err);
  });
};
