import {
  CreateElement,
  FunctionalComponentOptions,
  RenderContext,
  VNode
} from 'vue';
import { DefaultProps, RecordPropsDefinition } from 'vue/types/options'; //tslint:disable-line:no-submodule-imports
import { BBCodeElement } from './core';
import { BBCodeParser } from './parser';

export const BBCodeView = (
  parser: BBCodeParser
): FunctionalComponentOptions<
  DefaultProps,
  RecordPropsDefinition<DefaultProps>
> => ({
  functional: true,
  render(createElement: CreateElement, context: RenderContext): VNode {
    /*tslint:disable:no-unsafe-any*/ //because we're not actually supposed to do any of this
    context.data.hook = {
      insert(node: VNode): void {
        node.elm!.appendChild(
          parser.parseEverything(
            context.props.text !== undefined
              ? context.props.text
              : context.props.unsafeText
          )
        );
        if (context.props.afterInsert !== undefined)
          context.props.afterInsert(node.elm);
      },
      destroy(node: VNode): void {
        const first = (node.elm as Element).firstChild as BBCodeElement | null;
        const cleanup: undefined | (() => void) = first
          ? (first as any).cleanup
          : undefined;
        if (typeof cleanup === 'function') cleanup();
      }
    };
    const vnode = createElement('span', context.data);
    vnode.key = context.props.text;
    return vnode;
    //tslint:enable
  }
});
