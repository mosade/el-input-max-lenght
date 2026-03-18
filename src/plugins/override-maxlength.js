const DEFAULT_MAXLENGTH = 4000;

function findNativeInput(el) {
  if (!el) return null;
  return el.querySelector("input, textarea");
}

function getProvidedMaxlength(instance) {
  if (!instance) return { provided: false, value: undefined };

  const vnodeProps =
    instance.$vnode &&
    instance.$vnode.componentOptions &&
    instance.$vnode.componentOptions.propsData;
  const optionsProps = instance.$options && instance.$options.propsData;
  const propsData = vnodeProps || optionsProps;

  if (!propsData || typeof propsData !== "object") {
    return { provided: false, value: undefined };
  }

  if (!Object.prototype.hasOwnProperty.call(propsData, "maxlength")) {
    return { provided: false, value: undefined };
  }

  return { provided: true, value: propsData.maxlength };
}

function resolveMaxlength(provided) {
  if (!provided || !provided.provided || provided.value === undefined) {
    return { enabled: true, value: DEFAULT_MAXLENGTH };
  }

  const value = provided.value;
  if (value === null || value === 0 || value === "0" || value === "") {
    return { enabled: false, value: DEFAULT_MAXLENGTH };
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) {
    return { enabled: true, value: Math.floor(numeric) };
  }

  return { enabled: true, value: DEFAULT_MAXLENGTH };
}

function applyMaxlength(instance) {
  if (!instance) return;

  const input = findNativeInput(instance.$el);
  if (!input) return;

  const provided = getProvidedMaxlength(instance);
  const resolved = resolveMaxlength(provided);

  if (!resolved.enabled) {
    input.removeAttribute("maxlength");
    return;
  }

  input.setAttribute("maxlength", resolved.value);
}

export default function install(Vue) {
  const ElInput = Vue.options && Vue.options.components && Vue.options.components.ElInput;
  if (!ElInput) return;

  Vue.component("ElInput2", {
    name: "ElInput2",
    extends: ElInput,
    mounted() {
      const apply = () => applyMaxlength(this);
      if (typeof this.$nextTick === "function") {
        this.$nextTick(apply);
      } else {
        apply();
      }
    },
    updated() {
      const apply = () => applyMaxlength(this);
      if (typeof this.$nextTick === "function") {
        this.$nextTick(apply);
      } else {
        apply();
      }
    }
  });
}
