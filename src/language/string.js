DefaultScript.protoOverrides.string = {
  indexOf: 'indexOf',
  length: 'length',
  lower: function $logic$(boundScopes, boundStep, boundStepName, string, boundOnException) {
    return string.toLowerCase();
  },
  upper: function $logic$(boundScopes, boundStep, boundStepName, string, boundOnException) {
    return string.toUpperCase();
  }
};
