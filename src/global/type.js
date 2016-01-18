DefaultScript.global.type = function $bust$(thing) {
  if (typeof thing === 'undefined') {
    return 'undefined';
  }

  if (thing === null) {
    return 'null';
  }

  if (thing === EMPTY) {
    return 'empty';
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
