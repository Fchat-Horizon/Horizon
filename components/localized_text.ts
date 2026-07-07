import Vue, { VNode } from 'vue';
import l, { LocalizeParams, lp } from '../chat/localize';

// ^ Renders a localized string, substituting each {token} with the matching
//   named slot so translations control where inline elements (links,
//   buttons) sit in the sentence. Tokens covered by `params` are replaced
//   with plain text by l() before slot substitution.
export default Vue.extend({
  name: 'localized-text',
  props: {
    k: { type: String, required: true },
    tag: { type: String, default: 'span' },
    params: { type: Object as () => LocalizeParams, default: undefined },
    count: { type: Number, default: undefined }
  },
  render(h): VNode {
    let str: string;
    if (this.count !== undefined) {
      // ^ self-replacement keeps the {count} token intact for the slot pass
      const params =
        this.$scopedSlots['count'] !== undefined
          ? { count: '{count}', ...this.params }
          : this.params;
      str = lp(this.k, this.count, params);
    } else {
      str = this.params !== undefined ? l(this.k, this.params) : l(this.k);
    }
    const children = str
      .split(/\{(\w+)\}/g)
      .map((part, i): VNode[] | string => {
        if (i % 2 === 0) return part;
        const slot = this.$scopedSlots[part];
        return slot?.({}) ?? `{${part}}`;
      })
      .filter(part => part !== '');
    return h(this.tag, children);
  }
});
