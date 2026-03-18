# El-Input Max Length Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two working implementations for Element UI `el-input` length limiting: explicit directive (manual opt-in) and automatic global injection (zero template changes), with a default limit of 4000 and per-component overrides.

**Architecture:** Extract shared max-length normalization/truncation logic into a small utility, then wire it into (A) a `v-maxlen` directive and (B) a global wrapper around `el-input` with IME-safe handling. Provide a minimal demo component showing both approaches.

**Tech Stack:** Vue 2, Element UI, plain JS (no TS), node built-in test runner for unit tests.

---

## Chunk 1: Shared Utility + Explicit Directive

### File Structure (locked in)
- Create: `src/utils/maxlen.js` (pure helper: normalize value, enforce limit)
- Create: `src/directives/maxlen.js` (directive wiring to native input/textarea)
- Create: `tests/maxlen.test.js` (node:test unit tests for helper)
- Modify: `src/main.js` (register directive)
- Modify: `src/App.vue` (demo usage for explicit directive)

### Task 1: Define and test shared max-length helper

**Files:**
- Create: `src/utils/maxlen.js`
- Create: `tests/maxlen.test.js`

- [ ] **Step 1: Write the failing test**

```js
const test = require("node:test");
const assert = require("node:assert/strict");
const { enforceMaxLen } = require("../src/utils/maxlen");

test("enforceMaxLen truncates over limit", () => {
  const result = enforceMaxLen("abcd", 3);
  assert.equal(result.value, "abc");
  assert.equal(result.truncated, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/maxlen.test.js`
Expected: FAIL with "Cannot find module" or undefined export.

- [ ] **Step 3: Write minimal implementation**

```js
function normalizeValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function enforceMaxLen(value, limit) {
  const normalized = normalizeValue(value);
  const safeLimit = Number.isFinite(limit) ? limit : 4000;
  if (normalized.length <= safeLimit) {
    return { value: normalized, truncated: false };
  }
  return { value: normalized.slice(0, safeLimit), truncated: true };
}

module.exports = { normalizeValue, enforceMaxLen };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/maxlen.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/utils/maxlen.js tests/maxlen.test.js
git commit -m "test: add maxlen helper coverage"
```

### Task 2: Add directive wiring with IME-safe truncation

**Files:**
- Create: `src/directives/maxlen.js`
- Modify: `src/App.vue`
- Modify: `src/main.js`

- [ ] **Step 1: Write the failing test**

Add to `tests/maxlen.test.js`:

```js
test("normalizeValue handles null and numbers", () => {
  assert.equal(enforceMaxLen(null, 3).value, "");
  assert.equal(enforceMaxLen(12345, 3).value, "123");
  assert.equal(enforceMaxLen("abc", 0).value, "");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/maxlen.test.js`
Expected: FAIL if normalize/convert not handled.

- [ ] **Step 3: Update helper if needed**

Ensure `normalizeValue` handles null/undefined and non-strings correctly.

- [ ] **Step 4: Implement directive**

```js
const { enforceMaxLen } = require("../utils/maxlen");

function findNativeInput(el) {
  if (!el) return null;
  return el.querySelector("input, textarea");
}

function getLimit(binding, vnode) {
  if (binding && binding.value !== undefined) return Number(binding.value) || 0;
  if (vnode && vnode.componentOptions && vnode.componentOptions.propsData) {
    const props = vnode.componentOptions.propsData;
    if (props.maxlen !== undefined) return Number(props.maxlen) || 0;
  }
  return 4000;
}

module.exports = {
  bind(el, binding, vnode) {
    const input = findNativeInput(el);
    if (!input) return;
    let composing = false;

    const onCompositionStart = () => { composing = true; };
    const onCompositionEnd = () => {
      composing = false;
      const limit = getLimit(binding, vnode);
      const result = enforceMaxLen(input.value, limit);
      if (result.truncated) {
        input.value = result.value;
        input.dispatchEvent(new Event("input"));
      }
    };
    const onInput = () => {
      if (composing) return;
      const limit = getLimit(binding, vnode);
      const result = enforceMaxLen(input.value, limit);
      if (result.truncated) {
        input.value = result.value;
        input.dispatchEvent(new Event("input"));
      }
    };

    input.addEventListener("compositionstart", onCompositionStart);
    input.addEventListener("compositionend", onCompositionEnd);
    input.addEventListener("input", onInput);
    el.__maxlenCleanup__ = () => {
      input.removeEventListener("compositionstart", onCompositionStart);
      input.removeEventListener("compositionend", onCompositionEnd);
      input.removeEventListener("input", onInput);
    };
  },
  unbind(el) {
    if (el.__maxlenCleanup__) el.__maxlenCleanup__();
  }
};
```

- [ ] **Step 5: Register directive and demo usage**

`src/main.js`:

