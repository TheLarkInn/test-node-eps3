"use strict";
global.wrap = function wrap(obj) {
  obj = obj.exports;
  let module_namespace = Object.create(null);
  function gatherExports(obj, acc) {
    acc = acc || new Map();
    if (typeof obj !== 'object' && typeof obj !== 'function' || obj === null) {
      return acc;
    }
    for (const key of Object.getOwnPropertyNames(obj)) {
      if (acc.has(key)) continue;
      const desc = Object.getOwnPropertyDescriptor(obj, key);
      acc.set(key, desc);
    }
    return gatherExports(Object.getPrototypeOf(obj), acc);
  }
  const exports = gatherExports(obj);
  Array.from(exports.keys()).forEach((key) => {
    const desc = exports.get(key);
    if (key === 'default') return;
    Object.defineProperty(module_namespace, key, {
      get: () => obj[key],
      set() {
        throw new Error(`ModuleNamespace key ${key} is read only.`)
      },
      configurable: false,
      enumerable: Boolean(desc.enumerable)
    });
  });
  Object.defineProperty(module_namespace, 'default', {
    get: () => obj,
    set() {
      throw new Error(`ModuleNamespace key default is read only.`)
    },
    configurable: false,
    enumerable: false
  });
  return Object.freeze(module_namespace);
}