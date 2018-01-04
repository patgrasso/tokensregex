# TokensRegex

TokensRegex is a tool for defining patterns over text/sequences of tokens, with
an emphasis on the use of attributes of the text/tokens, such as part of speech
or recognized entities. Instead of operating on individual characters, as
ordinary regular expression systems do, TokensRegex operates on tokens. For
example:

```
play ([{ tag:NN }]+) by ([]+)
```

This is a JavaScript implementation of the
[Stanford TokensRegex system](https://nlp.stanford.edu/software/tokensregex.html).
The expression grammar accepted by this implementation is adapted from that of
Stanford's own TokensRegex system, a full description of which can be found at
the link above.


## Usage

```js
const TokensRegex = require('tokensregex');

let songCommand = new TokensRegex('play ([{ tag:NN }]+) by ([]+)');

songCommand.test('play banana pancakes by Jack Johnson'); // true
songCommand.test('what is the capital of Minnesota?');    // false

'play Mr. Brightside by The Killers'.match(songCommand);  // { match object }
```

As you can see, `TokensRegex` operates very similarly to JavaScript's `RegExp`.
`TokensRegex` extends `RegExp` and overrides all relevant functionality, so it
can be used with the string methods `match()` and `replace()`, or via the
RegExp `exec()` and `test()` methods.


## Syntax

Each component in a TokensRegex expression operates on a token (typically a
word, but can be any kind of token). Some operators, such as `+`, `*`, `?`, may
seem familiar.

| Symbol              | Meaning                                               |
| ------------------- | ----------------------------------------------------- |
| **All**             |                                                       |
| []                  | Any token                                             |
| **Strings**         |                                                       |
| ~~"_abc_"~~             | The text of the token exactly equals the string abc.  |
| /_abc_/             | The text of the token matches the regular expression specified by abc.              |
| { /_key_/:"/abc/" } | The token annotation corresponding to key matches the string abc exactly.           |
| { /_key_/:/abc/ }   | The token annotation corresponding to key matches the regular expression specified by abc. |
| **Numerics**        |                                                       |
| ~~{ _key_==_number_ }~~ | The token annotation corresponding to key is equal to number.                       |
| ~~{ _key_!=_number_ }~~ | The token annotation corresponding to key is not equal to number.                   |
| ~~{ _key_>_number_ }~~  | The token annotation corresponding to key is greater than number.                   |
| ~~{ _key_<_number_ }~~  | The token annotation corresponding to key is less than number.                      |
| ~~{ _key_>=_number_ }~~ | The token annotation corresponding to key is greater than or equal to number.       |
| ~~{ _key_<=_number_ }~~ | The token annotation corresponding to key is less than or equal to number.          |
| **Boolean checks**  |                                                       |
| ~~{ _key_::IS\_NUM }~~  | The token annotation corresponding to key is a number.|
| ~~{ _key_::IS\_NIL } or { _key_::NOT\_EXISTS }~~  | The token annotation corresponding to key does not exist. |
| ~~{ _key_::NOT\_NIL } or { _key_::EXISTS }~~      | The token annotation corresponding to key exist.          |
| **Sequencing**      |                                                       |
| _X_ _Y_             | _X_ followed by _Y_                                   |
| _X_ \| _Y_          | _X_ or _Y_                                            |
| _X_ & _Y_           | _X_ and _Y_                                           |
| **Groups**          |                                                       |
| (_X_)               | _X_ as a capturing group                              |
| ~~(?$name _X_)~~        | _X_ as a capturing group with name name               |
| ~~(?: _X_)~~            | _X_ as a non-capturing group                          |
| **Greedy quantifiers** |                                                    |
| _X_?                | _X_, once or not at all                               |
| _X_\*               | _X_, zero or more times                               |
| _X_+                | _X_, one or more times                                |
| ~~_X_{n}~~              | _X_, exactly n times                                  |
| ~~_X_{n,}~~             | _X_, at least n times                                 |
| ~~_X_{n,m}~~            | _X_, at least n times but no more than m times        |
| **Reluctant quantifiers** |                                                 |
| ~~_X_??~~               | _X_, once or not at all                               |
| ~~_X_\*?~~              | _X_, zero or more times                               |
| ~~_X_+?~~               | _X_, one or more times                                |
| ~~_X_{n}?~~             | _X_, exactly n times                                  |
| ~~_X_{n,}?~~            | _X_, at least n times                                 |
| ~~_X_{n,m}?~~           | _X_, at least n times but no more than m times        |

Rules with a ~~strikethrough~~ are not yet implemented.


## License

MIT
