import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const test = require("node:test");
const assert = require("node:assert/strict");
const { enforceMaxLen } = require("../src/utils/maxlen");
const maxlenDirective = require("../src/directives/maxlen").default;
const autoMaxlen = require("../src/plugins/auto-maxlen").default;
const overrideMaxlength = require("../src/plugins/override-maxlength").default;

if (typeof Event === "undefined") {
  global.Event = class Event {
    constructor(type) {
      this.type = type;
    }
  };
}

function createInput() {
  const listeners = new Map();
  const attributes = new Map();
  const input = {
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
    setAttribute(name, value) {
      attributes.set(String(name), String(value));
    },
    removeAttribute(name) {
      attributes.delete(String(name));
    },
    getAttribute(name) {
      const key = String(name);
      if (!attributes.has(key)) return null;
      return attributes.get(key);
    },
    _listenerCount(type) {
      if (!listeners.has(type)) return 0;
      return listeners.get(type).size;
    }
  };
  input.tagName = "INPUT";
  return input;
}

function createTextarea() {
  const textarea = createInput();
  textarea.tagName = "TEXTAREA";
  return textarea;
}

function createHost() {
  return {
    _input: null,
    querySelector(selector) {
      if (!this._input) return null;
      if (typeof selector !== "string") return null;
      const tagName = this._input.tagName;
      if (!tagName) return null;

      const normalized = tagName.toLowerCase();
      const selectors = selector
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

      if (selectors.includes(normalized)) return this._input;
      return null;
    }
  };
}

test("createHost querySelector respects selector", () => {
  const host = createHost();
  const input = createInput();
  host._input = input;

  assert.equal(host.querySelector("textarea"), null);
  assert.equal(host.querySelector("input, textarea"), input);
});

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

test("directive truncates and dispatches input", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;
  input.value = "abcd";

  const binding = { value: 3 };
  const vnode = {};

  maxlenDirective.bind(host, binding, vnode);
  maxlenDirective.inserted(host, binding, vnode);

  let inputEvents = 0;
  input.addEventListener("input", () => {
    inputEvents += 1;
  });

  input.dispatchEvent(new Event("input"));

  assert.equal(input.value, "abc");
  assert.equal(inputEvents, 2);
});

test("directive uses binding maxlen over vnode props", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;
  input.value = "abcd";

  const binding = { value: 2 };
  const vnode = {
    componentOptions: {
      propsData: { maxlen: 3 }
    }
  };

  maxlenDirective.bind(host, binding, vnode);
  maxlenDirective.inserted(host, binding, vnode);

  input.dispatchEvent(new Event("input"));

  assert.equal(input.value, "ab");
});

test("directive respects IME composition flow", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const binding = { value: 3 };
  const vnode = {};

  maxlenDirective.bind(host, binding, vnode);
  maxlenDirective.inserted(host, binding, vnode);

  let inputEvents = 0;
  input.addEventListener("input", () => {
    inputEvents += 1;
  });

  input.dispatchEvent(new Event("compositionstart"));
  input.value = "abcd";
  input.dispatchEvent(new Event("input"));

  assert.equal(input.value, "abcd");
  assert.equal(inputEvents, 1);

  input.dispatchEvent(new Event("compositionend"));

  assert.equal(input.value, "abc");
  assert.equal(inputEvents, 2);
});

test("directive supports textarea elements", () => {
  const textarea = createTextarea();
  const host = createHost();
  host._input = textarea;
  textarea.value = "abcd";

  const binding = { value: 3 };
  const vnode = {};

  maxlenDirective.bind(host, binding, vnode);
  maxlenDirective.inserted(host, binding, vnode);

  let inputEvents = 0;
  textarea.addEventListener("input", () => {
    inputEvents += 1;
  });

  textarea.dispatchEvent(new Event("input"));

  assert.equal(textarea.value, "abc");
  assert.equal(inputEvents, 2);
});

test("directive dispatches input for v-model sync", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;
  input.value = "abcd";

  const binding = { value: 3 };
  const vnode = {};

  maxlenDirective.bind(host, binding, vnode);
  maxlenDirective.inserted(host, binding, vnode);

  let modelValue = "";
  input.addEventListener("input", () => {
    modelValue = input.value;
  });

  input.dispatchEvent(new Event("input"));

  assert.equal(modelValue, "abc");
});

test("auto-maxlen plugin wraps ElInput and attaches listeners", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  autoMaxlen(Vue);

  assert.equal(Vue._registeredName, "ElInput");
  const wrapper = Vue._registeredDefinition;
  assert.equal(wrapper.props.maxlen.default, undefined);

  const instance = { $el: host, $props: { maxlen: 3 } };
  wrapper.mounted.call(instance);

  assert.equal(input._listenerCount("input"), 1);
  assert.equal(input._listenerCount("compositionstart"), 1);
  assert.equal(input._listenerCount("compositionend"), 1);

  wrapper.beforeDestroy.call(instance);

  assert.equal(input._listenerCount("input"), 0);
  assert.equal(input._listenerCount("compositionstart"), 0);
  assert.equal(input._listenerCount("compositionend"), 0);
});

test("auto-maxlen plugin truncates and dispatches input", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;
  input.value = "abcd";

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  autoMaxlen(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = { $el: host, $props: { maxlen: 3 } };
  wrapper.mounted.call(instance);

  let inputEvents = 0;
  input.addEventListener("input", () => {
    inputEvents += 1;
  });

  input.dispatchEvent(new Event("input"));

  assert.equal(input.value, "abc");
  assert.equal(inputEvents, 2);
});

