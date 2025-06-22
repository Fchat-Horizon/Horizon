import { ref } from 'vue';

/**
 * Composable to provide dialog show/hide logic, replacing the old CustomDialog class.
 * Usage:
 *   const { dialog, show, hide } = useCustomDialog();
 *   <modal ref="dialog" ... />
 */
export function useCustomDialog<T = any>() {
  const dialog = ref<T | null>(null);

  function show(keepOpen?: boolean) {
    dialog.value?.show?.(keepOpen);
  }

  function hide() {
    dialog.value?.hide?.();
  }

  return {
    dialog,
    show,
    hide
  };
}
