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
