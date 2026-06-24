import {
  defineComponent,
  h,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  type PropType
} from 'vue';
import type { BBCodeElement } from './core';
import type { BBCodeParser } from './parser';

/*
 * Renders parsed BBCode into a <span>. The parser builds raw DOM (and mounts
 * sub-component apps for tags like [user]), so this drives it imperatively
 * against a ref'd element instead of through the Vue vnode tree.
 */
function runCleanup(el: Element | null): void {
  const first = el?.firstChild as BBCodeElement | null;
  const cleanup: undefined | (() => void) = first
    ? (first as any).cleanup
    : undefined;
  if (typeof cleanup === 'function') cleanup();
}

export const BBCodeView = (parser: BBCodeParser) =>
  defineComponent({
    props: {
      text: {
        type: String as PropType<string | undefined>,
        default: undefined
      },
      unsafeText: {
        type: String as PropType<string | undefined>,
        default: undefined
      },
      afterInsert: {
        type: Function as PropType<(elm: HTMLElement) => void>,
        default: undefined
      }
    },
    setup(props) {
      const root = ref<HTMLSpanElement | null>(null);

      const render = (): void => {
        const el = root.value;
        if (el === null) return;
        runCleanup(el);
        el.textContent = '';
        el.appendChild(
          parser.parseEverything(
            props.text !== undefined ? props.text : props.unsafeText!
          )
        );
        if (props.afterInsert !== undefined) props.afterInsert(el);
      };

      onMounted(render);
      watch(
        () => [props.text, props.unsafeText],
        () => render()
      );
      onBeforeUnmount(() => runCleanup(root.value));

      return () => h('span', { ref: root });
    }
  });
