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

      const onCompositionStart = () => {
        composing = true;
      };
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
