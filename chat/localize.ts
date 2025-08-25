/*tslint:disable:max-line-length object-literal-sort-keys object-literal-key-quotes*/
const strings: { [key: string]: string | undefined } = {
  'action.edit': 'Edit',
  'action.view': 'View',
  'action.cut': 'Cut',
  'action.copy': 'Copy',
  'action.copyWithoutBBCode': 'Copy without BBCode',
  'action.paste': 'Paste',
  'action.delete': 'Delete',
  'action.selectAll': 'Select All',
  'action.copyLink': 'Copy Link',
  'action.incognito': 'Open in Incognito mode',
  'action.suggestions': 'Suggestions',
  'action.open': 'Show',
  'action.close': 'Close',
  'action.quit': 'Quit',
  'action.about': 'About Horizon',
  'action.newWindow': 'Open new window',
  'action.newTab': 'Open new tab',
  'action.updateAvailable': 'UPDATE AVAILABLE',
  'action.update': 'Quit and download update',
  'action.preferences': 'Preferences',
  'action.markAsRead': 'Mark all as read',
  'action.cancel': 'Cancel',
  'admgr.open': 'Ad Center',
  'admgr.postingBegins': 'Posting beings in {0}m {1}s',
  'admgr.nextPostDue': 'Next ad in {0}m {1}s',
  'admgr.expiresIn': ', auto-posting expires in {0}m {1}s',
  'admgr.noAds':
    'No ads have been set up -- auto-posting will be cancelled. Click "Ads > Edit Channel Ads..." to set up your ads.',
  'admgr.activeHeader': 'Auto-Posting Ads',
  'admgr.comingNext': 'Coming Next',
  'admgr.renew': 'Renew',
  'admgr.setup': 'Set-Up Ads',
  'admgr.toggleAutoPost': 'Auto-Post Ads',
  'consoleWarning.head': 'THIS IS THE DANGER ZONE.',
  'consoleWarning.body': `ANYTHING YOU WRITE OR PASTE IN HERE COULD BE USED TO STEAL YOUR PASSWORDS OR TAKE OVER YOUR ENTIRE COMPUTER. This is where happiness goes to die. If you aren't a developer or a special kind of daredevil, please get out of here!`,
  help: 'Help',
  'help.fchat': 'Horizon Help',
  'help.feedback': 'Report a Bug / Suggest Something',
  'help.rules': 'F-List Rules',
  'help.faq': 'F-List FAQ',
  'help.report': 'How to report a user',
  'help.changelog': 'Changelog',
  navigation: 'Navigation',
  'navigation.nextTab': 'Show Next Tab',
  'navigation.previousTab': 'Show Previous Tab',
  'fs.error': 'Error writing to disk',
  'spellchecker.add': 'Add to Dictionary',
  'spellchecker.remove': 'Remove from Dictionary',
  'spellchecker.noCorrections': 'No corrections available',
  window: 'Window',
  'window.newTab': 'New tab',
  title: process.env.NODE_ENV === 'production' ? 'Horizon' : 'Horizon (Dev)',
  'title.connected': 'Horizon ({0})',
  version: 'Version {0}',
  developmentVersion: 'Development build [{0}]',
  filter: 'Type to filter...',
  confirmYes: 'Yes',
  confirmNo: 'No',
  'login.account': 'Username',
  'login.password': 'Password',
  'login.host': 'Host',
  'login.proxy': 'Proxy',
  'login.advanced': 'Show advanced settings',
  'login.save': 'Save login',
  'login.auto': 'Automatically log in',
  'login.error': 'Error logging you in: Could not connect to server',
  'login.error.proxy': 'Failed to set proxy',
  'login.submit': 'Log in',
  'login.working': 'Logging in...',
  'login.selectCharacter': 'Select a character',
  'login.connect': 'Connect',
  'login.connecting': 'Connecting...',
  'login.connectError': 'Connection error: {0}',
  'login.alreadyLoggedIn':
    'You are already logged in on this character in another tab or window.',
  'channelList.public': 'Official channels',
  'channelList.private': 'Open rooms',
  'channelList.create': 'Create room',
  'channelList.createName': 'Room name',
  'chat.logout': 'Log out',
  'chat.status': 'Status:',
  'chat.setStatus': 'Set status',
  'chat.setStatus.status': 'Status',
  'chat.setStatus.message': 'Status message (optional)',
  'chat.menu': 'Menu',
  'chat.channels': 'Channels',
  'chat.pms': 'Private messages',
  'chat.pms.short': 'PMs',
  'chat.consoleTab': 'Console',
  'chat.pinTab': 'Pin this tab',
  'chat.closeTab': 'Close this tab',
  'chat.confirmLeave':
    'You are still connected to chat. Would you like to disconnect?',
  'chat.highlight': 'mentioned {0} in {1}:\n{2}',
  'chat.roll': 'rolls {0}: {1}',
  'chat.bottle': 'spins the bottle: {0}',
  'chat.consoleChat': 'You cannot chat here.',
  'chat.typing.typing': '{0} is typing...',
  'chat.typing.paused': '{0} has entered text.',
  'chat.errorOffline':
    '{0} is offline, you cannot send them a message right now.',
  'chat.errorIgnored':
    'You are ignoring {0}. If you would like to send them a message, please unignore them first.',
  'chat.disconnected':
    'You were disconnected from chat.\nAttempting to reconnect.',
  'chat.disconnected.title': 'Disconnected',
  'chat.ignoreList': 'You are currently ignoring: {0}',
  'chat.search': 'Search in messages...',
  'chat.send': 'Send',
  'logs.title': 'Logs',
  'logs.character': 'Character',
  'logs.conversation': 'Conversation',
  'logs.confirmExport':
    'Are you sure you would like to export all logs for {0}? If you have a lot of logs, this might take a while.',
  'logs.date': 'Date',
  'logs.selectCharacter': 'Select a character...',
  'logs.selectConversation': 'Select a conversation...',
  'logs.allDates': 'Show all',
  'logs.corruption.desktop':
    'Log corruption has been detected. This is usually caused by a crash/force close or power loss mid-write. Please use the "Fix corrupted logs" option for this character to restore proper functionality.',
  'logs.corruption.mobile':
    'Log corruption has been detected. This is usually caused by a crash/force close or power loss mid-write. Will now attempt to fix corrupted logs.',
  'logs.corruption.mobile.success': 'Your logs have been fixed.',
  'logs.corruption.mobile.error':
    'Unable to fix corrupted logs. Please clear the application data or reinstall the app.',
  'logs.corruption.web':
    'Error reading logs from browser storage. If this issue persists, please clear your stored browser data for F-Chat.',
  'logs.html':
    'Would you like to export these logs as HTML with formatting? Otherwise, they will be exported as plain text.',
  'user.profile': 'Profile',
  'user.message': 'Open conversation',
  'user.messageJump': 'View conversation',
  'user.bookmark': 'Bookmark',
  'user.unbookmark': 'Unbookmark',
  'user.ignore': 'Ignore',
  'user.unignore': 'Unignore',
  'user.hide': 'Hide ads',
  'user.friend': 'Friend',
  'user.unhide': 'Unhide ads',
  'user.memo': 'Edit memo',
  'user.memo.action': 'Update memo',
  'user.report': 'Report user',
  'user.channelKick': 'Kick from channel',
  'user.chatKick': 'Chat kick',
  'users.title': 'People',
  'users.friends': 'Friends',
  'users.bookmarks': 'Bookmarks',
  'users.members': 'Members',
  'users.memberCount': '{0} Members',
  'userProfile.edit': 'Edit character',

  'userProfile.': 'Edit character',
  'userProfile.delete': 'Delete character',
  'userProfile.duplicate': 'Duplicate character',
  'userProfile.bookmark': 'Bookmark character',
  'userProfile.memo': 'Update character memo',
  'userProfile.unbookmark': 'Unbookmark character',
  'userProfile.unbookmarkable': 'This user does not wish to be bookmarked.',
  'userProfile.showFriends': 'Show friends',
  'userProfile.sendNote': 'Send note',
  'chat.report': 'Alert Staff',
  'chat.report.description': `[color=red]Before you alert the moderators, PLEASE READ:[/color]
If you're just having personal trouble with someone, right-click their name and ignore them.
Please make sure what you're reporting is a violation of the site's [url=https://wiki.f-list.net/Code_of_Conduct]Code of Conduct[/url], otherwise nothing will be done.

This tool is intended for chat moderation. If you have a question, please visit our [url=https://wiki.f-list.net/Frequently_Asked_Questions]FAQ[/url] first, and if that doesn't help, join [session=Helpdesk]Helpdesk[/session] and ask your question there.

If your problem lies anywhere outside of the chat, please send in a Ticket instead.

For a more comprehensive guide as how and when to report another user, please [url=https://wiki.f-list.net/How_to_Report_a_User]consult this page.[/url]

Please provide a brief summary of your problem and the rules that have been violated.
[color=red]DO NOT PASTE LOGS INTO THE "REPORT TEXT" FIELD.
SELECT THE TAB YOU WISH TO REPORT, LOGS ARE AUTOMATICALLY ATTACHED[/color]`,
  'chat.report.conversation': 'Reporting tab',
  'chat.report.reporting': 'Reporting user',
  'chat.report.general':
    'No one in particular. If you wish to report a specific user, please right-click them and select "Report".',
  'chat.report.text': 'Report text',
  'chat.recentConversations': 'Recent Conversations',
  'chat.channelJoin': 'Join a channel',
  'settings.tabs.general': 'General',
  'settings.tabs.look': 'Look and feel',
  'settings.tabs.notifications': 'Notifications',
  'settings.tabs.behavior': 'App behavior',
  'settings.tabs.accessibility': 'Accessibility',
  'settings.tabs.advanced': 'Advanced',
  'settings.tabs.hideAds': 'Hidden users',
  'settings.tabs.import': 'Import',
  'settings.comingsoon': 'Coming soon.',
  'settings.open': 'Settings',
  'settings.action': 'Change settings',
  'settings.character': 'Character Settings',
  'settings.hideAds.empty': `You aren't currently hiding the ads of any users.`,
  'settings.import': 'Import settings',
  'settings.import.selectCharacter': 'Select a character',
  'settings.import.confirm': `You are importing settings from your character {0}.
This will overwrite any and all settings, pinned conversations and conversation settings of character {1}.
Logs and recent conversations will not be touched.
You will be logged out. Once you log back in, the settings will have been imported.
Are you sure?`,
  'settings.playSound': 'Play notification sounds',
  'settings.notifications': 'Show desktop/push notifications',
  'settings.clickOpensMessage':
    'Clicking users opens messages (instead of their profile)',
  'settings.enterSend': 'Enter sends messages (shows send button if disabled)',
  'settings.disallowedTags': 'Disallowed BBCode tags (comma-separated)',
  'settings.highlight': 'Notify for messages containing your name',
  'settings.highlightWords': 'Custom highlight notify words (comma-separated)',
  'settings.highlightUsers':
    'Notify when the following characters send a message in a channel (comma-separated)',
  'settings.highlightUsers.conversation':
    'Notify when the following characters send a message (comma-separated)',
  'settings.showAvatars': 'Show character avatars',
  'settings.animatedEicons': 'Animate [eicon]s',
  'settings.idleTimer': 'Idle timer (minutes, clear to disable)',
  'settings.messageSeparators': 'Display separators between messages',
  'settings.eventMessages':
    'Also display console messages (like login/logout, status changes) in current tab',
  'settings.joinMessages': 'Display join/leave messages in channels',
  'settings.alwaysNotify': 'Play sounds even when looking at the tab',
  'settings.closeToTray': 'Close to tray',
  'settings.behavior.chat': 'Chat',
  'settings.behavior.window': 'Window',
  'settings.spellcheck': 'Spellcheck',
  'settings.spellcheck.language': 'Languages',
  'settings.spellcheck.disabled': 'Disabled',
  'settings.displayLanguage': 'Display Language (coming soon)',
  'settings.sounds': 'Sounds',
  'settings.soundTheme': 'Sound Theme',
  'settings.theme': 'Theme',
  'settings.theme.textColors': 'Text and colors',
  'settings.theme.sync': 'Sync with system theme (coming soon)',
  'settings.theme.sync.light': 'Light mode theme',
  'settings.theme.sync.dark': 'Dark mode theme',
  'settings.theme.vanillaBbcode': 'Use vanilla BBCode colors',
  'settings.theme.vanillaBbcode.legibilityNote':
    'These colors might not be legible on all themes.',
  'settings.theme.vanillaGenders': 'Use vanilla gender colours',
  'settings.theme.vanillaGenders.note':
    "Show the original 'vanilla' gender colours regardless of the current theme.",
  'settings.theme.bbcodeGlow': 'Enable BBCode glow (text shadow)',
  'settings.theme.bbcodeGlow.note':
    'Adds a subtle glow to certain BBCode-coloured text without changing the colour palette.',
  'settings.profileViewer': 'Use profile viewer',
  'settings.logDir': 'Change log location',
  'settings.logDir.confirm': `Do you want to set your log location to {0}?

No files will be moved. If you click Yes here, Horizon will shut down. If you would like to keep your log files, please move them manually before restarting Horizon.

Current log location: {1}`,
  'settings.logDir.inAppDir':
    'Please set your log directory to a location outside of the Horizon installation directory, as it would otherwise be overwritten during an update.',
  'settings.logMessages': 'Log messages',
  'settings.logAds': 'Log ads',
  'settings.fontSize': 'Font size (experimental)',
  'settings.showNeedsReply':
    'Show indicator on PM tabs with unanswered messages',
  'settings.defaultHighlights': 'Use global highlight words',
  'settings.colorBookmarks': 'Show friends/bookmarks in a different colour',
  'settings.updates': 'Updates',
  'settings.updateCheck': 'Automatically check for updates',
  'settings.beta': 'Opt-in to test unstable prerelease updates',
  'settings.hwAcceleration': 'Enable hardware acceleration (requires restart)',
  'settings.bbCodeBar': 'Show BBCode formatting bar',
  'settings.browserOption': 'Set default browser',
  'settings.browserOptionHeader': 'Browser Settings',
  'settings.browserOptionTitle': 'Browser Path',
  'settings.browserOptionPath': 'Path to browser executable',
  'settings.browserOptionArguments': 'Arguments to pass to executable',
  'settings.browserOptionArgumentsHelp':
    'Arguments are separated by spaces. Use %s to insert the URL.',
  'settings.browserOptionBrowse': 'Browse',
  'settings.browserOptionSave': 'Save',
  'settings.browserOptionReset': 'Reset to default',
  'settings.customCss': 'Custom user stylesheet (Experimental)',
  'settings.customCss.enabled': 'Use custom CSS',
  'settings.customCss.css': 'Custom CSS',
  'settings.customCss.warning':
    "Warning: Don't enter anything in here from people you do not fully trust.",
  'settings.risingDisableWindowsHighContrast':
    'Disable Windows high-contrast mode',
  'settings.system': 'System',
  'settings.systemLogLevel': 'System Log Level',
  'settings.charactersToGeneral':
    'In the nearby future, most of these settings will be moved to the global settings menu, where they will be applied globally across your characters. Settings like your pings, or other similar settings that can also be set on a per-conversation level will remain character-specific though.',
  'settings.charactersToGeneral.instructions':
    'This new settings menu can be found under the app menu in Horizon > Preferences. Check it out!',
  'settings.charactersToGeneral.generalInfo':
    "Looking a bit empty? In the nearby future, most of the settings in the character-specific settings (the ones you see in the chat window once you've signed in) will be moved to this general window, where they will be applied globally across your characters.",
  'settings.horizonCacheDraftMessages':
    'Automatically save and restore in-progress messages while using Horizon (change requires new tab)',
  'settings.horizonSaveDraftMessagesToDiskTimer':
    'How often to backup save in-progress messages to disk (seconds, minimum 5, change requires new tab)',
  'fixLogs.action': 'Fix corrupted logs',
  'fixLogs.text': `There are a few reason log files can become corrupted - log files from old versions with bugs that have since been fixed or incomplete file operations caused by computer crashes are the most common.
If one of your log files is corrupted, you may get an "Unknown Type" error when you log in or when you open a specific tab. You may also experience other issues.
This is not a tool you should use if you're not sure it's absolutely necessary. It will go through and rewrite all of your log files.
Once this process has started, do not interrupt it or your logs will get corrupted even worse.`,
  'fixLogs.character': 'Character',
  'fixLogs.error':
    'An error has occurred while attempting to fix your logs. Please ask in for further assistance in the Helpdesk channel.',
  'fixLogs.success':
    'Your logs have been fixed. If you experience any more issues, please ask in for further assistance in the Helpdesk channel.',
  'conversationSettings.title': 'Tab Settings',
  'conversationSettings.action': 'Edit settings for {0}',
  'conversationSettings.save': 'Save settings',
  'conversationSettings.default': 'Default',
  'conversationSettings.true': 'Yes',
  'conversationSettings.false': 'No',
  'conversationSettings.notify': 'Notify for messages',
  'channel.mode.ads': 'Ads',
  'channel.mode.chat': 'Chat',
  'channel.mode.both': 'Both',
  'channel.mode.ads.countdown': 'Ads ({0}m{1}s)',
  'channel.official': 'Official channel',
  'channel.description': 'Description',
  'manageChannel.open': 'Manage',
  'manageChannel.action': 'Manage {0}',
  'manageChannel.submit': 'Save settings',
  'manageChannel.mods': 'Channel moderators',
  'manageChannel.modAdd': 'Add moderator',
  'manageChannel.modAddName': 'New moderator name',
  'manageChannel.isPublic':
    'Is public (i.e. in the channel list; anyone can join without an invite)',
  'manageChannel.mode': 'Allowed messages',
  'manageChannel.description': 'Description',
  'characterSearch.open': 'Character Search',
  'characterSearch.action': 'Search characters',
  'characterSearch.again': 'Start another search',
  'characterSearch.results': 'Results',
  'characterSearch.kinks': 'Kinks',
  'characterSearch.genders': 'Genders',
  'characterSearch.orientations': 'Orientations',
  'characterSearch.languages': 'Languages',
  'characterSearch.furryprefs': 'Furry preferences',
  'characterSearch.roles': 'Dom/sub roles',
  'characterSearch.positions': 'Positions',
  'characterSearch.species': 'Species (beta)',
  'characterSearch.bodytypes': 'Body types',
  'characterSearch.error.noResults': 'There were no search results.',
  'characterSearch.error.throttle':
    'You must wait five seconds between searches.',
  'characterSearch.error.tooManyResults':
    'There are too many search results, please narrow your search.',
  'events.broadcast': '{0} has broadcast: {1}',
  'events.broadcast.notification': 'Broadcast from {0}',
  'events.invite': '{0} has invited you to join {1}',
  'events.error': 'Error: {0}',
  'events.rtbCommentReply': '{0} replied to your comment on the {1}: {2}',
  'events.rtbComment': '{0} commented on your {1}: {2}',
  'events.rtbComment_bugreport': 'bug report',
  'events.rtbComment_changelog': 'changelog post',
  'events.rtbComment_feature': 'feature request',
  'events.rtbComment_newspost': 'news post',
  'events.rtb_note': '{0} has sent you a note: {1}',
  'events.rtb_bugreport': '{0} submitted a bug report: {1}',
  'events.rtb_featurerequest': '{0} submitted a feature request: {1}',
  'events.rtb_grouprequest': '{0} requested a group named: {1}',
  'events.rtb_helpdeskreply':
    '{0} replied to [url={1}]a help desk ticket you are involved in[/url].',
  'events.rtb_helpdeskticket': '{0} submitted a help desk ticket: {1}',
  'events.rtb_friendrequest': '{0} has sent you a friend request.',
  'events.report':
    '[b][color=red]MODERATOR ALERT[/color][/b] - Report by {0}:\nCurrent tab: {1}\nReport: {2}',
  'events.report.confirmed': "{0} is handling {1}'s report.",
  'events.report.confirm': 'Confirm report',
  'events.report.viewLog': 'View log',
  'events.report.noLog': 'No log available',
  'events.status': '{0} is now {1}.',
  'events.status.message': '{0} is now {1}: {2}',
  'events.status.own': 'You are now {0}.',
  'events.status.ownMessage': 'You are now {0}: {1}',
  'events.ban': '{2} has banned {1} from {0}.',
  'events.timeout': '{2} has timed out {1} from {0} for {3} minutes.',
  'events.kick': '{2} has kicked {1} from {0}.',
  'events.login': '{0} has logged in.',
  'events.logout': '{0} has logged out.',
  'events.channelJoin': '{0} has joined the channel.',
  'events.channelLeave': '{0} has left the channel.',
  'events.ignore_add':
    "You are now ignoring {0}'s messages. Should they go around this by any means, please report it using the Alert Staff button.",
  'events.ignore_delete': '{0} is now allowed to send you messages again.',
  'events.uptime':
    'Server has been running since {0}, with currently {1} channels and {2} users, a total of {3} accepted connections, and {4} maximum users.',
  'events.highlight': '{0} said "{1}" in {2}',
  'events.watchedUserPosted': '{0} spoke in {1}',
  'commands.unknown':
    'Unknown command. For a list of valid commands, please click the ? button.',
  'commands.badContext':
    'This command cannot be used here. Please use the Help (click the ? button) if you need further information.',
  'commands.tooFewParams':
    'This command requires more parameters. Please use the Help (click the ? button) if you need further information.',
  'commands.invalidParam':
    'The value for the parameter {0} is invalid. Please use the Help (click the ? button) if you need further information.',
  'commands.invalidCharacter':
    'The character you entered is not online. Put the name in double quotes if you want to override. Please use the Help (click the ? button) if you need further information.',
  'commands.emptyCharacter': 'Enter a character name.',
  'commands.help': 'Command Help',
  'commands.help.syntax': 'Syntax: {0}',
  'commands.help.contextChannel':
    'This command can be executed in a channel tab.',
  'commands.help.contextPrivate':
    'This command can be executed in a private conversation tab.',
  'commands.help.contextConsole':
    'This command can be executed in the console tab.',
  'commands.help.permissionRoomOp':
    'This command requires you to be an operator in the selected channel.',
  'commands.help.permissionRoomOwner':
    'This command requires you to be the owner of the selected channel.',
  'commands.help.permissionChannelMod':
    'This command requires you to be an official channel moderator.',
  'commands.help.permissionChatOp':
    'This command requires you to be a global chat operator.',
  'commands.help.permissionAdmin': 'This command requires you to be an admin.',
  'commands.help.parameters': 'Parameters:',
  'commands.help.paramOptional': '{0} (optional):',
  'commands.param_character': 'Character',
  'commands.param_character.help':
    'The name of a character. Must be valid and logged in - override by putting in double quotes.',
  'commands.reward': 'Reward',
  'commands.reward.help':
    'Reward a user, giving them a special status until they change it or log out.',
  'commands.greports': 'Pending reports',
  'commands.greports.help':
    'Requests a list of pending chat reports from the server.',
  'commands.join': 'Join channel',
  'commands.join.help': 'Joins the channel with the given name/ID.',
  'commands.join.param0': 'Channel ID',
  'commands.join.param0.help':
    'The name/ID of the channel to join. For official channels, this is the name, for private rooms this is the ID.',
  'commands.close': 'Close tab',
  'commands.close.help': 'Closes the currently viewed PM or channel tab.',
  'commands.clear': 'Clear tab',
  'commands.clear.help':
    'Clears the currently viewed tab, emptying its message list. No logs will be deleted.',
  'commands.uptime': 'Uptime',
  'commands.uptime.help': 'Requests statistics about server uptime.',
  'commands.status': 'Set status',
  'commands.status.help': 'Sets your status along with an optional message.',
  'commands.status.param0': 'Status',
  'commands.status.param0.help':
    'A valid status, namely "online", "busy", "looking", "away" or "dnd".',
  'commands.status.param1': 'Message',
  'commands.status.param1.help':
    'An optional status message of up to 255 bytes.',
  'commands.priv': 'Open conversation',
  'commands.priv.help': 'Opens a conversation with the given character.',
  'commands.broadcast': 'Chat broadcast',
  'commands.broadcast.help':
    'Broadcast a message, alerting all currently connected characters.',
  'commands.broadcast.param0': 'Message',
  'commands.broadcast.param0.help':
    'Broadcast message. May contain valid chat BBCode.',
  'commands.makeroom': 'Create private room',
  'commands.makeroom.help':
    'Creates a private room. Only people you /invite will be able to join it, and it will not be listed, until you open it with /openroom.',
  'commands.makeroom.param0': 'Room name',
  'commands.makeroom.param0.help':
    'A name for your new private room. Must be 1-64 in length.',
  'commands.ignore': 'Ignore a character',
  'commands.ignore.help':
    'Ignores the given character, and discards all of their messages, except in channels where you are a moderator.',
  'commands.unignore': 'Unignore a character',
  'commands.unignore.help':
    'Removes the given character from your ignore list, and allows them to send you messages again.',
  'commands.ignorelist': 'Ignore list',
  'commands.ignorelist.help':
    'Lists all of the characters currently on your ignore list.',
  'commands.roll': 'Dice roll',
  'commands.roll.help':
    'Rolls dice (RNG), displaying the result to all members of the current tab.',
  'commands.roll.param0': 'Dice',
  'commands.roll.param0.help':
    'Syntax: [1-9]d[1-100]. Addition and subtraction of rolls and fixed numbers is also possible. Example: /roll 1d6+1d20-5',
  'commands.bottle': 'Spin the bottle',
  'commands.bottle.help':
    'Spins a bottle, randomly selecting a member of the current tab and displaying it to all.',
  'commands.me': 'Post as action',
  'commands.me.help':
    'This will cause your message to be formatted differently, as an action your character is performing.',
  'commands.me.param0': 'Message',
  'commands.me.param0.help':
    'The message to post as an action - the action you would like your character to perform.',
  'commands.warn': 'Warn channel',
  'commands.warn.help':
    'Provides a way for channel moderators to warn/alert members. This message will be formatted differently, and is often used as a warning before moderator action.',
  'commands.warn.param0': 'Message',
  'commands.warn.param0.help': 'The message to post as a warning.',
  'commands.kick': 'Channel kick',
  'commands.kick.help':
    'Removes a character from the current channel. They are free to rejoin - use /ban or /timeout if you want to get rid of them for a longer period of time.',
  'commands.ban': 'Channel ban',
  'commands.ban.help':
    'Bans a character from the current channel. They will not be able to rejoin unless and until you undo this with /unban.',
  'commands.unban': 'Channel unban',
  'commands.unban.help':
    'Unbans a character from the current channel, allowing them to rejoin.',
  'commands.banlist': 'Channel ban list',
  'commands.banlist.help':
    'Requests the ban list for the current channel. The server will reply with a system response, which you will be able to view in the Console tab.',
  'commands.timeout': 'Channel timeout',
  'commands.timeout.help':
    'Temporarily bans the given character from the current channel. Mind the comma in the syntax!',
  'commands.timeout.param1': 'Duration',
  'commands.timeout.param1.help':
    'The number of minutes to ban the character for.',
  'commands.op': 'Promote to Channel OP',
  'commands.op.help':
    'Promotes a character to channel OP in the current channel.',
  'commands.deop': 'Demote from Channel OP',
  'commands.deop.help':
    'Demotes a character from channel OP in the current channel.',
  'commands.oplist': 'List Channel OPs',
  'commands.oplist.help': 'Lists all the OPs of the current channel.',
  'commands.setowner': 'Set channel owner',
  'commands.setowner.help':
    'Set the owner of a channel to another character. The previous owner will be demoted to a member.',
  'commands.invite': 'Invite to room',
  'commands.invite.help':
    'Invites a character to the current channel. This will allow them to join it even if it is a closed room. You can revoke this with /kick, /ban or /timeout.',
  'commands.closeroom': 'Close room',
  'commands.closeroom.help':
    'Closes the current channel. This will only allow people you /invite to join it, and remove it from the rooms list.',
  'commands.openroom': 'Open room',
  'commands.openroom.help':
    'Opens the current channel. This will allow anyone to join it, and let it be listed in the rooms list.',
  'commands.killchannel': 'Destroy room',
  'commands.killchannel.help':
    'PERMANENTLY kills/destroys/removes the current room. All associated settings and prestige will be lost. Make sure this is what you want to do, you cannot undo it.',
  'commands.createchannel': 'Create official channel',
  'commands.createchannel.help': 'Creates an official, staff-moderated room.',
  'commands.createchannel.param0': 'Channel name',
  'commands.createchannel.param0.help': 'A name for the new official channel.',
  'commands.setmode': 'Set room mode',
  'commands.setmode.help':
    'Set whether ads and/or chat are allowed in the current channel.',
  'commands.setmode.param0': 'Mode',
  'commands.setmode.param0.help':
    'A valid room mode, namely "ads", "chat" or "both".',
  'commands.setdescription': 'Set room description',
  'commands.setdescription.help': 'Set the description for the current room.',
  'commands.setdescription.param0': 'Description',
  'commands.setdescription.param0.help':
    'New description for the room. May contain up to 50,000 characters, and valid chat BBCode.',
  'commands.code': 'Copy channel code',
  'commands.code.help':
    'Copies a BBCode link to the current channel into your clipboard. This can be pasted anywhere else on chat to render a link to this channel.',
  'commands.code.success': 'Channel code copied to your clipboard.',
  'commands.gkick': 'Chat kick',
  'commands.gkick.help':
    'Removes a character from the chat. They are free to rejoin - use /gban or /gtimeout if you want to get rid of them for a longer period of time.',
  'commands.gban': 'Chat ban',
  'commands.gban.help':
    'Bans a character from the chat. They will not be able to reconnect unless and until you undo this with /unban.',
  'commands.gunban': 'Chat unban',
  'commands.gunban.help':
    'Unbans a character from the chat, allowing them to reconnect.',
  'commands.gtimeout': 'Chat timeout',
  'commands.gtimeout.help':
    'Temporarily bans the given character from F-Chat. Mind the comma in the syntax!',
  'commands.gtimeout.param1': 'Duration',
  'commands.gtimeout.param1.help':
    'The number of minutes to ban the character for.',
  'commands.gtimeout.param2': 'Reason',
  'commands.gtimeout.param2.help': 'The reason for the chat timeout.',
  'commands.gop': 'Promote to Chat OP',
  'commands.gop.help': 'Promotes a character to global chat OP.',
  'commands.gdeop': 'Demote from Chat OP',
  'commands.gdeop.help': 'Demotes a character from global chat OP.',
  'commands.scop': 'Promote to Super COP',
  'commands.scop.help':
    'Promotes a character to super channel operator, making them an operator in all public channels.',
  'commands.scdeop': 'Demote from Super COP',
  'commands.scdeop.help': 'Demotes a character from super channel operator.',
  'commands.reloadconfig': 'Reload config',
  'commands.reloadconfig.help': 'Reload server-side config from disk.',
  'commands.reloadconfig.param0': 'Save?',
  'commands.reloadconfig.param0.help':
    'Save ops, bans and channels to disk first.',
  'commands.xyzzy': 'Debug',
  'commands.xyzzy.help': 'Execute debug command on the server.',
  'commands.xyzzy.param0': 'Command',
  'commands.xyzzy.param0.help': 'The command to execute.',
  'commands.xyzzy.param1': 'Arguments',
  'commands.xyzzy.param1.help': 'The arguments to the command.',
  'status.online': 'Online',
  'status.away': 'Away',
  'status.busy': 'Busy',
  'status.looking': 'Looking',
  'status.dnd': 'Do Not Disturb',
  'status.idle': 'Idle',
  'status.offline': 'Offline',
  'status.crown': 'Rewarded',
  'pager.messages': 'Messages',
  'pager.notes': 'Notes',
  'changelog.version': 'Changelog for {0}',
  'changelog.compare': 'Horizon {0} is available, you are using {1}.',
  'changelog.quitAndDownload': 'Quit and download',
  'changelog.quitAndDownload.confirm':
    'You are still connected to chat. \nAre you sure you want to exit and download the update right now?',
  'changelog.download': 'Download',
  'importer.importGeneral':
    'slimCat data has been detected on your computer.\nWould you like to import general settings?',
  'importer.importCharacter': `slimCat data for this character has been detected on your computer.
Would you like to import settings and logs?
This may take a while.
Any existing FChat 3.0 data for this character will be overwritten.`,
  'importer.importing': 'Importing data',
  'importer.importingNote':
    'Importing logs. This may take a couple of minutes. Please do not close the application, even if it appears to hang for a while, as you may end up with incomplete logs.',
  'importer.error':
    'There was an error importing your settings. The defaults will be used.',
  'quickJump.action': 'Switch conversations',
  'quickJump.title': 'Quick Jump',
  'quickJump.placeholder': 'Search channels and conversations...',
  'quickJump.noResults': 'No results found',
  'quickJump.openNewConversation': 'Open new conversation with "{0}"',
  'quickJump.consoleDescription': 'Console tab',
  'quickJump.privateConversation': 'Private conversation',
  'quickJump.channel': 'Channel',
  'quickJump.recent': 'Recent conversation',
  'quickJump.members': 'members'
};

export default function l(key: string, ...args: (string | number)[]): string {
  let i = args.length;
  let str = strings[key];
  if (str === undefined) {
    if (process.env.NODE_ENV !== 'production')
      throw new Error(`String ${key} does not exist.`);
    return '';
  }
  while (i-- > 0)
    str = str.replace(new RegExp(`\\{${i}\\}`, 'igm'), args[i].toString());
  return str;
}
