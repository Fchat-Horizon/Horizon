<template>
  <div class="mb-3">
    <label v-if="label && id" :for="id">{{ label }}</label>
    <slot
      :cls="{ 'is-invalid': hasErrors, 'is-valid': valid }"
      :invalid="hasErrors"
      :valid="valid"
    ></slot>
    <small v-if="helptext" class="form-text" :id="helpId">{{ helptext }}</small>
    <div v-if="hasErrors" class="invalid-feedback">
      <ul v-if="errorList.length > 1">
        <li v-for="error in errorList">{{ error }}</li>
      </ul>
      <template v-if="errorList.length === 1"> {{ errorList[0] }}</template>
    </div>
    <slot v-if="valid" name="valid"></slot>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';

  export default Vue.extend({
    props: {
      field: { required: true as const },
      errors: { required: true as const },
      label: {},
      id: {},
      valid: { default: false },
      helptext: {}
    },
    computed: {
      hasErrors(): boolean {
        return typeof this.errors[this.field] !== 'undefined';
      },
      errorList(): ReadonlyArray<string> {
        return this.errors[this.field] || []; //tslint:disable-line:strict-boolean-expressions
      },
      helpId(): string | undefined {
        return this.id !== undefined ? `${this.id}Help` : undefined;
      }
    }
  });
</script>
