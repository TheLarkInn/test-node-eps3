"use strict";
// indirect eval, because JS is strange
const global = (0,eval)('this');
// light tamper prevention
const getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
const Error = global.Error;
const String = global.String;
const Promise = global.Promise;
const Symbol = global.Symbol;

require(process.argv[2]);
const wrap = global.wrap;
const failures = [];
let fail = (msg) => {
  failures[failures.length] = String(msg);
}
let passed = 0;
let pass = (msg) => {
  passed++;
  console.error(msg);
}
const getDescValueEqual = (o, k, v, msg) =>  {
  const found = o[k];
  const checkNaN = v !== v;
  if (checkNaN ? found === found : found !== v) {
    if (!msg) {
      msg = Error(`expected hoisted value of ${k} to be ${v}, got ${found}`).stack;
    }
    fail(String(msg));
  }
  else {
    pass(`proper hoisted value of ${k}`)
  }
}
function test(name, module, runner) {
  console.error('test:', name);
  const oldfail = fail;
  const oldpass = pass;
  fail = (msg)=>oldfail(`${name}: ${msg}`);
  pass = (msg)=>oldpass(`${name}: ${msg}`);
  const original = module.exports;
  const wrapped = wrap(module);
  runner(wrapped, original);
  fail = oldfail;
  pass = oldpass;
}
function attemptThrow(fn, msg) {
  try {
    fn();
    fail(`failure: ${msg}`);
  }
  catch (e) {
    pass(`success: ${msg}`);
  }
}
function attemptNoThrow(fn, msg) {
  try {
    fn();
    pass(`success: ${msg}`);
  }
  catch (e) {
    fail(`failure: ${msg} Error: ${e}`);
  }
}


