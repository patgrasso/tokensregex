const fTRUE = () => true;
const fEPS  = () => EPS;
const EPS   = Symbol('e');
const State = (pred = () => true, match = false, tst) => ({ pred, out: [], match, tst });
const Frag  = (start, out) => ({ start, out });

const patch = (outl, st) => outl.forEach((out) => out.push(st));

const ops   = { };

// or
ops['|'] = (stack) => {
  let e2 = stack.pop()
    , e1 = stack.pop()
    , s = State(fEPS);
  s.out.push(e1.start, e2.start);
  stack.push(Frag(s, [ ...e1.out, ...e2.out ]));
};

// and
ops['&'] = (stack) => {
  let e2 = stack.pop()
    , e1 = stack.pop();
  //console.log(e1.start, e1.start.pred);
  s = State((tok) => e1.start.pred(tok) && e2.start.pred(tok));
  stack.push(Frag(s, [ s.out ]));
};

// concat
ops['.'] = (stack) => {
  let e2 = stack.pop()
    , e1 = stack.pop();
  patch(e1.out, e2.start);
  stack.push(Frag(e1.start, e2.out));
};

// maybe (0 or 1)
ops['?'] = (stack) => {
  let e1 = stack.pop()
    , s = State(fEPS);
  s.out.push(e1.start);
  stack.push(Frag(s, e1.out.concat([[s.out]])));
};

// kleene (0 or more)
ops['*'] = (stack) => {
  let e1 = stack.pop()
    , s = State(fEPS, false, '*');
  s.out.push(e1.start);
  patch(e1.out, s);
  stack.push(Frag(s, [s.out]));
};

// plus (1 or more)
ops['+'] = (stack) => {
  let e1 = stack.pop()
    , s = State();
  s.out.push(e1.start);
  patch(e1.out, s);
  stack.push(Frag(e1.start, [s.out]));
};

ops['WORD'] = (stack, token) => {
  let s = State(({ word }) => word === token, false, token);
  stack.push(Frag(s, [ s.out ]));
};

ops['REGEXP'] = (stack, token) => {
  let re = new RegExp(token);
  let s = State(({ word }) => re.test(word), false, re);
  stack.push(Frag(s, [ s.out ]));
};;

function post2NFA(tokens) {
  let stack = [State(() => true, false, '^')]
    , matchstate = State(() => true, true, '$');

  for (let [ type, token ] of tokens) {
    if (!(type in ops)) {
      throw new TypeError(`${type} not implemented`);
    }
    ops[type](stack, token);
  }

  e1 = stack.pop();
  patch(e1.out, matchstate);
  return e1.start;
}

function simulateNFA(nfa, tokens) {
  let states = [[ 0, nfa ]]
    , ret, i;

  while (!states.some(([_, s]) => s.match) && states.length > 0) {
    let newStates = states.map(([ index, state ]) => {
      if (index >= tokens.length) {
        return [[ index, state ]];
      }
      if ((ret = state.pred(tokens[index])) === true) {
        return state.out.map((nextState) => [ index + 1, nextState ]);
      } else if (ret === EPS) {
        return state.out.map((nextState) => [ index, nextState ]);
      }
      return [];
    });
    states = [].concat(...newStates);
    //states = [].concat(...states.filter((s) => s.pred(token)).map((s) => s.out));
  }
  //console.log(states);
  return states.some(([_, s]) => s.match);
}

module.exports = { create: post2NFA, simulate: simulateNFA };
