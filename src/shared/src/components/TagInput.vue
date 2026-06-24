<template>
  <div
    class="vue-input-tag-wrapper"
    :class="{ 'read-only': disabled }"
    @click="focusInput"
  >
    <span v-for="(tag, i) in modelValue" :key="i" class="input-tag">
      <span class="tag-text">{{ tag }}</span>
      <a
        v-if="!disabled"
        href="#"
        class="remove"
        @click.prevent.stop="removeTag(i)"
        >&times;</a
      >
    </span>
    <input
      ref="input"
      :id="id"
      v-model="newTag"
      class="new-tag"
      :placeholder="placeholder"
      :disabled="disabled"
      @keydown="onKeydown"
      @blur="onBlur"
    />
  </div>
</template>

<script lang="ts">
  import { defineComponent, type PropType } from 'vue';

  export default defineComponent({
    name: 'TagInput',
    props: {
      modelValue: { type: Array as PropType<string[]>, default: () => [] },
      placeholder: { type: String, default: '' },
      disabled: { type: Boolean, default: false },
      id: { type: String, default: undefined },
      addTagOnKeys: {
        type: Array as PropType<string[]>,
        default: () => ['Enter']
      },
      addTagOnBlur: { type: Boolean, default: false }
    },
    emits: ['update:modelValue'],
    data() {
      return { newTag: '' };
    },
    methods: {
      focusInput(): void {
        (this.$refs.input as HTMLInputElement | undefined)?.focus();
      },
      addTag(): void {
        const value = this.newTag.trim();
        this.newTag = '';
        if (value.length === 0 || this.modelValue.indexOf(value) !== -1) return;
        this.$emit('update:modelValue', [...this.modelValue, value]);
      },
      removeTag(index: number): void {
        const next = this.modelValue.slice();
        next.splice(index, 1);
        this.$emit('update:modelValue', next);
      },
      onKeydown(e: KeyboardEvent): void {
        if (this.addTagOnKeys.indexOf(e.key) !== -1) {
          e.preventDefault();
          this.addTag();
        } else if (
          // backspace on empty field removes the last tag
          e.key === 'Backspace' &&
          this.newTag.length === 0 &&
          this.modelValue.length > 0
        ) {
          this.removeTag(this.modelValue.length - 1);
        }
      },
      onBlur(): void {
        if (this.addTagOnBlur) this.addTag();
      }
    }
  });
</script>
