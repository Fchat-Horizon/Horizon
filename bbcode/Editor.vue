<template>
  <div
    class="bbcode-editor"
    style="display: flex; flex-wrap: wrap; justify-content: flex-end"
    @keydown="onKeyDownGlobal"
    tabindex="1"
    ref="editorContainer"
  >
    <slot></slot>
    <a
      tabindex="0"
      class="btn btn-light bbcode-btn btn-sm"
      role="button"
      @click="showToolbar = true"
      @blur="showToolbar = false"
      style="border-bottom-left-radius: 0; border-bottom-right-radius: 0"
      v-if="hasToolbar"
    >
      <i class="fa fa-code"></i>
    </a>

    <EIconSelector
      :onSelect="onSelectEIcon"
      ref="eIconSelector"
    ></EIconSelector>

    <div
      class="bbcode-toolbar btn-toolbar"
      role="toolbar"
      :disabled="disabled"
      :style="
        showToolbar || colorPopupVisible ? { display: 'flex' } : undefined
      "
      @mousedown.stop.prevent
      v-if="hasToolbar"
      style="flex: 1 51%"
    >
      <transition name="color-popover">
        <div
          class="popover popover-top color-selector"
          v-show="colorPopupVisible"
          v-on-clickaway="dismissColorSelector"
        >
          <div class="popover-body">
            <div
              class="color-typing-hint"
              v-if="awaitingColorKey && awaitingBuffer"
              :class="{ 'no-match': awaitingNoMatch }"
            >
              <div class="buffer">{{ awaitingBuffer.toLowerCase() }}</div>
              <div class="matches">
                <span
                  v-for="m in awaitingMatches"
                  :key="m"
                  :class="['chip', m]"
                  >{{ m }}</span
                >
              </div>
            </div>
            <div class="btn-group" role="group" :aria-label="l('common.color')">
              <button
                v-for="btnCol in buttonColors"
                type="button"
                class="btn text-color"
                :class="btnCol"
                :title="btnCol"
                @click.prevent.stop="applyAndClearColor(btnCol)"
                tabindex="0"
              ></button>
            </div>
          </div>
        </div>
      </transition>

      <div class="btn-group toolbar-buttons" style="flex-wrap: wrap">
        <div v-if="!!characterName" class="character-btn">
          <icon :character="characterName"></icon>
        </div>

        <div
          class="btn btn-light btn-sm"
          v-for="button in buttons"
          :class="button.outerClass"
          :title="button.title"
          @click.prevent.stop="apply(button)"
        >
          <i
            :class="(button.class ? button.class : 'fa fa-fw ') + button.icon"
          ></i>
        </div>
        <div
          @click="previewBBCode"
          class="btn btn-light btn-sm bbcode-editor-preview"
          :class="preview ? 'active' : ''"
          :title="
            preview
              ? l('editor.closePreview', `${this.shortcutModifierKey}+Shift+P`)
              : l('editor.preview', `${this.shortcutModifierKey}+Shift+P`)
          "
        >
          <i class="fa" :class="preview ? 'fa-eye' : 'far fa-eye'"></i>
        </div>
      </div>
      <button
        type="button"
        class="btn-close"
        :aria-label="l('action.close')"
        style="margin-left: 10px"
        @click="showToolbar = false"
      ></button>
    </div>
    <div
      @click="previewBBCode"
      v-if="preview && !hasToolbar"
      class="btn btn-light btn-sm bbcode-editor-preview active"
      :title="l('editor.closePreview', `${this.shortcutModifierKey}+Shift+P`)"
    >
      <i class="fa fa-eye-slash"></i>
    </div>
    <div
      class="bbcode-editor-text-area bg-light"
      style="order: 100; width: 100%"
    >
      <textarea
        ref="input"
        v-model="text"
        @input="onInput"
        v-show="!preview"
        :maxlength="maxlength"
        :placeholder="placeholder"
        :class="finalClasses"
        class="hidden-scrollbar"
        @keyup="onKeyUp"
        :disabled="disabled"
        @paste="onPaste"
        @keypress="$emit('keypress', $event)"
        :style="hasToolbar ? { 'border-top-left-radius': 0 } : undefined"
        @keydown="onKeyDown"
      ></textarea>
      <textarea ref="sizer" class="hidden-scrollbar"></textarea>
      <div class="bbcode-preview bg-body" v-show="preview">
        <div class="bbcode-preview-warnings">
          <div class="alert alert-danger" v-show="previewWarnings.length">
            <li v-for="warning in previewWarnings">{{ warning }}</li>
          </div>
        </div>
        <div class="bbcode" ref="preview-element"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import _ from 'lodash';
  import Vue from 'vue';
  import { mixin as clickaway } from 'vue-clickaway';
  import { getKey } from '../chat/common';
  import { Keys } from '../keys';
  import { BBCodeElement, CoreBBCodeParser, urlRegex } from './core';
  import core from '../chat/core';
  import { defaultButtons, EditorButton, EditorSelection } from './editor';
  import { BBCodeParser } from './parser';
  import { default as IconView } from './IconView.vue';
  import { default as EIconSelector } from './EIconSelector.vue';
  import Modal from '../components/Modal.vue';
  import { Character } from '../fchat';
  import l from '../chat/localize';

  export default Vue.extend({
    components: {
      icon: IconView,
      EIconSelector: EIconSelector
    },
    mixins: [clickaway],
    props: {
      extras: {},
      maxlength: { default: 1000 },
      classes: {},
      value: { default: undefined },
      disabled: {},
      placeholder: {},
      hasToolbar: { default: true },
      invalid: { default: false, type: Boolean },
      characterName: { default: null },
      type: { default: 'normal' }
    },
    data() {
      return {
        l: l,
        buttonColors: [
          'red',
          'orange',
          'yellow',
          'green',
          'cyan',
          'purple',
          'blue',
          'pink',
          'black',
          'brown',
          'white',
          'gray'
        ],
        colorPopupVisible: false,
        preview: false,
        previewWarnings: [] as ReadonlyArray<string>,
        previewResult: '',
        // tslint:disable-next-line: no-unnecessary-type-assertion
        text: (this.value !== undefined ? this.value : '') as string,
        element: undefined as any as HTMLTextAreaElement,
        sizer: undefined as any as HTMLTextAreaElement,
        editorContainer: undefined as any as HTMLElement,
        maxHeight: 0 as number,
        minHeight: 0 as number,
        showToolbar: false,
        shortcutModifierKey: process.platform == 'darwin' ? '⌘' : 'Ctrl',
        parser: undefined as any as BBCodeParser,
        defaultButtons: defaultButtons,
        isShiftPressed: false,
        undoStack: [] as string[],
        undoIndex: 0,
        lastInput: 0,
        awaitingColorKey: false as boolean,
        awaitingNoMatch: false as boolean,
        awaitingNoMatchTimer: null as number | null,
        awaitingBuffer: '' as string,
        //tslint:disable:strict-boolean-expressions
        resizeListener: undefined as any as () => void
      };
    },
    computed: {
      awaitingMatches(): string[] {
        return this.awaitingBuffer
          ? this.getMatches(this.awaitingBuffer).slice(0, 3)
          : [];
      },
      finalClasses(): string | undefined {
        let classes = this.classes as string | undefined;
        if (this.invalid) classes += ' is-invalid';
        return classes;
      },
      buttons(): EditorButton[] {
        const buttons = this.defaultButtons.slice();

        if (this.extras !== undefined)
          for (
            let i = 0, l = (this.extras as EditorButton[]).length;
            i < l;
            i++
          )
            buttons.push((this.extras as EditorButton[])[i]);

        const colorButtonIndex = _.findIndex(buttons, b => b.tag === 'color');

        if (this.colorPopupVisible) {
          const colorButton = _.clone(buttons[colorButtonIndex]);
          colorButton.outerClass = 'toggled';

          buttons[colorButtonIndex] = colorButton;
        }

        return buttons;
      }
    },
    watch: {
      value(newValue: string): void {
        this.$nextTick(() => this.resize());
        if (this.text === newValue) return;
        this.text = newValue;
        this.lastInput = 0;
        this.undoIndex = 0;
        this.undoStack = [];
      }
    },
    created(): void {
      // console.log('EDITOR', 'created');
      this.parser = new CoreBBCodeParser();
      this.resizeListener = () => {
        const styles = getComputedStyle(this.element);
        this.maxHeight = parseInt(styles.maxHeight, 10) || 250;
        this.minHeight = parseInt(styles.minHeight, 10) || 60;
      };
    },
    mounted(): void {
      // console.log('EDITOR', 'mounted');
      this.element = <HTMLTextAreaElement>this.$refs['input'];
      const styles = getComputedStyle(this.element);
      this.maxHeight = parseInt(styles.maxHeight, 10) || 250;
      this.minHeight = parseInt(styles.minHeight, 10) || 60;
      setInterval(() => {
        if (
          Date.now() - this.lastInput >= 500 &&
          this.text !== this.undoStack[0] &&
          this.undoIndex === 0
        ) {
          if (this.undoStack.length >= 30) this.undoStack.pop();
          this.undoStack.unshift(this.text);
        }
      }, 500);
      this.sizer = <HTMLTextAreaElement>this.$refs['sizer'];
      this.sizer.style.cssText = styles.cssText;
      this.sizer.style.height = '0';
      this.sizer.style.minHeight = '0';
      this.sizer.style.overflow = 'hidden';
      this.sizer.style.position = 'absolute';
      this.sizer.style.top = '0';
      this.sizer.style.visibility = 'hidden';
      this.resize();
      window.addEventListener('resize', this.resizeListener);
      this.editorContainer = this.$refs['editorContainer'] as HTMLElement;
    },

    //tslint:enable

    destroyed(): void {
      // console.log('EDITOR', 'destroyed');
      window.removeEventListener('resize', this.resizeListener);
    },
    methods: {
      getMatches(prefix: string): string[] {
        const topRow = new Set(this.buttonColors.slice(0, 8));
        return this.buttonColors
          .filter(c => c.toLowerCase().startsWith(prefix.toLowerCase()))
          .sort((a, b) => {
            const aTop = topRow.has(a) ? 0 : 1;
            const bTop = topRow.has(b) ? 0 : 1;
            if (aTop !== bTop) return aTop - bTop;
            return a.localeCompare(b);
          });
      },
      clearAwaiting(): void {
        this.awaitingColorKey = false;
        this.awaitingBuffer = '';
        this.awaitingNoMatch = false;
        if (this.awaitingNoMatchTimer) {
          window.clearTimeout(this.awaitingNoMatchTimer);
          this.awaitingNoMatchTimer = null;
        }
        this.colorPopupVisible = false;
      },
      applyAndClearColor(color: string): void {
        this.clearAwaiting();
        this.colorApply(color);
      },
      getButtonByTag(tag: string): EditorButton {
        const btn = _.find(this.buttons, b => b.tag === tag);

        if (!btn) {
          throw new Error('Unknown button');
        }

        return btn;
      },
      getSelection(): EditorSelection {
        const length = this.element.selectionEnd - this.element.selectionStart;
        return {
          start: this.element.selectionStart,
          end: this.element.selectionEnd,
          length,
          text: this.element.value.substr(this.element.selectionStart, length)
        };
      },

      replaceSelection(replacement: string): string {
        const selection = this.getSelection();
        const start =
          this.element.value.substr(0, selection.start) + replacement;
        const end = this.element.value.substr(selection.end);
        this.element.value = start + end;
        this.element.dispatchEvent(new Event('input'));
        return start + end;
      },

      setSelection(start: number, end?: number): void {
        if (end === undefined) end = start;
        this.element.focus();
        this.element.setSelectionRange(start, end);
      },

      isEIconSelectorOpen(): boolean {
        const eIconSelector = this.$refs['eIconSelector'] as any;
        return eIconSelector?.dialog?.isShown === true;
      },

      applyText(
        startText: string,
        endText: string,
        withInject?: string,
        collapseAfterWrap: boolean = false
      ): void {
        if (this.undoIndex === 0 && this.text !== this.undoStack[0]) {
          if (this.undoStack.length >= 30) this.undoStack.pop();
          this.undoStack.unshift(this.text);
        }

        const selection = this.getSelection();
        if (selection.length > 0) {
          const replacement =
            startText + (withInject || selection.text) + endText;
          this.text = this.replaceSelection(replacement);
          // If collapsing after wrap, place caret at end; otherwise keep wrapped text selected.
          if (collapseAfterWrap) {
            const caretPos = selection.start + replacement.length;
            this.setSelection(caretPos, caretPos);
          } else {
            this.setSelection(
              selection.start,
              selection.start + replacement.length
            );
          }
        } else {
          const start = this.text.substr(0, selection.start) + startText;
          const end = endText + this.text.substr(selection.start);
          this.text = start + (withInject || '') + end;

          const selectionPoint = withInject
            ? start.length + withInject.length + endText.length
            : start.length;

          this.$nextTick(() => this.setSelection(selectionPoint));
        }
        this.$emit('input', this.text);
      },

      dismissColorSelector(): void {
        this.colorPopupVisible = false;
      },

      colorApply(btnColor: string): void {
        const button = this.getButtonByTag('color');

        this.applyButtonEffect(button, btnColor);

        this.colorPopupVisible = false;
      },

      dismissEIconSelector(): void {
        (this.$refs['eIconSelector'] as Modal).hide();
      },

      showEIconSelector(): void {
        (this.$refs['eIconSelector'] as Modal).show();
        setTimeout(() => (this.$refs['eIconSelector'] as any).setFocus(), 50);
      },

      onSelectEIcon(eiconId: string, shift: boolean): void {
        this.eiconApply(eiconId, shift);
      },

      eiconApply(eiconId: string, shift: boolean): void {
        const button = this.getButtonByTag('eicon');

        this.applyButtonEffect(button, undefined, eiconId);

        if (!shift) {
          this.dismissEIconSelector();
        }
      },

      apply(button: EditorButton): void {
        if (button.tag === 'color') {
          this.colorPopupVisible = !this.colorPopupVisible;
          return;
        } else if (button.tag === 'eicon') {
          this.showEIconSelector();
          this.colorPopupVisible = false;
          return;
        } else {
          this.colorPopupVisible = false;
        }

        this.applyButtonEffect(button);
      },

      applyButtonEffect(
        button: EditorButton,
        withArgument?: string,
        withInject?: string
      ): void {
        // Allow emitted variations for custom buttons.
        this.$once('insert', (startText: string, endText: string) =>
          this.applyText(startText, endText)
        );
        // noinspection TypeScriptValidateTypes
        if (button.handler !== undefined) {
          // tslint:ignore-next-line:no-any
          return button.handler.call(this as any, this);
        }
        const startText =
          button.startText === undefined || withArgument
            ? `[${button.tag}${withArgument ? '=' + withArgument : ''}]`
            : button.startText;
        const endText =
          button.endText === undefined ? `[/${button.tag}]` : button.endText;

        const ebl = endText ? endText.length : 0;
        const sbl = startText ? startText.length : 0;

        if (this.text.length + sbl + ebl > this.maxlength) return;

        const collapseAfterWrap = button.tag === 'color';
        this.applyText(
          startText || '',
          endText || '',
          withInject,
          collapseAfterWrap
        );
        this.lastInput = Date.now();
      },

      onInput(): void {
        if (this.undoIndex > 0) {
          this.undoStack = this.undoStack.slice(this.undoIndex);
          this.undoIndex = 0;
        }
        this.$emit('input', this.text);
        this.lastInput = Date.now();
      },

      //By "global" we mean global to the editor, not for the entire page.
      //They fire when the editor element is focused, not the text box.
      onKeyDownGlobal(e: KeyboardEvent): void {
        if (this.isEIconSelectorOpen()) {
          return;
        }

        const key = getKey(e);
        if (
          ((e.metaKey || e.ctrlKey) && e.shiftKey && key === Keys.KeyP) ||
          ((key === Keys.Enter || key === Keys.Space) && this.preview)
        ) {
          e.stopPropagation();
          e.preventDefault();
          this.togglePreview();
          return;
        }

        const input = <HTMLTextAreaElement>this.$refs['input'];
        if (input) {
          input.focus();
        }
      },

      onKeyDown(e: KeyboardEvent): void {
        const key = getKey(e);
        if (this.awaitingColorKey) {
          // Escape: cancel
          if (key === Keys.Escape) {
            e.stopPropagation();
            e.preventDefault();
            this.clearAwaiting();
            return;
          }

          // Backspace: remove last char
          if (key === Keys.Backspace) {
            e.stopPropagation();
            e.preventDefault();
            if (this.awaitingBuffer.length > 0)
              this.awaitingBuffer = this.awaitingBuffer.slice(0, -1);
            return;
          }

          if (key >= Keys.KeyA && key <= Keys.KeyZ) {
            e.stopPropagation();
            e.preventDefault();
            const ch = String.fromCharCode(key);
            this.awaitingBuffer += ch;

            const prefix = this.awaitingBuffer.toLowerCase();
            const matches = this.buttonColors.filter(c =>
              c.toLowerCase().startsWith(prefix)
            );

            if (matches.length === 1) {
              this.applyAndClearColor(matches[0]);
              return;
            }
            const exact = matches.find(c => c.toLowerCase() === prefix);
            if (exact) {
              this.applyAndClearColor(exact);
              return;
            }

            if (matches.length === 0) {
              this.awaitingNoMatch = true;
              if (this.awaitingNoMatchTimer)
                window.clearTimeout(this.awaitingNoMatchTimer);
              this.awaitingNoMatchTimer = window.setTimeout(
                () => this.clearAwaiting(),
                800
              ) as unknown as number;
              return;
            }

            return;
          }
        }
        if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
          if (key === Keys.KeyZ) {
            e.preventDefault();
            if (this.undoIndex === 0 && this.undoStack[0] !== this.text)
              this.undoStack.unshift(this.text);
            if (this.undoStack.length > this.undoIndex + 1) {
              this.text = this.undoStack[++this.undoIndex];
              this.$emit('input', this.text);
              this.lastInput = Date.now();
            }
          } else if (key === Keys.KeyY) {
            e.preventDefault();
            if (this.undoIndex > 0) {
              this.text = this.undoStack[--this.undoIndex];
              this.$emit('input', this.text);
              this.lastInput = Date.now();
            }
          }
          if (
            this.hasToolbar &&
            core.state.settings.horizonUseColorPicker &&
            key === Keys.KeyD
          ) {
            e.stopPropagation();
            e.preventDefault();
            this.awaitingColorKey = true;
            this.awaitingBuffer = '';
            this.colorPopupVisible = true;
            return;
          }

          for (const button of this.buttons)
            if (button.key === key) {
              e.stopPropagation();
              e.preventDefault();
              this.applyButtonEffect(button);
              break;
            }
        } else if (e.shiftKey) this.isShiftPressed = true;
        this.$emit('keydown', e);
      },

      onKeyUp(e: KeyboardEvent): void {
        if (!e.shiftKey) this.isShiftPressed = false;
        this.$emit('keyup', e);
      },

      resize(): void {
        const styles = getComputedStyle(this.element);
        const paddingLeft = parseFloat(styles.paddingLeft) || 0;
        const paddingRight = parseFloat(styles.paddingRight) || 0;
        const contentWidth =
          this.element.clientWidth - paddingLeft - paddingRight;
        this.sizer.style.fontSize = this.element.style.fontSize;
        this.sizer.style.lineHeight = this.element.style.lineHeight;
        this.sizer.style.width = `${contentWidth}px`;
        this.sizer.value = this.element.value;
        this.element.style.height = `${Math.max(Math.min(this.sizer.scrollHeight, this.maxHeight), this.minHeight)}px`;
        this.sizer.style.width = '0';
      },

      onPaste(e: ClipboardEvent): void {
        const data = e.clipboardData!.getData('text/plain');
        if (!this.isShiftPressed && urlRegex.test(data)) {
          const selection = this.getSelection();
          if (selection.text.length === 0) {
            //This regex tests for [url= so you don't wind up pasting another pair of URL tags
            const match = /.*\[url=$/.exec(
              this.text.substring(0, selection.end)
            );
            if (match !== null) {
              return;
            }
          }

          console.log('bbcode.url.paste', data);
          e.preventDefault();
          //we only replace the brackets instead of trying to force the whole path to be escaped because
          //these two characters give us trouble with BBCode and the rest can just be picked up by the browser anyway
          //Oh, and if your TS compiler cries about it, don't worry.  Chromium's JS engine supports it...
          //And the problem is just that as of writing (27 nov 2025) we are still, somehow, using es2017 as our target.
          this.applyText(
            `[url=${data.replaceAll('[', '%5B').replaceAll(']', '%5D')}]`,
            '[/url]'
          );
        }
      },

      focus(): void {
        this.element.focus();
      },

      previewBBCode(): void {
        this.doPreview();
      },

      doPreview(): void {
        const targetElement = <HTMLElement>this.$refs['preview-element'];
        if (this.preview) {
          this.preview = false;
          this.previewWarnings = [];
          this.previewResult = '';
          const previewElement = <BBCodeElement>targetElement.firstChild;
          // noinspection TypeScriptValidateTypes
          if (previewElement.cleanup !== undefined) previewElement.cleanup();
          if (targetElement.firstChild !== null)
            targetElement.removeChild(targetElement.firstChild);
        } else {
          this.preview = true;
          this.parser.storeWarnings = true;
          targetElement.appendChild(this.parser.parseEverything(this.text));
          this.previewWarnings = this.parser.warnings;
          this.parser.storeWarnings = false;
        }
      },

      togglePreview(): void {
        this.doPreview();
        // If we're in preview mode, we need to ensure focus is maintained
        if (this.preview) {
          this.$nextTick(() => {
            this.editorContainer.focus();
          });
        } else {
          this.$nextTick(() => this.focus());
        }
      }
    }
  });
