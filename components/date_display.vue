<template>
  <span class="localizable-date" :title="secondary">{{ primary }}</span>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue';
  import { formatDistanceToNow, format } from 'date-fns';
  import core from '../chat/core';

  interface Props {
    time?: string | number | null;
  }

  const props = withDefaults(defineProps<Props>(), { time: 0 });

  const primary = ref<string>();
  const secondary = ref<string>();

  const update = () => {
    if (!props.time) return;

    const date = isNaN(+props.time)
      ? new Date(`${props.time}+00:00`)
      : new Date(+props.time * 1000);

    const use12 = core?.state?.generalSettings?.use12HourTime || false;
    const timeFormat = use12 ? 'yyyy-MM-dd hh:mm a' : 'yyyy-MM-dd HH:mm';
    const absolute = format(date, timeFormat);
    const relative = formatDistanceToNow(date, { addSuffix: true });
    const fuzzy = core.state.generalSettings?.fuzzyDates ?? true;

    if (fuzzy) {
      primary.value = relative;
      secondary.value = absolute;
    } else {
      primary.value = absolute;
      secondary.value = relative;
    }
  };

  onMounted(update);
  watch(() => props.time, update);
</script>
