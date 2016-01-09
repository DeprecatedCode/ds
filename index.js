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
(function () {

var globalVars = typeof global === 'object' ? global : window;
var DefaultScript = {
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

var isBrowser = typeof window === 'object';
var isNode = typeof global === 'object' && typeof require === 'function';

var resumeCallback = function (result) {
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

const BREAK    = 0;
const NAME     = 1;
const OPERATOR = 2;
const GROUP    = 3;
const LOGIC    = 4;
const ARRAY    = 5;
const STRING   = 6;

const POSITION = 0;
const TYPE     = 1;
const SOURCE   = 2;

const IT = '@';
const EMPTY = {$: 'empty'};
const EXTENSION = '.ds';

var remember = function (step, stepName, fn) {
  fn.step = step;
  fn.stepName = stepName;
  return fn;
};
DefaultScript.block = function (type, position) {
  if (type !== GROUP && type !== LOGIC && type !== ARRAY) {
    throw new Error('Invalid block type');
  }
  var block = [];
  block[TYPE] = type;
  block[SOURCE] = [];
  block[POSITION] = position;
  block.$type$ = 'block';
  return block;
};
DefaultScript.error = function (err, step, stepName) {
  var desc;

  if (!step || !stepName) {
    throw new Error('Invalid use of DefaultScript.error');
  }

  if (typeof step[SOURCE] === 'string' && step[SOURCE].length > 0) {
    desc = '`' + step[SOURCE] + '`';
  }

  else {
    desc = DefaultScript.tokenTypes[step[TYPE]].toLowerCase();
  }

  err.stack = [];

  err.name = '@' + err.name;

  err.message = err.message + ' near ' + desc + ' at ' + step[POSITION]() +
     '\n' + step[POSITION].getSource(true);

  return err;
};
DefaultScript.expression = function (scopes, step, triggerStepName, expression) {
  var stack = [];
  var left = [];
  var right = [];
  var operation = [];
  var value = EMPTY;

  return DefaultScript.walk(expression, triggerStepName, function (step, stepName) {
    if (step[TYPE] === BREAK || right.length > 0) {
      var operate = function (leftValue) {

        return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, function (_value_) {
          if (value.stepName === '@expect(actual: number)') {
            throw new Error(String(_value_));
          }

          left = [];
          right = [];
          operation = [];
          value = _value_;

          if (step[TYPE] !== BREAK) {
            right.push(step);
          }
        });
      };

      if (left.length > 0) {
        if (value !== EMPTY) {
          throw new Error('Invalid situation');
        }

        return DefaultScript.resolve(scopes, step, stepName, left, function (leftValue) {
          return operate(leftValue);
        });
      }

      return operate(value);
    }

    else if (step[TYPE] === OPERATOR && step[SOURCE] !== '.') {
      operation.push(step);
    }

    else if (value === EMPTY && left.length === 0 && operation.length === 0) {
      left.push(step);
    }

    else /* has value or operation.length > 0 */ {
      right.push(step);
    }
  }, function (resolve) {
    resolve(value);
  });
};
DefaultScript.get = function (scopes, step, stepName) {
  var key = step[SOURCE];
  var value;

  for (var i = 0; i < scopes.length; i++) {
    if (key in scopes[i]) {
      return scopes[i][key];
    }
  }

  if (key[0] === '@') {
    var globalKey = key.substr(1);
    if (globalKey in DefaultScript.global) {
      return DefaultScript.global[globalKey];
    }
  }

  throw DefaultScript.error(new Error(key + ' is not defined'), step, stepName);
};
if (isNode) {
  var fs = require('fs');
  var path = require('path');
  DefaultScript.import = function (name, step) {
    var stats;

    try {
      stats = fs.lstatSync(name);
    }

    catch (e) {
      stats = fs.lstatSync(name + EXTENSION);
      name += EXTENSION;
    }

    if (stats.isDirectory()) {
      name = path.join(name, DefaultScript.index + EXTENSION);
    }

    var contents;

    try {
      contents = fs.readFileSync(name, 'utf8');
    }

    catch (e) {
      throw ds.errorMessage(e, step);
    }

    var tree = DefaultScript.parse(contents, name);
    var logic = DefaultScript.logic(tree, name);
    var scopes = [DefaultScript.global.scope()];
    return logic(scopes, null, name, EMPTY);
  };
}

else if (isBrowser) {
  DefaultScript.import = function (name) {
    if (name.substr(name.length - 3) !== EXTENSION) {
      name = name + EXTENSION;
    }

    return DefaultScript.pause(function (resume) {
      DefaultScript.global.request(name)(function (contents) {
        var tree = DefaultScript.parse(contents, name);
        var logic = DefaultScript.logic(tree, name);
        var scopes = [DefaultScript.global.scope()];
        resume(logic(scopes, null, name, EMPTY));
      });
    });
  };
}

else {
  throw new Error('@import is not supported on this platform');
}
DefaultScript.index = 'index';
DefaultScript.literals = {
  'true':       true,
  'false':      false,
  'null':       null,
  'undefined':  undefined
};
DefaultScript.logic = function (block, name) {
  return remember(block, name, function $logic$(scopes, step, stepName, value) {
    var stack = [];
    var key = [];
    var expectKey = false;
    var lastValue = EMPTY;

    var isNameOrDot = function (step) {
      return step[TYPE] === NAME || (
        step[TYPE] === OPERATOR && step[SOURCE] === '.'
      );
    };

    return DefaultScript.walk(block[SOURCE], name, function (step, stepName) {
console.log(step[1], step[2], step[0]())
      if (step[TYPE] === BREAK) {
        if (expectKey) {
          throw DefaultScript.error(new Error('Key expected'), step);
        }

        stack.push(step);
        return DefaultScript.expression(scopes, step, stepName, stack, function (value) {
          stack = [];

          if (key.length === 0) {
            lastValue = value;
          }

          else {
            return DefaultScript.set(scopes, step, stepName, key, value, function () {
              key = [];
            });
          }
        });
      }

      else if (step[TYPE] === OPERATOR && step[SOURCE] === ':') {
        if (expectKey || key.length > 0) {
          throw DefaultScript.error(new Error('Unexpected :'), step, stepName);
        }

        if (stack.length === 0) {
          expectKey = true;
        }

        else {
          key = stack;
          stack = [];
        }
      }

      else if (expectKey && isNameOrDot(step)) {
        key.push(step);
      }

      else if (expectKey && key.length === 0) {
        key.push(step);
        expectKey = false;
      }

      else {
        expectKey = false;
        stack.push(step);
      }

      return DefaultScript.pause(function (resume) {
        setTimeout(resume, 10);
      });
    }, function (resolve) {
      resolve(lastValue !== EMPTY ? lastValue : scopes);
    });
  });
};
DefaultScript.operate = function (scopes, step, stepName, leftValue, operation, right) {

  if (DefaultScript.global.type(leftValue) === 'logic' && leftValue.name === '$trap$') {
    return DefaultScript.resolve(scopes, step, stepName, right, function (rightValue) {
      return leftValue(scopes, step, stepName, rightValue, next);
    });
  }

  // DefaultScript.global.log('\n\nOperate:', leftValue, operation, right, '\n\n');

  var leftType = DefaultScript.global.type(leftValue);

  var resolveRight = function (fn) {
    return DefaultScript.resolve(scopes, step, stepName, right, function (rightValue) {
      var rightType = DefaultScript.global.type(rightValue);
      return fn(rightType, rightValue);
    });
  }

  if (operation.length === 0) {
    return resolveRight(function (rightType, rightValue) {
      console.log('###', leftValue, operation, rightValue)
      if (rightType === 'logic') {
        return rightValue(scopes, step, stepName, leftValue, next);
      }

      else if (rightType === 'function') {
        try {
          return rightValue(leftValue);
        }

        catch (e) {
          throw new DefaultScript.error(e, step, stepName);
        }
      }

      else {
        var message = 'Invalid combination, ' + leftType + ' and ' + rightType;
        throw DefaultScript.error(
          new Error(message), step, stepName
        );
      }
    });
  }

  else if (operation[operation.length - 1][SOURCE] === '!') {
    leftValue = !leftValue;
    operation.pop();
    return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, next);
  }

  else if (operation.length > 1 && operation[0][SOURCE] === '-') {
    leftValue = -1 * leftValue;
    operation.pop();
    return DefaultScript.operate(scopes, step, stepName, leftValue, operation, right, next);
  }

  else {
    var combinedOperator = operation.map(function (op) {
      return op[SOURCE];
    }).join('');

    if (combinedOperator === '+') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue + rightValue;
      });
    }

    else if (combinedOperator === '-') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue - rightValue;
      });
    }

    else if (combinedOperator === '*') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue * rightValue;
      });
    }

    else if (combinedOperator === '/') {
      return resolveRight(function (rightType, rightValue) {
        return leftValue / rightValue;
      });
    }

    throw new Error('Operation ' + combinedOperator + ' not implemented');
  }
};
DefaultScript.parse = function (source, name) {
  var syntax = DefaultScript.syntax;
  var isEscape = false;
  var isComment = false;
  var breaks = [-1];

  var position = function (start, end) {
    var i = start;
    var positionFn = function () {
      var line = -1;
      while (i > breaks[line + 1]) {
        line++;
      }
      var column = i - breaks[line];
      return 'line ' + ++line + ' column ' + column;
    };

    positionFn.start = start;
    positionFn.end = typeof end === 'number' ? end : start;

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

  var logic = DefaultScript.block(LOGIC, position(0, source.length - 1));
  var head = logic;
  var stack = [];
  var previous;
  var isString;
  var queue = DefaultScript.token(NAME, position(0));

  var queueToHead = function (i) {
    if (queue[SOURCE].length) {
      queue[POSITION].end = i - 1;
      head[SOURCE].push(queue);
    }

    queue = DefaultScript.token(NAME, position(i + 1));
  };

  var breakAt = function (head, i) {
    var src = head[SOURCE];
    if (src.length > 0 && src[src.length - 1][TYPE] !== BREAK) {
      src.push(DefaultScript.token(BREAK, position(i)));
    }
  };

  for (var i = 0; i < source.length; i++) {
    if (source[i] === '\n') {
      isComment = false;
      breaks.push(i);
    }

    isString = head[TYPE] &&
               syntax.blocks[head[TYPE]] &&
               syntax.blocks[head[TYPE]].string;

    if (isComment) {
      // do nothing
    }

    else if (!isString && !isComment && source[i] === syntax.comment) {
      isComment = true;
      continue;
    }

    else if (!isEscape && source[i] === syntax.escape) {
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

        head[SOURCE] += add;
      }
    }

    else if (!isString && source[i] in syntax.open) {
      queueToHead(i);
      previous = head;
      stack.push(previous);
      var type = syntax.open[source[i]]; // <3 OSS

      if (syntax.blocks[type].string) {
        head = DefaultScript.token(type, position(i));
      }

      else {
        head = DefaultScript.block(type, position(i));
      }

      previous[SOURCE].push(head);
    }

    else if (isString && source[i] === syntax.blocks[head[TYPE]].close) {
      head[POSITION].end = i;
      head = stack.pop();
    }

    else if (isString) {
      head[SOURCE] += source[i];
    }

    else if (syntax.close.indexOf(source[i]) !== -1) {
      if (head && syntax.blocks[head[TYPE]] &&
          source[i] === syntax.blocks[head[TYPE]].close) {
        queueToHead(i);
        breakAt(head, i);
        head[POSITION].end = i;
        head = stack.pop();
      }

      else {
        head = null;
      }

      if (!head) {
        throw DefaultScript.error(new SyntaxError('Unexpected'), {
          value: source[i],
          position: position(i)
        });
      }
    }

    else if (syntax.separators.indexOf(source[i]) !== -1) {
      queueToHead(i);
      breakAt(head, i);
    }

    else if (syntax.whitespace.indexOf(source[i]) !== -1) {
      queueToHead(i);
    }

    else if (syntax.name.test(source[i])) {
      queueToHead(i);
      head[SOURCE].push(DefaultScript.token(OPERATOR, position(i), source[i]));
    }

    else {
      queue[SOURCE] += source[i];
    }
  }

  return logic;
};
DefaultScript.pause = function (wait) {
  var done;
  var noResume = new Error('Nothing to do when resuming pause');

  wait(function $resume$() {
    if (typeof done !== 'function') {
      throw noResume;
    }
    done();
  });

  return function $pause$(_done_) {
    done = _done_;
  };
};
DefaultScript.resolve = function (scopes, step, triggerStepName, stack) {
  const STATE_DOT = 0;
  const STATE_NAME = 1;

  // DefaultScript.global.log('Resolve:', stack);
  var value = EMPTY;
  var state = EMPTY;

  return DefaultScript.walk(stack, triggerStepName, function (step, stepName) {
    if (step[TYPE] === OPERATOR && step[SOURCE] === '.') {
      if (state === EMPTY) {
        console.log(value)
      }
      state = STATE_DOT;
    }

    else if ((state === STATE_DOT || state === EMPTY) && step[TYPE] === NAME) {

      if (state === EMPTY && /^\d+$/.test(step[SOURCE])) {
        value = parseInt(step[SOURCE], 10);
      }

      else {
        state = STATE_NAME;
        return DefaultScript.get(value === EMPTY ? scopes : value, step, stepName, function (_value_) {
          value = _value_;
        });
      }
    }

    else if (state !== EMPTY) {
      throw new Error('Invalid state');
    }

    else if (step[TYPE] === STRING) {
      value = step[SOURCE];
    }

    else if (step[TYPE] === LOGIC) {
      value = DefaultScript.logic(step, stepName);
    }

    else {
      console.log(step)
      throw new Error('Invalid step to resolve');
    }
  }, function (resolve) {
    resolve(value);
  });
};
DefaultScript.run = function () {
  if (isNode) {
    if (require.main === module) {
      var result;
      var name = process.argv[2];

      if (typeof name !== 'string') {
        throw new Error('Usage: ds source.ds');
      }

      if (name === '--help') {
        resumeCallback(DefaultScript.import('lib/help'))(function (value) {
          // Don't care about the result, but we need to handle this
          // console.log('Result:', value);
        });
      }

      else {
        resumeCallback(DefaultScript.import(name))(function (value) {
          // Don't care about the result, but we need to handle this
          // console.log('Result:', value);
        });
      }
    }

    else {
      module.exports = function (source, name) {
        throw new Error('Not implemented');
        var logic = DefaultScript.logic(name, DefaultScript.parse(source));
        var scopes = [DefaultScript.global.scope()];
        console.log(logic)
        return resumeCallback(logic(scopes, null, name, EMPTY));
      };
    }
  }

  else if (isBrowser) {
    window.DefaultScript = DefaultScript;
  }

  else {
    throw new Error('No valid environment found');
  }
};
DefaultScript.set = function (scopes, step, stepName, key, value) {
  // always call next at resolve end
  // next(55);
  console.log('SET', key, value);
  // return DefaultScript.pause if needed during resolve walk
  return;
}
DefaultScript.syntax = {
  escape      : '\\',
  comment     : '#',
  separators  : ['\n', ','],
  whitespace  : ['\t', ' '],
  close       : [']', ')', '}'],
  name        : /[^$@_a-zA-Z0-9]/,
  open        : {
    '[' : ARRAY,
    '(' : GROUP,
    '{' : LOGIC,
    "'" : STRING
  },
  blocks: (function (blocks) {
    blocks[ARRAY]  = {close: /*[*/ ']', type: ARRAY};
    blocks[GROUP]  = {close: /*(*/ ')', type: GROUP};
    blocks[LOGIC]  = {close: /*{*/ '}', type: LOGIC};
    blocks[STRING] = {close: /*'*/ "'", type: STRING, string: true};
    return blocks;
  })({})
};
DefaultScript.token = function (type, position, value) {
  if (type !== BREAK && type !== NAME && type !== OPERATOR && type !== STRING) {
    throw new Error('Invalid token type');
  }
  var token = [];
  token[TYPE] = type;
  token[SOURCE] = value || '';
  token[POSITION] = position;
  token.$type$ = 'token';
  return token;
};
DefaultScript.walk = function (sourceSteps, sourceName, each, next) {
  var i = 0;
  var paused = false;
  var resume;
  var value;
  var resolve = function (_value_) {
    value = _value_;
    if (resume) {
      resume(value);
    }
  };

  var nextStep = function () {
    if (typeof i === 'undefined') {
      i = 0;
    }

    if (i >= sourceSteps.length) {
      next(resolve);
    }

    else {
      var handler = each(sourceSteps[i], sourceName);
      i += 1;

      if (typeof handler === 'function' && handler.name === '$pause$') {
        handler(nextStep);
        paused = true;
      }

      else {
        nextStep();
      }
    }
  };

  nextStep();

  if (!paused) {
    return value;
  }

  return DefaultScript.pause(function (_resume_) {
    resume = _resume_;
  });
};
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
DefaultScript.global.expect = remember(null, '@expect', function $logic$(scopes, step, stepName, actualValue) {
  var label = '@expect(actual: ' + DefaultScript.global.type(actualValue) + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, expectedValue) {
    if (actualValue !== expectedValue) {
      throw new Error('Woah');
    }
    console.log('QSNMQSKQNMSQS');
  });
});
DefaultScript.global.format = function (item) {
  var type =  DefaultScript.global.type(item);
  var more;
  var restrict = function (array) {
    var max = 3;
    more = 0;
    if (array.length > max) {
      more = array.length - max
      return array.slice(0, max);
    }
    else {
      return array;
    }
  };

  if (type === 'array') {
    var items = restrict(item).map(DefaultScript.global.format);

    if (more > 0) {
      items = items.concat(['...(' + more + ' more)']);
    }

    var itemsCommaSpace = items.join(', ');
    var itemsNewLine = function () {
      return [''].concat(items).join('\n')
                 .replace(/\n/g, '\n  ').concat(['\n']);
    };

    var items = itemsCommaSpace.length < 80 ?
      itemsCommaSpace : itemsNewLine();
    return ['[', items, ']'].join('');
  }

  if (type === 'token' || type === 'block') {
    var formattedSource;
    if (!item[SOURCE].length) {
      formattedSource = '';
    }
    else {
      formattedSource = ' ' + DefaultScript.global.format(item[SOURCE]);
    }
    return ['<', DefaultScript.tokenTypes[item[TYPE]], formattedSource, '>'].join('');
  }

  if (type === 'object') {
    var items = restrict(Object.keys(item)).map(function (key) {
      return [key, ': ', DefaultScript.global.format(item[key])].join('');
    });

    if (more > 0) {
      items = items.concat(['...(' + more + ' more)']);
    }

    var itemsCommaSpace = items.join(', ');
    var itemsNewLine = function () {
      return [''].concat(items).join('\n')
                 .replace(/\n/g, '\n  ').concat(['\n']);
    };

    var items = itemsCommaSpace.length < 80 ?
      itemsCommaSpace : itemsNewLine();
    return ['{', items, '}'].join('');
  }

  if (type === 'string') {
    return ["'", item, "'"].join('');
  }

  if (type === 'number' ||
      type === 'boolean' ||
      type === 'null' ||
      type === 'undefined') {
    return String(item);
  }

  if (type === 'logic') {
    var name = item.stepName || 'native';
    return ['{logic ', name, '}'].join('');
  }

  return type;
};
DefaultScript.global.log = function () {
  Array.prototype.slice.call(arguments).forEach(function (arg) {
    console.log(DefaultScript.global.format(arg));
  });
};
if (isBrowser) {
  DefaultScript.global.request = function (config, data) {
    /**
     * https://gist.github.com/Xeoncross/7663273
     * IE 5.5+, Firefox, Opera, Chrome, Safari XHR object
     */
    if (typeof config !== 'object') {
      config = {url: config, method: 'GET'};
    }

    if (typeof data !== 'undefined') {
      config.data = data;
      config.method = 'POST';
    }

		var x = new(window.XMLHttpRequest || ActiveXObject)('MSXML2.XMLHTTP.3.0');
		x.open(config.method, config.url, 1);
		x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
		x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		x.send(config.data);

    return function (callback) {
      if (typeof callback !== 'function') {
        throw new Error('Invalid use of @request');
      }
  		x.onreadystatechange = function () {
  			x.readyState > 3 && callback(x.responseText, x);
  		};
    };
  };
}

