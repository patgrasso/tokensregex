const expect    = require('chai').expect;
const { parse } = require('../lib/ts2postfix.js');
const nfa       = require('../lib/nfa.js');
const { EPS }   = nfa;

const re2NFA    = (re) => nfa.post2NFA(parse(re));
const path      = (start, p) => p.reduce((state, i) => state.out[i], start);

describe('nfa', () => {

  describe('post2NFA() state structure', () => {

    [ 'a', '{ word: a }', '/a/' ].forEach((re) => {
      it(re, () => {
        let s = re2NFA(re);
        expect(s.match).to.equal(false);
        expect(s.out[0].match).to.equal(true);
      });
    });

    [ 'a b', 'a /b/', 'a { word: b }' ].forEach((re) => {
      it(re, () => {
        let s = re2NFA(re);
        expect(s.match).to.equal(false);
        expect(path(s, [0]).match).to.equal(false);
        expect(path(s, [0, 0]).match).to.equal(true);
      });
    });

    [ '[a b]', '[a | b]' ].forEach((re) => {
      it(re, () => {
        let s = re2NFA(re);
        expect(s.out.length).to.equal(2);         // ^ -> {a -> $, b -> $}
        expect(path(s, [0]).match).to.equal(false);   // ^ -/> $
        expect(path(s, [0, 0]).match).to.equal(true); // a -> $
        expect(path(s, [1, 0]).match).to.equal(true); // b -> $
      });
    });

    /*
     * postfix: a b | { word:c } | /d/ |
     *                 ,-(a)--$
     *           ,-(|)<
     *     ,-(|)<      `-(b)--$
     * (|)<      `-({ word: c})--$
     *     `-(/d/)--$
     */
    it('[a b | { word:c } /d/ ]', () => {
      let s = re2NFA('[a b | { word:c } /d/ ]');
      expect(s.out.length).to.equal(2);
      expect(path(s, [0]).match).to.equal(false);   // |->
      expect(path(s, [1, 0]).match).to.equal(true); // /d/->$

      expect(path(s, [0, 0]).match).to.equal(false);    // |->
      expect(path(s, [0, 1, 0]).match).to.equal(true);  // { word:c }->$

      expect(path(s, [0, 0, 0]).match).to.equal(false); // |->a
      expect(path(s, [0, 0, 1]).match).to.equal(false); // |->b

      expect(path(s, [0, 0, 0, 0]).match).to.equal(true); // a->$
      expect(path(s, [0, 0, 1, 0]).match).to.equal(true); // b->$
    });

    it('[a & b]', () => {
      let s = re2NFA('[a & b]');
      expect(s.out[0].match).to.equal(true);
    });

    it('(a b c) d', () => {
      let s = re2NFA('(a b c) d');
      expect(path(s, [0]).match).to.equal(false);
      expect(path(s, [0, 0]).match).to.equal(false);
      expect(path(s, [0, 0, 0]).match).to.equal(false);
      expect(path(s, [0, 0, 0, 0]).match).to.equal(true);
    });

    it('(a [ foo bar ] c) d', () => {
      let s = re2NFA('(a [ foo bar ] c) d');
      expect(path(s, [0]).match).to.equal(false);
      expect(path(s, [0, 0]).match).to.equal(false);
      expect(path(s, [0, 1]).match).to.equal(false);
      expect(path(s, [0, 0, 0]).match).to.equal(false);
      expect(path(s, [0, 1, 0]).match).to.equal(false);
      expect(path(s, [0, 0, 0, 0]).match).to.equal(false);
      expect(path(s, [0, 1, 0, 0]).match).to.equal(false);
      expect(path(s, [0, 0, 0, 0, 0]).match).to.equal(true);
      expect(path(s, [0, 1, 0, 0, 0]).match).to.equal(true);
    });

    it('a+', () => {
      let s = re2NFA('a+');
      expect(path(s, [0, 0])).to.equal(s);
      expect(path(s, [0, 1]).match).to.equal(true);
    });

    it('a*', () => {
      let s = re2NFA('a*');
      expect(path(s, [0, 0])).to.equal(s);
      expect(path(s, [1]).match).to.equal(true);
    });

  });

  describe('post2NFA() state predicates', () => {

    const examples = {
      'WORD': [
        ['a'      , { word: 'a' }       , true      ],
        ['a'      , { word: 'apple' }   , false     ],
        ['a'      , { word: 'fooa' }    , false     ],
        ['a'      , { word: null }      , false     ],
        ['a'      , { word: undefined } , false     ],
        ['a'      , { word: '' }        , false     ],
        ['apple'  , { word: 'apple' }   , true      ],
        [undefined, { word: 'a' }       , TypeError ],
        [null     , { word: null }      , TypeError ]
      ],

      'REGEXP': [
        ['/a/'    , { word: 'a' }       , true      ],
        ['/a/'    , { word: 'apple' }   , true      ],
        ['/a/'    , { word: 'fooa' }    , true      ],
        ['/a/'    , { word: null }      , false     ],
        ['/a/'    , { word: undefined } , false     ],
        ['/a/'    , { word: '' }        , false     ],
        ['/apple/', { word: 'apple' }   , true      ],
        ['/apple/', { word: 'a' }       , false     ],
        ['/^a$/'  , { word: 'abc' }     , false     ],
        ['/^a$/'  , { word: 'a' }       , true      ],
        ['/a+b/'  , { word: 'b' }       , false     ],
        ['/a+b/'  , { word: 'ab' }      , true      ],
        ['/a+b/'  , { word: 'aaaaab' }  , true      ],
        ['/a+b/'  , { word: 'aaaaac' }  , false     ]
      ],

      'ATTR': [
        ['{a:b}'      , { a: 'b' }      , true      ],
        ['{word:yes}' , { word: 'yes' } , true      ],
        ['{word:yes}' , undefined       , TypeError ],
        ['{word:yes}' , null            , TypeError ],
        ['{word:yes}' , { a: 'b' }      , false     ],
        ['{word:yes}' , { word: 'no' }  , false     ],
        ['{word:yes}' , { word: 'yess' }, false     ],
        ['{word:/a/}' , { word: 'abc' } , true      ],
        ['{word:/a/}' , { word: 'bcd' } , false     ],
      ],

      '|': [
        ['[a | b]', { word: 'a' }       , EPS       ]
      ],

      '[...]': [
        ['[a b]'  , { word: 'a' }       , EPS       ]
      ],

      '&': [
        ['[/^ab[cde]$/ & /de/]' , { word: 'abcd' }   , false],
        ['[/^ab[cde]$/ & /de/]' , { word: 'abcde' }  , false],
        ['[/^ab[cde]+$/ & /de/]', { word: 'abcde' }  , true ],
      ]
    };

    const exp2str = {
      [TypeError] : 'TypeError',
      [false]     : 'false    ',
      [true]      : 'true     ',
      [EPS]       : 'epsilon  '
    };

    for (let type in examples) {

      describe(type, () => examples[type].forEach(([ re, tok, expected ]) => {

        it(`${exp2str[expected]} | ${re} =~ ${JSON.stringify(tok)}`, () => {
          if (Error.isPrototypeOf(expected)) {
            expect(() => re2NFA(re).pred(tok)).to.throw(expected);
          } else {
            expect(re2NFA(re).pred(tok)).to.equal(expected);
          }
        });

      }));

    }

  });

});
