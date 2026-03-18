# Design: Global Default maxlength for el-input

**Date:** 2026-03-17
**Status:** Approved
**Stack:** Vue 2 + Element UI

---

## Problem

The project contains 500+ uses of `el-input`. For security reasons, all inputs must have a length limit. Adding `maxlength` to each instance manually is impractical and error-prone.

---

## Requirements

- All `el-input` components get a default `maxlength` of 500
- Individual components can override the default by explicitly passing `:maxlength="n"`
- Behavior is consistent with Element UI's native `maxlength` (hard truncation, no extra UI changes)
- Zero modification to existing templates

---

## Approach: Global Vue Mixin

Register a global mixin via `Vue.mixin()` in `main.js`. The mixin's `beforeCreate` hook runs for every component instance before props are sealed. It checks:

1. Is this component an `ElInput`? (via `this.$options.name === 'ElInput'`)
2. Has `maxlength` already been explicitly provided? (via `this.$options.propsData.maxlength === undefined`)

If both conditions are true, the default `maxlength` is injected into `propsData`.

> **Why `beforeCreate` and `propsData`:** `maxlength` is a named prop on `ElInput`, not an HTML attribute — Vue 2 routes named props to `$props` and never puts them in `$attrs`. Additionally, `$attrs` is read-only. `$options.propsData` holds the raw prop values before they are sealed and is safely writable at `beforeCreate` time. Note: `propsData` may be `null` (not an object) when no props are passed from the parent — the `|| {}` fallback handles this case.

> **Performance:** The `beforeCreate` hook runs on every component instantiation in the app. The name check is O(1) and negligible in practice, but this is an accepted tradeoff of the global mixin approach.

> **Registration order:** `Vue.mixin()` must be called **before** `new Vue({ ... })` in `main.js`. Global mixins apply to all future instances; components already instantiated before registration are unaffected.

> **Name fragility:** The check `this.$options.name === 'ElInput'` relies on Element UI's internal component name. It will fail silently for locally aliased or wrapped versions of `ElInput`. Do not register a local component named `ElInput` in the project.

---

## File Structure

```
src/
├── config/
│   └── inputConfig.js        # Exports DEFAULT_MAX_LENGTH = 500
├── mixins/
│   └── inputMaxLength.js     # Mixin definition
└── main.js                   # Vue.mixin() registration
```

---

## Implementation Details

### `src/config/inputConfig.js`

```js
export const DEFAULT_MAX_LENGTH = 500
```

### `src/mixins/inputMaxLength.js`

```js
import { DEFAULT_MAX_LENGTH } from '@/config/inputConfig'

export default {
  beforeCreate() {
    if (this.$options.name === 'ElInput') {
      // propsData is null (not an object) when no props are passed from the parent
      const propsData = this.$options.propsData || {}
      if (propsData.maxlength === undefined) {
        this.$options.propsData = { ...propsData, maxlength: DEFAULT_MAX_LENGTH }
      }
    }
  }
}
```

### `src/main.js`

```js
import Vue from 'vue'
import inputMaxLengthMixin from './mixins/inputMaxLength'

// Must be called before new Vue()
Vue.mixin(inputMaxLengthMixin)

new Vue({ ... })
```

---

## Override Pattern

```html
<!-- Uses default 500 -->
<el-input v-model="val" />

<!-- Override to 100 -->
<el-input v-model="val" :maxlength="100" />

<!-- Explicit opt-out of limit (project convention: use null, not undefined) -->
<el-input v-model="val" :maxlength="null" />

<!-- Textarea also covered (same ElInput component) -->
<el-input type="textarea" v-model="val" />
```

---

## Edge Cases

| Case | Behavior |
|------|----------|
| `:maxlength="100"` passed explicitly | `propsData.maxlength !== undefined`, default not injected |
| `:maxlength="null"` passed explicitly | Project convention for opt-out — `null` is not `undefined`, default not injected; ElInput treats `null` as no limit |
| `:maxlength="0"` passed explicitly | Not `undefined`, default not injected; ElInput behavior with `0` is implementation-defined — avoid using in practice |
| `:maxlength="false"` passed explicitly | Not `undefined`, default not injected; passing a boolean is likely a template error |
| `:maxlength="someVar"` where `someVar === undefined` at runtime | Treated as not provided — default 500 is injected. Use `null` for dynamic opt-out, not `undefined` |
| `type="textarea"` | Covered — same ElInput component |
| Non-ElInput components | Skipped — name check prevents interference |
| `show-word-limit` not set | No character counter UI shown — consistent with existing behavior |
| `show-word-limit` set on a field | Counter UI appears as normal — this mixin does not affect it |

---

## Future Migration to Vue 3

The global mixin approach has a clear migration path but should be treated as temporary scaffolding when moving to Vue 3.

**Short-term (minimal changes):**
- Change `Vue.mixin()` → `app.mixin()` in `main.js`
- Update detection: `this.$options.name === 'ElInput'` still works for Element Plus since it uses `defineComponent({ name: 'ElInput' })`
- Note: `this.$.type === ElInput` is sometimes suggested but accesses Vue 3 internal APIs (`$` is `InternalInstance`) and is not part of the stable public API — avoid it

**Long-term (recommended):**
- Migrate to a wrapped `AppInput` component approach with a one-time codemod script to replace all `<el-input` with `<app-input`. This eliminates the global mixin entirely and is the clean permanent solution.

---

## Testing

- Unit test: apply mixin directly via `mixins` option, mount `ElInput` without `maxlength` → assert prop is 500
- Unit test: mount `ElInput` with `:maxlength="100"` → assert prop is 100
- Unit test: mount `ElInput` with `:maxlength="null"` → assert prop is null
- Unit test: mount a non-ElInput component → assert mixin has no effect
- Integration test: register mixin globally via `Vue.mixin()` in test setup, mount `ElInput` without `maxlength`, assert prop is 500 — this validates the full registration path in `main.js`

---

## Out of Scope

- Visual character counter UI
- Per-field length configuration beyond explicit override
- Textarea-specific limits