```js
const Vue = require("vue");
const App = require("./App.vue");
const maxlen = require("./directives/maxlen");

Vue.directive("maxlen", maxlen);

new Vue({ render: h => h(App) }).$mount("#app");
```

`src/App.vue` example:

```vue
<template>
  <div>
    <el-input v-maxlen v-model="text" placeholder="Default 4000" />
    <el-input v-maxlen="10" v-model="shortText" placeholder="Max 10" />
  </div>
</template>
```

- [ ] **Step 6: Run tests**

Run: `node --test tests/maxlen.test.js`
Expected: PASS

- [ ] **Step 7: Manual verification (directive behavior)**

Checklist:
- Type 15 chars into `v-maxlen="10"` input, verify it truncates to 10 and model updates.
- Use IME composition (CJK) and confirm no truncation mid-composition; truncates on composition end if over limit.
- Switch `el-input` to `type="textarea"` and verify truncation still applies.
- Confirm precedence: `v-maxlen="10"` overrides default 4000.

- [ ] **Step 8: Commit**

```bash
git add src/directives/maxlen.js src/main.js src/App.vue tests/maxlen.test.js
git commit -m "feat: add explicit maxlen directive for el-input"
```

## Chunk 2: Automatic Global Injection

### Task 3: Implement auto-injection plugin (no template changes)

**Files:**
- Create: `src/plugins/auto-maxlen.js`
- Modify: `src/main.js`
- Modify: `src/App.vue`

Notes:
- Override source for Approach B is `maxlen` prop only.
- Do not emit `change`; only dispatch `input` after truncation (align with spec).

- [ ] **Step 1: Implement auto-injection plugin**

```js
const { enforceMaxLen } = require("../utils/maxlen");

function findNativeInput(el) {
  if (!el) return null;
  return el.querySelector("input, textarea");
}

function getLimit(props) {
  if (props && props.maxlen !== undefined) return Number(props.maxlen) || 0;
  return 4000;
}

module.exports = function install(Vue) {
  const ElInput = Vue.options.components && Vue.options.components.ElInput;
  if (!ElInput) return;

  Vue.component("ElInput", {
    name: "ElInput",
    extends: ElInput,
    props: {
      maxlen: { type: [Number, String], default: undefined }
    },
    mounted() {
      const input = findNativeInput(this.$el);
      if (!input) return;
      let composing = false;

      const onCompositionStart = () => { composing = true; };
      const onCompositionEnd = () => {
        composing = false;
        const limit = getLimit(this.$props);
        const result = enforceMaxLen(input.value, limit);
        if (result.truncated) {
          input.value = result.value;
          input.dispatchEvent(new Event("input"));
        }
      };
      const onInput = () => {
        if (composing) return;
        const limit = getLimit(this.$props);
        const result = enforceMaxLen(input.value, limit);
        if (result.truncated) {
          input.value = result.value;
          input.dispatchEvent(new Event("input"));
        }
      };

      input.addEventListener("compositionstart", onCompositionStart);
      input.addEventListener("compositionend", onCompositionEnd);
      input.addEventListener("input", onInput);
      this.__maxlenCleanup__ = () => {
        input.removeEventListener("compositionstart", onCompositionStart);
        input.removeEventListener("compositionend", onCompositionEnd);
        input.removeEventListener("input", onInput);
      };
    },
    beforeDestroy() {
      if (this.__maxlenCleanup__) this.__maxlenCleanup__();
    }
  });
};
```

- [ ] **Step 2: Register plugin and demo usage**

`src/main.js`:

```js
const Vue = require("vue");
const App = require("./App.vue");
const maxlen = require("./directives/maxlen");
const autoMaxlen = require("./plugins/auto-maxlen");

Vue.directive("maxlen", maxlen);
Vue.use(autoMaxlen);

new Vue({ render: h => h(App) }).$mount("#app");
```

`src/App.vue` example:

```vue
<template>
  <div>
    <el-input v-model="autoText" placeholder="Auto default 4000" />
    <el-input :maxlen="12" v-model="autoShort" placeholder="Auto max 12" />
  </div>
</template>
```

- [ ] **Step 3: Run tests**

Run: `node --test tests/maxlen.test.js`
Expected: PASS

- [ ] **Step 4: Manual verification (auto injection)**

Checklist:
- With no directive, type 20 chars into default input; verify truncation to 4000 only when exceeded.
- Use `:maxlen="12"` and verify truncation at 12.
- Verify IME composition behaves correctly (no mid-composition truncation).
- Verify textarea mode still truncates.
- Verify v-model sync after truncation (model value equals truncated input value).
- Verify safe fallback when native input cannot be found (no errors).

Migration note:
- Approach B requires rework when moving to Element Plus due to internal component changes.

- [ ] **Step 5: Commit**

```bash
git add src/plugins/auto-maxlen.js src/main.js src/App.vue tests/maxlen.test.js
git commit -m "feat: add auto-injected maxlen for el-input"
```
