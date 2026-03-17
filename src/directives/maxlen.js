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

    const onCompositionStart = () => {
      composing = true;
    };
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
