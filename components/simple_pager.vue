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
  import {
    computed,
    defineComponent,
    getCurrentInstance,
    PropType
  } from 'vue';
  import cloneDeep = require('lodash/cloneDeep'); //tslint:disable-line:no-require-imports
  import l from '../chat/localize';

  type ParamDictionary = { [key: string]: number | undefined };
  interface RouteParams {
    name?: string;
    params?: ParamDictionary;
  }

  export default defineComponent({
    name: 'SimplePager',
    props: {
      nextLabel: {
        type: String,
        default: () => l('pager.nextPage')
      },
      prevLabel: {
        type: String,
        default: () => l('pager.previousPage')
      },
      next: {
        type: Boolean,
        required: true
      },
      prev: {
        type: Boolean,
        required: true
      },
      routed: {
        type: Boolean,
        default: false
      },
      route: {
        type: Object as PropType<RouteParams>,
        required: false
      },
      paramName: {
        type: String,
        default: 'page'
      }
    },
    emits: ['next', 'prev'],
    setup(props, { emit }) {
      const instance = getCurrentInstance();
      const currentRoute = computed<RouteParams>(() => {
        if (props.route) return props.route;
        return (instance?.proxy as any)?.$route ?? {};
      });

      const nextPage = () => {
        if (!props.next) return;
        emit('next');
      };

      const previousPage = () => {
        if (!props.prev) return;
        emit('prev');
      };

      const prevRoute = computed<RouteParams>(() => {
        const route = currentRoute.value;
        if (
          route.params !== undefined &&
          route.params[props.paramName] !== undefined
        ) {
          const newPage = route.params[props.paramName]! - 1;
          const clone = cloneDeep(route) as RouteParams;
          clone.params![props.paramName] = newPage;
          return clone;
        }
        return {};
      });

      const nextRoute = computed<RouteParams>(() => {
        const route = currentRoute.value;
        if (
          route.params !== undefined &&
          route.params[props.paramName] !== undefined
        ) {
          const newPage = route.params[props.paramName]! + 1;
          const clone = cloneDeep(route) as RouteParams;
          clone.params![props.paramName] = newPage;
          return clone;
        }
        return {};
      });

      return {
        nextPage,
        previousPage,
        prevRoute,
        nextRoute
      };
    }
  });
</script>
