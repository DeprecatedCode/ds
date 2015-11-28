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
