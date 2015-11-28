/**
 * DefaultScript
 * @author Nate Ferrero
 * @url https://nateferrero.com
 * @tel (919) 426-2830
 * @location Ann Arbor, MI
 * @date Thursday, November 26th, 2015
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
