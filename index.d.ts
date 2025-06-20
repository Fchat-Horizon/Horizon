declare module '!!raw-loader!*' {
  const content: string;
  export default content;
}

declare module 'any-ascii' {
  export default function anyAscii(s: string): string;
}

declare module 'vue-input-tag' {}
declare module 'vue' {
  import { CompatVue } from '@vue/runtime-dom';
  const Vue: CompatVue;
  export default Vue;
  export * from '@vue/runtime-dom';
  const { configureCompat } = Vue;
  export { configureCompat };
}
