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
  import Vue from 'vue';
  import { Infotag, InfotagGroup } from '../../interfaces';
  import { Store } from './data_store';
  import InfotagView from './infotag.vue';
  import { MatchReport } from '../../learn/matcher';
  import { Character } from './interfaces';
  import l from '../../chat/localize';

  export default Vue.extend({
    components: { infotag: InfotagView },
    props: {
      character: { required: true as const },
      characterMatch: { required: true as const }
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
      getInfotags(group: number): Infotag[] {
        return Object.keys(Store.shared.infotags)
          .map(x => Store.shared.infotags[x])
          .filter(
            x =>
              x.infotag_group === group &&
              this.character.character.infotags[x.id] !== undefined
          );
      }
    }
  });
</script>
