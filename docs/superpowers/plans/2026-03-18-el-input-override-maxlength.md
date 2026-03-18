# ElInput2 Override Maxlength Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `ElInput2` component that injects a default `maxlength=4000`, supports explicit `:maxlength` overrides, and treats `null/0/""` as disable, including textarea support.

**Architecture:** Introduce a new plugin that registers `ElInput2` by extending Element UI's `ElInput`, then apply a DOM `maxlength` attribute in `mounted/updated` using the spec's normalization rules. Add targeted unit tests in the existing Node test suite to validate registration and DOM attribute behavior.

**Tech Stack:** Vue 2, Element UI, Vite, Node.js `node:test`

---

## File Structure

- Create: `src/plugins/override-maxlength.js` (registers `ElInput2`, applies DOM `maxlength`)
- Modify: `src/main.js` (register override plugin)
- Modify: `src/App.vue` (demo usage of `el-input2`)
- Modify: `tests/maxlen.test.js` (unit tests for `ElInput2` behavior)

## Chunk 1: Tests for ElInput2 Override Plugin

### Task 1: Add failing tests for override-maxlength plugin

**Files:**
- Modify: `tests/maxlen.test.js`

- [ ] **Step 1: Add test helpers for DOM attribute operations**

Extend the `createInput` helper to support `setAttribute`, `removeAttribute`, and `getAttribute` (and ensure `createTextarea` inherits these via `createInput`):

```js
const attrs = new Map();
setAttribute(name, value) { attrs.set(name, String(value)); }
removeAttribute(name) { attrs.delete(name); }
getAttribute(name) { return attrs.has(name) ? attrs.get(name) : null; }
```

- [ ] **Step 2: Add failing tests for ElInput2 registration**

```js
test("override-maxlength plugin registers ElInput2", () => {
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
  assert.ok(Vue._registeredDefinition);
  assert.equal(Vue._registeredDefinition.extends, ElInput);
});
```

- [ ] **Step 3: Add failing tests for default/override/disable rules**

```js
test("ElInput2 applies default maxlength 4000", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = { $el: host, $vnode: { componentOptions: { propsData: {} } }, $nextTick: (fn) => fn() };
  Vue._def.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), "4000");
});

test("ElInput2 uses explicit maxlength override", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: { maxlength: 12 } } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), "12");
});

test("ElInput2 disables maxlength for null/0/empty string", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const cases = [null, 0, "0", ""];
  for (const value of cases) {
    const instance = {
      $el: host,
      $vnode: { componentOptions: { propsData: { maxlength: value } } },
      $nextTick: (fn) => fn()
    };
    Vue._def.mounted.call(instance);
    assert.equal(input.getAttribute("maxlength"), null);
  }
});

test("ElInput2 defaults when maxlength is undefined or invalid", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const cases = [undefined, -1, NaN, Infinity, -Infinity, "oops"];
  for (const value of cases) {
    const instance = {
      $el: host,
      $vnode: { componentOptions: { propsData: { maxlength: value } } },
      $nextTick: (fn) => fn()
    };
    Vue._def.mounted.call(instance);
    assert.equal(input.getAttribute("maxlength"), "4000");
  }
});

test("ElInput2 floors numeric string values", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: { maxlength: "10.5" } } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), "10");
});
```

- [ ] **Step 4: Add failing test for textarea support and updated lifecycle**

```js
test("ElInput2 re-applies maxlength on updated and textarea", () => {
  const textarea = createTextarea();
  const host = createHost();
  host._input = textarea;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);
  textarea.removeAttribute("maxlength");

  Vue._def.updated.call(instance);

  assert.equal(textarea.getAttribute("maxlength"), "4000");
});

test("ElInput2 re-applies when switching input to textarea", () => {
  const input = createInput();
  const textarea = createTextarea();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);

  host._input = textarea;
  Vue._def.updated.call(instance);

  assert.equal(textarea.getAttribute("maxlength"), "4000");
});

test("ElInput2 uses propsData fallback when vnode props missing", () => {
  const input = createInput();
  const host = createHost();
  host._input = input;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $options: { propsData: { maxlength: 9 } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);

  assert.equal(input.getAttribute("maxlength"), "9");
});

test("ElInput2 applies default for textarea when no maxlength", () => {
  const textarea = createTextarea();
  const host = createHost();
  host._input = textarea;

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);

  assert.equal(textarea.getAttribute("maxlength"), "4000");
});

test("ElInput2 applies maxlength when input appears later", () => {
  const host = createHost();

  const ElInput = function ElInput() {};
  const Vue = { options: { components: { ElInput } }, component(name, definition) { this._def = definition; } };

  overrideMaxlength(Vue);

  const instance = {
    $el: host,
    $vnode: { componentOptions: { propsData: {} } },
    $nextTick: (fn) => fn()
  };
  Vue._def.mounted.call(instance);

  const input = createInput();
  host._input = input;
  Vue._def.updated.call(instance);

  assert.equal(input.getAttribute("maxlength"), "4000");
});
```

