# Translating Horizon

Thank you for helping translate Horizon! This guide is for translators and
assumes no programming knowledge. If you are a developer adding translatable
strings to the code, see [docs/localize.md](docs/localize.md) instead.

All translation happens on our Weblate instance:

<https://translate.horizn.moe/projects/horizon/>

## Getting started

1. Create an account on Weblate and open the Horizon project.
2. On your first contribution you will be asked to accept the contributor
   license agreement. This lets us ship your translation with the app.
3. Pick your language and start translating. Every string shows the English
   source text; you write your language's version next to it.

Some useful things to know:

- Untranslated strings fall back to English in the app, so a partially
  translated language is always safe. Translate at your own pace.
- A language appears in Horizon's language picker once it is roughly 30%
  translated.
- Your translations land on the `development` branch automatically and ship
  with the next release. You will be credited in the Translation section of
  the README.
- If your language does not exist on Weblate yet, use the "start new
  translation" button to request it, or open a GitHub issue.

## Placeholders

Many strings contain placeholders in curly braces:

> Cannot share logs: `{character}` is offline.

At runtime the placeholder is replaced with a real value, here a character
name. The rules:

- Keep the text inside the braces **exactly** as written. Never translate,
  rename, or remove it.
- You can move placeholders anywhere in the sentence to fit your language's
  word order.
- A placeholder may appear more than once; every occurrence is replaced.

Weblate checks placeholders automatically. If your translation drops or
misspells one, the string gets a red "Placeholders" warning; please fix it
before moving on.

## Placeholders that contain phrases

A few placeholders receive an already-translated _phrase_ rather than a bare
number or name. For example, the export summary:

> Exported `{files}` for `{characters}` to `{file}`.

Here `{files}` becomes something like "3 files" and `{characters}` becomes
"2 characters", using the separate `settings.summary.files` and
`settings.summary.characters` plural strings. Those fragments are translated
by you too, in the same component.

Translate the frame sentence so that a counted noun phrase reads naturally in
the placeholder's position, and translate the fragments so they fit the frames
they are used in. If your language needs the fragment in a particular
grammatical case, put the case in the fragment. Hungarian, for example,
translates `settings.summary.characters` as "{count} karakternek" because the
sentence it slots into requires the dative.

## Plural forms

Strings that depend on a number are shown in Weblate as one entry with a
separate field for each plural form your language uses. `{count}` is the
number itself.

- English has two forms (one, other). Your language may have more or fewer;
  Weblate shows exactly the fields your language needs.
- If your language does not change the noun after a number (Hungarian, for
  example), it is correct for all forms to be identical.
- The singular form may drop `{count}` when that reads better ("one hour"
  instead of "1 hour").

### Reading plural rules

Weblate may show a rule that selects a translation field from the count. The
rules use this pattern:

> `test ? form if true : form if false`

`n` is the count, and form numbers start at 0. A rule may put another test in
the "if false" part. Read this example from the outside in:

```text
(n == 1)
  ? 0
  : ((n != 0 && n % 1000000 == 0)
    ? 1
    : 2)
```

1. Test whether `n` is exactly 1. If it is, use form 0, the first field.
2. Otherwise, test whether `n` is nonzero and a multiple of 1,000,000. If it
   is, use form 1, the second field.
3. Use form 2, the third field, for every other number, including 0.

In these rules, `==` means "is equal to", `!=` means "is not equal to", `&&`
means "and", and `%` gives the remainder after division. So
`n % 1000000 == 0` means that dividing `n` by 1,000,000 leaves no remainder.
The form names that Weblate shows, such as "one", "many", or "other", depend
on the language.

## BBCode

Some strings contain BBCode markup:

> Please [b]never[/b] share your password. See [url=...]this page[/url].

Translate only the text between the tags. Keep every opening tag matched by
its closing tag, and never translate the tag names themselves or anything
inside `[url=...]`.

## Style

- Horizon is a chat client; its voice is casual and friendly. Match it.
- Each language has an established way of addressing the user, and staying
  consistent matters more than the choice itself. German uses the informal
  "du"; French uses "vous". Follow whatever your language's existing strings
  do. If you are starting a fresh language, pick one register and keep it.
- Many strings sit on buttons, tabs, and menus where space is tight. Prefer
  short wording; if your translation is much longer than the English, look
  for a tighter phrasing.
- Use your language's own punctuation and quotation marks in visible text.

## The glossary

The project has a shared glossary of Horizon terms (ad, channel, character,
kink, ...). When a string contains one of them, the term and its agreed
translation appear in the sidebar next to the editor.

- Translate glossary terms the same way everywhere; the glossary is the
  source of truth for them.
- Terms marked untranslatable (eicon, BBCode, F-List, F-Chat, Horizon) stay
  exactly as written in every language.
- If your language has no translation for a term yet, add one so later
  strings stay consistent.

## Automatic suggestions

The "Automatic suggestions" tab offers machine translations and matches from
translation memory. Treat them as drafts: they are often a good starting
point, but verify the placeholders, the glossary terms, and the meaning
before accepting one.

## When context is unclear

Short strings can be ambiguous ("Status" the noun? "Clear" the verb?). When
you are unsure what a string does:

- The string's key (shown under "Context", e.g. `settings.export.summary`)
  hints at where it appears in the app.
- Leave a comment on the string. Comments notify the maintainers, and the
  answer helps every translator after you.

## Special languages

- **Cyute Engwish (en-x-uwu)** is a deliberately silly, stylized English
  variant. Normal grammar and style rules do not apply there; playfulness
  does.
- **English (United States)** is the source language. Its strings are
  maintained in the code repository, not through Weblate.
