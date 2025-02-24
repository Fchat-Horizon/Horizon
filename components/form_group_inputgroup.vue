<template>
  <div class="form-group">
    <label v-if="label && id" :for="id">{{ label }}</label>
    <div class="input-group">
      <slot :cls="{ 'is-invalid': hasErrors, 'is-valid': valid }"></slot>
      <slot name="button"></slot>
      <small v-if="helptext" class="form-text" :id="helpId">{{ helptext }}</small>
      <div v-if="hasErrors" class="invalid-feedback">
        <ul v-if="errorList.length > 1">
          <li v-for="error in errorList">{{ error }}</li>
        </ul>
        <template v-if="errorList.length === 1"> {{ errorList[0] }}</template>
      </div>
      <slot v-if="valid" name="valid"></slot>
    </div>
  </div>
</template>

<script lang="ts">
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';

  @Component
  export default class FormGroupInputgroup extends Vue {
    @Prop({ required: true })
    readonly field!: string;
    @Prop({ required: true })
    readonly errors!: { [key: string]: ReadonlyArray<string> | undefined };
    @Prop
    readonly label?: string;
    @Prop
    readonly id?: string;
    @Prop({ default: false })
    readonly valid!: boolean;
    @Prop
    readonly helptext?: string;

    get hasErrors(): boolean {
      return typeof this.errors[this.field] !== 'undefined';
    }

    get errorList(): ReadonlyArray<string> {
      return this.errors[this.field] || []; //tslint:disable-line:strict-boolean-expressions
    }

    get helpId(): string | undefined {
      return this.id !== undefined ? `${this.id}Help` : undefined;
    }
  }
</script>
