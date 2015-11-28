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
