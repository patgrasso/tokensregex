const expect    = require('chai').expect;
const { parse } = require('../lib/ts2postfix.js');

describe('ts2postfix.y', () => {

  describe('lex(ATTR) \'{ <attr>:<value> }\'', () => {

    it('allows spaces around braces', () => {
      expect(parse('{ attr:my }')[0][0]).to.equal('ATTR');
      expect(parse('{ \tattr:my\t\n }')[0][0]).to.equal('ATTR');
    });

    it('allows spaces around colon', () => {
      expect(parse('{attr : my}')).to.eql([[ 'ATTR', 'attr', 'my' ]]);
      expect(parse('{attr \t:\t\n   my}')).to.eql([[ 'ATTR', 'attr', 'my' ]]);
    });

    it('stores <attr> in the 1st index', () => {
      expect(parse('{attr:my}')[0][1]).to.equal('attr');
      expect(parse('{word:my}')[0][1]).to.equal('word');
    });

    it('stores <value> in the 2nd index', () => {
      expect(parse('{attr:my}')[0][2]).to.equal('my');
      expect(parse('{word:my}')[0][2]).to.equal('my');
      expect(parse('{word:foobar}')[0][2]).to.equal('foobar');
    });

    it('returns a RegExp instance if <value> is a REGEXP', () => {
      expect(parse('{attr:/my/}')[0][2]).to.eql(/my/);
      expect(parse('{attr:/my/}')[0][2]).to.not.eql('my'); // sanity check
    });

  });

  describe('lex(WORD)', () => {

    it('recognizes a word consisting of a-zA-Z', () => {
      let lowerAlpha  = 'abcdefghijklm nopqrstuvwxyz'
        , lowerAlpha0 = 'abcdefghijklm'
        , lowerAlpha1 = 'nopqrstuvwxyz'
        , upperAlpha  = 'ABCDEFGHIJKLM NOPQRSTUVWXYZ'
        , upperAlpha0 = 'ABCDEFGHIJKLM'
        , upperAlpha1 = 'NOPQRSTUVWXYZ';

      expect(parse(lowerAlpha)).to.eql([
        [ 'WORD', lowerAlpha0 ],
        [ 'WORD', lowerAlpha1 ],
        [ '.' ]
      ]);
      expect(parse(upperAlpha)).to.eql([
        [ 'WORD', upperAlpha0 ],
        [ 'WORD', upperAlpha1 ],
        [ '.' ]
      ]);
    });

    it('recognizes a word consisting of 0-9', () => {
      expect(parse('0123456789')).to.eql([[ 'WORD', '0123456789' ]]);
    });

    // TODO: i mean, we *should* test every character except those excluded
    //       by the regex (see lex file)

  });

  describe('\'.\' concat', () => {

    it('a => a', () => {
      expect(parse('a')).to.eql([
        [ 'WORD', 'a' ]
      ]);
    });

    it('a b => a b .', () => {
      expect(parse('a b')).to.eql([
        [ 'WORD', 'a' ],
        [ 'WORD', 'b' ],
        [ '.' ]
      ]);
    });

    it('a /b/ => a /b/ .', () => {
      expect(parse('a /b/')).to.eql([
        [ 'WORD', 'a' ],
        [ 'REGEXP', /b/ ],
        [ '.' ]
      ]);
      expect(parse('a { word:b }')).to.eql([
        [ 'WORD', 'a' ],
        [ 'ATTR', 'word', 'b' ],
        [ '.' ]
      ]);
    });

    it('a b (c d) => a b . c d . .', () => {
      expect(parse('a b (c d)')).to.eql([
        [ 'WORD', 'a' ],
        [ 'WORD', 'b' ],
        [ '.' ],
        [ 'WORD', 'c' ],
        [ 'WORD', 'd' ],
        [ '.' ],
        [ '.' ]
      ]);
    });

    it('a { word:hello } b => a { word:hello } . b .', () => {
      expect(parse('a { word:hello } b')).to.eql([
        [ 'WORD', 'a' ],
        [ 'ATTR', 'word', 'hello' ],
        [ '.' ],
        [ 'WORD', 'b' ],
        [ '.' ]
      ]);
    });

    it('a ([ /[abc]def[cba]/ & /c/ | d ]) => a /[abc]def[cba]/ /c/ & d | .', () => {
      expect(parse('a ([ /[abc]def[cba]/ & /c/ | d ])')).to.eql([
        [ 'WORD', 'a' ],
        [ 'REGEXP', /[abc]def[cba]/ ],
        [ 'REGEXP', /c/ ],
        [ '&' ],
        [ 'WORD', 'd' ],
        [ '|' ],
        [ '.' ]
      ]);
    });

  });

  [ ['|', 'or'], ['&', 'and'] ].forEach(([ o, desc ]) => {
    describe(`'${o}' ${desc}`, () => {

      it(`[ a ${o} b ] => a b ${o}`, () => {
        expect(parse(`[ a ${o} b ]`)).to.eql([
          [ 'WORD', 'a' ],
          [ 'WORD', 'b' ],
          [ o ]
        ]);
      });

      it(`[ a ${o} b ${o} c ] => a b ${o} c ${o}`, () => {
        expect(parse(`[ a ${o} b ${o} c ]`)).to.eql([
          [ 'WORD', 'a' ],
          [ 'WORD', 'b' ],
          [ o ],
          [ 'WORD', 'c' ],
          [ o ]
        ]);
      });

      it('throws if not inside [ ... ]', () => {
        expect(() => parse( `a ${o} b` )).to.throw();
        expect(() => parse(`(a ${o} b)`)).to.throw();
        expect(() => parse(`[a ${o} b]`)).not.to.throw();
        expect(() => parse(`([a ${o} b])`)).not.to.throw();
        expect(() => parse(`([( a ${o} b )])`)).to.throw();
        expect(() => parse(`((([a ${o} b])))`)).not.to.throw();
      });

    });
  });

  describe('\'?\' maybe', () => {

    it('a?b => a ? b .', () => {
      expect(parse('a?b')).to.eql([
        [ 'WORD', 'a' ],
        [ '?' ],
        [ 'WORD', 'b' ],
        [ '.' ]
      ]);
    });

    it('[a | b]? c => a b | ? c .', () => {
      expect(parse('[a | b]? c')).to.eql([
        [ 'WORD', 'a' ],
        [ 'WORD', 'b' ],
        [ '|' ],
        [ '?' ],
        [ 'WORD', 'c' ],
        [ '.' ]
      ]);
    });

    it('throws if after a space ("a ?" rather than "a?")', () => {
      expect(() => parse('a ?')).to.throw();
      expect(() => parse('a?')).not.to.throw();
    });

  });

  [ ['+', 'plus'], ['*', 'kleene star'] ].forEach(([ o, desc ]) => {
    let other = { '+': '*', '*': '+' };

    describe(`'${o}' ${desc}`, () => {

      it(`a${o}b => a ${o} b .`, () => {
        expect(parse(`a${o}b`)).to.eql([
          [ 'WORD', 'a' ],
          [ o ],
          [ 'WORD', 'b' ],
          [ '.' ]
        ]);
      });

      it(`throws if after a ${other[o]} (e.g. "a${other[o]}${o}")`, () => {
        expect(() => parse(`a${other[o]}${o}`)).to.throw();
        expect(() => parse(`a${o}`)).not.to.throw();
      });

      it(`throws if after a space ("a ${o}" rather than "a${o}")`, () => {
        expect(() => parse(`a ${o}`)).to.throw();
        expect(() => parse(`a${o}`)).not.to.throw();
      });

    });
  });

});
