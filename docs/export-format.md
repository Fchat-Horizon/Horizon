# Horizon Export Format (v2)

This document describes the ZIP-based export format used by Horizon for
backing up and restoring user data. Other clients can produce or consume
this format by following the specification below.

## Overview

A Horizon export is a standard ZIP archive (deflate, level 6 recommended)
containing a flat `manifest.json`, an optional top-level `settings` file,
and per-character data nested under `characters/<name>/`.

## ZIP layout

```
manifest.json                          # required (v2+)
settings                              # general app settings (JSON, no extension)
characters/
  <CharacterName>/
    logs/
      <target>.json                    # chat log (JSON array, see below)
    settings/
      pinned                           # pinned conversations (JSON, no extension)
      favoriteEIcons                   # favorite eicons (JSON, no extension)
      recent                           # recent conversations (JSON, no extension)
      recentChannels                   # recent channels (JSON, no extension)
      hiddenUsers                      # hidden users list (JSON, no extension)
      ...                              # other character settings files
    drafts.txt                         # message drafts (JSON, .txt extension)
```

### Path conventions

- All paths use forward slashes (`/`).
- Character names are used verbatim as directory names (case-sensitive).
- Settings files have no file extension; they contain JSON.
- Log files are JSON arrays (`.txt.json`), organized by target name and
  date. Each element is an object with `time` (unix seconds), `type`
  (message type integer), `sender` (character name), and `text` fields.
  On import, these are converted back to the application's binary format.

## manifest.json

The manifest **must** be the first entry in the ZIP. It is a JSON object
with the following fields:

| Field           | Type       | Description                                           |
| --------------- | ---------- | ----------------------------------------------------- |
| `version`       | `number`   | Format version. Currently `2`.                        |
| `createdAt`     | `string`   | ISO 8601 timestamp of when the export was created.    |
| `app`           | `string`   | Always `"horizon"`.                                   |
| `expectedFiles` | `number`   | Number of data files (excludes `manifest.json`).      |
| `characters`    | `string[]` | Character names included in the export.               |
| `includes`      | `object`   | Flags indicating which data categories were selected. |

### `includes` object

| Field               | Type      | Description                                  |
| ------------------- | --------- | -------------------------------------------- |
| `generalSettings`   | `boolean` | Top-level `settings` file is included.       |
| `logs`              | `boolean` | Chat log files are included.                 |
| `drafts`            | `boolean` | Draft files are included.                    |
| `characterSettings` | `boolean` | Full character settings dirs included.       |
| `pinned`            | `boolean` | Pinned conversations files included.         |
| `eicons`            | `boolean` | Favorite eicons files included.              |
| `recents`           | `boolean` | Recent conversations/channels included.      |
| `hidden`            | `boolean` | Hidden users lists included.                 |
| `jsonLogs`          | `boolean` | If `true`, log files are JSON (`.txt.json`). |

When `characterSettings` is `true`, all files under each character's
`settings/` directory are included. The `pinned`, `eicons`, `recents`,
and `hidden` flags are still set to reflect what is present, but
`characterSettings` being `true` implies all of them.

### Example

```json
{
  "version": 2,
  "createdAt": "2026-02-09T14:30:00.000Z",
  "app": "horizon",
  "expectedFiles": 142,
  "characters": ["Alice", "Bob"],
  "includes": {
    "generalSettings": true,
    "logs": true,
    "drafts": true,
    "characterSettings": true,
    "pinned": true,
    "eicons": true,
    "recents": true,
    "hidden": true
  }
}
```

## Backwards compatibility

Exports created before v2 do not contain a `manifest.json`. Importers
should handle this gracefully:

- If `manifest.json` is absent, scan the ZIP entries directly to
  determine available characters and data categories.
- If `manifest.json` is present but has an unrecognized `version`,
  the importer should warn the user but may still attempt import.

## Producing an export

1. Build the list of data files to include.
2. Create the manifest with `expectedFiles` set to the data file count.
3. Write `manifest.json` as the **first** ZIP entry.
4. Add all data files.
5. Finalize the archive.
6. **Verify**: Re-open the ZIP and confirm:
   - `manifest.json` exists and parses as valid JSON.
   - The entry count matches `expectedFiles + 1` (within a tolerance
     of 1 to account for the manifest itself).
   - Each character listed in the manifest has at least one entry under
     `characters/<name>/`.

## Consuming an import

1. Open the ZIP and look for `manifest.json`.
2. If present, parse it and validate the `version` and `app` fields.
   Use the manifest to populate the UI (character list, available
   categories, file counts).
3. If absent, fall back to scanning ZIP entries to build the character
   list and detect available data categories.
4. For each file written during import, catch and count per-file errors
   rather than aborting the entire operation.
5. After import, report success counts, skip counts, and error counts.

## Security

- Validate all ZIP entry paths. Reject entries containing `..` or
  entries that resolve outside the target data directory (path
  traversal).
