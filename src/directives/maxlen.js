import { enforceMaxLen } from "../utils/maxlen.js";

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

export default {
  bind(el, binding, vnode) {
    el.__maxlenState__ = {
      binding,
      vnode,
      input: null,
      cleanup: null,
      composing: false
    };
  },
  inserted(el, binding, vnode) {
    if (!el.__maxlenState__) {
      el.__maxlenState__ = {
        binding,
        vnode,
        input: null,
        cleanup: null,
        composing: false
      };
    } else {
      el.__maxlenState__.binding = binding;
      el.__maxlenState__.vnode = vnode;
    }
    attachListeners(el);
  },
  componentUpdated(el, binding, vnode) {
    if (!el.__maxlenState__) {
      el.__maxlenState__ = {
        binding,
        vnode,
        input: null,
        cleanup: null,
        composing: false
      };
    } else {
      el.__maxlenState__.binding = binding;
      el.__maxlenState__.vnode = vnode;
    }
    attachListeners(el);
  },
  unbind(el) {
    if (el.__maxlenState__ && el.__maxlenState__.cleanup) {
      el.__maxlenState__.cleanup();
    }
    delete el.__maxlenState__;
  }
};

function attachListeners(el) {
  if (!el.__maxlenState__) return;
  const state = el.__maxlenState__;
  const input = findNativeInput(el);
  if (!input) return;
  if (state.input === input && state.cleanup) return;
  if (state.cleanup) state.cleanup();

  state.input = input;
  state.composing = false;

  const onCompositionStart = () => {
    state.composing = true;
  };
  const onCompositionEnd = () => {
    state.composing = false;
    const limit = getLimit(state.binding, state.vnode);
    const result = enforceMaxLen(input.value, limit);
    if (result.truncated) {
      input.value = result.value;
      input.dispatchEvent(new Event("input"));
    }
  };
  const onInput = () => {
    if (state.composing) return;
    const limit = getLimit(state.binding, state.vnode);
    const result = enforceMaxLen(input.value, limit);
    if (result.truncated) {
      input.value = result.value;
      input.dispatchEvent(new Event("input"));
    }
  };

  input.addEventListener("compositionstart", onCompositionStart);
  input.addEventListener("compositionend", onCompositionEnd);
  input.addEventListener("input", onInput);
  state.cleanup = () => {
    input.removeEventListener("compositionstart", onCompositionStart);
    input.removeEventListener("compositionend", onCompositionEnd);
    input.removeEventListener("input", onInput);
  };
}