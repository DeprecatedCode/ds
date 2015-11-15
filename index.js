/**
 * Default Script
 * @author Nate Ferrero <http://nateferrero.com>
 * @license MIT
 */

const NAME     = 0;
const OPERATOR = 1;
const LOGIC    = 2;
const GROUP    = 3;
const ARRAY    = 4;
const STRING   = 5;
const TEMPLATE = 6;
const BREAK    = 7;

 /**
  * This file can be used in the following modes:
  *
  * On the command line:
  *   node ds source.ds
  *
  * In Node:
  *   var ds = require('ds');
  *   ds("'Hello World' @Console.log");
  *   ds.Console.log(ds.Parse('1 + 3')(ds.Scope()));
  */
var ds = {
  Array: Array,

  Apply: function (logic) {
    return function (scope) {
      var value;

      logic.items.forEach(function (step) {
        value = ds.Execute(step, scope);
      });

      return value === ds.Flag ? scope : value;
    };
  },

  ApplyValue: function (scope, value) {
    if (scope.$state$.operator.length) {
      scope.$state$.value = ds.Operate(
        scope,
        scope.$state$.value,
        scope.$state$.operator,
        value
      );
      scope.$state$.operator.length = 0;
    }

    else if (scope.$state$.value === ds.Undefined) {
      scope.$state$.value = value;
    }

    else {
      scope.$state$.value = ds.Combine(scope.$state$.value, value);
    }
  },

  Booean: Boolean,

  Console: console,

  Combine: function (first, second) {
    if (typeof second === 'function') {
      return second(first);
    }
  },

  Date: Date,

  ErrorMessage: function (err, step) {
    var desc;

    if ('value' in step) {
      desc = step.value;
    }

    else {
      desc = [
        'name',
        'operator',
        'logic',
        'group',
        'array',
        'string',
        'template'
      ][step.type];
    }

    err.stack = [];

    err.name = '@' + err.name;

    err.message = err.message + ' ' + desc + ' at ' + step.position() + '\n' +
      step.position.getSource(true);

    return err;
  },

  Execute: function (step, scope) {
    var resolve = scope.$state$.resolve;
    var lastResolve = resolve.length && resolve[resolve.length - 1];
    if ((step.type === NAME && (!lastResolve || lastResolve.type === OPERATOR)) ||
        (step.type === OPERATOR && step.value === '.')) {
      resolve.push(step);
      return;
    }

    // resolve all variables before continuing
    if (resolve.length) {
      ds.ApplyValue(scope, ds.Resolve(scope, resolve));
      resolve.length = 0;

      if (step.type === NAME) {
        resolve.push(step);
        return;
      }
    }

    if (step.type === BREAK) {
      if ('$accumulate$' in scope) {
        scope.$accumulate$.push(scope.$state$.value);
      }
      scope.$state$.value = ds.Undefined;
    }

    else if (step.type === OPERATOR) {
      scope.$state$.operator.push(step);
    }

    else if (step.type === STRING) {
      return ds.ApplyValue(scope, step.items.map(function (i) {
        return i.value;
      }).join(''));
    }

    else if (step.type === GROUP) {
      return ds.Apply(step)(scope);
    }

    else if (step.type === ARRAY) {
      var arrayScope = ds.Scope();
      arrayScope.$accumulate$ = [];
      ds.Apply(step)(arrayScope);
      return arrayScope.$accumulate$;
    }

    else if (step.type === LOGIC) {
      return function (scope) {
        return ds.Apply(step)(scope);
      };
    }

    else {
      throw ds.ErrorMessage(new SyntaxError('Invalid'), step);
    }
  },

  Extension: '.ds',

  File: require('fs'),

  Group: {},

  Import: function (path) {
    var stats;

    try {
      stats = ds.File.lstatSync(path);
    }

    catch (e) {
      stats = ds.File.lstatSync(path + ds.Extension);
      path += ds.Extension;
    }

    if (stats.isDirectory()) {
      path = ds.Path.join(path, ds.Index + ds.Extension);
    }

    return ds.Parse(
      ds.File.readFileSync(path, ds.UTF8),
      path
    )(ds.Scope());
  },

  Index: 'index',

  JSON: JSON,

  Logic: function (type, range) {
    return {
      type: type,
      range: range,
      items: []
    };
  },

  Null: null,

  Number: Number,

  Operate: function (scope, left, operator, right) {
    var combinedOperator = {
      position: operator[0].position,
      value: operator.map(function (o) {
        return o.value;
      }).join('')
    };

    if (combinedOperator.value === ':') {
      scope[left] = right;
    }

    else if (combinedOperator.value === '+') {
      return left + right;
    }

    else if (combinedOperator.value === '-') {
      return left - right;
    }

    else if (combinedOperator.value === '*') {
      return left * right;
    }

    else if (combinedOperator.value === '/') {
      return left / right;
    }

    else if (combinedOperator.value === '+') {
      return left + right;
    }

    else if (combinedOperator.value === '%') {
      return left % right;
    }

    else {
      throw ds.ErrorMessage(new SyntaxError('Operator not implemented:'),
                            combinedOperator);
    }
  },

  Parse: function (source, name) {
    var breaks = [-1];
    var position = function (i) {
      var positionFn = function () {
        var line = -1;
        while (i > breaks[line + 1]) {
          line++;
        }
        var column = i - breaks[line];
        return 'line ' + ++line + ' column ' + column;
      };

      positionFn.getSource = function (includeCaret) {
        var line = -1;
        while (i > breaks[line + 1]) {
          line++;
        }
        var column = i - breaks[line];
        var start = breaks[line] + 1;
        var sourceLine = source.substr(start, breaks[line + 1] - start);

        if (includeCaret) {
          sourceLine = '\n' + name + ':' + (line + 1) + '\n' + sourceLine + '\n' +
                       new Array(column).join(' ') + '^';
        }
        return sourceLine;
      };

      return positionFn;
    };

    var logic = ds.Logic('Logic', [0, source.length - 1]);
    logic.position = position(0);
    var head = logic;
    var stack = [];
    var previous;
    var isString;
    var queue = {
      type: NAME,
      range: [0],
      position: position(0),
      value: ''
    };

    var queueToHead = function (i) {
      if (queue.value.length) {
        queue.range.push(i - 1);
        head.items.push(queue);
      }
      queue = {
        type: NAME,
        range: [i + 1],
        position: position(i + 1),
        value: ''
      };
    };

    for (var i = 0; i < source.length; i++) {
      if (source[i] === '\n') {
        breaks.push(i);
      }

      isString = head.type &&
                 ds.Syntax.blocks[head.type] &&
                 ds.Syntax.blocks[head.type].string;

      if (!isString && source[i] in ds.Syntax.open) {
        queueToHead(i);
        previous = head;
        stack.push(previous);
        head = ds.Logic(ds.Syntax.open[source[i]], [i]); // I love open source
        head.position = position(i);
        previous.items.push(head);
      }

      else if (isString && source[i] === ds.Syntax.blocks[head.type].close) {
        queueToHead(i);
        head.range.push(i);
        head = stack.pop();
      }

      else if (isString) {
        queue.value += source[i];
      }

      else if (ds.Syntax.close.indexOf(source[i]) !== -1) {
        if (head.type && ds.Syntax.blocks[head.type] && source[i] === ds.Syntax.blocks[head.type].close) {
          queueToHead(i);
          head.items.push({type: BREAK});
          head.range.push(i);
          head = stack.pop();
        }

        else {
          head = null;
        }

        if (!head) {
          throw ds.ErrorMessage(new SyntaxError('Unexpected'), {
            value: '"' + source[i] + '"',
            position: position(i)
          });
        }
      }

      else if (ds.Syntax.separators.indexOf(source[i]) !== -1) {
        queueToHead(i);
        head.items.push({type: BREAK});
      }

      else if (ds.Syntax.whitespace.indexOf(source[i]) !== -1) {
        queueToHead(i);
      }

      else if (/[^$@a-zA-Z0-9]/.test(source[i])) {
        queueToHead(i);
        head.items.push({type: OPERATOR, value: source[i], position: position(i)});
      }

      else {
        queue.value += source[i];
      }
    }

    return ds.Apply(logic);
  },

  Path: require('path'),

  Process: process,

  Resolve: function (scope, resolve) {
    var value = scope;
    var allowNext = true;
    resolve.forEach(function (step) {
      if (step.type === NAME) {
        if (!allowNext) {
          throw new TypeError();
        }

        allowNext = false;

        if (/^\d+$/.test(step.value)) {
          if (typeof value === 'number') {
            value = parseFloat(value + '.' + step.value);
          }

          else {
            value = parseInt(step.value);
          }
        }

        else if (step.value[0] === '@') {
          value = ds[step.value.substr(1)];
        }

        else {
          if (value === null) {
            throw ds.ErrorMessage(new TypeError('Cannot read property of @Null:'), step);
          }

          else if (typeof value === 'undefined') {
            throw ds.ErrorMessage(new TypeError('Cannot read property of @Undefined:'), step);
          }
          value = value[step.value];
        }
      }

      else if (step.type === OPERATOR) {
        allowNext = true;
      }

      else {
        throw new TypeError();
      }
    });

    return value;
  },

  Scope: function () {
    var scope = {};
    Object.defineProperty(scope, '$state$', {
      value: {
        stage: 'key',
        value: ds.Undefined,
        operator: [],
        resolve: []
      },
      enumerable: false
    });
    return scope;
  },

  String: String,

  Syntax: {
    separators  : ['\n', ','],
    whitespace  : ['\t', ' '],
    close       : [']', ')', '}'],
    open        : {
      '[' : ARRAY,
      '(' : GROUP,
      '{' : LOGIC,
      "'" : STRING,
      '`' : TEMPLATE
    },
    blocks: (function (blocks) {
      blocks[ARRAY]    = {close: /*[*/ ']', type: ARRAY};
      blocks[GROUP]    = {close: /*(*/ ')', type: GROUP};
      blocks[LOGIC]    = {close: /*{*/ '}', type: LOGIC};
      blocks[STRING]   = {close: /*'*/ "'", type: STRING,    string: true};
      blocks[TEMPLATE] = {close: /*`*/ '`', type: TEMPLATE,  string: true};
      return blocks;
    })({})
  },

  System: require('os'),

  Template: {},

  Undefined: (function () {})(),

  UTF8: 'utf8'
};

if (require.main === module) {
  var path = ds.Process.argv[2];
  if (typeof path !== 'string') {
    throw new Error('Usage: node ds source.ds');
  }
  ds.Import(path);
}

else {
  module.exports = function (source, name) {
    return ds.Parse(source, name)(ds.Scope());
  };

  Object.keys(ds).forEach(function (key) {
    module.exports[key] = ds[key];
  });
}
