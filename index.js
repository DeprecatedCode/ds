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
const BREAK    = 6;

var fs = require('fs');
var path = require('path');

 /**
  * This file can be used in the following modes:
  *
  * On the command line:
  *   node ds source.ds
  *
  * In Node:
  *   var ds = require('ds');
  *   ds("'Hello World' @console.log");
  *   ds.console.log(ds.parse('1 + 3')(ds.scope()));
  */
var ds = {
  apply: function (logic, originalScope) {
    var fn = function applyScope(scope) {
      if (!scope.$state$) {
        throw new Error('Invalid scope');
      }

      logic.items.forEach(function (step) {
        ds.execute(step, scope, originalScope);
      });

      if (scope.$state$.return) {
        return scope.$state$.lastValue;
      }

      return scope;
    };
    fn.$logic$ = true;
    return fn;
  },

  applyValue: function (scope, value, step) {
    if (scope.$state$.value === ds.empty) {
      scope.$state$.value = value;
    }

    else {
      var left = scope.$state$.value;
      scope.$state$.value = ds.combine(left, value, scope, step);
    }
  },

  combine: function (first, second, scope, step) {
    if (typeof first === 'function') {
      if (first.$logic$) {
        if (typeof second === 'function' && second.$logic$) {
          var newScope = ds.scope(scope);
          newScope['@it'] = first;
          return second(newScope);
        }

        else if (typeof second === 'function') {
          return second(function (it) {
            var newScope = ds.scope(scope);
            newScope['@it'] = it;
            return first(newScope);
          });
        }
      }

      else if (typeof second === 'function') {
        return second(first);
      }
    }

    else if (typeof second === 'function') {
      if (second.$logic$) {
        var newScope = ds.scope(scope);
        newScope['@it'] = first;
        return second(newScope);
      }

      else {
        return second(first);
      }
    }

    else if (typeof first === 'string') {
      return first + String(second);
    }

    else if (typeof first === 'number') {
      return second[first];
    }

    throw ds.errorMessage(new SyntaxError('Invalid combination of ' +
                          ds.type(first) + ' and ' + ds.type(second)), step);
  },

  empty: {$: 'Empty'},

  errormessage: function (err, step) {
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
        'break'
      ][step.type];
    }

    err.stack = [];

    err.name = '@' + err.name;

    err.message = err.message + ' ' + desc + ' at ' + step.position() + '\n' +
      step.position.getSource(true);

    return err;
  },

  execute: function (step, scope, originalScope) {
    if (step.type === BREAK) {
      if (scope.$state$.break) {
        return;
      }
      scope.$state$.break = true;
    }

    else {
      scope.$state$.break = false;
    }

    var resolve = scope.$state$.resolve;

    var nameExpected = resolve.length === 0 || (
      resolve[resolve.length - 1].type === OPERATOR &&
      resolve[resolve.length - 1].value === '.'
    );

    if (step.type === NAME && nameExpected) {
      resolve.push(step);
      return;
    }

    if (step.type === OPERATOR && step.value === '.') {
      if (nameExpected) {
        throw ds.errorMessage(new SyntaxError('Invalid'), step);
      }
      resolve.push(step);
      return;
    }

    if (step.type === OPERATOR && step.value === ':') {
      if (nameExpected) {
        if (resolve.length) {
          throw ds.errorMessage(new SyntaxError('Unexpected assigment operator'), step);
        }
        scope.$state$.convenienceKey = true;
        return;
      }

      if (scope.$state$.key !== ds.empty) {
        throw ds.errorMessage(new SyntaxError('Unexpected assigment operator'), step);
      }

      scope.$state$.key = resolve.map(
        function (x) {return x.value;}
      ).join('');
      scope.$state$.resolve = [];
      scope.$state$.value = ds.empty;
      return;
    }

    var collapse = function () {
      if (resolve.length === 0) {
        return;
      }

      var value = ds.resolve(scope, originalScope);

      if (scope.$state$.operator.length > 0) {
        scope.$state$.value = ds.operate(scope, value, step);
      }

      else {
        ds.applyValue(scope, value, step);
      }
    };

    if (step.type === OPERATOR) {
      if (resolve.length > 0 && nameExpected) {
        throw ds.errorMessage(new SyntaxError('Unexpected operator'), step);
      }
      collapse();
      scope.$state$.operator.push(step);
      return;
    }

    collapse();

    resolve = scope.$state$.resolve;

    if (step.type === BREAK) {
      if (scope.$state$.operator.length > 0) {
        scope.$state$.value = ds.operate(scope, ds.undefined, step);
      }

      if (scope.$state$.key !== ds.empty) {
        scope[scope.$state$.key] = scope.$state$.value;
        scope.$state$.key = ds.empty;
        scope.$state$.value = ds.empty;
        scope.$state$.return = false;
      }

      else if ('accumulate' in scope.$state$) {
        if (scope.$state$.value !== ds.empty) {
          scope.$state$.accumulate.push(scope.$state$.value);
        }
        scope.$state$.value = ds.empty;
        scope.$state$.return = false;
      }

      else {
        scope.$state$.return = true;
      }

      scope.$state$.lastValue = scope.$state$.value === ds.empty ?
                                  ds.undefined : scope.$state$.value;
      scope.$state$.value = ds.empty;
      return;
    }

    resolve.push(step);
  },

  extension: '.ds',

  false: false,

  group: {},

  import: function (name) {
    var stats;

    try {
      stats = fs.lstatSync(name);
    }

    catch (e) {
      stats = fs.lstatSync(name + ds.extension);
      name += ds.extension;
    }

    if (stats.isDirectory()) {
      name = path.join(name, ds.index + ds.extension);
    }

    return ds.parse(
      fs.readFileSync(name, 'utf8'),
      name
    )(ds.scope());
  },

  index: 'index',

  logic: function (type, range) {
    return {
      type: type,
      range: range,
      items: []
    };
  },

  null: null,

  operate: function (scope, right, step) {
    var left = scope.$state$.value;
    var operator = scope.$state$.operator;
    scope.$state$.operator = [];

    var combinedOperator = {
      position: operator[0].position,
      value: operator.map(function (o) {
        return o.value;
      }).join('')
    };

    if (combinedOperator.value.length > 1 &&
      combinedOperator.value[combinedOperator.value.length - 1] === '-') {
      combinedOperator.value = combinedOperator.value.substr(0,
                                 combinedOperator.value.length - 1);
      if (typeof right !== 'number') {
        throw ds.errorMessage(new TypeError('Cannot negate a non-numeric value'), step);
      }

      right = -1 * right;
    }

    if (combinedOperator.value === '!') {
      return (
        typeof left === 'undefined' ||
               left === false ||
               left === null
      );
    }

    else if (combinedOperator.value === '&') {
      if (left !== ds.empty) {
        throw ds.errorMessage(new SyntaxError('Invalid &'), step);
      }

      if (right) {
        if (typeof right === 'function' && right.$logic$) {
          right(scope);
        }

        else if (Array.isArray(right)) {
          if (!Array.isArray(scope.$state$.accumulate)) {
            throw ds.errorMessage(
              new TypeError('Cannot merge array and object'), step
            );
          }
          right.forEach(function (item) {
            scope.$state$.accumulate.push(item);
          });
        }

        else if (typeof right === 'object') {
          Object.keys(right).forEach(function (key) {
            scope[key] = right[key];
          });
        }

        else {
          throw ds.errorMessage(
            new TypeError('Value must be a function, object, or array'), step
          );
        }
      }

      else {
        var fn = scope['@it'];
        if (typeof fn === 'function' && fn.$logic$) {
          fn(scope);
        }

        else {
          throw ds.errorMessage(
            new TypeError('Value must be a function'), step
          );
        }
      }

      return ds.empty;
    }

    else if (combinedOperator.value === '!=') {
      return left !== right;
    }

    else if (combinedOperator.value === '=') {
      return left === right;
    }

    else if (combinedOperator.value === '+') {
      if (typeof left === 'function') {
        if (typeof right === 'function') {
          var fn = function (scope) {
            left(scope);
            right(scope);
            return scope;
          };
          fn.$logic$ = true;
          return fn;
        }

        else {
          throw ds.errorMessage(
            new Error('Cannot add function and ' + ds.type(right)), step
          );
        }
      }

      else if (typeof right === 'function') {
        throw ds.errorMessage(
          new Error('Cannot add ' + ds.type(left) + ' and function'), step
        );
      }

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

    else if (combinedOperator.value === '%') {
      return left % right;
    }

    else {
      throw ds.errorMessage(new SyntaxError('Operator not implemented:'),
                            combinedOperator);
    }
  },

  parse: function (source, name) {
    var isEscape = false;
    var isComment = false;
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

    var logic = ds.logic('Logic', [0, source.length - 1]);
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
        isComment = false;
        breaks.push(i);
      }

      isString = head.type &&
                 ds.syntax.blocks[head.type] &&
                 ds.syntax.blocks[head.type].string;

      if (isComment) {
        // do nothing
      }

      else if (!isString && !isComment && source[i] === ds.syntax.comment) {
        isComment = true;
        continue;
      }

      else if (!isEscape && source[i] === ds.syntax.escape) {
        isEscape = true;
      }

      else if (isEscape) {
        isEscape = false;

        if (isString) {
          var add = source[i];

          if (add === 'n') {
            add = '\n';
          }

          else if (add === 't') {
            add = '\t';
          }

          queue.value += add;
        }
      }

      else if (!isString && source[i] in ds.syntax.open) {
        queueToHead(i);
        previous = head;
        stack.push(previous);
        head = ds.logic(ds.syntax.open[source[i]], [i]); // I love open source
        head.position = position(i);
        previous.items.push(head);
      }

      else if (isString && source[i] === ds.syntax.blocks[head.type].close) {
        queueToHead(i);
        head.range.push(i);
        head = stack.pop();
      }

      else if (isString) {
        queue.value += source[i];
      }

      else if (ds.syntax.close.indexOf(source[i]) !== -1) {
        if (head.type && ds.syntax.blocks[head.type] &&
            source[i] === ds.syntax.blocks[head.type].close) {
          queueToHead(i);
          head.items.push({type: BREAK, position: position(i)});
          head.range.push(i);
          head = stack.pop();
        }

        else {
          head = null;
        }

        if (!head) {
          throw ds.errorMessage(new SyntaxError('Unexpected'), {
            value: '"' + source[i] + '"',
            position: position(i)
          });
        }
      }

      else if (ds.syntax.separators.indexOf(source[i]) !== -1) {
        queueToHead(i);
        head.items.push({type: BREAK, position: position(i)});
      }

      else if (ds.syntax.whitespace.indexOf(source[i]) !== -1) {
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

    return ds.apply(logic);
  },

  resolve: function (scope, originalScope) {
    var value = scope;
    var allowRead = true;
    var resolve = scope.$state$.resolve;
    scope.$state$.resolve = [];

    if (resolve.length === 0) {
      return ds.undefined;
    }

    resolve.forEach(function (step) {
      if (step.type === OPERATOR && step.value === '.') {
        if (allowRead) {
          throw ds.errorMessage(new SyntaxError('Invalid'), step);
        }
        allowRead = true;
        return;
      }

      if (!allowRead) {
        throw ds.errorMessage(new SyntaxError('Invalid'), step);
      }

      allowRead = false;
      if (step.type === STRING) {
        value = step.items.map(function (i) {
          return i.value;
        }).join('');
      }

      else if (step.type === GROUP) {
        var groupScope = ds.scope(scope);
        ds.apply(step, originalScope)(groupScope);
        value = groupScope.$state$.lastValue;
      }

      else if (step.type === ARRAY) {
        var arrayScope = ds.scope(scope);
        arrayScope.$state$.break = true;
        arrayScope.$state$.accumulate = [];
        ds.apply(step, originalScope)(arrayScope);
        value = arrayScope.$state$.accumulate;
      }

      else if (step.type === LOGIC) {
        value = ds.apply(step, scope, originalScope);
      }

      else if (step.type === NAME) {
        if (scope.$state$.convenienceKey) {
          scope.$state$.convenienceKey = false;
          scope.$state$.key = step.value;
        }

        if (/^\d+$/.test(step.value)) {
          if (typeof value === 'number') {
            value = parseFloat(value + '.' + step.value);
          }

          else {
            value = parseInt(step.value);
          }
        }

        else if (step.value[0] === '@') {
          var name = step.value.substr(1);
          value = scope[step.value];
          if (originalScope && typeof value === 'undefined') {
            value = originalScope[step.value];
          }
          if (typeof value === 'undefined') {
            value = ds[name];
          }
        }

        else {
          if (value === null) {
            throw ds.errorMessage(new TypeError('Cannot read property of @Null:'), step);
          }

          else if (typeof value === 'undefined') {
            throw ds.errorMessage(new TypeError('Cannot read property of @undefined:'), step);
          }

          var lastValue = value;
          value = value[step.value];

          if (lastValue === scope && originalScope && typeof value === 'undefined') {
            value = originalScope[step.value];
          }

          if (typeof value === 'function' && !value.$logic$) {
            value = value.bind(lastValue);
          }
        }
      }

      else {
        throw ds.errorMessage(new SyntaxError('Invalid'), step);
      }
    });

    return value;
  },

  scope: function (parentScope) {
    var scope = Object.create(parentScope || Object.prototype);
    Object.defineProperty(scope, '$state$', {
      value: {
        key: ds.empty,
        value: ds.empty,
        operator: [],
        resolve: []
      },
      enumerable: false
    });
    return scope;
  },

  syntax: {
    escape      : '\\',
    comment     : '#',
    separators  : ['\n', ','],
    whitespace  : ['\t', ' '],
    close       : [']', ')', '}'],
    open        : {
      '[' : ARRAY,
      '(' : GROUP,
      '{' : LOGIC,
      "'" : STRING
    },
    blocks: (function (blocks) {
      blocks[ARRAY]    = {close: /*[*/ ']', type: ARRAY};
      blocks[GROUP]    = {close: /*(*/ ')', type: GROUP};
      blocks[LOGIC]    = {close: /*{*/ '}', type: LOGIC};
      blocks[STRING]   = {close: /*'*/ "'", type: STRING, string: true};
      return blocks;
    })({})
  },

  true: true,

  type: function (thing) {
    if (Array.isArray(thing)) {
      return 'array';
    }
    return typeof thing;
  },

  undefined: (function () {})()
};

[
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
  'global',
  'process'
].forEach(function (key) {
  if (key in ds) {
    throw new Error(key + ' previously defined');
  }
  if (!(key in global)) {
    throw new Error('Module not available: ' + key);
  }
  ds[key] = global[key];
});

if (require.main === module) {
  var name = ds.process.argv[2];
  if (typeof name !== 'string') {
    throw new Error('Usage: node ds source.ds');
  }
  ds.import(name);
}

else {
  module.exports = function (source, name) {
    return ds.parse(source, name)(ds.scope());
  };

  Object.keys(ds).forEach(function (key) {
    module.exports[key] = ds[key];
  });
}