test("auto-maxlen plugin respects IME composition flow", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  autoMaxlen(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = { $el: host, $props: { maxlen: 3 } };
  wrapper.mounted.call(instance);

  let inputEvents = 0;
  input.addEventListener("input", () => {
    inputEvents += 1;
  });

  input.dispatchEvent(new Event("compositionstart"));
  input.value = "abcd";
  input.dispatchEvent(new Event("input"));

  assert.equal(input.value, "abcd");
  assert.equal(inputEvents, 1);

  input.dispatchEvent(new Event("compositionend"));

  assert.equal(input.value, "abc");
  assert.equal(inputEvents, 2);
});

test("auto-maxlen plugin supports textarea elements", () => {
  const textarea = createTextarea();
  const host = createHost();
  host._input = textarea;
  textarea.value = "abcd";

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  autoMaxlen(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = { $el: host, $props: { maxlen: 3 } };
  wrapper.mounted.call(instance);

  let inputEvents = 0;
  textarea.addEventListener("input", () => {
    inputEvents += 1;
  });

  textarea.dispatchEvent(new Event("input"));

  assert.equal(textarea.value, "abc");
  assert.equal(inputEvents, 2);
});

test("auto-maxlen plugin attaches when input appears later", () => {
  const host = createHost();

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  autoMaxlen(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = { $el: host, $props: { maxlen: 3 } };
  wrapper.mounted.call(instance);

  const input = createInput();
  host._input = input;

  assert.ok(typeof wrapper.updated === "function");
  wrapper.updated.call(instance);

  assert.equal(input._listenerCount("input"), 1);
  assert.equal(input._listenerCount("compositionstart"), 1);
  assert.equal(input._listenerCount("compositionend"), 1);
});

test("auto-maxlen plugin reattaches on input replacement", () => {
  const host = createHost();
  const firstInput = createInput();
  host._input = firstInput;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  autoMaxlen(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = { $el: host, $props: { maxlen: 3 } };
  wrapper.mounted.call(instance);

  const secondInput = createInput();
  host._input = secondInput;

  wrapper.updated.call(instance);

  assert.equal(firstInput._listenerCount("input"), 0);
  assert.equal(firstInput._listenerCount("compositionstart"), 0);
  assert.equal(firstInput._listenerCount("compositionend"), 0);
  assert.equal(secondInput._listenerCount("input"), 1);
  assert.equal(secondInput._listenerCount("compositionstart"), 1);
  assert.equal(secondInput._listenerCount("compositionend"), 1);
});

test("override-maxlength registers ElInput2 and extends ElInput", () => {
  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredName = name;
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  assert.equal(Vue._registeredName, "ElInput2");
  const wrapper = Vue._registeredDefinition;
  assert.equal(wrapper.extends, ElInput);
});

test("override-maxlength defaults to 4000 when maxlength missing", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), "4000");
});

test("override-maxlength applies explicit maxlength overrides", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: { maxlength: 12 } } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), "12");
});

test("override-maxlength disables for null and zero", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: { maxlength: null } } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), null);

  instance.$vnode.componentOptions.propsData.maxlength = 0;
  wrapper.updated.call(instance);
  assert.equal(input.getAttribute("maxlength"), null);

  instance.$vnode.componentOptions.propsData.maxlength = "0";
  wrapper.updated.call(instance);
  assert.equal(input.getAttribute("maxlength"), null);

  instance.$vnode.componentOptions.propsData.maxlength = "";
  wrapper.updated.call(instance);
  assert.equal(input.getAttribute("maxlength"), null);
});

test("override-maxlength defaults for invalid values", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: { maxlength: undefined } } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);
  assert.equal(input.getAttribute("maxlength"), "4000");

  const cases = [-1, NaN, Infinity, -Infinity, "oops"];
  for (const value of cases) {
    instance.$vnode.componentOptions.propsData.maxlength = value;
    wrapper.updated.call(instance);
    assert.equal(input.getAttribute("maxlength"), "4000");
  }
});

test("override-maxlength floors numeric string values", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: { maxlength: "10.5" } } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);
  assert.equal(input.getAttribute("maxlength"), "10");
});

test("override-maxlength supports textarea elements", () => {
  const textarea = createTextarea();
  const host = createHost();
  host._input = textarea;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);
  assert.equal(textarea.getAttribute("maxlength"), "4000");
});

test("override-maxlength uses propsData fallback on options", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: {},
    $options: { propsData: { maxlength: 22 } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);
  assert.equal(input.getAttribute("maxlength"), "22");
});

test("override-maxlength re-checks on type switch", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);

  const textarea = createTextarea();
  host._input = textarea;
  wrapper.updated.call(instance);

  assert.equal(textarea.getAttribute("maxlength"), "4000");
});

test("override-maxlength attaches when input appears later", () => {
  const host = createHost();

  const ElInput = function ElInput() {};
  const Vue = {
    options: { components: { ElInput } },
    component(name, definition) {
      this._registeredDefinition = definition;
    }
  };

  overrideMaxlength(Vue);

  const wrapper = Vue._registeredDefinition;
  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };

  wrapper.mounted.call(instance);

  const input = createInput();
  host._input = input;
  wrapper.updated.call(instance);

  assert.equal(input.getAttribute("maxlength"), "4000");
});
