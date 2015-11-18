module.exports = function (ds) {
  console.log('DefaultScript Help');
  console.log('Usage: node ds path/to/file.ds');
  console.log('All injectables:', Object.keys(ds.global).map(function (x) {
    return '@' + x;
  }).join(', '));
};
