import { Component } from 'vue';
import { SharedStore, StoreMethods } from './interfaces';

export let Store: SharedStore = {
  shared: undefined!,
  authenticated: false
};

export const registeredComponents: { [key: string]: Component | undefined } = {};

export function registerComponent(name: string, component: Component): void {
  registeredComponents[name] = component;
}

export function registerMethod<K extends keyof StoreMethods>(name: K, func: StoreMethods[K]): void {
  methods[name] = func;
}

export const methods: StoreMethods = <StoreMethods>{}; //tslint:disable-line:no-object-literal-type-assertion
