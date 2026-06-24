class FChatDefinitionMutator {
  mutateDictionary() {
    document
      .querySelectorAll('html, body')
      .forEach(e =>
        e.setAttribute(
          'style',
          'border: 0 !important; padding: 0 !important; margin: 0 !important;'
        )
      );
    document
      .querySelectorAll('.app-base')
      .forEach(e =>
        e.setAttribute('style', 'padding: 0 !important; margin: 0 !important;')
      );

    document
      .querySelectorAll(
        'header, footer, .serp-nav-button, aside, .sailthru-overlay-container, .bxc, #marketingBanner-right, #marketingBanner-right-button'
      )
      .forEach(e => e.setAttribute('style', 'display: none !important'));

    const headword = document.querySelector('.entry-headword');

    if (headword) {
      const parent = headword.parentElement.parentElement;
      let el = headword.parentElement.nextElementSibling;

      while (el) {
        const dEl = el;

        el = el.nextElementSibling;
        parent.removeChild(dEl);
      }
    }
  }

  mutateThesaurus() {
    document
      .querySelectorAll('html, body')
      .forEach(e =>
        e.setAttribute(
          'style',
          'border: 0 !important; padding: 0 !important; margin: 0 !important;'
        )
      );
    document
      .querySelectorAll('.app-base')
      .forEach(e =>
        e.setAttribute('style', 'padding: 0 !important; margin: 0 !important;')
      );

    document
      .querySelectorAll(
        'header, footer, .serp-nav-button, aside, button, .sailthru-overlay-container, .bxc, #marketingBanner-right, #marketingBanner-right-button'
      )
      .forEach(e => e.setAttribute('style', 'display: none !important'));
  }

  mutateWikipedia() {
    document
      .querySelectorAll('header')
      .forEach(e => e.setAttribute('style', 'display: none !important'));
  }

  mutateUrbanDictionary() {
    document
      .querySelectorAll('.column, .columns')
      .forEach(e => e.setAttribute('style', 'padding: 0 !important'));

    document
      .querySelectorAll('.row')
      .forEach(e => e.setAttribute('style', 'max-width: 100% !important'));

    document
      .querySelectorAll(
        '#urban-top-bar, .ad-panel, .panel, .hide-for-large-up, .show-for-large-up, .show-for-medium-up, .pagination-centered, .header, .mug-ad, iframe'
      )
      .forEach(e => e.setAttribute('style', 'display: none !important'));
  }

  run(site) {
    switch (site) {
      case 'dictionary':
        this.mutateDictionary();
        break;

      case 'thesaurus':
        this.mutateThesaurus();
        break;

      case 'urbandictionary':
        this.mutateUrbanDictionary();
        break;

      case 'wikipedia':
        this.mutateWikipedia();
        break;
    }
  }
}

const mutator = new FChatDefinitionMutator();
mutator.run('## SITE ##');