- [ ] **Step 5: Run the tests to confirm they fail**

Run:

```bash
node --test tests/maxlen.test.js
```

Expected: FAIL with missing `override-maxlength` import or missing behavior.

- [ ] **Step 6: Commit tests**

```bash
git add tests/maxlen.test.js
git commit -m "test: add ElInput2 override-maxlength coverage"
```

## Chunk 2: Implement ElInput2 Override Plugin

Note: plugin registration and demo wiring are handled in Chunk 3.

### Task 2: Create override-maxlength plugin

**Files:**
- Create: `src/plugins/override-maxlength.js`

- [ ] **Step 1: Implement helper to resolve provided maxlength**

```js
function getProvidedMaxlength(instance) {
  const vnodeProps = instance && instance.$vnode && instance.$vnode.componentOptions
    ? instance.$vnode.componentOptions.propsData
    : undefined;
  const optionsProps = instance && instance.$options ? instance.$options.propsData : undefined;
  const propsData = vnodeProps || optionsProps;
  if (!propsData || !Object.prototype.hasOwnProperty.call(propsData, "maxlength")) {
    return { provided: false, value: undefined };
  }
  return { provided: true, value: propsData.maxlength };
}
```

- [ ] **Step 2: Implement normalization rules**

```js
function resolveMaxlength(instance) {
  const { provided, value } = getProvidedMaxlength(instance);
  if (!provided || value === undefined) return { enabled: true, value: 4000 };

  if (value === null || value === 0 || value === "0" || value === "") {
    return { enabled: false, value: undefined };
  }

  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return { enabled: true, value: 4000 };
  }

  return { enabled: true, value: Math.floor(numeric) };
}
```

- [ ] **Step 3: Implement DOM apply logic and plugin registration**

```js
function findNativeInput(el) {
  if (!el) return null;
  return el.querySelector("input, textarea");
}

function applyMaxlength(instance) {
  if (!instance || !instance.$el) return;
  const input = findNativeInput(instance.$el);
  if (!input) return;

  const resolved = resolveMaxlength(instance);
  if (!resolved.enabled) {
    input.removeAttribute("maxlength");
    return;
  }
  input.setAttribute("maxlength", String(resolved.value));
}

export default function install(Vue) {
  const ElInput = Vue.options.components && Vue.options.components.ElInput;
  if (!ElInput) return;

  Vue.component("ElInput2", {
    name: "ElInput2",
    extends: ElInput,
    mounted() {
      const attach = () => applyMaxlength(this);
      if (typeof this.$nextTick === "function") this.$nextTick(attach);
      else attach();
    },
    updated() {
      const attach = () => applyMaxlength(this);
      if (typeof this.$nextTick === "function") this.$nextTick(attach);
      else attach();
    }
  });
}
```

- [ ] **Step 4: Run tests**

```bash
node --test tests/maxlen.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit implementation**

```bash
git add src/plugins/override-maxlength.js
git commit -m "feat: add ElInput2 override-maxlength plugin"
```

## Chunk 3: Wire Plugin and Update Demo

### Task 3: Register plugin and update demo usage

**Files:**
- Modify: `src/main.js`
- Modify: `src/App.vue`

- [ ] **Step 1: Register override plugin**

```js
import overrideMaxlength from "./plugins/override-maxlength";

Vue.use(overrideMaxlength);
```

- [ ] **Step 2: Update demo with ElInput2 examples**

```vue
<el-input2 v-model="overrideText" placeholder="Override default 4000" />
<el-input2 :maxlength="8" v-model="overrideShort" placeholder="Override max 8" />
<el-input2 :maxlength="0" v-model="overrideDisabled" placeholder="Override disabled" />
<el-input2 type="textarea" v-model="overrideTextarea" placeholder="Override textarea" />
```

Also add the corresponding `data()` fields.

- [ ] **Step 3: Run tests**

```bash
node --test tests/maxlen.test.js
```

Expected: PASS.

- [ ] **Step 4: Commit wiring and demo**

```bash
git add src/main.js src/App.vue
git commit -m "feat: wire ElInput2 override-maxlength demo"
```
