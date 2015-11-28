var source = typeof global === 'object' ? global : window;

[
  // shared
  'Array',
  'Boolean',
  'Date',
  'Error',
  'EvalError',
  'Function',
  'Infinity',
  'JSON',
  'Math',
  'NaN',
  'Number',
  'Object',
  'RangeError',
  'ReferenceError',
  'RegExp',
  'String',
  'SyntaxError',
  'TypeError',
  'URIError',
  'ArrayBuffer',
  'Buffer',
  'DataView',
  'Float32Array',
  'Float64Array',
  'Int16Array',
  'Int32Array',
  'Int8Array',
  'Uint16Array',
  'Uint32Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'clearImmediate',
  'clearInterval',
  'clearTimeout',
  'setImmediate',
  'setInterval',
  'setTimeout',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'escape',
  'unescape',
  'console',

  // global only
  'process',

  // window only
  'document'
].forEach(function (key) {
  if (key in DefaultScript.global) {
    throw new Error(key + ' previously defined');
  }

  if (key in source) {
    DefaultScript.global[key] = source[key];
  }
});

if (typeof require === 'function') {
  DefaultScript.global.require = require;
}
