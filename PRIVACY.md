# Security & Privacy

## General

F-Chat Horizon does not collect any personal information about you, your computer, or anything else, other than what is necessary to connect you to F-Chat.

No data about your sessions, chats, characters, passwords, et cetera, is shared with the F-Chat Horizon developers.

## Connectivity

F-Chat Horizon connects to the following hosts:

- `f-list.net` – FChat, FList, profiles, character search, authentication, character images, etc.
- `github.com` – F-Chat Horizon [update checks](./electron/pack.js)
- `easylist.to`, `adblockplus.org`, `adtidy.org`, `githubusercontent.com` – [ad blocker updates](./electron/blocker/blocker.ts)
- `xariah.net` – [eicon updates](./learn/eicon/updater.ts)

Your character name, password, messages, and any other private data is only sent to `f-list.net`; the other services are queried anonymously.
Your IP address will be exposed to all of these services.

## Link Previews

When the 'Link Preview' feature is used, F-Chat Horizon will connect to the URL being previewed and any other hosts that are linked from the page being previewed.

- F-Chat Horizon uses [@cliqz/adblocker](https://github.com/ghostery/adblocker) to block as many ads and trackers as possible.
- Using the Link Preview feature will expose you to similar risks that opening a link in your web browser does.
- If you are concerned about your security or privacy, consider disabling the link preview feature in F-Chat Horizon settings.
- In some cases F-Chat Horizon uses 'proxy services' that help formatting Link Previews. For example:
  - Twitter previews are proxied through `api.fxtwitter.com`
  - YouTube previews are proxied through `yewtu.be`

## High-Quality Portraits

When 'High-Quality Portraits' feature is used, F-Chat Horizon may connect to the following additional domains:

- iili.io
- e621.net
- imgur.com
- freeimage.host
- redgifs.com
- imgchest.com

If you are concerned about your security or privacy, consider disabling the high quality portraits feature in F-Chat Horizon settings.

## Locally Stored Data

F-Chat Horizon stores data on your computer. This data contains conversation logs, settings, cache, and other
information such as custom dictionary words. By default, the data is stored in:

| **Operating System** | **Data Path**                         |
| :------------------- | :------------------------------------ |
| Windows              | `%AppData%\fchat`                     |
| MacOS                | `~/Library/Application Support/fchat` |
| Linux                | `~/.config/fchat`                     |

F-List account usernames and passwords are stored in a secure datastore provided by your operating system.
For more information, see [electron safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage).
