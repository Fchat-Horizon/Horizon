# Localization

This document describes how Horizon's UI is translated: the runtime translation
layer, the format of locale files, and how new languages and strings are added.
Translations are managed by the community through Weblate at
<https://translate.horizn.moe/projects/horizon/>. You should not edit them
directly, except for `en_us` and `en_uwu`, such as for adding new strings.

Localization is maintained by
[@CodingWithAnxiety](https://github.com/CodingWithAnxiety).

## Overview

All translatable UI text is keyed. Instead of hard-coding a string in a
component, you call `l('some.key')`, and the active locale decides what text is
shown. Locale data lives in flat JSON files under `chat/locales/`, one per
language. `en_us.json` is the main localization file: every key originates
there, and any string missing from another locale falls back to it
automatically.

| Piece                          | Location                                    |
| ------------------------------ | ------------------------------------------- |
| Translation function `l()`     | `chat/localize.ts`                          |
| Locale files (`<code>.json`)   | `chat/locales/`                             |
| Display-language list + picker | `chat/localize.ts`, `electron/Settings.vue` |
| Persisted setting              | `displayLanguage` (`electron/common.ts`)    |

## The `l()` function

`l` is the default export of `chat/localize.ts`:

```ts
export default function l(key: string, ...args: (string | number)[]): string;
```

- Looks the key up in the active locale.
- If the key is missing there, falls back to `en_us`.
- If it is missing from `en_us` too, returns the key string unchanged and warns
  in the console, assuming we're currently in a dev build.
- Any `{0}`, `{1}`, ... placeholders are replaced by the positional `args` you
  pass.

### Using a string in code

1. Add the key and English text to `chat/locales/en_us.json`. Keys are kept in
   sorted order.
2. Import `l` and expose it to the template. Components register it as a data
   property so it can be used in the markup:

   ```ts
   import l from './localize';

   export default CustomDialog.extend({
     data() {
       return { l: l /* ...other state */ };
     }
   });
   ```

3. Call it from the template or script:

   ```html
   {{ l('settings.displayLanguage') }}
   <CustomButton :buttonText="l('conversationSettings.save')" />
   ```

### Placeholders

Use `{N}` placeholders for values that are interpolated at runtime. They are
zero-indexed and map to the trailing arguments of `l()`:

```json
{ "about.madeWith": "Made with {0} by" }
```

```ts
l('about.madeWith', 'love'); // "Made with love by"
l('conversationSettings.action', conversation.name);
```

There is no pluralization or gender support (yet!). A placeholder may appear
more than once in a string; every occurrence is substituted.

## Locale file format

Each file is a flat JSON object mapping a key to its translated string. Keys are
dot-namespaced by feature area (`about.*`, `settings.*`,
`conversationSettings.*`) but are otherwise plain strings, not nested objects.

```json
{
  "about.commit": "Commit",
  "about.madeWith": "Made with {0} by",
  "action.cancel": "Cancel"
}
```

A translation file only needs the keys it actually translates. Because every
locale is merged on top of `en_us` at load time, omitted keys display the
English text rather than breaking the UI. This is why locale files vary in size,
and why a brand-new language can ship with just a handful of translated keys.

## How a locale is loaded

`chat/localize.ts` bundles every `chat/locales/*.json` file via Webpack's
`require.context`, so adding a JSON file is enough for it to be bundled.
`en_us.json` is loaded eagerly as the base; switching language merges the
requested file over it:

```ts
current = { ...enUS, ...data };
```

Language state is reactive. `i18nState` is a `Vue.observable` holding the active
`locale` and a `version` counter; `l()` reads `version` on every call, and
`setLanguage()` bumps it. Any template that calls `l()` therefore re-renders
automatically when the language changes, with no page reload.

`setLanguage(code)` is the entry point for switching. If the requested locale
file cannot be loaded it logs a warning (dev only) and falls back to `en_us`.

## Display languages and the picker

The dropdown in Settings is driven by `availableDisplayLanguages` in
`chat/localize.ts`. Each entry pairs the file `code` with the `name` shown to
the user:

```ts
export const availableDisplayLanguages = [
  { code: 'en_us', name: 'English (US)' },
  { code: 'fr', name: 'Français (France)' }
  // ...
];
```

`electron/Settings.vue` binds the picker to `settings.displayLanguage` and
watches it: on change it calls `setLanguage()` and persists the setting via
`general-settings-update`. The selected language is applied early at startup in
`electron/chat.ts`, and defaults to `en_us` (`electron/common.ts`).

> [!NOTE]  
> Adding a JSON file alone does not surface a language in the UI. It must also
> be added to `availableDisplayLanguages`. **Add languages once they're
> sufficently translated (30%), not just when they are added.**

## Translating with Weblate

Day-to-day translation happens on Weblate, not by editing JSON files by hand:

<https://translate.horizn.moe/projects/horizon/>

- Translators sign up, pick a language, and translate strings against the
  English source. The English strings in `en_us.json` are the source text shown
  to translators.
- Weblate writes changes back to the repository as commits titled `Translated
using Weblate (<language>)`. These land in the locale JSON files
  automatically.
- Because missing keys fall back to English, partially translated languages are
  safe to ship at any stage.

When new translatable strings are added to the code, only `en_us.json` needs the
new keys. Weblate then exposes those keys to translators for every language.

## Adding a new language

1. Create the language on Weblate (preferred), or add `chat/locales/<code>.json`
   with at least one translated key. The `<code>` becomes the locale identifier.
2. Add an entry to `availableDisplayLanguages` in `chat/localize.ts` with the
   `code` and a human-readable `name` so it appears in the Settings picker.
3. Credit the translators in the **Translation** section of `README.md` (kept
   alphabetical).

## Special languages

- **`en_uwu` ("Cyute Engwish")** - a complete, intentionally silly English
  variant. It behaves like any other locale.
- **`test` (Test Language)** - a development-only pseudo-locale. It is only
  listed when `NODE_ENV !== 'production'`. It replaces every word in every
  string with `test`, which makes it easy to spot UI text that is hard-coded
  rather than routed through `l()`. It is not shipped in production builds, and
  does NOT have a file associated with it.
