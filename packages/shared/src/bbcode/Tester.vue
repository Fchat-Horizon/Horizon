<template>
  <div>
    <textarea v-model="code"> </textarea>

    <bbcode :text="code"></bbcode>
  </div>
</template>

<script lang="ts">
  import * as _ from 'lodash';
  import Vue from 'vue';

  import { BBCodeView } from './view';
  import { StandardBBCodeParser } from './standard';

  const standardParser = new StandardBBCodeParser();

  export default Vue.extend({
    components: {
      bbcode: BBCodeView(standardParser)
    },
    data() {
      return {
        code: '[center][heading][collapse=Testing Collapse][url=https://google.com/]This is a link [/url][/collapse][/heading][/center]'
      };
    }
  });
</script>

<style lang="scss"></style>
