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
        :infotag="item.infotag"
        v-for="item in getInfotags(group.id)"
        :key="item.infotag.id"
        :characterMatch="characterMatch"
        :data="item.data"
      ></infotag>
    </div>
  </div>
</template>

<script lang="ts">
  import Vue, { PropType } from 'vue';
  import { CharacterInfotag, Infotag, InfotagGroup } from '../../interfaces';
  import { Store } from './data_store';
  import InfotagView from './infotag.vue';
  import { MatchReport } from '../../learn/matcher';
  import { Character } from './interfaces';
  import l from '../../chat/localize';

  export default Vue.extend({
    components: { infotag: InfotagView },
    props: {
      character: { type: Object as PropType<Character>, required: true },
      characterMatch: { type: Object as PropType<MatchReport>, required: true }
    },
    data() {
      return {
        l: l
      };
    },
    computed: {
      groups(): { readonly [key: string]: Readonly<InfotagGroup> } {
        return Store.shared.infotagGroups;
      }
    },
    methods: {
      getInfotags(
        group: number
      ): { infotag: Infotag; data: CharacterInfotag }[] {
        return Object.keys(Store.shared.infotags)
          .map(x => Store.shared.infotags[x])
          .filter(
            x =>
              x.infotag_group === group &&
              this.character.character.infotags[x.id] !== undefined
          )
          .map(infotag => {
            const data = this.character.character.infotags[infotag.id];
            if (!data) return null;

            return { infotag, data };
          })
          .filter(
            (item): item is { infotag: Infotag; data: CharacterInfotag } =>
              item !== null
          );
      }
    }
  });
</script>
