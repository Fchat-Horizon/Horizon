<template>
  <div
    class="character-kink"
    :class="kinkClasses"
    :id="kink.key"
    @click="toggleSubkinks"
    @mouseover.stop="showTooltip = true"
    @mouseout.stop="showTooltip = false"
  >
    <span class="kink-name">{{ kink.name }}</span
    ><i
      v-show="kink.hasSubkinks"
      class="fa custom-kink-icon"
      style="float: right"
      :class="{ 'fa-minus': !listClosed, 'fa-plus': listClosed }"
    ></i>
    <i
      v-show="!kink.hasSubkinks && kink.isCustom"
      class="far custom-kink-icon"
    ></i>
    <span class="kink-custom-desc" v-if="kink.isCustom && expandedCustom">{{
      kink.description
    }}</span>
    <template v-if="kink.hasSubkinks">
      <div class="subkink-list" :class="{ closed: listClosed }">
        <kink
          v-for="subkink in kink.subkinks"
          :kink="subkink"
          :key="subkink.id"
          :comparisons="comparisons"
          :highlights="highlights"
        ></kink>
      </div>
    </template>
    <div
      class="popover popover-top"
      v-if="showTooltip && (!kink.isCustom || !expandedCustom)"
    >
      <div class="arrow" style="left: 10%"></div>
      <h5 class="popover-header">{{ kink.name }}</h5>
      <div class="popover-body">
        <p>
          {{
            kink.description.length > 0
              ? kink.description
              : l('profile.noDescription')
          }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
  import {
    defineComponent,
    ref,
    computed,
    watch,
    onMounted,
    type PropType
  } from 'vue';
  import anyAscii from 'any-ascii';
  import core from '@/chat/core';
  import type { DisplayKink } from './interfaces';
  import { kinkComparisonSwaps } from '@/learn/matcher-types';
  import l from '@/chat/localize';

  export default defineComponent({
    name: 'kink',
    props: {
      kink: {
        type: Object as PropType<DisplayKink>,
        required: true
      },
      highlights: {
        type: Object as PropType<{ [key: number]: boolean }>,
        required: true
      },
      comparisons: {
        type: Object as PropType<{ [key: number]: string | undefined }>,
        required: true
      },
      expandedCustom: {
        type: Boolean,
        default: false
      }
    },
    setup(props) {
      const listClosed = ref(true);
      const initialListClosedState = ref(true);
      const showTooltip = ref(false);

      watch(
        () => props.expandedCustom,
        newValue => {
          if (newValue) {
            initialListClosedState.value = listClosed.value;
            listClosed.value = false;
          } else {
            listClosed.value = initialListClosedState.value;
          }
        }
      );

      onMounted(() => {
        if (
          props.kink.isCustom &&
          core.state.generalSettings &&
          core.state.generalSettings.horizonForceAsciiProfiles
        ) {
          props.kink.description = anyAscii(props.kink.description);
          props.kink.name = anyAscii(props.kink.name);
        }
      });

      const toggleSubkinks = () => {
        if (!props.kink.hasSubkinks) return;

        listClosed.value = !listClosed.value;
        initialListClosedState.value = listClosed.value;
      };

      const kinkClasses = computed(() => {
        const classes: { [key: string]: boolean } = {
          'stock-kink': !props.kink.isCustom,
          'custom-kink': props.kink.isCustom,
          highlighted: !props.kink.isCustom && props.highlights[props.kink.id],
          subkink: props.kink.hasSubkinks,
          'expanded-custom-kink': props.expandedCustom
        };
        classes[`kink-id-${props.kink.key}`] = true;
        classes[`kink-group-${props.kink.group}`] = true;

        const theirKinkId =
          props.kink.id in kinkComparisonSwaps
            ? kinkComparisonSwaps[props.kink.id]
            : props.kink.id;

        if (
          !props.kink.isCustom &&
          typeof props.comparisons[theirKinkId] !== 'undefined'
        ) {
          classes['comparison-result'] = true;
          classes[`comparison-${props.comparisons[theirKinkId]}`] = true;
        }

        return classes;
      });

      const customId = computed(() => {
        return props.kink.isCustom ? props.kink.id : undefined;
      });

      return {
        listClosed,
        showTooltip,
        toggleSubkinks,
        kinkClasses,
        customId,
        l
      };
    }
  });
</script>
