Object.defineProperty(DefaultScript.global, 'deferred', {
  get: function () {
    var onResolve = [];
    var resolve = function $logic$(scopes) {
      onResolve.map(function (fn) {
        fn(scopes);
      });
    };

    var onReject = [];
    var reject = function $logic$(scopes) {
      onReject.map(function (fn) {
        fn(scopes);
      });
    };

    var promise = {
      $populate$: true,
      $type$: 'promise',
      then: function $trap$(fn) {
        onResolve.push(fn);
      },
      catch: function $trap$(fn) {
        onReject.push(fn);
      }
    };

    return {
      $type$: 'deferred',
      resolve: resolve,
      reject: reject,
      promise: promise
    };
  }
});
