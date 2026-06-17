<template>
  <div :class="tagClasses">
    <span class="infotag-label">{{ infotag.name }}: </span>
    <span
      v-if="infotag.infotag_group !== contactGroupId"
      class="infotag-value"
      >{{ value }}</span
    >
    <span v-else class="infotag-value"
      ><a :href="contactLink">{{ contactValue }}</a></span
    >
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import anyAscii from 'any-ascii';
  import core from '@/chat/core';
  import { CharacterInfotag, Infotag, ListItem } from '@/interfaces';
  import { formatContactLink, formatContactValue } from './contact_utils';
  import { Store } from './data_store';
  import { CONTACT_GROUP_ID } from './interfaces';
  import { MatchReport } from '@/learn/matcher';
  import { CssClassMap } from './match-report.vue';
  import { TagId } from '@/learn/matcher-types';

  const props = defineProps<{
    infotag: Infotag;
    data: CharacterInfotag;
    characterMatch: MatchReport;
  }>();

  const contactGroupId = CONTACT_GROUP_ID;

  const theirInterestIsRelevant = (id: number): boolean => {
    return (
      id === TagId.FurryPreference ||
      id === TagId.SubDomRole ||
      id === TagId.Position ||
      id === TagId.PostLength
    );
  };

  const yourInterestIsRelevant = (id: number): boolean => {
    return (
      id === TagId.Gender ||
      id === TagId.Age ||
      id === TagId.Species ||
      id === TagId.BodyType
    );
  };

  const tagClasses = computed((): CssClassMap => {
    const styles: CssClassMap = {
      infotag: true
    };

    // // console.log(`Infotag ${props.infotag.id}: ${props.infotag.name}`, core.state.settings.risingAdScore, props.characterMatch);
    const id = parseInt(props.infotag.id as any, 10);

    if (
      core.state.settings.risingAdScore &&
      props.characterMatch &&
      // We don't get passed a reference to the character this tag is for,
      // so we just check if the MatchReport involves a match where both characters are the same.
      // It's good that we don't use the is_self field from the API here, because we still might
      // want to test matches with our own characters.
      props.characterMatch.them.them.id != props.characterMatch.them.you.id
    ) {
      const scores = theirInterestIsRelevant(id)
        ? props.characterMatch.them.scores
        : yourInterestIsRelevant(id)
          ? props.characterMatch.you.scores
          : null;

      if (scores) {
        const score = scores[id];

        styles[score.getRecommendedClass()] = true;
        styles['match-score'] = true;
      }
    }

    return styles;
  });

  const contactLink = computed((): string | undefined => {
    return formatContactLink(props.infotag, props.data.string!);
  });

  const contactValue = computed((): string => {
    return formatContactValue(props.infotag, props.data.string!);
  });

  const value = computed((): string => {
    let shouldFormatAscii =
      props.infotag.infotag_group !== contactGroupId &&
      core.state.generalSettings &&
      core.state.generalSettings.horizonForceAsciiProfiles;
    switch (props.infotag.type) {
      case 'text':
        return shouldFormatAscii
          ? anyAscii(props.data.string!)
          : props.data.string!;
      case 'number':
        if (props.infotag.allow_legacy && !props.data.number) {
          //Prettier makes this an unreadable mess, so lets just describe it:
          //First check if we have a proper strng value for this legacy field.
          //If we don't, we return an empty string
          //Otherwise we then check if we shouldd format to ASCII, in which case
          //we do that before returning.
          return props.data.string !== undefined
            ? shouldFormatAscii
              ? anyAscii(props.data.string)
              : props.data.string
            : '';
        }
        return props.data.number!.toPrecision();
    }
    const listitem = <ListItem | undefined>(
      Store.shared.listItems[props.data.list!]
    );
    if (typeof listitem === 'undefined') return '';
    return listitem.value;
  });
</script>
