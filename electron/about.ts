import About from './About.vue';
import Vue from 'vue';
import l, { setLanguage } from '../chat/localize';
import type {} from './about/api';

async function initializeAbout(): Promise<void> {
  console.info('init.about');
  const initialState = await window.horizonAbout.getState();
  setLanguage(initialState.settings.displayLanguage);
  console.info('init.about.vue', Vue.version);
  new About({
    el: '#about',
    propsData: { initialState }
  });
  console.debug('init.about.vue.done');
}

void initializeAbout()
  .catch(error => {
    console.error('init.about.failed', error);
    const root = document.getElementById('about');
    if (root) root.textContent = l('events.error', { error: String(error) });
  })
  .finally(() => window.horizonAbout.ready());
