/**
 * DefaultScript
 * @author Nate Ferrero
 * @url https://nateferrero.com
 * @tel (919) 426-2830
 * @location Ann Arbor, MI
 * @date Thursday, November 26th, 2015
 * @date Saturday, January 9th, 2016
 * @desc Full DefaultScript engine rewrite for modularity and extensibility.
 */
var g = typeof global === 'object' ? global : window;

g.DefaultScript = {
  global: {},
  tokenTypes: [
    'BREAK',
    'NAME',
    'OPERATOR',
    'GROUP',
    'LOGIC',
    'ARRAY',
    'STRING'
  ]
};

g.isBrowser = typeof window === 'object';
g.isNode = typeof global === 'object' && typeof require === 'function';
g.isMain = g.isNode && require.main === module;

g.transformPossiblePause = function (result, transform) {
  if (typeof result === 'function' && result.name === '$pause$') {
    return g.DefaultScript.pause(function (resume) {
      result(function (value) {
        var transformedValue = transform(value);
        console.log('TV', transformedValue);
        return g.transformPossiblePause(transformedValue, resume);
      });
    });
  }

  return transform(result);
};

g.resumeCallback = function (result) {
  return function (next) {
    if (typeof next !== 'function') {
      throw new Error('resumeCallback(result)(handler) handler function required');
    }

    if (typeof result === 'function' && result.name === '$pause$') {
      result(next);
    }

    else {
      next(result);
    }
  };
};

g.BREAK    = 0;
g.NAME     = 1;
g.OPERATOR = 2;
g.GROUP    = 3;
g.LOGIC    = 4;
g.ARRAY    = 5;
g.STRING   = 6;

g.POSITION = 0;
g.TYPE     = 1;
g.SOURCE   = 2;

g.IT = '@';
g.EMPTY = {$: 'empty'};
g.END = {$: 'end'};
g.EXTENSION = '.ds';

g.remember = function (step, stepName, fn) {
  fn.step = step;
  fn.stepName = stepName;
  return fn;
};

require('./src/global/beforeUnload');
require('./src/global/deferred');
require('./src/global/expect');
require('./src/global/format');
require('./src/global/log');
require('./src/global/request');
require('./src/global/scope');
require('./src/global/standard');
require('./src/global/test');
require('./src/global/type');

require('./src/language/array');
require('./src/language/block');
require('./src/language/combine');
require('./src/language/expression');
require('./src/language/get');
require('./src/language/group');
require('./src/language/import');
require('./src/language/index');
require('./src/language/literals');
require('./src/language/logic');
require('./src/language/operate');
require('./src/language/parse');
require('./src/language/pause');
require('./src/language/resolve');
require('./src/language/run');
require('./src/language/set');
require('./src/language/string');
require('./src/language/syntax');
require('./src/language/token');
require('./src/language/walk');

DefaultScript.run();
