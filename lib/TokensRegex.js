const { parse }                 = require('./ts2postfix');
const { post2NFA, simulateNFA } = require('./nfa');
const priv                   = new WeakMap();

/*
 * Adaptation of the Stanford NLP TokensRegex parser.
 *
 * See {@link https://nlp.stanford.edu/software/tokensregex.html} for the
 * parser syntax.
 */
class TokensRegex extends RegExp {

  constructor(source='/.*/*', flags='') {
    super();
    priv.set(this, {});
    this.compile(source, flags);
  }

  compile(source, flags='') {
    priv.get(this).nfa = post2NFA(parse(source));
    priv.get(this).flags = flags;
    priv.get(this).source = source;
    return this;
  }

  get source() {
    return priv.get(this).source.slice();
  }

  get flags() {
    return priv.get(this).flags.slice();
  }

  exec(tagged) {
    // TODO: lex input sentence "tagged"
    let tokens = tagged.split(' ').map((word) => ({ word }));
    let result = simulateNFA(priv.get(this).nfa, tokens);
    return result;
  }

}

module.exports = TokensRegex;
