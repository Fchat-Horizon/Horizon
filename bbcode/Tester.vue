<template>
  <div>
    <textarea v-model="code"> </textarea>

    <bbcode :text="code"></bbcode>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue';

  import { BBCodeView } from './view';
  import { StandardBBCodeParser } from './standard';

  const standardParser = new StandardBBCodeParser();

  export default defineComponent({
    name: 'BBCodeTester',
    components: {
      bbcode: BBCodeView(standardParser)
    },
    setup() {
      const code = ref(
        '[center][heading][collapse=Testing Collapse][url=https://google.com/]This is a link [/url][/collapse][/heading][/center]'
      );

      return {
        code
      };
    }
  });
</script>

<style lang="scss"></style>
