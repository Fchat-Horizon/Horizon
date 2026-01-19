<template>
  <div
    class="bbcode-editor bbcode-editor-mattermost"
    :class="{ 'toolbar-top': toolbarPosition === 'top' }"
    @keydown="onKeyDownGlobal"
    tabindex="1"
    ref="editorContainer"
  >
    <EIconSelector
      :onSelect="onSelectEIcon"
      ref="eIconSelector"
    ></EIconSelector>

    <div class="bbcode-editor-container" :class="{ focused: isFocused }">
      <div
        class="bbcode-toolbar-internal"
        role="toolbar"
        :disabled="disabled"
        @mousedown.stop.prevent
        v-if="hasToolbar && toolbarPosition === 'top'"
        ref="toolbarInternal"
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
              <div
                class="btn-group"
                role="group"
                :aria-label="l('common.color')"
              >
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

        <div class="toolbar-buttons-wrapper" ref="toolbarButtonsWrapper">
          <div v-if="!!characterName" class="character-btn">
            <icon :character="characterName"></icon>
          </div>

          <div
            class="toolbar-btn"
            v-for="button in visibleButtons"
            :key="button.tag"
            :class="button.outerClass"
            :title="button.title"
            @click.prevent.stop="apply(button)"
          >
            <i
              :class="(button.class ? button.class : 'fa fa-fw ') + button.icon"
            ></i>
          </div>

          <div
            class="toolbar-btn toolbar-overflow-btn"
            v-if="overflowButtons.length > 0"
            @click.prevent.stop="toggleOverflowMenu"
            :class="{ active: showOverflowMenu }"
            title="More formatting options"
            ref="overflowTrigger"
          >
            <i class="fa fa-fw fa-ellipsis-h"></i>
          </div>

          <div
            @click="previewBBCode"
            class="toolbar-btn bbcode-editor-preview"
            :class="preview ? 'active' : ''"
            :title="
              preview
                ? l(
                    'editor.closePreview',
                    `${this.shortcutModifierKey}+Shift+P`
                  )
                : l('editor.preview', `${this.shortcutModifierKey}+Shift+P`)
            "
          >
            <i class="fa" :class="preview ? 'fa-eye' : 'far fa-eye'"></i>
          </div>
        </div>

        <div
          class="toolbar-overflow-menu"
          v-if="overflowButtons.length > 0"
          v-show="showOverflowMenu"
          v-on-clickaway="closeOverflowMenu"
          ref="overflowMenu"
        >
          <div
            class="toolbar-overflow-item"
            v-for="button in overflowButtons"
            :key="button.tag"
            :class="button.outerClass"
            :title="button.title"
            @click.prevent.stop="applyFromOverflow(button)"
          >
            <i
              :class="(button.class ? button.class : 'fa fa-fw ') + button.icon"
            ></i>
          </div>
        </div>

        <slot name="controls"></slot>
      </div>

      <div
        class="bbcode-editor-separator"
        v-if="hasToolbar && toolbarPosition === 'top'"
      ></div>

      <div class="bbcode-editor-text-area">
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
          @keydown="onKeyDown"
          @focus="isFocused = true"
          @blur="isFocused = false"
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

      <div
        class="bbcode-editor-separator"
        v-if="hasToolbar && toolbarPosition === 'bottom'"
      ></div>

      <div
        class="bbcode-toolbar-internal"
        role="toolbar"
        :disabled="disabled"
        @mousedown.stop.prevent
        v-if="hasToolbar && toolbarPosition === 'bottom'"
        ref="toolbarInternal"
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
              <div
                class="btn-group"
                role="group"
                :aria-label="l('common.color')"
              >
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

        <div class="toolbar-buttons-wrapper" ref="toolbarButtonsWrapper">
          <div v-if="!!characterName" class="character-btn">
            <icon :character="characterName"></icon>
          </div>

          <div
            class="toolbar-btn"
            v-for="button in visibleButtons"
            :key="button.tag"
            :class="button.outerClass"
            :title="button.title"
            @click.prevent.stop="apply(button)"
          >
            <i
              :class="(button.class ? button.class : 'fa fa-fw ') + button.icon"
            ></i>
          </div>

          <div
            class="toolbar-btn toolbar-overflow-btn"
            v-if="overflowButtons.length > 0"
            @click.prevent.stop="toggleOverflowMenu"
            :class="{ active: showOverflowMenu }"
            title="More formatting options"
            ref="overflowTrigger"
          >
            <i class="fa fa-fw fa-ellipsis-h"></i>
          </div>

          <div
            @click="previewBBCode"
            class="toolbar-btn bbcode-editor-preview"
            :class="preview ? 'active' : ''"
            :title="
              preview
                ? l(
                    'editor.closePreview',
                    `${this.shortcutModifierKey}+Shift+P`
                  )
                : l('editor.preview', `${this.shortcutModifierKey}+Shift+P`)
            "
          >
            <i class="fa" :class="preview ? 'fa-eye' : 'far fa-eye'"></i>
          </div>
        </div>

        <div
          class="toolbar-overflow-menu"
          v-if="overflowButtons.length > 0"
          v-show="showOverflowMenu"
          v-on-clickaway="closeOverflowMenu"
          ref="overflowMenu"
        >
          <div
            class="toolbar-overflow-item"
            v-for="button in overflowButtons"
            :key="button.tag"
            :class="button.outerClass"
            :title="button.title"
            @click.prevent.stop="applyFromOverflow(button)"
          >
            <i
              :class="(button.class ? button.class : 'fa fa-fw ') + button.icon"
            ></i>
          </div>
        </div>

        <slot name="controls"></slot>
      </div>
    </div>

    <slot></slot>

    <div
      @click="previewBBCode"
      v-if="preview && !hasToolbar"
      class="btn btn-light btn-sm bbcode-editor-preview active standalone-preview"
      :title="l('editor.closePreview', `${this.shortcutModifierKey}+Shift+P`)"
    >
      <i class="fa fa-eye-slash"></i>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Hook, Prop, Watch } from '@f-list/vue-ts';
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

  @Component({
    components: {
      icon: IconView,
      EIconSelector: EIconSelector
    },
    mixins: [clickaway]
  })
  export default class Editor extends Vue {
    l = l;
    @Prop
    readonly extras?: EditorButton[];

    @Prop({ default: 1000 })
    readonly maxlength!: number;

    @Prop
    readonly classes?: string;

    @Prop
    readonly value?: string | undefined = undefined;

    @Prop
    readonly disabled?: boolean;

    @Prop
    readonly placeholder?: string;

    @Prop({ default: true })
    readonly hasToolbar!: boolean;

    @Prop({ default: 'bottom' })
    readonly toolbarPosition!: 'bottom' | 'top';

    @Prop({ default: false, type: Boolean })
    readonly invalid!: boolean;

    @Prop({ default: null })
    readonly characterName: Character | null = null;

    @Prop({ default: 'normal' })
    readonly type: 'normal' | 'big' = 'normal';

    buttonColors = [
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
    ];
    colorPopupVisible = false;

    preview = false;
    previewWarnings: ReadonlyArray<string> = [];
    previewResult = '';
    // tslint:disable-next-line: no-unnecessary-type-assertion
    text: string = (this.value !== undefined ? this.value : '') as string;
    element!: HTMLTextAreaElement;
    sizer!: HTMLTextAreaElement;
    editorContainer!: HTMLElement;
    maxHeight!: number;
    minHeight!: number;
    showToolbar = false;
    shortcutModifierKey: String = process.platform == 'darwin' ? '⌘' : 'Ctrl';
    protected parser!: BBCodeParser;
    protected defaultButtons = defaultButtons;

    showOverflowMenu = false;
    visibleButtonCount = 14;
    isFocused = false;

    private isShiftPressed = false;
    private undoStack: string[] = [];
    private undoIndex = 0;
    private lastInput = 0;
    private awaitingColorKey: boolean = false;
    private awaitingNoMatch: boolean = false;
    private awaitingNoMatchTimer: number | null = null;
    private awaitingBuffer: string = '';
    // tslint:disable-next-line:no-any
    private overflowResizeObserver: any = null;
    //tslint:disable:strict-boolean-expressions
    private resizeListener!: () => void;

    get visibleButtons(): EditorButton[] {
      return this.buttons.slice(0, this.visibleButtonCount);
    }

    get overflowButtons(): EditorButton[] {
      return this.buttons.slice(this.visibleButtonCount);
    }

    toggleOverflowMenu(): void {
      this.showOverflowMenu = !this.showOverflowMenu;
    }

    closeOverflowMenu(event?: MouseEvent): void {
      if (event) {
        const trigger = this.$refs['overflowTrigger'] as HTMLElement;
        if (trigger && trigger.contains(event.target as Node)) {
          return;
        }
      }
      this.showOverflowMenu = false;
    }

    applyFromOverflow(button: EditorButton): void {
      this.apply(button);
      this.closeOverflowMenu();
    }

    private calculateVisibleButtons(): void {
      if (!this.hasToolbar) return;

      const wrapper = this.$refs['toolbarButtonsWrapper'] as HTMLElement;
      if (!wrapper) return;

      const wrapperWidth = wrapper.clientWidth;
      const buttonWidth = 32;
      const overflowBtnWidth = 32;
      const previewBtnWidth = 32;
      const characterBtnWidth = this.characterName ? 32 : 0;
      const padding = 16;

      const totalButtons = this.buttons.length;
      const availableWithoutOverflow =
        wrapperWidth - previewBtnWidth - characterBtnWidth - padding;
      const maxButtonsWithoutOverflow = Math.floor(
        availableWithoutOverflow / buttonWidth
      );

      if (maxButtonsWithoutOverflow >= totalButtons) {
        this.visibleButtonCount = totalButtons;
      } else {
        const availableWithOverflow =
          wrapperWidth -
          overflowBtnWidth -
          previewBtnWidth -
          characterBtnWidth -
          padding;
        const maxButtonsWithOverflow = Math.floor(
          availableWithOverflow / buttonWidth
        );
        this.visibleButtonCount = Math.max(
          4,
          Math.min(maxButtonsWithOverflow, totalButtons - 1)
        );
      }
    }

    private getMatches(prefix: string): string[] {
      const topRow = new Set(this.buttonColors.slice(0, 8));
      return this.buttonColors
        .filter(c => c.toLowerCase().startsWith(prefix.toLowerCase()))
        .sort((a, b) => {
          const aTop = topRow.has(a) ? 0 : 1;
          const bTop = topRow.has(b) ? 0 : 1;
          if (aTop !== bTop) return aTop - bTop;
          return a.localeCompare(b);
        });
    }

    get awaitingMatches(): string[] {
      return this.awaitingBuffer
        ? this.getMatches(this.awaitingBuffer).slice(0, 3)
        : [];
    }

    private clearAwaiting(): void {
      this.awaitingColorKey = false;
      this.awaitingBuffer = '';
      this.awaitingNoMatch = false;
      if (this.awaitingNoMatchTimer) {
        window.clearTimeout(this.awaitingNoMatchTimer);
        this.awaitingNoMatchTimer = null;
      }
      this.colorPopupVisible = false;
    }

    private applyAndClearColor(color: string): void {
      this.clearAwaiting();
      this.colorApply(color);
    }

    @Hook('created')
    created(): void {
      // console.log('EDITOR', 'created');
      this.parser = new CoreBBCodeParser();
      this.resizeListener = () => {
        const styles = getComputedStyle(this.element);
        this.maxHeight = parseInt(styles.maxHeight, 10) || 250;
        this.minHeight = parseInt(styles.minHeight, 10) || 60;
      };
    }

    @Hook('mounted')
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

      this.$nextTick(() => {
        this.calculateVisibleButtons();
        const wrapper = this.$refs['toolbarButtonsWrapper'] as HTMLElement;
        // tslint:disable-next-line:no-any
        const RO = (window as any).ResizeObserver;
        if (wrapper && typeof RO !== 'undefined') {
          this.overflowResizeObserver = new RO(() => {
            this.calculateVisibleButtons();
          });
          this.overflowResizeObserver.observe(wrapper);
        }
      });
    }

    //tslint:enable

    @Hook('destroyed')
    destroyed(): void {
      // console.log('EDITOR', 'destroyed');
      window.removeEventListener('resize', this.resizeListener);
      if (this.overflowResizeObserver) {
        this.overflowResizeObserver.disconnect();
        this.overflowResizeObserver = null;
      }
    }

    get finalClasses(): string | undefined {
      let classes = this.classes;
      if (this.invalid) classes += ' is-invalid';
      return classes;
    }

    get buttons(): EditorButton[] {
      const buttons = this.defaultButtons.slice();

      if (this.extras !== undefined)
        for (let i = 0, l = this.extras.length; i < l; i++)
          buttons.push(this.extras[i]);

      const colorButtonIndex = _.findIndex(buttons, b => b.tag === 'color');

      if (this.colorPopupVisible) {
        const colorButton = _.clone(buttons[colorButtonIndex]);
        colorButton.outerClass = 'toggled';

        buttons[colorButtonIndex] = colorButton;
      }

      return buttons;
    }

    getButtonByTag(tag: string): EditorButton {
      const btn = _.find(this.buttons, b => b.tag === tag);

      if (!btn) {
        throw new Error('Unknown button');
      }

      return btn;
    }

    @Watch('value')
    watchValue(newValue: string): void {
      this.$nextTick(() => this.resize());
      if (this.text === newValue) return;
      this.text = newValue;
      this.lastInput = 0;
      this.undoIndex = 0;
      this.undoStack = [];
    }

    getSelection(): EditorSelection {
      const length = this.element.selectionEnd - this.element.selectionStart;
      return {
        start: this.element.selectionStart,
        end: this.element.selectionEnd,
        length,
        text: this.element.value.substr(this.element.selectionStart, length)
      };
    }

    replaceSelection(replacement: string): string {
      const selection = this.getSelection();
      const start = this.element.value.substr(0, selection.start) + replacement;
      const end = this.element.value.substr(selection.end);
      this.element.value = start + end;
      this.element.dispatchEvent(new Event('input'));
      return start + end;
    }

    setSelection(start: number, end?: number): void {
      if (end === undefined) end = start;
      this.element.focus();
      this.element.setSelectionRange(start, end);
    }

    private isEIconSelectorOpen(): boolean {
      const eIconSelector = this.$refs['eIconSelector'] as any;
      return eIconSelector?.dialog?.isShown === true;
    }

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
    }

    dismissColorSelector(): void {
      this.colorPopupVisible = false;
    }

    colorApply(btnColor: string): void {
      const button = this.getButtonByTag('color');

      this.applyButtonEffect(button, btnColor);

      this.colorPopupVisible = false;
    }

    dismissEIconSelector(): void {
      (this.$refs['eIconSelector'] as Modal).hide();
    }

    showEIconSelector(): void {
      (this.$refs['eIconSelector'] as Modal).show();
      setTimeout(() => (this.$refs['eIconSelector'] as any).setFocus(), 50);
    }

    onSelectEIcon(eiconId: string, shift: boolean): void {
      this.eiconApply(eiconId, shift);
    }

    eiconApply(eiconId: string, shift: boolean): void {
      const button = this.getButtonByTag('eicon');

      this.applyButtonEffect(button, undefined, eiconId);

      if (!shift) {
        this.dismissEIconSelector();
      }
    }

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
    }

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
    }

    onInput(): void {
      if (this.undoIndex > 0) {
        this.undoStack = this.undoStack.slice(this.undoIndex);
        this.undoIndex = 0;
      }
      this.$emit('input', this.text);
      this.lastInput = Date.now();
    }

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
    }

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
    }

    onKeyUp(e: KeyboardEvent): void {
      if (!e.shiftKey) this.isShiftPressed = false;
      this.$emit('keyup', e);
    }

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
    }

    onPaste(e: ClipboardEvent): void {
      const data = e.clipboardData!.getData('text/plain');
      if (!this.isShiftPressed && urlRegex.test(data)) {
        const selection = this.getSelection();
        if (selection.text.length === 0) {
          //This regex tests for [url= so you don't wind up pasting another pair of URL tags
          const match = /.*\[url=$/.exec(this.text.substring(0, selection.end));
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
    }

    focus(): void {
      this.element.focus();
    }

    previewBBCode(): void {
      this.doPreview();
    }

    protected doPreview(): void {
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
    }

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
</script>
<style lang="scss">
  .bbcode-editor.bbcode-editor-mattermost {
    display: flex;
    flex-direction: column;
    position: relative;

    &:focus {
      outline: none;
    }

    > .chat-info-text {
      margin-bottom: 4px;
      font-size: 0.875em;
      order: -2;
    }

    .bbcode-editor-container {
      order: 0;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--bs-border-color);
      border-radius: 4px;
      background-color: var(--input-bg, var(--bs-body-bg));
      transition:
        border-color 0.15s ease-in-out,
        box-shadow 0.15s ease-in-out;
      overflow: visible;

      &.focused {
        border-color: var(--bs-primary);
        box-shadow: 0 0 0 2px rgba(var(--bs-primary-rgb), 0.15);
      }
    }

    .bbcode-editor-text-area {
      position: relative;
      flex: 1;
      overflow: hidden;
      border-radius: 4px;

      textarea {
        width: 100%;
        border: none;
        background: transparent;
        padding: 10px 12px;
        min-height: 80px;
        max-height: 250px;
        resize: none;
        color: var(--input-color, var(--bs-body-color));
        font-size: inherit;

        &:focus {
          outline: none;
          box-shadow: none;
        }

        &::placeholder {
          color: var(--bs-secondary-color);
          opacity: 0.4;
        }
      }
    }

    .bbcode-editor-separator {
      height: 1px;
      background-color: var(--bs-border-color);
      margin: 0 8px;
    }

    .bbcode-toolbar-internal {
      display: flex;
      align-items: center;
      padding: 6px 8px;
      position: relative;
      min-height: 40px;
      container-type: inline-size;

      .toolbar-buttons-wrapper {
        display: flex;
        align-items: center;
        flex: 1;
        gap: 2px;
        overflow: hidden;
        min-width: 0;
      }

      > .toolbar-controls {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-left: 8px;
        flex-shrink: 0;

        .char-counter {
          font-size: 0.7rem;
          color: var(--bs-secondary-color);
          white-space: nowrap;
        }

        .send-ads-switcher {
          display: flex;
          gap: 1px;
          margin: 0;
          padding: 0;

          .nav-item {
            list-style: none;
          }

          .nav-link {
            padding: 2px 6px;
            font-size: 0.7rem;
            border-radius: 4px;
            color: var(--bs-secondary-color);
            background: transparent;
            transition:
              background-color 0.1s ease,
              color 0.1s ease;

            &:hover {
              background-color: var(--bs-tertiary-bg);
              color: var(--bs-body-color);
            }

            &.active {
              background-color: var(--bs-primary-bg-subtle);
              color: var(--bs-primary);
            }

            &.disabled {
              opacity: 0.5;
              pointer-events: none;
            }
          }
        }

        .toolbar-separator {
          width: 1px;
          height: 18px;
          background-color: var(--bs-border-color);
          margin: 0 2px;
        }

        .send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          padding: 0;
          font-size: 0.75rem;
          border-radius: 4px;
        }
      }

      @container (max-width: 350px) {
        > .toolbar-controls .char-counter {
          display: none;
        }
      }

      .character-btn {
        width: 26px;
        height: 26px;
        overflow: hidden;
        flex-shrink: 0;
        margin-right: 4px;

        a {
          width: 100%;
          height: 100%;
          display: block;

          img {
            width: 100%;
            height: 100%;
            border-radius: 3px;
          }
        }
      }

      .toolbar-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--bs-secondary-color);
        transition:
          background-color 0.1s ease,
          color 0.1s ease;
        flex-shrink: 0;

        &:hover {
          background-color: var(--bs-tertiary-bg);
          color: var(--bs-body-color);
        }

        &.active,
        &.toggled {
          background-color: var(--bs-primary-bg-subtle);
          color: var(--bs-primary);
        }

        i {
          font-size: 14px;
        }
      }

      .bbcode-editor-preview {
        margin-left: 4px;
      }

      .color-selector {
        max-width: 150px;
        left: 4.5em;
        bottom: 2.5em;
        line-height: 1;
        z-index: 1000;
        background-color: var(--bs-body-bg);
        position: absolute;
        border: 1px solid var(--bs-border-color);
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

        .popover-body {
          padding: 0;
        }

        .btn-group {
          display: block;
          margin: 10px 13px;
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

        .btn.text-color {
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

    .toolbar-overflow-menu {
      position: absolute;
      right: 8px;
      bottom: calc(100% + 4px);
      background-color: var(--bs-body-bg);
      border: 1px solid var(--bs-border-color);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      padding: 6px;
      display: flex;
      flex-wrap: wrap;
      gap: 2px;
      max-width: 180px;

      .toolbar-overflow-item {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        border-radius: 4px;
        cursor: pointer;
        color: var(--bs-secondary-color);
        transition:
          background-color 0.1s ease,
          color 0.1s ease;

        &:hover {
          background-color: var(--bs-tertiary-bg);
          color: var(--bs-body-color);
        }

        &.active,
        &.toggled {
          background-color: var(--bs-primary-bg-subtle);
          color: var(--bs-primary);
        }

        i {
          font-size: 14px;
        }
      }
    }

    .standalone-preview {
      position: absolute;
      top: 0;
      right: 0;
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

  .bbcode-editor.bbcode-editor-mattermost.toolbar-top {
    .bbcode-toolbar-internal .color-selector {
      bottom: auto;
      top: 2.5em;
    }

    .bbcode-toolbar-internal .toolbar-overflow-menu {
      bottom: auto;
      top: calc(100% + 4px);
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
