const __TokensRegex = require('./lib/TokensRegex');

function _TokensRegex(...args) {
  return new __TokensRegex(...args);
}

Object.defineProperty(_TokensRegex, 'name', {
  value: 'TokensRegex',
  writable: false,
  enumerable: false,
  configurable: true
});

module.exports = _TokensRegex;
