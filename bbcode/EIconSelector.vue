<template>
  <modal
    action="Select EIcon"
    ref="dialog"
    :buttons="false"
    @close="close"
    dialogClass="eicon-selector big"
  >
    <div class="eicon-selector-ui">
      <div
        v-if="!storeLoaded || refreshing"
        class="d-flex align-items-center loading"
      >
        <strong>Loading...</strong>
        <div
          class="spinner-border ml-auto"
          role="status"
          aria-hidden="true"
        ></div>
      </div>
      <div v-else>
        <div>
          <div class="search-bar">
            <input
              type="text"
              class="form-control search"
              id="search"
              v-model="search"
              ref="search"
              placeholder="Search eicons..."
              @input="searchUpdateDebounce()"
              tabindex="0"
              @click.prevent.stop="setFocus()"
              @mousedown.prevent.stop
              @mouseup.prevent.stop
            />
            <div class="btn-group search-buttons">
              <div
                class="btn expressions"
                @click.prevent.stop="searchWithString('category:favorites')"
                title="Favorites"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-thumbtack"></i>
              </div>

              <div
                class="btn expressions"
                @click.prevent.stop="searchWithString('category:expressions')"
                title="Expressions"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-theater-masks"></i>
              </div>

              <div
                class="btn sexual"
                @click.prevent.stop="searchWithString('category:sexual')"
                title="Sexual"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-heart"></i>
              </div>

              <div
                class="btn bubbles"
                @click.prevent.stop="searchWithString('category:bubbles')"
                title="Speech bubbles"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-comment"></i>
              </div>

              <div
                class="btn actions"
                @click.prevent.stop="searchWithString('category:symbols')"
                title="Symbols"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-icons"></i>
              </div>

              <div
                class="btn memes"
                @click.prevent.stop="searchWithString('category:memes')"
                title="Memes"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-poo"></i>
              </div>

              <div
                class="btn random"
                @click.prevent.stop="searchWithString('category:random')"
                title="Random"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-random"></i>
              </div>

              <div
                class="btn refresh"
                @click.prevent.stop="refreshIcons()"
                title="Refresh eicons data"
                role="button"
                tabindex="0"
              >
                <i class="fas fa-sync"></i>
              </div>
            </div>
          </div>

          <div class="courtesy">
            Courtesy of <a href="https://xariah.net/eicons">xariah.net</a>
          </div>

          <div class="upload">
            <a href="https://www.f-list.net/icons.php">Upload eicons</a>
          </div>
        </div>

        <div class="carousel slide w-100 results">
          <div class="carousel-inner w-100" role="listbox">
            <div
              class="carousel-item"
              v-for="eicon in results"
              role="img"
              :aria-label="eicon"
              tabindex="0"
            >
              <img
                class="eicon"
                :alt="eicon"
                :src="
                  'https://static.f-list.net/images/eicon/' + eicon + '.gif'
                "
                :title="eicon"
                role="button"
                :aria-label="eicon"
                @click.prevent.stop="selectIcon(eicon, $event)"
              />

              <div
                class="btn favorite-toggle"
                :class="{ favorited: isFavorite(eicon) }"
                @click.prevent.stop="toggleFavorite(eicon)"
                role="button"
                :aria-label="
                  isFavorite(eicon)
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                "
              >
                <i class="fas fa-thumbtack"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook, Prop } from '@f-list/vue-ts';
  // import Vue from 'vue';
  import { EIconStore } from '../learn/eicon/store';
  import core from '../chat/core';
  import modal from '../components/Modal.vue';
  import CustomDialog from '../components/custom_dialog';

  function debounce<T>(
    func: (this: T, ...args: any) => void,
    wait: number = 330
  ): () => void {
    let timer: ReturnType<typeof setTimeout>;
    return function (this: T, ...args: any) {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func.apply(this, args);
      }, wait);
    };
  }

  let store: EIconStore | undefined;

  @Component({
    components: { modal }
  })
  export default class EIconSelector extends CustomDialog {
    @Prop
    readonly onSelect?: (eicon: string, shift: boolean) => void;

    storeLoaded: boolean = false;

    results: string[] = [];

    search: string = '';

    refreshing = false;

    searchUpdateDebounce = debounce(() => this.runSearch(), 350);

    @Hook('mounted')
    async mounted(): Promise<void> {
      store = await EIconStore.getSharedStore();
      this.storeLoaded = true;

      this.searchWithString('category:favorites');
    }

    searchWithString(s: string) {
      this.search = s;
      this.runSearch();
    }

    runSearch() {
      const s = this.search.toLowerCase().trim();

      if (s.startsWith('category:')) {
        const category = s.substring(9).trim();

        if (category === 'random') {
          this.results = store?.nextPage() || [];
        } else {
          this.results = this.getCategoryResults(category);
        }
      } else {
        if (s.length === 0) {
          this.results = store?.nextPage() || [];
        } else {
          this.results = store?.search(s).slice(0, 301) || [];
        }
      }
    }

    getCategoryResults(category: string): string[] {
      switch (category) {
        case 'expressions':
          return [
            'coolemoji',
            'coughing emoji',
            'flushedemoji',
            'eyerollemoji',
            'cryinglaughing',
            'grinning emoji',
            'party emoji',
            'pensiveemoji',
            'lipbite emoji',
            'nauseous emoji',
            'angryemoji',
            'love2',
            'clapemoji',
            'heart eyes',
            'kissing heart',
            'cowemoji',
            'eggplantemoji',
            'peachemoji',
            'melting emoji',
            'poopy',
            'thinkingemoji',
            'triumphemoji',
            'uwuemoji',
            'voremoji',
            'skullemoji',
            'smugemoji',
            'heartflooshed',
            'blushpanic',
            'fluttersorry',
            'snake emoji',
            'horseeyes',
            'thehorse',
            'catblob',
            'catblobangery',
            'splashemoji',
            'tonguemoji',
            'blobhugs',
            'lickscreen',
            'eyes emoji',
            'nerdmeme',
            'horsepls',
            'e62pog',
            'thirstytwi',
            'bangfingerbang',
            'chefs kiss',
            'excuse me',
            'psychopath',
            'ashemote3',
            'whentheohitsright',
            'caradrinkreact',
            'lip_bite',
            'twittersob',
            'confused01',
            'blushiedash',
            'brogstare',
            'brucegrin',
            'onefortheteam',
            'ellesogood',
            'speaknoevil'
          ];

        case 'symbols':
          return [
            'loveslove',
            'pimpdcash',
            'pls stop',
            'paw2',
            'gender-female',
            'gender-male',
            'gendershemale',
            'gender-cuntboy',
            'gender-mherm',
            'gender-transgender',
            'usflag',
            'europeflag',
            'lgbt',
            'transflag',
            'sunnyuhsuperlove',
            'discovered',
            'goldcoin1',
            'star',
            'full moon',
            'sunshine',
            'pinetree',
            'carrots1',
            'smashletter',
            'ghostbuster',
            'cuckquean',
            'goldendicegmgolddicegif',
            'pentagramo',
            'sexsymbol',
            'idnd1',
            'instagram',
            'twitterlogo',
            'snapchaticon',
            'tiktok',
            'twitchlogo',
            'discord',
            'uber',
            'google',
            'nvidia',
            'playstation',
            'suitclubs',
            'suitdiamonds',
            'suithearts',
            'suitspades',
            'chainscuffs',
            'num-1',
            'num-2',
            'num-3',
            'num-4',
            'num-5',
            'num-6',
            'seven',
            'eight',
            '9ball',
            'discordeye',
            'streamlive',
            'check mark',
            'x mark',
            'question mark',
            'lubimark',
            'questget',
            'music',
            'cam',
            'speaker emoji',
            'laptop',
            'naughtyfood',
            'open2',
            'dont look away',
            'milkcartonreal'
          ];

        case 'bubbles':
          return [
            'takemetohornyjail',
            'notcashmoney',
            'lickme',
            'iacs',
            'imahugeslut',
            'fuckyouasshole',
            'bubblecute',
            'pat my head',
            'chorse',
            'knotslutbubble',
            'toofuckinghot',
            'pbmr',
            'imabimbo',
            'dicefuck',
            'ciaig',
            'horseslut',
            'fatdick',
            'tomboypussy',
            'breakthesubs',
            'fuckingnya',
            'iltclion',
            'suckfuckobey',
            'shemale',
            'breedmaster',
            'imastepfordwife',
            'ahegaoalert2',
            'buttslutbb',
            'notgayoranything',
            'onlyfans',
            'horsecockneed',
            'crimes',
            'breed143',
            'nagagross',
            'willrim',
            'muskslut',
            '4lewdbubble',
            'shimathatlewd',
            'hypnosiss',
            'imahypnoslut',
            'sheepsass2',
            'imahugeslut',
            'notahealslut',
            'ratedmilf',
            'ratedstud',
            'ratedslut',
            '5lewdbubble',
            'xarcuminme',
            'xarcumonme',
            'choke me',
            'iamgoingtopunchyou',
            'snapmychoker',
            'rude1',
            'fuckbun',
            'iamindanger',
            'elves',
            'helpicantstopsuckingcocks',
            'talkpooltoy',
            'thatskindahot',
            'ygod',
            'simpbait',
            'eyesuphere',
            'fuckpiggy',
            'peggable2',
            'sydeanothere',
            'nothingcan',
            'pawslut',
            'corpsestare-',
            'dinnersex',
            'plappening',
            'fallout-standby',
            'inbagg',
            'request denied',
            'goodboy0',
            'goodending',
            'milky2',
            'howbadcanibe',
            'gwanna',
            'spitinmouth',
            'bathwater'
          ];

        case 'sexual':
          return [
            'kissspink',
            'paytonkiss',
            'coralbutt4',
            'capstrip',
            'pinkundress',
            'collaredpet',
            'jhab1',
            'caninelover',
            'pole',
            'rorobutt2',
            'fingerlick',
            'lapgrind',
            'jackthighs',
            'a condom',
            'wolf abs',
            'musclefuck2',
            'verobutt3',
            'realahegao4',
            'influencerhater',
            'gagged2',
            'ballsack3',
            'fingerblast3',
            'sloppy01',
            'sybian',
            'floppyhorsecock',
            'blackshem1',
            'fingersucc',
            'vullylick',
            'fingersucc',
            'cmontakeit',
            'jessi flash',
            'poju-butt',
            'cheegrope2',
            'patr1',
            'ahega01 2',
            'handjob1nuke',
            'harmanfingers',
            '2buttw1',
            'dropsqueeze',
            'lixlove',
            'bbctitjob6',
            'appreciativetease',
            'bimbowhisper',
            'subj3',
            'salivashare',
            'ballsworship3',
            'wolfsknot2',
            'gaykiss',
            'slurpkiss',
            'absbulge',
            'cockiss',
            'horsedick11',
            'knotknotknot',
            'g4ebulge',
            'blackadamrough',
            'knotdog',
            'flaunt',
            'cummiefj',
            'lovetosuck',
            'worship',
            'hopelessly in love',
            'cockloveeee',
            'donglove',
            'knotjob2',
            'cummz',
            'every drop',
            'edgyoops',
            'orccummies2',
            'oralcreampie100px',
            'horseoral9a',
            'swallowit',
            'realahegao4',
            'gayicon2',
            'slut4',
            'hossspurties2',
            'cumringgag',
            'jillbimbogiffell2'
          ];

        case 'memes':
          return [
            'guncock',
            'michaelguns',
            'watchbadass',
            'gonnabang',
            'flirting101',
            'loudnoises',
            'nyancat',
            'gayb',
            'fortasshole',
            'dickletsign',
            'hotdogface',
            'siren0',
            'apologize to god',
            'jabbalick',
            'zeldawink',
            'whatislove',
            'surprisemothafucka',
            'females',
            'thanksihateit',
            'hell is this',
            'confused travolta',
            'no words',
            'coffindance',
            'homelander',
            'thatsapenis',
            'pennyhee',
            'kermitbusiness',
            'goodbye',
            'rickle',
            'shiamagic',
            'oag'
          ];

        case 'favorites':
          return Object.keys(core.state.favoriteEIcons);
      }

      return [];
    }

    selectIcon(eicon: string, event: MouseEvent): void {
      const shift = event.shiftKey;

      if (this.onSelect) {
        this.onSelect(eicon, shift);
      }
    }

    async refreshIcons(): Promise<void> {
      this.refreshing = true;

      await store?.checkForUpdates();
      this.runSearch();

      this.refreshing = false;
    }

    setFocus(): void {
      (this.$refs['search'] as any).focus();
      (this.$refs['search'] as any).select();
    }

    isFavorite(eicon: string): boolean {
      return eicon in core.state.favoriteEIcons;
    }

    toggleFavorite(eicon: string): void {
      if (eicon in core.state.favoriteEIcons) {
        delete core.state.favoriteEIcons[eicon];
      } else {
        core.state.favoriteEIcons[eicon] = true;
      }

      void core.settingsStore.set('favoriteEIcons', core.state.favoriteEIcons);

      this.$forceUpdate();
    }

    close(): void {
      store?.shuffle();
    }
  }
