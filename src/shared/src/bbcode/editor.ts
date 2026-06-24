import type { ComponentPublicInstance } from 'vue';
import { Keys } from '@/keys';

export interface EditorButton {
  titleKey: string;
  tag: string;
  icon: string;
  key?: Keys;
  class?: string;
  outerClass?: string;
  startText?: string;
  endText?: string;
  handler?(vm: ComponentPublicInstance): void;
}

export interface EditorSelection {
  start: number;
  end: number;
  length: number;
  text: string;
}
export const defaultButtons: ReadonlyArray<EditorButton> = [
  {
    titleKey: 'editor.format.bold',
    tag: 'b',
    icon: 'fa-bold',
    key: Keys.KeyB
  },
  {
    titleKey: 'editor.format.italic',
    tag: 'i',
    icon: 'fa-italic',
    key: Keys.KeyI
  },
  {
    titleKey: 'editor.format.underline',
    tag: 'u',
    icon: 'fa-underline',
    key: Keys.KeyU
  },
  {
    titleKey: 'editor.format.strikethrough',
    tag: 's',
    icon: 'fa-strikethrough',
    key: Keys.KeyS
  },
  {
    titleKey: 'editor.format.color',
    tag: 'color',
    startText: '[color=]',
    icon: 'fa-eye-dropper',
    key: Keys.KeyD
  },
  {
    titleKey: 'editor.format.superscript',
    tag: 'sup',
    icon: 'fa-superscript',
    key: Keys.ArrowUp
  },
  {
    titleKey: 'editor.format.subscript',
    tag: 'sub',
    icon: 'fa-subscript',
    key: Keys.ArrowDown
  },
  {
    titleKey: 'editor.format.url',
    tag: 'url',
    startText: '[url=]',
    icon: 'fa-link',
    key: Keys.KeyL
  },
  {
    titleKey: 'editor.format.user',
    tag: 'user',
    icon: 'fa-user',
    key: Keys.KeyR
  },
  {
    titleKey: 'editor.format.icon',
    tag: 'icon',
    icon: 'fa-user-circle',
    key: Keys.KeyO
  },
  {
    titleKey: 'editor.format.eicon',
    tag: 'eicon',
    class: 'far fa-fw ',
    icon: 'fa-smile',
    key: Keys.KeyE
  },
  {
    titleKey: 'editor.format.spoiler',
    tag: 'spoiler',
    icon: 'fa-eye-slash',
    key: Keys.KeyK
  },
  {
    titleKey: 'editor.format.noparse',
    tag: 'noparse',
    icon: 'fa-ban',
    key: Keys.KeyN
  }
];