test('Promise', {
  exports: Promise.resolve(Symbol())
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'then', original.then);
  getDescValueEqual(hoisted, 'catch', original.catch);
  getDescValueEqual(hoisted, 'constructor', original.constructor);
  attemptThrow(_=>hoisted.then(_=>{}), 'hoisted methods should throw');
  attemptThrow(_=>hoisted.catch(_=>{}), 'hoisted methods should throw');
});
test('Function', {
  exports: function(a, b) {}
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'name', original.name);
  getDescValueEqual(hoisted, 'length', original.length);
  getDescValueEqual(hoisted, 'prototype', original.prototype);
  attemptThrow(_=>hoisted.call({}), 'hoisted methods should throw');
  attemptThrow(_=>hoisted(), 'hoisted should not be callable');
  attemptThrow(_=>new hoisted(), 'hoisted should not be newable');
});
test('Arrow Function', {
  exports: ()=>{}
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'name', original.name);
  getDescValueEqual(hoisted, 'length', original.length);
  getDescValueEqual(hoisted, 'prototype', original.prototype);
  attemptThrow(_=>hoisted.call({}), 'hoisted methods should throw');
  attemptThrow(_=>hoisted(), 'hoisted should not be callable');
  attemptThrow(_=>new hoisted(), 'hoisted should not be newable');
});
test('Class', {
  exports: class {
    static foo() {}
  }
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'name', original.name);
  getDescValueEqual(hoisted, 'length', original.length);
  getDescValueEqual(hoisted, 'prototype', original.prototype);
  attemptThrow(_=>hoisted.call({}), 'hoisted methods should throw');
  attemptThrow(_=>hoisted(), 'hoisted should not be callable');
  attemptThrow(_=>new hoisted(), 'hoisted should not be newable');
  attemptNoThrow(_=>hoisted.foo({}), 'hoisted static methods should work');
});
test('Concise Method', {
  exports() {}
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'name', original.name);
  getDescValueEqual(hoisted, 'length', original.length);
  getDescValueEqual(hoisted, 'prototype', original.prototype);
  attemptThrow(_=>hoisted.call({}), 'hoisted methods should throw');
  attemptThrow(_=>hoisted(), 'hoisted should not be callable');
  attemptThrow(_=>new hoisted(), 'hoisted should not be newable');
});
test('Boolean', {
  exports: false
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', undefined);
  getDescValueEqual(hoisted, 'toString', undefined);
});
test('Number', {
  exports: NaN
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', undefined);
  getDescValueEqual(hoisted, 'toString', undefined);
});
test('Null', {
  exports: null
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', undefined);
  getDescValueEqual(hoisted, 'toString', undefined);
});
test('Undefined', {
  exports: undefined
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', undefined);
  getDescValueEqual(hoisted, 'toString', undefined);
});
test('String', {
  exports: ''
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', undefined);
  getDescValueEqual(hoisted, 'toString', undefined);
});
test('Symbol', {
  exports: Symbol
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', original.valueOf);
  getDescValueEqual(hoisted, 'toString', original.toString);
  attemptThrow(_=>''+hoisted, 'hoisted should not be string coercible');
  attemptThrow(_=>+hoisted, 'hoisted should not be value coercible');
});
test('Exports getter', {
  get exports() {return Symbol();}
}, (hoisted, original) => {
  attemptNoThrow(_=>{
    if (hoisted.default !== hoisted.default) {
      throw Error();
    }
  }, 'hoisted.default should not be affected by a getter');
});
test('Export property getter', {
  exports: {
    get foo() {return Symbol();}
  }
}, (hoisted, original) => {
  attemptNoThrow(_=>{
    if (hoisted.foo === hoisted.foo) {
      throw Error();
    }
  }, 'hoisted getters should work');
});
;{
  const module = {
    exports: {
      foo: 1
    }
  };
  test('Mutation', module, (hoisted, original) => {
    attemptNoThrow(_=>{
      if (hoisted.default !== module.exports) {
        throw Error();
      }
    }, 'module should match prior to mutation');
    module.exports = {};
    attemptNoThrow(_=>{
      if (hoisted.default === module.exports) {
        throw Error();
      }
    }, 'module mutation should not be observable');
    original.foo = 1;
    attemptNoThrow(_=>{
      if (hoisted.foo !== original.foo) {
        throw Error();
      }
    }, 'export mutation should be observable');
    attemptThrow(_=>{
      hoisted.foo = 2;
    }, 'hoisted mutation should throw');
    attemptNoThrow(_=>{
      if (hoisted.bar !== original.bar) {
        throw Error();
      }
    }, 'hoisted shape should match prior to mutation');
    original.bar = 3;
    attemptNoThrow(_=>{
      if (hoisted.bar === original.bar) {
        throw Error();
      }
      if (original.bar !== 3) {
        throw Error();
      }
    }, 'hoisted shape should not change on mutation');
  });
};
test('Empty Object', {
  exports: {}
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', original.valueOf);
  getDescValueEqual(hoisted, 'toString', original.toString);
  attemptNoThrow(_=>{
    if (Object.getPrototypeOf(hoisted) !== null) {
      throw Error();
    }
  }, 'hoisted should not have a prototype');
  attemptNoThrow(_=>{
    if (Object.isFrozen(hoisted) !== true
    || Object.isSealed(hoisted) !== true
    || Object.isExtensible(hoisted) !== false) {
      throw Error();
    }
  }, 'hoisted should be frozen');
});
test('Basic Object', {
  exports: {
    default: Symbol(),
    boolean: false,
    number: NaN,
    string: '',
    object: {},
    array: [],
    symbol: Symbol()
  }
}, (hoisted, original) => {
  getDescValueEqual(hoisted, 'default', original);
  getDescValueEqual(hoisted, 'valueOf', original.valueOf);
  getDescValueEqual(hoisted, 'toString', original.toString);
  getDescValueEqual(hoisted, 'boolean', original.boolean);
  getDescValueEqual(hoisted, 'number', original.number);
  getDescValueEqual(hoisted, 'string', original.string);
  getDescValueEqual(hoisted, 'object', original.object);
  getDescValueEqual(hoisted, 'array', original.array);
  getDescValueEqual(hoisted, 'symbol', original.symbol);
  attemptNoThrow(_=>{
    if (hoisted.default === original.default) {
      throw Error();
    }
  }, 'default should not be hoisted');
});
test('Descriptors', {
  exports: Object.create(null, {
    foo:{
      value: Symbol(),
      enumberable: false,
      configurable: true
    }
  })
}, (hoisted, original) => {
  attemptNoThrow(_=>{
    const vis = Object.getOwnPropertyDescriptor(hoisted,'default').enumerable;
    if (vis !== false) {
      throw Error();
    }
  }, 'hoisted default should not be enumerable');
  attemptNoThrow(_=>{
    const vis = Object.getOwnPropertyDescriptor(hoisted,'foo').enumerable;
    if (vis !== false) {
      throw Error();
    }
  }, 'hoisted property should preserve enumerable');
  attemptNoThrow(_=>{
    const vis = Object.getOwnPropertyDescriptor(hoisted,'foo').configurable;
    if (vis !== false) {
      throw Error();
    }
  }, 'hoisted property should not preserve configurable');
});
console.log(`${passed} PASSED`);
console.log(`${failures.length} FAILED`);
console.log(failures.join('\r\n'));