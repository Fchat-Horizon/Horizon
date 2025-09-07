<template>
  <modal
    ref="dialog"
    :action="l('searchHistory.title')"
    :buttonText="l('action.select')"
    @open="onMounted()"
    @submit="selectStatus"
    dialogClass="w-100 modal-70"
  >
    <form class="search-history" v-if="history.length > 0">
      <div
        class="row"
        v-for="(search, index) in history"
        :class="{ 'selected-row': index === selectedSearch }"
      >
        <div class="form-col radio-col">
          <input
            type="radio"
            :id="'search_history_' + index"
            :name="'search_history_' + index"
            v-model="selectedSearch"
            v-bind:value="index"
          />
        </div>
        <div
          class="form-col content-col"
          @click="select(index)"
          @dblclick="submit"
        >
          <span class="before-content"
            ><i
              class="fas"
              :class="{ 'fa-check-circle': index === selectedSearch }"
          /></span>
          <label class="form-check-label" :for="'search_history_' + index">
            {{ describeSearch(search) }}
          </label>
          <span class="content-action" @click="removeSearchHistoryEntry(index)"
            ><i class="fas fa-times-circle"
          /></span>
        </div>
      </div>
    </form>
    <div v-else>
      <i>{{ l('searchHistory.empty') }}</i>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  import Modal from '../components/Modal.vue';
  import Dropdown from '../components/Dropdown.vue';
  import CustomDialog from '../components/custom_dialog';
  import core from './core';
  import { BBCodeView } from '../bbcode/view';
  import * as _ from 'lodash';
  import { ExtendedSearchData, SearchData } from './interfaces';
  import l from './localize';

  @Component({
    components: {
      modal: Modal,
      dropdown: Dropdown,
      bbcode: BBCodeView(core.bbCodeParser)
    }
  })
  export default class CharacterSearchHistory extends CustomDialog {
    l = l;
    @Prop({ required: true })
    readonly callback!: (searchData: ExtendedSearchData) => void;

    @Prop({ required: true })
    readonly curSearch!: ExtendedSearchData | undefined;

    history: (ExtendedSearchData | SearchData)[] = [];

    selectedSearch: number | null = null;

    @Hook('mounted')
    async onMounted(): Promise<void> {
      this.history = (await core.settingsStore.get('searchHistory')) || [];
      this.selectedSearch = null;

      if (this.curSearch) {
        const cleanedSearch = JSON.stringify(this.curSearch, null, 0);

        const index = _.findIndex(
          this.history,
          c => JSON.stringify(c, null, 0) === cleanedSearch
        );

        if (index >= 0) {
          this.selectedSearch = index;
        }
      }
    }

    selectStatus(): void {
      if (this.selectedSearch !== null) {
        this.callback(
          _.merge(
            { species: [], bodytypes: [] },
            this.history[this.selectedSearch]
          ) as ExtendedSearchData
        );
      }
    }

    submit(e: Event): void {
      (<Modal>this.$refs.dialog).submit(e);
    }

    describeSearch(searchData: SearchData | ExtendedSearchData): string {
      return _.join(
        _.map(
          // tslint:disable-next-line no-unsafe-any no-any
          _.flatten(_.map(searchData as any)),
          // tslint:disable-next-line no-unsafe-any no-any
          v => _.get(v, 'name', v)
        ),
        ', '
      );
    }

    async removeSearchHistoryEntry(index: number): Promise<void> {
      this.history.splice(index, 1);

      await core.settingsStore.set('searchHistory', this.history);
    }

    select(index: number): void {
      this.selectedSearch = index;
    }
  }
</script>

<style lang="scss">
  .search-history {
    .radio-col {
      display: none;
    }

    label::before {
      display: none !important;
    }

    .content-col {
      min-width: 100%;
      display: flex;

      label {
        flex: 1;
      }

      .before-content {
        width: 1.3rem;
        margin-bottom: auto;
        margin-top: auto;
      }

      .content-action {
        float: right;
        opacity: 0.2;
        margin-bottom: auto;
        margin-top: auto;
        margin-left: 1rem;

        &:hover {
          opacity: 0.8;
        }
      }
    }

    .row {
      margin-bottom: 10px;
      padding: 3px;

      border: 1px solid rgba(0, 0, 0, 0);
      border-radius: 2px;
    }

    .row:hover {
      // background-color: #20203e;
      // border: 1px solid #2d2d6b;
      backdrop-filter: invert(30%);

      border-radius: 2px;
    }

    .selected-row,
    .row.selected-row:hover {
      /*background-color: #343461;*/
      /*border: 1px solid #6565b2;*/

      backdrop-filter: invert(20%);

      border-radius: 2px;
    }
  }
</style>
