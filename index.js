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
      logic.items.forEach(function (step) {
        ds.Execute(step, scope);
      });
      return scope;
    };
  },

  ApplyValue: function (scope, value, step) {
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
      scope.$state$.value = ds.Combine(scope.$state$.value, value, scope, step);
    }
  },

  Booean: Boolean,

  Console: console,

  Combine: function (first, second, scope, step) {
    // console.log('x', first, second, scope);
    if (typeof second === 'function') {
      if (typeof first === 'function') {
        var newScope = ds.Scope(scope);
        first(newScope);
        return second(newScope);
      }

      return second(first);
    }

    if (typeof first === 'string') {
      return first + String(second);
    }

    if (typeof first === 'number') {
      return second[first];
    }

    throw ds.ErrorMessage(new SyntaxError('Invalid combination of ' +
                          ds.Type(first) + ' and ' + ds.Type(second)), step);
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
        'template',
        'at break'
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

    var dotExpected = resolve.length > 0 && !(
      resolve[resolve.length - 1].type === OPERATOR &&
      resolve[resolve.length - 1].value === '.'
    );

    // if we are an assignment key
    if (step.type === OPERATOR && step.value === ':') {
      if (!dotExpected || scope.$state$.key) {
        throw ds.ErrorMessage(new SyntaxError('Unexpected assigment operator'), step);
      }
      scope.$state$.key = resolve.map(
        function (x) {return x.value;}
      ).join('');
      scope.$state$.resolve = [];
      scope.$state$.value = ds.Undefined;
    }

    else if (step.type === OPERATOR && step.value !== '.') {
      if (!dotExpected) {
        throw ds.ErrorMessage(new SyntaxError('Unexpected operator'), step);
      }
      ds.Resolve(scope);
      scope.$state$.operator.push(step);
    }

    else if (step.type === BREAK) {
      if (resolve.length && !dotExpected) {
        throw ds.ErrorMessage(new SyntaxError('Unexpected syntax'), step);
      }

      if (scope.$state$.key) {
        scope[scope.$state$.key] = ds.Resolve(scope);
        scope.$state$.key = ds.Undefined;
        scope.$state$.value = ds.Undefined;
      }

      else if ('accumulate' in scope.$state$) {
        scope.$state$.accumulate.push(ds.Resolve(scope));
        scope.$state$.value = ds.Undefined;
      }

      else {
        scope.$state$.value = ds.Resolve(scope);
      }
    }

    else {
      if (dotExpected && !(step.type === OPERATOR && step.value === '.')) {
        ds.Resolve(scope);
      }
      scope.$state$.resolve.push(step);
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

    if (combinedOperator.value === '!') {
      return !left;
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
        var sourceLine = source.substr(start,
                                       (breaks[line + 1] || start + 1) - start);

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
        if (head.type && ds.Syntax.blocks[head.type] &&
            source[i] === ds.Syntax.blocks[head.type].close) {
          queueToHead(i);
          head.items.push({type: BREAK, position: position(i)});
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
        head.items.push({type: BREAK, position: position(i)});
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

  Resolve: function (scope) {
    var value = scope;
    var allowRead = true;
    var resolve = scope.$state$.resolve;
    resolve.forEach(function (step) {
      if (step.type === OPERATOR && step.value === '.') {
        if (allowRead) {
          throw ds.ErrorMessage(new SyntaxError('Invalid'), step);
        }
        allowRead = true;
        return;
      }

      if (!allowRead) {
        throw ds.ErrorMessage(new SyntaxError('Invalid'), step);
      }

      allowRead = false;

      if (step.type === STRING) {
        value = step.items.map(function (i) {
          return i.value;
        }).join('');
      }

      else if (step.type === GROUP) {
        var groupScope = ds.Scope(scope);
        ds.Apply(step)(groupScope);
        value = groupScope.$state$.value;
      }

      else if (step.type === ARRAY) {
        var arrayScope = ds.Scope(scope);
        arrayScope.$state$.accumulate = [];
        ds.Apply(step)(arrayScope);
        value = arrayScope.$state$.accumulate;
      }

      else if (step.type === LOGIC) {
        value = function (scope) {
          return ds.Apply(step)(scope);
        };
      }

      else if (step.type === NAME) {
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

          var lastValue = value;
          value = value[step.value];
          if (typeof value === 'function') {
            value = value.bind(lastValue);
          }
        }
      }

      else {
        throw ds.ErrorMessage(new SyntaxError('Invalid'), step);
      }
    });

    scope.$state$.resolve = [];
    scope.$state$.value = value;
    return value;
  },

  Scope: function (parentScope) {
    var scope = Object.create(parentScope || Object.prototype);
    Object.defineProperty(scope, '$state$', {
      value: {
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

  SyntaxError: SyntaxError,

  System: require('os'),

  Template: {},

  Type: function (thing) {
    if (Array.isArray(thing)) {
      return 'array';
    }
    return typeof thing;
  },

  TypeError: TypeError,

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
