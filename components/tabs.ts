import Vue, { CreateElement, VNode } from 'vue';

//tslint:disable-next-line:variable-name
const Tabs = Vue.extend({
  props: ['value', 'tabs'],
  render(
    this: Vue & { readonly value?: string; _v?: string; selected?: string; tabs: { readonly [key: string]: string } },
    createElement: CreateElement
  ): VNode {
    let children: { [key: string]: string | VNode | undefined };
    if (this.$slots['default'] !== undefined) {
      children = {};
      this.$slots['default']!.forEach((child, i) => {
        if (child.context !== undefined) children[child.key !== undefined ? child.key : i] = child;
      });
    } else children = this.tabs;
    const keys = Object.keys(children);
    if (this._v !== this.value) this.selected = this._v = this.value;
    if (this._v === undefined || children[this._v] === undefined) this.$emit('input', (this._v = keys[0]));
    if (this.selected !== this._v && children[this.selected!] !== undefined) this.$emit('input', (this._v = this.selected));
    return createElement('div', { staticClass: 'nav-tabs-scroll' }, [
      createElement(
        'ul',
        { staticClass: 'nav nav-tabs' },
        keys.map(key =>
          createElement('li', { staticClass: 'nav-item' }, [
            createElement(
              'a',
              {
                attrs: { href: '#' },
                staticClass: 'nav-link',
                class: { active: this._v === key },
                on: { click: () => this.$emit('input', key) }
              },
              [children[key]!]
            )
          ])
        )
      )
    ]);
  }
});

export default Tabs;
