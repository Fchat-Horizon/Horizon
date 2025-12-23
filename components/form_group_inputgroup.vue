<template>
  <div class="mb-3">
    <label v-if="label && id" :for="id">{{ label }}</label>
    <div class="input-group">
      <slot :cls="{ 'is-invalid': hasErrors, 'is-valid': valid }"></slot>
      <slot name="button"></slot>
      <small v-if="helptext" class="form-text" :id="helpId">{{
        helptext
      }}</small>
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
  import { computed, defineComponent, PropType } from 'vue';

  export default defineComponent({
    name: 'FormGroupInputgroup',
    props: {
      field: {
        type: String,
        required: true
      },
      errors: {
        type: Object as PropType<
          Record<string, ReadonlyArray<string> | undefined>
        >,
        required: true
      },
      label: {
        type: String,
        required: false
      },
      id: {
        type: String,
        required: false
      },
      valid: {
        type: Boolean,
        default: false
      },
      helptext: {
        type: String,
        required: false
      }
    },
    setup(props) {
      const hasErrors = computed(
        () => typeof props.errors[props.field] !== 'undefined'
      );

      const errorList = computed<ReadonlyArray<string>>(
        () => props.errors[props.field] || [] //tslint:disable-line:strict-boolean-expressions
      );

      const helpId = computed(() =>
        props.id !== undefined ? `${props.id}Help` : undefined
      );

      return {
        hasErrors,
        errorList,
        helpId
      };
    }
  });
</script>
