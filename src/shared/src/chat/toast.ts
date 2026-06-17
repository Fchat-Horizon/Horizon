import Vue from 'vue';

export interface ToastEntry {
  id: string;
  message: string;
  icon?: string;
  iconSpin?: boolean;
  variant?: 'default' | 'error' | 'success';
  progress?: number;
  autoDismiss?: number;
}

type ToastUpdate = Partial<Omit<ToastEntry, 'id'>>;

const state = Vue.observable({ toasts: [] as ToastEntry[] });

const timers = new Map<string, ReturnType<typeof setTimeout>>();

let nextId = 0;

function scheduleAutoDismiss(id: string, ms: number): void {
  clearTimer(id);
  if (ms > 0) {
    timers.set(
      id,
      setTimeout(() => dismissToast(id), ms)
    );
  }
}

function clearTimer(id: string): void {
  const t = timers.get(id);
  if (t !== undefined) {
    clearTimeout(t);
    timers.delete(id);
  }
}

export function showToast(
  opts: Omit<ToastEntry, 'id'> & { id?: string }
): string {
  const id = opts.id ?? `toast-${++nextId}`;
  const entry: ToastEntry = {
    variant: 'default',
    autoDismiss: 0,
    ...opts,
    id
  };
  state.toasts.push(entry);
  if (entry.autoDismiss) scheduleAutoDismiss(id, entry.autoDismiss);
  return id;
}

export function updateToast(id: string, partial: ToastUpdate): void {
  const idx = state.toasts.findIndex(t => t.id === id);
  if (idx === -1) return;
  const entry = { ...state.toasts[idx], ...partial };
  Vue.set(state.toasts, idx, entry);
  if (partial.autoDismiss !== undefined) {
    scheduleAutoDismiss(id, partial.autoDismiss);
  }
}

export function dismissToast(id: string): void {
  clearTimer(id);
  const idx = state.toasts.findIndex(t => t.id === id);
  if (idx !== -1) state.toasts.splice(idx, 1);
}

export const toasts = state.toasts;
