# El-Input Max Length Design

## Overview
Provide a safe, consistent input length limit for Element UI `el-input` across a large codebase. Default limit is 4000 characters, with per-component override support. Two implementation paths are defined: an explicit directive (manual template opt-in) and an automatic global injection (zero template changes).

## Goals
- Enforce a default maximum length of 4000 characters for `el-input`.
- Allow per-component override of the limit.
- Keep v-model in sync after truncation.
- Support both `<input>` and `<textarea>`.
- Preserve IME (composition) behavior for CJK input.
- Provide a migration path to Element Plus.

## Non-Goals
- Enforce limits on non-`el-input` components.
- Auto-derive max length from backend schema.

## Approach A: Explicit Directive (Manual Opt-In)
### Summary
Introduce a global directive `v-maxlen` and use it on each `el-input`. The directive locates the native input/textarea, listens for `input` and composition events, truncates value on overflow, and emits an input event to keep v-model consistent.

### Usage
- Default limit: 4000 (if no value passed)
- Override (authoritative):
  - `v-maxlen="123"`
- Optional secondary source:
  - `:maxlen="123"` is read only when `v-maxlen` has no explicit value
- Precedence: `v-maxlen` value > `maxlen` prop > global default (4000)

### Pros
- Low coupling to Element UI internals.
- Easy migration to Element Plus.

### Cons
- Requires editing every `el-input` to add the directive.

## Approach B: Automatic Global Injection (Zero Template Changes)
### Summary
Wrap or extend `el-input` globally and inject the same length-limiting logic internally. This auto-applies to all usages without template changes.

### Usage
- Default limit: 4000
- Override via a `maxlen` prop added by the wrapper (single supported override source)
- Precedence: `maxlen` prop > global default (4000)

### Pros
- Zero template changes; one-time global setup.

### Cons
- Higher coupling to Element UI internals; needs rework when upgrading to Element Plus.

## Behavior Details
### Truncation Flow
1. Listen to native `input` events on the inner `<input>`/`<textarea>`.
2. If `value.length > limit`, truncate to the limit.
3. Emit a synthetic `input` event immediately after truncation to sync v-model.
4. Do not emit `change` (keep behavior aligned with native input).

### IME Handling
- Track `compositionstart` and `compositionend`.
- Do not truncate during composition.
- On `compositionend`, immediately truncate if over limit and emit `input`.

### Type Handling
- Normalize value to string for length check.
- Preserve empty values (null/undefined -> empty string) without throwing.
- The model value after truncation is always a string (consistent with Element UI input behavior).

### Fallback
- If native input element is not found, skip without affecting render.

## File Layout
- `src/directives/maxlen.js` (Approach A)
- `src/plugins/auto-maxlen.js` (Approach B)
- `src/main.js` for registration

## Migration Notes (Element Plus)
- Approach A is largely portable; confirm inner input lookup logic.
- Approach B requires re-implementing the wrapper to match Element Plus internals.

## Testing Notes
- Verify truncation in both input and textarea modes.
- Verify IME composition flow.
- Verify v-model sync after truncation.
- Verify per-component override takes precedence over default.
