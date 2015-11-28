DefaultScript.global.scope = function (parent) {
  return Object.create(parent || null);
};
