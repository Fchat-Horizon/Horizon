// At what point do we start moving channel grouping files into a chat/channels dir?
// Apparently not at 2026-05-25.
// - FatCat

const ACTIVE_DROP_ZONE_SELECTOR =
  '.channel-group-list.sortable-over, .ungrouped-channels.sortable-over';

function getConversationsElement(): HTMLElement | null {
  return document.getElementById('conversations');
}

function clearActiveDropZones(): void {
  getConversationsElement()
    ?.querySelectorAll(ACTIVE_DROP_ZONE_SELECTOR)
    .forEach(el => el.classList.remove('sortable-over'));
}

export function startChannelDragging(): void {
  getConversationsElement()?.classList.add('channel-dragging');
  clearActiveDropZones();
}

export function setActiveDropZone(target: HTMLElement | undefined): void {
  getConversationsElement()
    ?.querySelectorAll(ACTIVE_DROP_ZONE_SELECTOR)
    .forEach(el => {
      if (el !== target) el.classList.remove('sortable-over');
    });
  target?.classList.add('sortable-over');
}

export function endChannelDragging(): void {
  getConversationsElement()?.classList.remove('channel-dragging');
  clearActiveDropZones();
}

export function startGroupDragging(): void {
  getConversationsElement()?.classList.add('group-dragging');
}

export function endGroupDragging(): void {
  getConversationsElement()?.classList.remove('group-dragging');
}
