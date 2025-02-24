import Vue from 'vue';
import { Keys } from '../keys';

export interface EditorButton {
  title: string;
  tag: string;
  icon: string;
  key?: Keys;
  class?: string;
  outerClass?: string;
  startText?: string;
  endText?: string;
  handler?(vm: Vue): void;
}

export interface EditorSelection {
  start: number;
  end: number;
  length: number;
  text: string;
}
/*tslint:disable:max-line-length*/
export let defaultButtons: ReadonlyArray<EditorButton> = [
  {
    title: 'Bold (Ctrl+B)\n\nMakes text appear with a bold weight.',
    tag: 'b',
    icon: 'fa-bold',
    key: Keys.KeyB
  },
  {
    title: 'Italic (Ctrl+I)\n\nMakes text appear with an italic style.',
    tag: 'i',
    icon: 'fa-italic',
    key: Keys.KeyI
  },
  {
    title: 'Underline (Ctrl+U)\n\nMakes text appear with an underline beneath it.',
    tag: 'u',
    icon: 'fa-underline',
    key: Keys.KeyU
  },
  {
    title:
      'Strikethrough (Ctrl+S)\n\nPlaces a horizontal line through the text. Usually used to signify a correction or redaction without omitting the text.',
    tag: 's',
    icon: 'fa-strikethrough',
    key: Keys.KeyS
  },
  {
    title:
      'Color (Ctrl+D)\n\nStyles text with a color. Valid colors are: red, orange, yellow, green, cyan, blue, purple, pink, black, brown, white and gray.',
    tag: 'color',
    startText: '[color=]',
    icon: 'fa-eye-dropper',
    key: Keys.KeyD
  },
  {
    title: 'Superscript (Ctrl+↑)\n\nLifts text above the text baseline. Makes text slightly smaller. Cannot be nested.',
    tag: 'sup',
    icon: 'fa-superscript',
    key: Keys.ArrowUp
  },
  {
    title: 'Subscript (Ctrl+↓)\n\nPushes text below the text baseline. Makes text slightly smaller. Cannot be nested.',
    tag: 'sub',
    icon: 'fa-subscript',
    key: Keys.ArrowDown
  },
  {
    title: 'URL (Ctrl+L)\n\nCreates a clickable link to another page of your choosing.',
    tag: 'url',
    startText: '[url=]',
    icon: 'fa-link',
    key: Keys.KeyL
  },
  {
    title: "User (Ctrl+R)\n\nLinks to a character's profile.",
    tag: 'user',
    icon: 'fa-user',
    key: Keys.KeyR
  },
  {
    title: "Icon (Ctrl+O)\n\nShows a character's profile image, linking to their profile.",
    tag: 'icon',
    icon: 'fa-user-circle',
    key: Keys.KeyO
  },
  {
    title:
      'EIcon (Ctrl+E)\n\nShows a previously uploaded eicon. If the icon is a gif, it will be shown as animated unless a user has turned this off.',
    tag: 'eicon',
    class: 'far ',
    icon: 'fa-smile',
    key: Keys.KeyE
  },
  {
    title: 'Spoiler (Ctrl+K)\n\nHidden until explicitly clicked by the viewer.',
    tag: 'spoiler',
    icon: 'fa-eye-slash',
    key: Keys.KeyK
  },
  {
    title:
      'Noparse (Ctrl+N)\n\nAll BBCode placed within this tag will be ignored and treated as text. Great for sharing structure without it being rendered.',
    tag: 'noparse',
    icon: 'fa-ban',
    key: Keys.KeyN
  }
];
