<template>
  <div class="d-flex w-100 my-2 justify-content-between">
    <div>
      <slot name="previous" v-if="!routed">
        <a
          class="btn btn-secondary"
          :class="{ disabled: !prev }"
          role="button"
          @click.prevent="previousPage()"
        >
          <span aria-hidden="true">&larr;</span> {{ prevLabel }}
        </a>
      </slot>
      <router-link
        v-else
        :to="prevRoute"
        class="btn btn-secondary"
        :class="{ disabled: !prev }"
        role="button"
      >
        <span aria-hidden="true">&larr;</span> {{ prevLabel }}
      </router-link>
    </div>
    <div>
      <slot name="next" v-if="!routed">
        <a
          class="btn btn-secondary"
          :class="{ disabled: !next }"
          role="button"
          @click.prevent="nextPage()"
        >
          {{ nextLabel }} <span aria-hidden="true">&rarr;</span>
        </a>
      </slot>
      <router-link
        v-else
        :to="nextRoute"
        class="btn btn-secondary"
        :class="{ disabled: !next }"
        role="button"
      >
        {{ nextLabel }} <span aria-hidden="true">&rarr;</span>
      </router-link>
    </div>
  </div>
</template>

<script lang="ts">
  import cloneDeep = require('lodash/cloneDeep'); //tslint:disable-line:no-require-imports
  import Vue from 'vue';
  import l from '../chat/localize';

  type ParamDictionary = { [key: string]: number | undefined };
  interface RouteParams {
    name?: string;
    params?: ParamDictionary;
  }

  export default Vue.extend({
    props: {
      nextLabel: { default: () => l('pager.nextPage') },
      prevLabel: { default: () => l('pager.previousPage') },
      next: { required: true as const },
      prev: { required: true as const },
      routed: { default: false },
      route: {
        default(this: Vue & { $route: RouteParams }): RouteParams {
          return this.$route;
        }
      },
      paramName: { default: 'page' }
    },
    data() {
      return {
        l: l
      };
    },
    computed: {
      prevRoute(): RouteParams {
        if (
          this.route.params !== undefined &&
          this.route.params[this.paramName] !== undefined
        ) {
          const newPage = this.route.params[this.paramName]! - 1;
          const clone = cloneDeep(this.route) as RouteParams;
          clone.params![this.paramName] = newPage;
          return clone;
        }
        return {};
      },
      nextRoute(): RouteParams {
        if (
          this.route.params !== undefined &&
          this.route.params[this.paramName] !== undefined
        ) {
          const newPage = this.route.params[this.paramName]! + 1;
          const clone = cloneDeep(this.route) as RouteParams;
          clone.params![this.paramName] = newPage;
          return clone;
        }
        return {};
      }
    },
    methods: {
      nextPage(): void {
        if (!this.next) return;
        this.$emit('next');
      },
      previousPage(): void {
        if (!this.prev) return;
        this.$emit('prev');
      }
    }
  });
</script>
