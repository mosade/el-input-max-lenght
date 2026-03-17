# Maxlen Tests Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add directive-focused tests for truncation, synthetic input dispatch, binding precedence, IME composition flow, and v-model sync.

**Architecture:** Extend the existing Node test suite in `tests/maxlen.test.js` using the provided helper factories. Validate directive behavior by simulating input/composition events and asserting truncation and event dispatch.

**Tech Stack:** Node.js `node:test`, `assert/strict`.

---

## Chunk 1: Add directive behavior tests

### Task 1: Add truncation + synthetic input dispatch test for directive

**Files:**
- Modify: `tests/maxlen.test.js`
- Test: `tests/maxlen.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/maxlen.test.js`
Expected: FAIL with missing test behavior.

- [ ] **Step 3: Write minimal implementation**

No production changes expected. Keep test-only edits.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/maxlen.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/maxlen.test.js
git commit -m "test: cover directive truncation dispatch"
```

### Task 2: Add binding precedence over vnode props test

**Files:**
- Modify: `tests/maxlen.test.js`
- Test: `tests/maxlen.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/maxlen.test.js`
Expected: FAIL if precedence is wrong.

- [ ] **Step 3: Write minimal implementation**

No production changes expected.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/maxlen.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/maxlen.test.js
git commit -m "test: assert directive binding precedence"
```

### Task 3: Add IME composition flow test for directive

**Files:**
- Modify: `tests/maxlen.test.js`
- Test: `tests/maxlen.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/maxlen.test.js`
Expected: FAIL if composition handling is broken.

- [ ] **Step 3: Write minimal implementation**

No production changes expected.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/maxlen.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/maxlen.test.js
git commit -m "test: add directive IME flow"
```

### Task 4: Add v-model sync via input dispatch after truncation

**Files:**
- Modify: `tests/maxlen.test.js`
- Test: `tests/maxlen.test.js`

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/maxlen.test.js`
Expected: FAIL if synthetic dispatch missing.

- [ ] **Step 3: Write minimal implementation**

No production changes expected.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/maxlen.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tests/maxlen.test.js
git commit -m "test: cover v-model sync via dispatch"
```
