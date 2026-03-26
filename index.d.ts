declare module '!!raw-loader!*' {
  const content: string;
  export default content;
}

declare module 'any-ascii' {
  export default function anyAscii(s: string): string;
}

declare module 'vue-input-tag' {}

declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
