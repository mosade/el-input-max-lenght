import { enforceMaxLen } from "../utils/maxlen.js";

function findNativeInput(el) {
  if (!el) return null;
  return el.querySelector("input, textarea");
}

function getLimit(props) {
  if (props && props.maxlen !== undefined) return Number(props.maxlen) || 0;
  return 10;
}

export default function install(Vue) {
  const ElInput = Vue.options.components && Vue.options.components.ElInput;
  if (!ElInput) return;

  Vue.component("ElInput", {
    name: "ElInput",
    extends: ElInput,
    props: {
      maxlen: { type: [Number, String], default: undefined }
    },
    mounted() {
      const attach = () => {
        attachListeners(this);
      };
      if (typeof this.$nextTick === "function") {
        this.$nextTick(attach);
      } else {
        attach();
      }
    },
    updated() {
      attachListeners(this);
    },
    beforeDestroy() {
      if (this.__maxlenState__ && this.__maxlenState__.cleanup) {
        this.__maxlenState__.cleanup();
      }
      delete this.__maxlenState__;
    }
  });
}

function attachListeners(instance) {
  if (!instance) return;
  if (!instance.__maxlenState__) {
    instance.__maxlenState__ = {
      input: null,
      cleanup: null,
      composing: false
    };
  }

  const state = instance.__maxlenState__;
  const input = findNativeInput(instance.$el);

  if (!input) {
    if (state.cleanup) state.cleanup();
    state.input = null;
    state.cleanup = null;
    state.composing = false;
    return;
  }

  if (state.input === input && state.cleanup) return;
  if (state.cleanup) state.cleanup();

  state.input = input;
  state.composing = false;

  const onCompositionStart = () => {
    state.composing = true;
  };
  const onCompositionEnd = () => {
    state.composing = false;
    const limit = getLimit(instance.$props);
    const result = enforceMaxLen(input.value, limit);
    if (result.truncated) {
      input.value = result.value;
      input.dispatchEvent(new Event("input"));
    }
  };
  const onInput = () => {
    if (state.composing) return;
    const limit = getLimit(instance.$props);
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