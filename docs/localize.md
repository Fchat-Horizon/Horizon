# Localization

This document describes how Horizon's UI is translated: the runtime translation
layer, the format of locale files, and how new languages and strings are added.
Translations are managed by the community through Weblate at
<https://translate.horizn.moe/projects/horizon/>. You should not edit them
directly, except for `en-US` and `en-x-uwu`, such as for adding new strings.

Localization is maintained by
[@CodingWithAnxiety](https://github.com/CodingWithAnxiety).

## Overview

All translatable UI text is keyed. Instead of hard-coding a string in a
component, you call `l('some.key')`, and the active locale decides what text is
shown. Locale data lives in flat JSON files under `chat/locales/`, one per
language. `en-US.json` is the main localization file: every key originates
there, and any string missing from another locale falls back to it
automatically.

| Piece                           | Location                                    |
| ------------------------------- | ------------------------------------------- |
| Translation functions `l`, `lp` | `chat/localize.ts`                          |
| Inline-element sentences        | `components/localized_text.ts`              |
| Date formatting `dateLocale()`  | `chat/localize.ts`                          |
| Locale files (`<code>.json`)    | `chat/locales/`                             |
| Display-language list + picker  | `chat/localize.ts`, `electron/Settings.vue` |
| Persisted setting               | `displayLanguage` (`electron/common.ts`)    |
| Validator (`pnpm i18n:check`)   | `scripts/i18n-check.js`                     |

Locale codes are valid BCP47 (`en-US`, `en-x-uwu`, `fr`, ...), and the file
name is the code. That lets `Intl` APIs (plural rules) consume the active
locale directly. The pre-2.4 underscore codes (`en_us`, `en_uwu`, `test`) are
migrated transparently when `setLanguage()` sees them in old settings.

## The `l()` function

`l` is the default export of `chat/localize.ts`:

```ts
export default function l(key: string, params?: LocalizeParams): string;
```

- Looks the key up in the active locale.
- If the key is missing there, falls back to `en-US`.
- If it is missing from `en-US` too, returns the key string unchanged and warns
  in the console, assuming we're currently in a dev build.
- Named `{token}` placeholders are replaced from the `params` object.

### Using a string in code

1. Add the key and English text to `chat/locales/en-US.json`. Keys are kept in
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

Use named `{token}` placeholders for values interpolated at runtime, and pass
them as an object. Choose descriptive names; translators see them:

```json
{ "logs.shareOffline": "Cannot share logs: {character} is offline." }
```

```ts
l('logs.shareOffline', { character: targetName });
```

A placeholder may appear more than once in a string; every occurrence is
substituted, and translations may reorder them freely. The older positional
form (`{0}`, `{1}` with trailing arguments) still works but is legacy; no
string in the locale files uses it anymore.

### Whole sentences with inline elements: `<localized-text>`

Never split a sentence across multiple keys to wrap part of it in a link or
button; word order differs between languages. Use `localized-text`
(`components/localized_text.ts`): tokens not covered by `params` render as
named slots, so the translation controls where the element sits.

```json
{ "admgr.useEditor": "Use the {adEditor} to create ads." }
```

```html
<localized-text k="admgr.useEditor">
  <template #adEditor>
    <button @click="openAdEditor()">{{ l('admgr.editor') }}</button>
  </template>
</localized-text>
```

## Pluralization

Strings whose shape depends on a count use `lp()`:

```ts
export function lp(key: string, count: number, params?: LocalizeParams): string;
```

Plural forms live in the locale files as suffixed keys, using CLDR category
names - the same `_one`/`_other` convention as i18next, which Weblate groups
into a single plural unit per language:

```json
{
  "quickJump.members_one": "{count} member",
  "quickJump.members_other": "{count} members"
}
```

```ts
lp('quickJump.members', channel.sortedMembers.length);
```

- `count` picks the CLDR category via `Intl.PluralRules` for the active locale
  and is injected as `{count}`; extra params ride along in `params`.
- `en-US.json` carries exactly `_one` and `_other`. Languages with more
  categories (`_few`, `_many`, ...) add them in their own files; Weblate shows
  translators every form their language requires.
- Lookup falls back per form: locale exact category, locale `_other`, `en-US`
  exact, `en-US` `_other`.
- `{count}` may be omitted in a `_one` form ("1 hour" reads better than
  "{count} hour"). The validator allows this.
- `<localized-text>` takes a `count` prop that routes through `lp()`, so plural
  sentences can still contain slots.

Writing `(s)` into a string ("{count} file(s)") is deprecated for
single-count strings; convert to a plural group instead. Strings with several
counts in one sentence (the import/export summaries) still use it - restructure
the sentence before pluralizing those. Gender support does not exist (yet!).

## Localized dates

`dateLocale()` returns the date-fns locale for the active display language.
Pass it to any date-fns display formatting:

```ts
import { format } from 'date-fns';
import { dateLocale } from './localize';

format(date, 'PPpp', { locale: dateLocale() });
```

Message timestamps (`formatTime` in `chat/common.ts`) and relative dates
(`components/date_display.vue`) already do this. Never localize filenames or
serialized dates; those keep fixed numeric patterns.

## The validator

`pnpm i18n:check` runs `scripts/i18n-check.js`, and CI runs it on every PR
touching `chat/locales/` (`.github/workflows/i18n_check.yml`). Errors fail CI;
warnings are informational.

- Errors: invalid JSON, duplicate keys, non-string values, stale keys missing
  from `en-US.json`, placeholder mismatches against the source, plural groups
  in `en-US.json` that are not exactly `_one` + `_other`, a bare key shadowing
  a plural group, and a translated group missing `_other`.
- Warnings: empty strings, unsorted keys, plural categories a language
  requires but does not have yet, and categories it has but does not use.

## Locale file format

Each file is a flat JSON object mapping a key to its translated string. Keys are
dot-namespaced by feature area (`about.*`, `settings.*`,
`conversationSettings.*`) but are otherwise plain strings, not nested objects.

```json
{
  "about.commit": "Commit",
  "action.cancel": "Cancel"
}
```

A translation file only needs the keys it actually translates. Because every
locale is merged on top of `en-US` at load time, omitted keys display the
English text rather than breaking the UI. This is why locale files vary in size,
and why a brand-new language can ship with just a handful of translated keys.

## How a locale is loaded

`chat/localize.ts` bundles every `chat/locales/*.json` file via Webpack's
`require.context`, so adding a JSON file is enough for it to be bundled.
`en-US.json` is loaded eagerly as the base; switching language merges the
requested file over it:

```ts
current = { ...enUS, ...data };
```

Language state is reactive. `i18nState` is a `Vue.observable` holding the active
`locale` and a `version` counter; `l()` reads `version` on every call, and
`setLanguage()` bumps it. Any template that calls `l()` therefore re-renders
automatically when the language changes, with no page reload.

`setLanguage(code)` is the entry point for switching. If the requested locale
file cannot be loaded it logs a warning (dev only) and falls back to `en-US`.

## Display languages and the picker

The dropdown in Settings is driven by `availableDisplayLanguages` in
`chat/localize.ts`. Each entry pairs the file `code` with the `name` shown to
the user:

```ts
export const availableDisplayLanguages = [
  { code: 'en-US', name: 'English (US)' },
  { code: 'fr', name: 'Français (France)' }
  // ...
];
```

`electron/Settings.vue` binds the picker to `settings.displayLanguage` and
watches it: on change it calls `setLanguage()` and persists the setting via
`general-settings-update`. The selected language is applied early at startup in
`electron/chat.ts`, and defaults to `en-US` (`electron/common.ts`).

> [!NOTE]  
> Adding a JSON file alone does not surface a language in the UI. It must also
> be added to `availableDisplayLanguages`. **Add languages once they're
> sufficently translated (30%), not just when they are added.**

## Translating with Weblate

Day-to-day translation happens on Weblate, not by editing JSON files by hand:

<https://translate.horizn.moe/projects/horizon/>

- Translators sign up, pick a language, and translate strings against the
  English source. The English strings in `en-US.json` are the source text shown
  to translators.
- The component uses the i18next v4 JSON format, so `_one`/`_other` plural keys
  appear as one grouped string with a field per form the target language needs.
- Weblate writes changes back to the repository as commits titled `Translated
using Weblate (<language>)`. These land in the locale JSON files
  automatically.
- Because missing keys fall back to English, partially translated languages are
  safe to ship at any stage.

When new translatable strings are added to the code, only `en-US.json` needs the
new keys. Weblate then exposes those keys to translators for every language.

## Adding a new language

1. Create the language on Weblate (preferred), or add `chat/locales/<code>.json`
   with at least one translated key. The `<code>` becomes the locale identifier
   and must be valid BCP47.
2. Add an entry to `availableDisplayLanguages` in `chat/localize.ts` with the
   `code` and a human-readable `name` so it appears in the Settings picker.
3. Credit the translators in the **Translation** section of `README.md` (kept
   alphabetical).

## Special languages

- **`en-x-uwu` ("Cyute Engwish")** - a complete, intentionally silly English
  variant. It behaves like any other locale.
- **`en-x-pseudo` (Pseudo-locale)** - a development-only locale, listed when
  `NODE_ENV !== 'production'` and generated at render time from `en-US` - it
  has no file. Letters gain accents (`Šéŧŧíñĝš`) so hard-coded strings stand
  out from localized ones, and each string is bracketed and padded
  (`[...···]`) to simulate the length of real translations - if the closing
  `]` is cut off, the layout clips. Placeholders and plural selection work
  normally. It is not shipped in production builds.
