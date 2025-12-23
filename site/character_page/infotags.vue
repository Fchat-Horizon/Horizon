<template>
  <div class="infotags row">
    <div
      class="infotag-group col-sm-6 col-lg-3"
      v-for="group in groups"
      :key="group.id"
      style="margin-top: 5px"
    >
      <div class="infotag-title">{{ group.name }}</div>
      <hr />
      <infotag
        :infotag="infotag"
        v-for="infotag in getInfotags(group.id)"
        :key="infotag.id"
        :characterMatch="characterMatch"
        :data="character.character.infotags[infotag.id]"
      ></infotag>
    </div>
  </div>
</template>

<script lang="ts">
  import { computed, defineComponent } from 'vue';
  import { Infotag, InfotagGroup } from '../../interfaces';
  import { Store } from './data_store';
  import InfotagView from './infotag.vue';
  import { MatchReport } from '../../learn/matcher';
  import { Character } from './interfaces';
  import l from '../../chat/localize';

  export default defineComponent({
    name: 'InfotagsView',
    components: { infotag: InfotagView },
    props: {
      character: {
        type: Object as () => Character,
        required: true
      },
      characterMatch: {
        type: Object as () => MatchReport,
        required: true
      }
    },
    setup(props) {
      const groups = computed(
        () => Store.shared.infotagGroups as {
          readonly [key: string]: Readonly<InfotagGroup>;
        }
      );

      const getInfotags = (group: number): Infotag[] =>
        Object.keys(Store.shared.infotags)
          .map(x => Store.shared.infotags[x])
          .filter(
            x =>
              x.infotag_group === group &&
              props.character.character.infotags[x.id] !== undefined
          );

      return {
        l,
        groups,
        getInfotags
      };
    }
  });
</script>
