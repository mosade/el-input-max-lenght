const test = require("node:test");
const assert = require("node:assert/strict");
const { enforceMaxLen } = require("../src/utils/maxlen");
const maxlenDirective = require("../src/directives/maxlen");

function createInput() {
  const listeners = new Map();
  return {
    value: "",
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(handler);
    },
    removeEventListener(type, handler) {
      if (!listeners.has(type)) return;
      listeners.get(type).delete(handler);
    },
    dispatchEvent(event) {
      if (!listeners.has(event.type)) return;
      for (const handler of listeners.get(event.type)) {
        handler(event);
      }
    },
    _listenerCount(type) {
      if (!listeners.has(type)) return 0;
      return listeners.get(type).size;
    }
  };
}

function createHost() {
  return {
    _input: null,
    querySelector() {
      return this._input;
    }
  };
}

test("enforceMaxLen truncates over limit", () => {
  const result = enforceMaxLen("abcd", 3);
  assert.equal(result.value, "abc");
  assert.equal(result.truncated, true);
});

test("normalizeValue handles null and numbers", () => {
  assert.equal(enforceMaxLen(null, 3).value, "");
  assert.equal(enforceMaxLen(12345, 3).value, "123");
  assert.equal(enforceMaxLen("abc", 0).value, "");
});

test("directive attaches listeners after input appears", () => {
  const el = createHost();
  const binding = { value: 3 };

  maxlenDirective.bind(el, binding, {});
  assert.equal(el._input, null);

  const input = createInput();
  el._input = input;

  maxlenDirective.inserted(el, binding, {});

  assert.equal(input._listenerCount("input"), 1);
  assert.equal(input._listenerCount("compositionstart"), 1);
  assert.equal(input._listenerCount("compositionend"), 1);
});

test("directive does not duplicate listeners on update", () => {
  const el = createHost();
  const binding = { value: 3 };
  const input = createInput();
  el._input = input;

  maxlenDirective.bind(el, binding, {});
  maxlenDirective.inserted(el, binding, {});
  maxlenDirective.componentUpdated(el, binding, {});
  maxlenDirective.componentUpdated(el, binding, {});

  assert.equal(input._listenerCount("input"), 1);
  assert.equal(input._listenerCount("compositionstart"), 1);
  assert.equal(input._listenerCount("compositionend"), 1);
});
