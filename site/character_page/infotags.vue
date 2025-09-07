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
  import { Component, Prop } from '@f-list/vue-ts';
  import Vue from 'vue';
  import { Infotag, InfotagGroup } from '../../interfaces';
  import { Store } from './data_store';
  import InfotagView from './infotag.vue';
  import { MatchReport } from '../../learn/matcher';
  import { Character } from './interfaces';
  import l from '../../chat/localize';

  @Component({
    components: { infotag: InfotagView }
  })
  export default class InfotagsView extends Vue {
    l = l;
    @Prop({ required: true })
    readonly character!: Character;
    @Prop({ required: true })
    readonly characterMatch!: MatchReport;

    get groups(): { readonly [key: string]: Readonly<InfotagGroup> } {
      return Store.shared.infotagGroups;
    }

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
</script>
