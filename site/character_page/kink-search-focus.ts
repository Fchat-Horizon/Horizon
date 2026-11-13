type KinkSearch = {
  input: HTMLInputElement;
  showOverview: () => void;
};

let search: KinkSearch | undefined;

// Because channel view already had a way to trigger on search
// this was the way i decided to override if if you had the modal up
// I didn't really want to write a more overaching method for catching
// the find, maybe that would be celaner? that way you could tell if
// a profile modal or channel or potentially any other "thing" was up on screen
// and have a dedicated in-view search for that.
export function registerProfileKinkSearch(next: KinkSearch): () => void {
  search = next;
  return () => {
    if (search === next) search = undefined;
  };
}

// Actually focus on the filter and put the cursor in the text field
export function focusProfileKinkFilter(): boolean {
  const current = search;
  if (!current?.input.isConnected) return false;

  const content = <HTMLElement | null>current.input.closest('.modal-content');
  if (!content || content.style.display === 'none') return false;
  if (document.activeElement === current.input) return true;

  current.showOverview();
  const input = current.input;
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
  return true;
}
