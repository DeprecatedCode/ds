/**
 * Default Script
 * @author Nate Ferrero <http://nateferrero.com>
 * @license MIT
 */

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
  Array     : Array,
  Apply     : function (logic) {
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
  Booean    : Boolean,
  Console   : console,
  Combine   : function (first, second) {
    if (typeof second === 'function') {
      return second(first);
    }
  },
  Date      : Date,
  ErrorMessage : function (type, step) {
    var desc;

    if ('value' in step) {
      desc = step.value;
    }

    else if (step.type === 'l') {
      desc = '{...}';
    }

    else if (step.type === 'g') {
      desc = '(...)';
    }

    return type + ' ' + desc + ' at ' + step.position();
  },
  Execute   : function (step, scope) {
    var resolve = scope.$state$.resolve;
    var lastResolve = resolve.length && resolve[resolve.length - 1];
    if ((step.type === 'v' && (!lastResolve || lastResolve.type === 'o')) ||
        (step.type === 'o' && step.value === '.')) {
      resolve.push(step);
      return;
    }

    // resolve all variables before continuing
    if (resolve.length) {
      ds.ApplyValue(scope, ds.Resolve(scope, resolve));
      resolve.length = 0;

      if (step.type === 'v') {
        resolve.push(step);
        return;
      }
    }

    if (step.type === 'x') {
      scope.$state$.value = ds.Undefined;
    }

    else if (step.type === 'o') {
      scope.$state$.operator.push(step);
    }

    else if (step.type === 's') {
      return ds.ApplyValue(scope, step.items.map(function (i) {
        return i.value;
      }).join(''));
    }

    else if (step.type === 'g') {
      return ds.Apply(step)(scope);
    }

    else {
      throw new SyntaxError(ds.ErrorMessage('Invalid', step));
    }
  },
  Extension : '.ds',
  File      : require('fs'),
  Group     : {},
  Import    : function (path) {
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
      ds.File.readFileSync(path, ds.UTF8)
    )(ds.Scope());
  },
  Index     : 'index',
  JSON      : JSON,
  Logic     : function (type, range) {
    return {
      type: type,
      range: range,
      items: []
    };
  },
  Null      : null,
  Number    : Number,
  Operate   : function (left, operator, right) {
    var combinedOperator = {
      position: operator[0].position,
      value: operator.map(function (o) {
        return o.value;
      }).join('')
    };

    if (combinedOperator.value === '+') {
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
      throw new SyntaxError(ds.ErrorMessage(
        'Operator not implemented:', combinedOperator));
    }
  },
  Parse     : function (source) {
    var breaks = [-1];
    var position = function (i) {
      return function () {
        var line = -1;
        while (i > breaks[line + 1]) {
          line++;
        }
        var column = i - breaks[line];
        return 'line ' + ++line + ' column ' + column;
      }
    };

    var logic = ds.Logic('Logic', [0, source.length - 1]);
    logic.position = position(0);
    var head = logic;
    var stack = [];
    var previous;
    var isString;
    var queue = {
      type: 'v',
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
        type: 'v',
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
          head.items.push({type: 'x'});
          head.range.push(i);
          head = stack.pop();
        }

        else {
          head = null;
        }

        if (!head) {
          throw new SyntaxError(ds.ErrorMessage(
            'Unexpected', {
              value: '"' + source[i] + '"',
              position: position(i)
            }
          ));
        }
      }

      else if (ds.Syntax.separators.indexOf(source[i]) !== -1) {
        queueToHead(i);
        head.items.push({type: 'x'});
      }

      else if (ds.Syntax.whitespace.indexOf(source[i]) !== -1) {
        queueToHead(i);
      }

      else if (/[^$@a-zA-Z0-9]/.test(source[i])) {
        queueToHead(i);
        head.items.push({type: 'o', value: source[i], position: position(i)});
      }

      else {
        queue.value += source[i];
      }
    }

    return ds.Apply(logic);
  },
  Path      : require('path'),
  Process   : process,
  Resolve   : function (scope, resolve) {
    var value = scope;
    var allowNext = true;
    resolve.forEach(function (step) {
      if (step.type === 'v') {
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
          value = value[step.value];
        }
      }

      else if (step.type === 'o') {
        allowNext = true;
      }

      else {
        throw new TypeError();
      }
    });

    return value;
  },
  Scope     : function () {
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
  String    : String,
  Syntax    : {
    separators  : ['\n', ','],
    whitespace  : ['\t', ' '],
    close       : [']', ')', '}'],
    open        : {
      '[' : 'a',
      '(' : 'g',
      '{' : 'l',
      "'" : 's',
      '`' : 't'
    },
    blocks : {
      a : {close: ']', type: 'a'},
      g : {close: ')', type: 'g'},
      l : {close: '}', type: 'l'},
      s : {close: "'", type: 's',  string: true},
      t : {close: '`', type: 't',   string: true}
    }
  },
  System    : require('os'),
  Template  : {},
  Undefined : (function () {})(),
  UTF8      : 'utf8'
};

if (require.main === module) {
  var path = ds.Process.argv[2];
  if (typeof path !== 'string') {
    throw new Error('Usage: node ds source.ds');
  }
  ds.Import(path);
}

else {
  module.exports = function (source) {
    return ds.Parse(source)(ds.Scope());
  };

  Object.keys(ds).forEach(function (key) {
    module.exports[key] = ds[key];
  });
}
