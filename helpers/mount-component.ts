import Vue from 'vue';
// NOTE: Transitional helper: keeps Vue 2.7 Composition API components mountable via
//       a single wrapper, so we can swap the internals to Vue 3 later. Should make things... *Less*, painful.

/**
 * Mount a component into an existing element using a small wrapper instance.
 *
 * @param Component - The Vue component definition to render.
 * @param el - The DOM element to mount into.
 * @param props - Props passed to the component.
 * @returns The wrapper Vue instance so callers can destroy it later.
 */
export function mountComponent(
  Component: any,
  el: Element,
  props: Record<string, unknown> = {}
): Vue {
  const vm = new Vue({
    render: h => h(Component, { props })
  });

  vm.$mount(el as any);

  return vm;
}