else if (isNode) {
  var http = require('http');
  DefaultScript.global.request = function () {
    throw new Error('not implemented');
  };
}

else {
  throw new Error('No request client available');
}
DefaultScript.global.scope = function (parent) {
  return Object.create(parent || null);
};
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
DefaultScript.global.test = remember(null, '@test', function $trap$(scopes, step, stepName, description) {
  if (DefaultScript.global.type(description) !== 'string') {
    throw DefaultScript.error(
      new TypeError('string description must follow @test'), step, stepName
    );
  }

  var label = '@test(' + description + ')';
  return remember(null, label, function $trap$(scopes, step, stepName, block) {
    if (DefaultScript.global.type(block) !== 'logic') {
      throw DefaultScript.error(
        new TypeError('logic block must follow @test'), step, stepName
      );
    }

    return block(scopes, step, stepName);
  });
});
DefaultScript.global.type = function $bust$(thing) {
  if (typeof thing === 'undefined') {
    return 'undefined';
  }

  if (thing === null) {
    return 'null';
  }

  if (typeof thing === 'object' && thing.$state$) {
    return 'scope';
  }

  if (typeof thing === 'object' && thing.$type$) {
    return thing.$type$;
  }

  if (typeof thing === 'function' &&
    (thing.name === '$logic$' || thing.name === '$trap$')) {
    return 'logic';
  }

  if (Array.isArray(thing)) {
    return 'array';
  }

  return typeof thing;
};
DefaultScript.run();

})();
