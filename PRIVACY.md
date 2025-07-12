# Security & Privacy

## General

Horizon does not collect any personal information about you, your computer, or anything else, other than what is necessary to connect you to F-Chat.

No data about your sessions, chats, characters, passwords, et cetera, is shared with the F-Chat Horizon developers.

## Connectivity

Horizon connects to the following hosts:

- `f-list.net` – FChat, FList, profiles, character search, authentication, character images, etc.
- `github.com` – F-Chat Horizon [update checks](./electron/pack.js)
- `easylist.to`, `adblockplus.org`, `adtidy.org`, `githubusercontent.com` – [ad blocker updates](./electron/blocker/blocker.ts)
- `xariah.net` – [eicon updates](./learn/eicon/updater.ts)

Your character name, password, messages, and any other private data is only sent to `f-list.net`; the other services are queried anonymously.
Your IP address will be exposed to all of these services.

## Link Previews

When the 'Link Preview' feature is used, Horizon will connect to the URL being previewed and any other hosts that are linked from the page being previewed.

- Horizon uses [@cliqz/adblocker](https://github.com/ghostery/adblocker) to block as many ads and trackers as possible.
- Using the Link Preview feature will expose you to similar risks that opening a link in your web browser does.
- If you are concerned about your security or privacy, consider disabling the link preview feature in Horizon settings.
- In some cases Horizon uses 'proxy services' that help formatting Link Previews. For example:
  - Twitter previews are proxied through `api.fxtwitter.com`
  - YouTube previews are proxied through `yewtu.be`

## High-Quality Portraits

When 'High-Quality Portraits' feature is used, Horizon may connect to the following additional domains:

- iili.io
- e621.net
- imgur.com
- freeimage.host
- redgifs.com
- imgchest.com
- toyhou.se

If you are concerned about your security or privacy, consider disabling the high quality portraits feature in Horizon settings.

## Locally Stored Data

Horizon stores data on your computer. This data contains conversation logs, settings, cache, and other
information such as custom dictionary words. By default, the data is stored in:

| **Operating System** | **Data Path**                                    |
| :------------------- | :----------------------------------------------- |
| Windows              | `%AppData%\horizon-electron`                     |
| MacOS                | `~/Library/Application Support/horizon-electron` |
| Linux                | `~/.config/horizon-electron`                     |

F-List account usernames and passwords are stored in a secure datastore provided by your operating system.
For more information, see [electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage).
