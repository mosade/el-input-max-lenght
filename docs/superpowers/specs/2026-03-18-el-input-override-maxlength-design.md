# Design: ElInput2 Default Maxlength Override

## Goal
Provide a third implementation path for Element UI `el-input` length limiting by introducing an `ElInput2` component that injects a default `maxlength=4000`, allows explicit `:maxlength` overrides, and treats `null`/`0` as disabling the limit. This must work for both `input` and `textarea` types without altering existing `ElInput` or `auto-maxlen` behavior.

## Non-goals
- Replace or modify the existing `ElInput` component globally.
- Change behavior in `src/plugins/auto-maxlen.js` or the `v-maxlen` directive.
- Enforce limits on non-`ElInput2` components.

## Approach
Create a new plugin module that registers a globally available `ElInput2` component via `Vue.component("ElInput2", { extends: ElInput, ... })`. This component reuses Element UI's existing `maxlength` prop (no re-declare/override) and, on `mounted/updated`, finds the internal native `input`/`textarea` element and sets or removes the DOM `maxlength` attribute based on the rules below.

## Maxlength Rules
- Determine if the user provided `maxlength` by checking `this.$vnode.componentOptions.propsData`, falling back to `this.$options.propsData` when needed, so behavior does not depend on any base component default. If both are missing, treat as not provided and use default `4000`.
- If `maxlength` is not provided, or it is provided as `undefined` (e.g., `v-bind` with an undefined value) -> use default `4000`.
- Decision (approved by user): if provided value is `null`, `0`, the string "0", or empty string (e.g., `maxlength=""`) -> disable (remove `maxlength` attribute).
- If provided value is a number or numeric string -> coerce with `Number()` and if finite and positive, use `Math.floor` of that value.
- Decision (approved by user): if provided value is negative, non-finite, or non-numeric -> treat as not provided and use default `4000`.

## Data Flow
1. `ElInput2` receives props and renders `ElInput` internally.
2. On `mounted` and `updated`, use `this.$nextTick` to locate native `input`/`textarea` within `this.$el`.
3. Resolve the effective limit using the rules above; if not provided, use default `4000`.
4. Apply the resolved value to the DOM `maxlength` attribute, or remove it if disabled.

## Edge Cases
- If no native `input`/`textarea` exists (e.g., render timing or custom slots), do nothing and re-check on the next component update.
- `ElInput2` is isolated from `auto-maxlen` because the plugin targets `ElInput` only. Avoid combining `ElInput2` with `v-maxlen`; if both are used, behavior is undefined and not supported.
- Precedence: `ElInput2` passes props through unchanged so Element UI can render as usual, then the plugin re-applies the resolved `maxlength` on `updated`, making the plugin's resolved value authoritative for the DOM attribute.
- `show-word-limit` is not automatically enabled by the default; it only reflects explicit `:maxlength` usage per Element UI behavior.
- Switching between `text` and `textarea` types is handled by re-checking on `updated`.
 - Textarea autosize or internal re-renders are handled because the plugin re-locates the native element and re-applies the attribute on each update cycle.

## API and Usage
`ElInput2` is available globally after plugin registration. The `maxlength` prop default must remain `undefined` so "not provided" can be distinguished from explicit values:

```vue
<el-input2 v-model="value" />
<el-input2 v-model="value" :maxlength="120" />
<el-input2 v-model="value" :maxlength="0" />
<el-input2 type="textarea" v-model="value" />
```

## Testing Plan
- Verify default `maxlength=4000` for `<el-input2 v-model>`, `input` and `textarea`.
- Verify explicit `:maxlength` overrides to `10` or other values.
- Verify `:maxlength="0"` and `:maxlength="null"` remove the DOM attribute.
- Verify updates when switching `type` between `text` and `textarea`.

## Rollout
- Add new plugin `src/plugins/override-maxlength.js` and register it in `src/main.js`.
- Update demo usage in `src/App.vue` with `el-input2` examples.
