DefaultScript.global.html = remember(null, '@html', function $trap$(scopes, step, stepName, htmlDocumentLogic, onException) {
  if (DefaultScript.global.type(htmlDocumentLogic) !== 'logic') {
    return onException(new TypeError('@html: logic definition must follow'), step, stepName);
  }

  var tagPrototype = {};

  tagPrototype.doctype = function $trap$(scopes, step, stepName, doctype, onException) {
    this.doctype = doctype;
  };

  ['html', 'body', 'base', 'head', 'link', 'meta', 'style', 'title', 'address', 'article', 'footer', 'header', 'h1', 'hgroup', 'nav', 'section', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'hr', 'li', 'main', 'ol', 'p', 'pre', 'ul', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'code', 'data', 'dfn', 'em', 'i', 'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr', 'area', 'audio', 'map', 'track', 'video', 'embed', 'object', 'param', 'source', 'canvas', 'noscript', 'script', 'del', 'ins', 'caption', 'col', 'colgroup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr', 'button', 'datalist', 'fieldset', 'form', 'input', 'keygen', 'label', 'legend', 'meter', 'optgroup', 'option', 'output', 'progress', 'select', 'details', 'dialog', 'menu', 'menuitem', 'summary'].forEach(function (tag) {
    tagPrototype[tag] = function $trap$(scopes, step, stepName, tagDefinition, onException) {
      if (typeof tagDefinition === 'string') {
        this.fragment.push(['<', tag, '>', tagDefinition, '</', tag, '>'].join(''));
        return;
      }

      if (DefaultScript.global.type(tagDefinition) !== 'logic') {
        return onException(new TypeError('<' + tag + '> tag definition must be a string or logic block'), step, stepName);
      }

      var newNode = createChildNode(this);
      newNode.fragment.push('<' + tag + '>');
  });

  var createChildNode = function (parent) {
    var node = Object.create(tagPrototype);
    if (parent) {
      parent.fragment.push(node);
    }
    node.fragment = [];
    return node;
  };

  var document = createChildNode();

  return transformPossiblePause(htmlDocumentLogic([document].concat(scopes), step, stepName, null, onException), function () {
    var tags;

    if (document.hasOwnProperty('doctype')) {
      tags = ['<!doctype ' + document.doctype + '>', '<html>'].concat(document.fragment, '</html>');
    }

    else {
      tags = document.fragment;
    }

    return {
      contentType: 'text/html',
      document: tags.join('\n')
    }
  });
});