</script>

<style lang="scss">
  .eicon-selector {
    width: 580px;
    max-width: 580px;
    line-height: 1;
    z-index: 1000;

    &.big {
      min-height: 530px;
    }

    .eicon-selector-ui {
      .search-bar {
        display: flex;

        .search {
          flex: 1;
          border-top-right-radius: 0;
          border-bottom-right-radius: 0;
        }

        .search-buttons {
          margin-left: -1px;

          .btn {
            border-bottom: 1px solid var(--secondary);
          }

          .expressions {
            border-top-left-radius: 0;
            border-top-right-radius: 0;
          }
        }
      }

      .courtesy {
        position: absolute;
        bottom: 7px;
        font-size: 9px;
        right: 1rem;
        opacity: 50%;
      }

      .upload {
        position: absolute;
        bottom: 7px;
        font-size: 9px;
        left: 1rem;
      }

      .results {
        max-height: 200px;
        overflow: hidden;
        margin-top: 5px;

        .carousel-inner {
          overflow-x: scroll;
          overflow-y: hidden;

          .carousel-item {
            display: table-cell;
            border: solid 1px transparent !important;
            position: relative;

            &:hover {
              background-color: var(--secondary) !important;
              border: solid 1px var(--gray-dark) !important;

              .favorite-toggle {
                visibility: visible !important;
              }
            }

            .favorite-toggle {
              position: absolute;
              right: 0;
              top: 0;
              border: none;
              margin: 0;
              padding: 4px;
              border-radius: 0;
              visibility: hidden;

              i {
                color: var(--gray-dark);
                opacity: 0.85;
                -webkit-text-stroke-width: thin;
                -webkit-text-stroke-color: var(--light);

                &:hover {
                  opacity: 1;
                }
              }

              &.favorited {
                visibility: visible;

                i {
                  color: var(--green);
                  opacity: 1;

                  &:hover {
                    filter: brightness(1.1);
                  }
                }
              }
            }

            img.eicon {
              width: 75px;
              height: 75px;
              max-width: 75px;
              max-height: 75px;
            }
          }
        }
      }
    }

    &.big {
      min-height: 530px;
      width: 590px;
      max-width: 590px;

      .eicon-selector-ui {
        .carousel.results {
          max-height: unset;
          height: 535px;
          margin-bottom: 0.75rem;

          .carousel-inner {
            overflow-x: hidden;
            overflow-y: scroll;
            height: 100%;
          }

          .carousel-item {
            display: inline-block;
          }
        }
      }
    }
  }
</style>
