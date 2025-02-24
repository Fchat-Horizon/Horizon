import axios, { AxiosError, AxiosResponse } from 'axios';
import { InlineDisplayMode, Settings, SimpleCharacter } from '../interfaces';

type FlashMessageType = 'info' | 'success' | 'warning' | 'danger';
type FlashMessageImpl = (type: FlashMessageType, message: string) => void;

let flashImpl: FlashMessageImpl = (type: FlashMessageType, message: string) => {
  console.log(`${type}: ${message}`);
};

export function setFlashMessageImplementation(impl: FlashMessageImpl): void {
  flashImpl = impl;
}

export function avatarURL(name: string): string {
  const uregex = /^[a-zA-Z0-9_\-\s]+$/;
  if (!uregex.test(name)) return '#';
  return `${staticDomain}images/avatar/${name.toLowerCase()}.png`;
}

export function characterURL(name: string): string {
  const uregex = /^[a-zA-Z0-9_\-\s]+$/;
  if (!uregex.test(name)) return '#';
  return `${siteDomain}c/${name}`;
}

//tslint:disable-next-line:no-any
export function isJSONError(error: any): error is Error & { response: AxiosResponse<{ [key: string]: object | string | number }> } {
  return (<AxiosError>error).response !== undefined && typeof (<AxiosError>error).response!.data === 'object';
}

export function ajaxError(error: any, prefix: string, showFlashMessage: boolean = true): void {
  //tslint:disable-line:no-any
  let message: string | undefined;
  if (error instanceof Error) {
    if (axios.isCancel(error)) return;

    if (isJSONError(error)) {
      const data = <{ error?: string | string[] }>error.response.data;
      if (typeof data.error === 'string') message = data.error;
      else if (typeof data.error === 'object' && data.error.length > 0) message = data.error[0];
    }
    if (message === undefined)
      message =
        (<Error & { response?: AxiosResponse }>error).response !== undefined
          ? (<Error & { response: AxiosResponse }>error).response.statusText
          : error.name;
  } else message = <string>error;
  console.error(error);
  if (showFlashMessage) flashError(`[ERROR] ${prefix}: ${message}`);
}

export function flashError(message: string): void {
  flashMessage('danger', message);
}

export function flashSuccess(message: string): void {
  flashMessage('success', message);
}

export function flashMessage(type: FlashMessageType, message: string): void {
  flashImpl(type, message);
}

export let siteDomain = '';
export let staticDomain = '';

export let settings: Settings = {
  animateEicons: true,
  inlineDisplayMode: InlineDisplayMode.DISPLAY_ALL,
  defaultCharacter: -1,
  fuzzyDates: true
};

export let characters: SimpleCharacter[] = [];

export function setDomains(site: string, stat: string): void {
  siteDomain = site;
  staticDomain = stat;
}

export function init(s: Settings, c: SimpleCharacter[]): void {
  settings = s;
  characters = c;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function replaceAll(str: string, find: string, replace: string): string {
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}