</script>
<style lang="scss">
  .bbcode-editor .bbcode-toolbar .character-btn {
    width: 30px;
    height: 30px;
    overflow: hidden;

    a {
      width: 100%;
      height: 100%;

      img {
        width: inherit;
        height: inherit;
      }
    }
  }

  .bbcode-preview {
    max-height: 450px;
    overflow-y: auto;
    div.bbcode {
      padding: 0.2em 0.45em;
      min-height: 60px;
    }
  }

  .bbcode-editor {
    resize: none;
    &:focus {
      outline: none;
      .bbcode-editor-text-area {
        outline: 2px ridge var(--bs-primary-border-subtle);
      }
    }
  }

  .bbcode-toolbar {
    position: relative;
    .toolbar-buttons {
      .btn.toggled {
        background-color: var(--bs-secondary) !important;
      }
    }

    .color-selector {
      max-width: 150px;
      left: 5.7em;
      bottom: 2.2em;
      line-height: 1;
      z-index: 1000;
      background-color: var(--bs-body-bg);
      position: absolute;

      .popover-body {
        padding: 0px;
      }

      .btn-group {
        display: block;
        margin: 10px 13px 10px 13px;
      }

      .color-typing-hint {
        padding: 6px 8px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 0.85em;
        background: linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.02),
          rgba(0, 0, 0, 0.02)
        );
        backdrop-filter: blur(3px);
      }

      .color-typing-hint .buffer {
        font-weight: 600;
        text-transform: lowercase;
        min-width: 18px;
        color: var(--bs-body-color);
        padding-right: 6px;
        border-right: 1px solid rgba(0, 0, 0, 0.06);
      }

      .color-typing-hint .matches {
        display: flex;
        gap: 6px;
        flex-wrap: nowrap;
        align-items: center;
      }

      .color-typing-hint .chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 18px;
        padding: 0 6px;
        border-radius: 10px;
        font-size: 0.85em;
        color: rgba(0, 0, 0, 0.7);
        background: rgba(255, 255, 255, 0.85);
        border: 1px solid rgba(0, 0, 0, 0.06);
      }

      .color-typing-hint.no-match .chip {
        opacity: 0.5;
        filter: grayscale(100%);
      }

      .btn {
        &.text-color {
          border-radius: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          margin-right: -1px !important;
          margin-bottom: -1px !important;
          border: 1px solid var(--bs-secondary);
          width: 1.3rem;
          height: 1.3rem;

          &::before {
            display: none !important;
          }

          &:hover {
            border-color: var(--bs-gray-800) !important;
          }

          &.red {
            background-color: var(--textRedColor);
          }

          &.orange {
            background-color: var(--textOrangeColor);
          }

          &.yellow {
            background-color: var(--textYellowColor);
          }

          &.green {
            background-color: var(--textGreenColor);
          }

          &.cyan {
            background-color: var(--textCyanColor);
          }

          &.purple {
            background-color: var(--textPurpleColor);
          }

          &.blue {
            background-color: var(--textBlueColor);
          }

          &.pink {
            background-color: var(--textPinkColor);
          }

          &.black {
            background-color: var(--textBlackColor);
          }

          &.brown {
            background-color: var(--textBrownColor);
          }

          &.white {
            background-color: var(--textWhiteColor);
          }

          &.gray {
            background-color: var(--textGrayColor);
          }
        }
      }
    }
  }
  .color-popover-enter-active,
  .color-popover-leave-active {
    transition: all 0.1s ease-in;
  }

  .color-popover-enter,
  .color-popover-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }

  .force-reduced-motion .bbcode-editor {
    @media (prefers-reduced-motion: no-preference) {
      *,
      *::before,
      *::after {
        //Sorry to all my fellow !important haters. The root implementation
        // of our reduced motion setting has forced my hand.
        transition-duration: unset !important;
      }
    }
  }
</style>
