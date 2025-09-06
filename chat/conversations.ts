import { queuedJoin } from '../fchat/channels';
import { decodeHTML } from '../fchat/common';
// import { CharacterCacheRecord } from '../learn/profile-cache';
import { AdManager } from './ads/ad-manager';
import {
  characterImage,
  ConversationSettings,
  EventMessage,
  BroadcastMessage,
  Message,
  messageToString
} from './common';
import core from './core';
import { Channel, Character, Conversation as Interfaces } from './interfaces';
import l from './localize';
import {
  CommandContext,
  isAction,
  isCommand,
  isWarn,
  parse as parseCommand
} from './slash_commands';
import MessageType = Interfaces.Message.Type;
import { EventBus } from './preview/event-bus';
import throat from 'throat';
import Bluebird from 'bluebird';
import log from 'electron-log';
import isChannel = Interfaces.isChannel;

/**
 * @constant
 * How frequently the contents of the textbox in each conversation should save to the in-memory cache, if enabled.
 */
const CONVERSATION_CACHE_UPDATE_FREQ_IN_MS = 1000;

function createMessage(
  this: any,
  type: MessageType,
  sender: Character,
  text: string,
  time?: Date
): Message {
  if (type === MessageType.Message && isAction(text)) {
    type = MessageType.Action;
    text = text.substr(text.charAt(4) === ' ' ? 4 : 3);
  }
  return new Message(type, sender, text, time);
}

function safeAddMessage(
  this: any,
  messages: Interfaces.Message[],
  message: Interfaces.Message,
  max: number
): void {
  if (messages.length >= max) messages.shift();
  messages.push(message);
}

abstract class Conversation implements Interfaces.Conversation {
  abstract enteredText: string;
  abstract readonly name: string;
  messages: Interfaces.Message[] = [];
  errorText = '';
  unread = Interfaces.UnreadState.None;
  lastRead: Interfaces.Message | undefined = undefined;
  infoText = '';
  abstract readonly maxMessageLength: number | undefined;
  _settings: Interfaces.Settings | undefined;
  protected abstract context: CommandContext;
  protected maxMessages = 50;
  protected insertCount = 0;
  protected allMessages: Interfaces.Message[] = [];
  readonly reportMessages: Interfaces.Message[] = [];
  private lastSent = '';
  // private loadedMore = false;
  adManager: AdManager;
  cacheActive = false;
  protected cacheInterval: NodeJS.Timer | undefined;

  public static readonly conversationThroat = throat(1); // make sure user posting and ad posting won't get in each others' way

  constructor(
    readonly key: string,
    public _isPinned: boolean
  ) {
    this.adManager = new AdManager(this);
    core.cache.conversationDraftCache.loadCache();
  }
  markRead(): void {
    this.lastRead = this.messages[this.messages.length - 1];
    this.unread = Interfaces.UnreadState.None;
  }

  get settings(): Interfaces.Settings {
    //tslint:disable-next-line:strict-boolean-expressions
    return (
      this._settings ||
      (this._settings = state.settings[this.key] || new ConversationSettings())
    );
  }

  set settings(value: Interfaces.Settings) {
    this._settings = value;
    state.setSettings(this.key, value); //tslint:disable-line:no-floating-promises
  }

  get isPinned(): boolean {
    return this._isPinned;
  }

  set isPinned(value: boolean) {
    if (value === this._isPinned) return;
    this._isPinned = value;
    state.savePinned(); //tslint:disable-line:no-floating-promises
  }

  clearText(): void {
    setImmediate(() => {
      this.enteredText = '';
      core.cache.conversationDraftCache.deregister(this.name);
    });
  }

  async send(): Promise<void> {
    if (this.enteredText.length === 0) return;

    if (isCommand(this.enteredText)) {
      const parsed = parseCommand(this.enteredText, this.context);
      if (typeof parsed === 'string') this.errorText = parsed;
      else {
        parsed.call(this);
        this.lastSent = this.enteredText;
        this.clearText();
      }
    } else {
      this.lastSent = this.enteredText;
      await this.doSend();
    }
  }

  //tslint:disable-next-line:no-async-without-await
  abstract async addMessage(message: Interfaces.Message): Promise<void>;

  loadLastSent(): void {
    this.enteredText = this.lastSent;
  }

  loadMore(): boolean {
    if (this.messages.length >= this.allMessages.length) return false;
    this.maxMessages += 50;
    // this.loadedMore = true;
    this.messages = this.allMessages.slice(-this.maxMessages);

    EventBus.$emit('conversation-load-more', { conversation: this });

    return true;
  }

  show(): void {
    state.show(this);
  }

  onHide(): void {
    this.errorText = '';
    this.lastRead = this.messages[this.messages.length - 1];
    this.maxMessages = 50;
    this.messages = this.allMessages.slice(-this.maxMessages);
    // this.loadedMore = false;
    this.insertCount = 0;
  }

  // Keeps the message-list from re-rendering every time when full, cleaning up after itself every 200 messages
  stretch(): void {
    if (
      core.conversations.selectedConversation !== this ||
      this.messages.length < this.maxMessages
    ) {
      return;
    }

    if (this.insertCount < 200) {
      this.maxMessages += 1;
      this.insertCount += 1;
    } else {
      const removed = this.insertCount;

      this.maxMessages -= removed;
      this.insertCount = 0;
      this.messages = this.allMessages.slice(-this.maxMessages);

      log.debug('conversation.view.cleanup', {
        channel: this.name,
        removed,
        left: this.messages.length,
        limit: this.maxMessages
      });
    }
  }

  clear(): void {
    this.allMessages = [];
    this.messages = [];
  }

  abstract close(): void;

  protected safeAddMessage(message: Interfaces.Message): void {
    safeAddMessage(this.reportMessages, message, 500);
    safeAddMessage(this.allMessages, message, 500);
    safeAddMessage(this.messages, message, this.maxMessages);
  }

  protected abstract doSend(): void | Promise<void>;

  protected static readonly POST_DELAY = 1250;

  public static async testPostDelay(): Promise<void> {
    const lastPostDelta = Date.now() - core.cache.getLastPost().getTime();

    // console.log('Last Post Delta', lastPostDelta, ((lastPostDelta < Conversation.POST_DELAY) && (lastPostDelta > 0)));

    if (lastPostDelta < Conversation.POST_DELAY && lastPostDelta > 0) {
      await Bluebird.delay(Conversation.POST_DELAY - lastPostDelta);
    }
  }

  isSendingAutomatedAds(): boolean {
    return this.adManager.isActive();
  }

  toggleAutomatedAds(): void {
    this.adManager.isActive() ? this.adManager.stop() : this.adManager.start();
  }

  hasAutomatedAds(): boolean {
    return this.adManager.getAds().length > 0;
  }
}

class PrivateConversation
  extends Conversation
  implements Interfaces.PrivateConversation
{
  readonly name = this.character.name;
  readonly context = CommandContext.Private;
  typingStatus: Interfaces.TypingStatus = 'clear';
  readonly maxMessageLength = core.connection.vars.priv_max;
  private _enteredText = '';
  private ownTypingStatus: Interfaces.TypingStatus = 'clear';
  private timer: number | undefined;
  private logPromise = core.logs.getBacklog(this).then(messages => {
    this.allMessages.unshift(...messages);
    this.reportMessages.unshift(...messages);
    this.messages = this.allMessages.slice();
  });

  constructor(readonly character: Character) {
    super(
      character.name.toLowerCase(),
      state.pinned.private.indexOf(character.name) !== -1
    );
    this.lastRead = this.messages[this.messages.length - 1];

    initConversationCache.call(this);
  }

  get enteredText(): string {
    return this._enteredText;
  }

  set enteredText(value: string) {
    this._enteredText = value;
    if (this.timer !== undefined) clearTimeout(this.timer);
    if (value.length > 0) {
      if (this.ownTypingStatus !== 'typing') this.setOwnTyping('typing');
      this.timer = window.setTimeout(() => this.setOwnTyping('paused'), 5000);
    } else if (this.ownTypingStatus !== 'clear') this.setOwnTyping('clear');
  }

  async addMessage(message: Interfaces.Message): Promise<void> {
    await this.logPromise;

    this.stretch();

    this.safeAddMessage(message);
    if (message.type !== Interfaces.Message.Type.Event) {
      if (core.state.settings.logMessages)
        await core.logs.logMessage(this, message);
      if (
        this.settings.notify !== Interfaces.Setting.False &&
        message.sender !== core.characters.ownCharacter
      )
        await core.notifications.notify(
          this,
          message.sender.name,
          message.text,
          characterImage(message.sender.name),
          'attention'
        );
      if (this !== state.selectedConversation || !state.windowFocused)
        this.unread = Interfaces.UnreadState.Mention;
      this.typingStatus = 'clear';
    }
  }

  async close(): Promise<void> {
    state.privateConversations.splice(
      state.privateConversations.indexOf(this),
      1
    );
    delete state.privateMap[this.character.name.toLowerCase()];
    await state.savePinned();
    if (state.selectedConversation === this) state.show(state.consoleTab);
    clearInterval(this.cacheInterval);
  }

  async sort(newIndex: number): Promise<void> {
    state.privateConversations.splice(
      state.privateConversations.indexOf(this),
      1
    );
    state.privateConversations.splice(newIndex, 0, this);
    return state.savePinned();
  }

  public async sendMessageEx(messageText: string): Promise<void> {
    if (this.character.status === 'offline') {
      this.errorText = l('chat.errorOffline', this.character.name);
      return;
    }

    if (this.character.isIgnored) {
      this.errorText = l('chat.errorIgnored', this.character.name);
      return;
    }

    await Conversation.conversationThroat(async () => {
      await Conversation.testPostDelay();

      core.connection.send('PRI', {
        recipient: this.name,
        message: messageText
      });
      core.cache.markLastPostTime();

      const message = createMessage(
        MessageType.Message,
        core.characters.ownCharacter,
        messageText
      );
      this.safeAddMessage(message);

      if (core.state.settings.logMessages)
        await core.logs.logMessage(this, message);
    });
  }

  protected async doSend(): Promise<void> {
    await this.logPromise;
    if (this.character.status === 'offline') {
      this.errorText = l('chat.errorOffline', this.character.name);
      return;
    }
    if (this.character.isIgnored) {
      this.errorText = l('chat.errorIgnored', this.character.name);
      return;
    }

    if (this.adManager.isActive()) {
      this.errorText =
        'Cannot send ads manually while ad auto-posting is active';
      return;
    }

    const messageText = this.enteredText;

    this.clearText();

    await Conversation.conversationThroat(async () => {
      await Conversation.testPostDelay();

      core.connection.send('PRI', {
        recipient: this.name,
        message: messageText
      });
      core.cache.markLastPostTime();

      const message = createMessage(
        MessageType.Message,
        core.characters.ownCharacter,
        messageText
      );
      this.safeAddMessage(message);

      if (core.state.settings.logMessages)
        await core.logs.logMessage(this, message);
      this.markRead();
    });
  }

  private setOwnTyping(status: Interfaces.TypingStatus): void {
    this.ownTypingStatus = status;
    core.connection.send('TPN', { character: this.name, status });
  }
}

class ChannelConversation
  extends Conversation
  implements Interfaces.ChannelConversation
{
  readonly context = CommandContext.Channel;
  readonly name = this.channel.name;
  isSendingAds = this.channel.mode === 'ads';
  nextAd = 0;
  private chat: Interfaces.Message[] = [];
  private ads: Interfaces.Message[] = [];
  private both: Interfaces.Message[] = [];
  private _mode!: Channel.Mode;
  private adEnteredText = '';
  private chatEnteredText = '';
  private logPromise = core.logs.getBacklog(this).then(messages => {
    this.both.unshift(...messages);
    this.chat.unshift(...this.both.filter(x => x.type !== MessageType.Ad));
    this.ads.unshift(...this.both.filter(x => x.type === MessageType.Ad));
    this.reportMessages.unshift(...messages);
    this.lastRead = this.messages[this.messages.length - 1];
    this.messages = this.allMessages.slice(-this.maxMessages);
  });

  constructor(readonly channel: Channel) {
    super(
      `#${channel.id.replace(/[^\w- ]/gi, '')}`,
      state.pinned.channels.indexOf(channel.id) !== -1
    );
    core.watch<Channel.Mode | undefined>(
      function (): Channel.Mode | undefined {
        const c = this.channels.getChannel(channel.id);
        return c !== undefined ? c.mode : undefined;
      },
      (value: Channel.Mode | undefined) => {
        if (value === undefined) return;
        this.mode = value;
        if (value !== 'both') this.isSendingAds = value === 'ads';
      }
    );
    this.mode =
      channel.mode === 'both' && channel.id in state.modes
        ? state.modes[channel.id]!
        : channel.mode;

    initConversationCache.call(this);
  }

  get maxMessageLength(): number {
    return core.connection.vars[this.isSendingAds ? 'lfrp_max' : 'chat_max'];
  }

  get mode(): Channel.Mode {
    return this._mode;
  }

  set mode(mode: Channel.Mode) {
    this._mode = mode;
    this.maxMessages = 50;
    this.allMessages = this[mode];
    this.messages = this.allMessages.slice(-this.maxMessages);
    if (mode === this.channel.mode && this.channel.id in state.modes)
      delete state.modes[this.channel.id];
    else if (
      mode !== this.channel.mode &&
      mode !== state.modes[this.channel.id]
    )
      state.modes[this.channel.id] = mode;
    else return;
    state.saveModes(); //tslint:disable-line:no-floating-promises
  }

  get enteredText(): string {
    return this.isSendingAds ? this.adEnteredText : this.chatEnteredText;
  }

  set enteredText(value: string) {
    if (this.isSendingAds) this.adEnteredText = value;
    else this.chatEnteredText = value;
  }

  addModeMessage(mode: Channel.Mode, message: Interfaces.Message): void {
    safeAddMessage(this[mode], message, 500);
    if (this._mode === mode)
      safeAddMessage(this.messages, message, this.maxMessages);
  }

  async addMessage(message: Interfaces.Message): Promise<void> {
    await this.logPromise;

    this.stretch();

    if (
      (message.type === MessageType.Message ||
        message.type === MessageType.Ad) &&
      isWarn(message.text)
    ) {
      const member = this.channel.members[message.sender.name];
      if (
        (member !== undefined && member.rank > Channel.Rank.Member) ||
        message.sender.isChatOp
      )
        message = new Message(
          MessageType.Warn,
          message.sender,
          message.text.substr(6),
          message.time
        );
    }

    if (message.type === MessageType.Ad) {
      this.addModeMessage('ads', message);
      if (core.state.settings.logAds) await core.logs.logMessage(this, message);
    } else {
      this.addModeMessage('chat', message);
      if (message.type !== Interfaces.Message.Type.Event) {
        if (message.type === Interfaces.Message.Type.Warn)
          this.addModeMessage('ads', message);
        if (core.state.settings.logMessages)
          await core.logs.logMessage(this, message);
        if (
          this.unread === Interfaces.UnreadState.None &&
          (this !== state.selectedConversation || !state.windowFocused) &&
          this.mode !== 'ads'
        )
          this.unread = Interfaces.UnreadState.Unread;
      } else this.addModeMessage('ads', message);
    }
    this.addModeMessage('both', message);
    if (message.type !== Interfaces.Message.Type.Event)
      safeAddMessage(this.reportMessages, message, 500);
  }

  clear(): void {
    this.messages = [];
    this.chat.length = 0;
    this.ads.length = 0;
    this.both.length = 0;
  }

  close(): void {
    core.connection.send('LCH', { channel: this.channel.id });
    clearInterval(this.cacheInterval);
  }

  async sort(newIndex: number): Promise<void> {
    state.channelConversations.splice(
      state.channelConversations.indexOf(this),
      1
    );
    state.channelConversations.splice(newIndex, 0, this);
    return state.savePinned();
  }

  protected async doSend(): Promise<void> {
    const isAd = this.isSendingAds;

    if (isAd && this.adManager.isActive()) {
      this.errorText =
        'Cannot post ads manually while ad auto-posting is active';
      return;
    }

    if (isAd && Date.now() < this.nextAd) {
      this.errorText =
        'You must wait at least ten minutes between ad posts on this channel';
      return;
    }

    const message = this.enteredText;

    if (!isAd) {
      this.clearText();
    }

    await Conversation.conversationThroat(async () => {
      await Conversation.testPostDelay();

      core.connection.send(isAd ? 'LRP' : 'MSG', {
        channel: this.channel.id,
        message
      });
      core.cache.markLastPostTime();

      await this.addMessage(
        createMessage(
          isAd ? MessageType.Ad : MessageType.Message,
          core.characters.ownCharacter,
          message,
          new Date()
        )
      );
      if (isAd) {
        this.nextAd = Date.now() + core.connection.vars.lfrp_flood * 1000;

        // enforces property setter
        this.settings = {
          ...this.settings,
          adSettings: {
            ...this.settings.adSettings,
            lastAdTimestamp: Date.now()
          }
        };
      }
      this.markRead();
    });
  }

  hasAutomatedAds(): boolean {
    return (
      (this.mode === 'both' || this.mode === 'ads') && super.hasAutomatedAds()
    );
  }

  async sendAd(text: string): Promise<void> {
    if (text.length < 1) return;

    const initTime = Date.now();

    await Conversation.conversationThroat(async () => {
      const throatTime = Date.now();

      await Promise.all([
        await Conversation.testPostDelay(),
        await core.adCoordinator.requestTurnToPostAd()
      ]);

      const delayTime = Date.now();

      core.connection.send('LRP', { channel: this.channel.id, message: text });
      core.cache.markLastPostTime();

      log.debug('conversation.sendAd', {
        character: core.characters.ownCharacter?.name,
        channel: this.channel.name,
        throatDelta: throatTime - initTime,
        delayDelta: delayTime - throatTime,
        totalWait: delayTime - initTime,
        text
      });

      await this.addMessage(
        createMessage(
          MessageType.Ad,
          core.characters.ownCharacter,
          text,
          new Date()
        )
      );

      this.nextAd = Date.now() + core.connection.vars.lfrp_flood * 1000;

      // enforces property setter
      this.settings = {
        ...this.settings,
        adSettings: {
          ...this.settings.adSettings,
          lastAdTimestamp: Date.now()
        }
      };
    });
  }
}

class ConsoleConversation extends Conversation {
  readonly context = CommandContext.Console;
  readonly name = l('chat.consoleTab');
  readonly maxMessageLength = undefined;
  enteredText = '';

  constructor() {
    super('_', false);
    this.allMessages = [];

    initConversationCache.call(this);
  }

  close(): void {
    clearInterval(this.cacheInterval);
  }

  async addMessage(message: Interfaces.Message): Promise<void> {
    this.safeAddMessage(message);
    if (core.state.settings.logMessages)
      await core.logs.logMessage(this, message);
    if (this !== state.selectedConversation || !state.windowFocused)
      this.unread = Interfaces.UnreadState.Unread;
  }

  protected doSend(): void {
    this.errorText = l('chat.consoleChat');
  }
}

class State implements Interfaces.State {
  privateConversations: PrivateConversation[] = [];
  channelConversations: ChannelConversation[] = [];
  privateMap: { [key: string]: PrivateConversation | undefined } = {};
  channelMap: { [key: string]: ChannelConversation | undefined } = {};
  consoleTab!: ConsoleConversation;
  selectedConversation: Conversation = this.consoleTab;
  recent: Interfaces.RecentPrivateConversation[] = [];
  recentChannels: Interfaces.RecentChannelConversation[] = [];
  pinned!: { channels: string[]; private: string[] };
  settings!: { [key: string]: Interfaces.Settings };
  modes!: { [key: string]: Channel.Mode | undefined };
  windowFocused = document.hasFocus();

  get hasNew(): boolean {
    return (
      this.privateConversations.some(
        x => x.unread === Interfaces.UnreadState.Mention
      ) ||
      this.channelConversations.some(
        x => x.unread === Interfaces.UnreadState.Mention
      )
    );
  }

  getPrivate(character: Character): PrivateConversation;
  getPrivate(
    character: Character,
    noCreate: boolean = false
  ): PrivateConversation | undefined {
    const key = character.name.toLowerCase();
    let conv = state.privateMap[key];
    if (conv !== undefined) return conv;

    if (noCreate) {
      return;
    }

    void core.cache.queueForFetching(character.name);

    conv = new PrivateConversation(character);
    this.privateConversations.push(conv);
    this.privateMap[key] = conv;
    const index = this.recent.findIndex(c => c.character === conv!.name);
    if (index !== -1) this.recent.splice(index, 1);
    if (this.recent.length >= 50) this.recent.pop();
    this.recent.unshift({ character: conv.name });
    core.settingsStore.set('recent', this.recent); //tslint:disable-line:no-floating-promises
    return conv;
  }

  byKey(key: string): Conversation | undefined {
    if (key === '_') return this.consoleTab;
    key = key.toLowerCase();
    return key[0] === '#'
      ? this.channelMap[key.substr(1)]
      : this.privateMap[key];
  }

  async savePinned(): Promise<void> {
    this.pinned.channels = this.channelConversations
      .filter(x => x.isPinned)
      .map(x => x.channel.id);
    this.pinned.private = this.privateConversations
      .filter(x => x.isPinned)
      .map(x => x.name);
    await core.settingsStore.set('pinned', this.pinned);
  }

  async saveModes(): Promise<void> {
    await core.settingsStore.set('modes', this.modes);
  }

  async setSettings(key: string, value: Interfaces.Settings): Promise<void> {
    this.settings[key] = value;
    await core.settingsStore.set('conversationSettings', this.settings);
  }

  show(conversation: Conversation): void {
    if (conversation === this.selectedConversation) return;
    this.selectedConversation.onHide();
    conversation.unread = Interfaces.UnreadState.None;
    this.selectedConversation = conversation;
    EventBus.$emit('select-conversation', { conversation });
  }

  async reloadSettings(): Promise<void> {
    //tslint:disable:strict-boolean-expressions
    this.pinned = (await core.settingsStore.get('pinned')) || {
      private: [],
      channels: []
    };
    this.modes = (await core.settingsStore.get('modes')) || {};
    for (const conversation of this.channelConversations)
      conversation._isPinned =
        this.pinned.channels.indexOf(conversation.channel.id) !== -1;
    for (const conversation of this.privateConversations)
      conversation._isPinned =
        this.pinned.private.indexOf(conversation.name) !== -1;
    this.recent = (await core.settingsStore.get('recent')) || [];
    this.recentChannels =
      (await core.settingsStore.get('recentChannels')) || [];
    const settings =
      <{ [key: string]: ConversationSettings }>(
        await core.settingsStore.get('conversationSettings')
      ) || {};
    for (const key in settings) {
      settings[key] = Object.assign(new ConversationSettings(), settings[key]);
      const conv = this.byKey(key);
      if (conv !== undefined) conv._settings = settings[key];
    }
    this.settings = settings;
    //tslint:enable
  }
}

let state: State;

async function addEventMessage(
  this: any,
  message: Interfaces.Message
): Promise<void> {
  await state.consoleTab.addMessage(message);
  if (
    core.state.settings.eventMessages &&
    state.selectedConversation !== state.consoleTab
  )
    await state.selectedConversation.addMessage(message);
}

function isOfInterest(this: any, character: Character): boolean {
  return (
    character.isFriend ||
    character.isBookmarked ||
    state.privateMap[character.name.toLowerCase()] !== undefined
  );
}

async function withNeutralVisibilityPrivateConversation(
  character: Character.Character,
  cb: (p: PrivateConversation, c: Character.Character) => Promise<void>
): Promise<void> {
  const isVisibleConversation = !!(state.getPrivate as any)(character, true);
  const conv = state.getPrivate(character);

  await cb(conv, character);

  if (!isVisibleConversation) {
    await conv.close();
  }
}

export async function testSmartFilterForPrivateMessage(
  fromChar: Character.Character,
  originalMessage?: Message
): Promise<boolean> {
  const cachedProfile =
    core.cache.profileCache.getSync(fromChar.name) ||
    (await core.cache.profileCache.get(fromChar.name));
  const firstTime = cachedProfile && !cachedProfile.match.autoResponded;

  if (
    cachedProfile &&
    cachedProfile.match.isFiltered &&
    core.state.settings.risingFilter.autoReply &&
    !cachedProfile.match.autoResponded
  ) {
    cachedProfile.match.autoResponded = true;

    await Conversation.conversationThroat(async () => {
      log.debug('filter.autoresponse', { name: fromChar.name });

      await Conversation.testPostDelay();

      // tslint:disable-next-line:prefer-template

      if (core.state.settings.risingFilter.autoReplyCustom) {
        const message = {
          recipient: fromChar.name,
          message: core.state.settings.risingFilter.autoReplyCustomMessage
        };

        core.connection.send('PRI', message);
        core.cache.markLastPostTime();

        if (core.state.settings.logMessages) {
          const logMessage = createMessage(
            Interfaces.Message.Type.Message,
            core.characters.ownCharacter,
            message.message,
            new Date()
          );

          await withNeutralVisibilityPrivateConversation(fromChar, async p => {
            // core.logs.logMessage(p, logMessage)
            await p.addMessage(logMessage);
          });
        }
      } else {
        const message = {
          recipient: fromChar.name,
          message:
            '\n[sub][color=orange][b][AUTOMATED MESSAGE][/b][/color][/sub]\n' +
            'Sorry, the player of this character is not interested in characters matching your profile.\n' +
            `${core.state.settings.risingFilter.hidePrivateMessages ? ' They did not see your message. To bypass this warning, send your message again.' : ''}\n` +
            '\n' +
            '✨ Need a filter for yourself? Try out [url=https://horizn.moe/]F-Chat Horizon[/url]'
        };

        core.connection.send('PRI', message);
        core.cache.markLastPostTime();

        if (core.state.settings.logMessages) {
          const logMessage = createMessage(
            Interfaces.Message.Type.Message,
            core.characters.ownCharacter,
            message.message,
            new Date()
          );

          await withNeutralVisibilityPrivateConversation(fromChar, async p => {
            // core.logs.logMessage(p, logMessage)
            await p.addMessage(logMessage);
          });
        }
      }
    });
  }

  if (
    cachedProfile &&
    cachedProfile.match.isFiltered &&
    core.state.settings.risingFilter.hidePrivateMessages &&
    firstTime // subsequent messages bypass this filter on purpose
  ) {
    if (core.state.settings.logMessages && originalMessage && firstTime) {
      await withNeutralVisibilityPrivateConversation(fromChar, async p =>
        core.logs.logMessage(p, originalMessage)
      );
    }

    return true;
  }

  return false;
}

async function testSmartFilterForChannel(
  fromChar: Character.Character,
  conversation: ChannelConversation
): Promise<boolean> {
  if (
    (isChannel(conversation) &&
      conversation.channel.owner === '' &&
      core.state.settings.risingFilter.hidePublicChannelMessages) ||
    (isChannel(conversation) &&
      conversation.channel.owner !== '' &&
      core.state.settings.risingFilter.hidePrivateChannelMessages)
  ) {
    const cachedProfile =
      core.cache.profileCache.getSync(fromChar.name) ||
      (await core.cache.profileCache.get(fromChar.name));

    if (cachedProfile && cachedProfile.match.isFiltered && !fromChar.isChatOp) {
      return true;
    }
  }

  return false;
}

/**
 * Sets up the backend draft message cache if needed, then populates the input textbox with the saved draft if one exists. At regular
 * intervals, this also saves the current draft message to the cache to be recovered in the event of a full tab crash, disconnect (in the
 * event the tab does not attempt to save state), or process/system crash.
 * @function
 * @param {Conversation} this
 * The conversation which will control the textbox and update interval. Upon close, the interval will be terminated to prevent leaks.
 * @internal
 */
async function initConversationCache(this: Conversation): Promise<void> {
  // Restore message draft if it exists (e.g. accidentally closing the tab). Be sure the cache is reset for a new character if needed.
  await core.cache.conversationDraftCache.resetCacheIfNeeded();

  const draft = core.cache.getConversationDraft(this.name);
  this.enteredText = draft;

  if (!this.cacheActive) {
    const cachedCharacter = core.connection.character;

    this.cacheActive = true;
    this.cacheInterval = setInterval(() => {
      // A single tab may maintain state to preserve resources, say if you log out and back into the same character. "Pause" the interval
      // while the connection is inactive to save resources and prevent cache cross-talk when switching characters in the same tab.
      if (!core.connection.isOpen) return;

      // If the character has swapped, completely kill the interval, as new ones have been created.
      if (cachedCharacter !== core.connection.character) {
        this.cacheActive = false;
        clearInterval(this.cacheInterval);
        return;
      }

      this.enteredText
        ? core.cache.registerConversationDraft(this.name, this.enteredText)
        : core.cache.deregisterConversationDraft(this.name);
    }, CONVERSATION_CACHE_UPDATE_FREQ_IN_MS);
  }
}

export default function (this: any): Interfaces.State {
  state = new State();
  window.addEventListener('focus', () => {
    state.windowFocused = true;
    if (state.selectedConversation !== undefined!)
      state.selectedConversation.unread = Interfaces.UnreadState.None;
  });
  window.addEventListener('blur', () => {
    state.windowFocused = false;
    if (state.selectedConversation !== undefined!)
      state.selectedConversation.lastRead =
        state.selectedConversation.messages[
          state.selectedConversation.messages.length - 1
        ];
  });
  const connection = core.connection;
  connection.onEvent('connecting', async isReconnect => {
    state.channelConversations = [];
    state.channelMap = {};
    if (!isReconnect) {
      state.consoleTab = new ConsoleConversation();
      state.privateConversations = [];
      state.privateMap = {};
    } else state.consoleTab.unread = Interfaces.UnreadState.None;
    state.selectedConversation = state.consoleTab;
    EventBus.$emit('select-conversation', {
      conversation: state.selectedConversation
    });
    await state.reloadSettings();
  });
  connection.onEvent('connected', isReconnect => {
    if (isReconnect) return;
    for (const item of state.pinned.private)
      state.getPrivate(core.characters.get(item));
    queuedJoin(state.pinned.channels.slice());
  });
  core.channels.onEvent(async (type, channel, member) => {
    if (type === 'join')
      if (member === undefined) {
        const conv = new ChannelConversation(channel);
        state.channelMap[channel.id] = conv;
        state.channelConversations.push(conv);
        const index = state.recentChannels.findIndex(
          c => c.channel === channel.id
        );
        if (index !== -1) state.recentChannels.splice(index, 1);
        if (state.recentChannels.length >= 50) state.recentChannels.pop();
        state.recentChannels.unshift({
          channel: channel.id,
          name: conv.channel.name
        });
        core.settingsStore.set('recentChannels', state.recentChannels); //tslint:disable-line:no-floating-promises

        AdManager.onNewChannelAvailable(conv);
      } else {
        const conv = state.channelMap[channel.id];
        if (conv === undefined) return;
        if (
          conv.settings.joinMessages === Interfaces.Setting.False ||
          (conv.settings.joinMessages === Interfaces.Setting.Default &&
            !core.state.settings.joinMessages)
        )
          return;
        const text = l(
          'events.channelJoin',
          `[user]${member.character.name}[/user]`
        );
        await conv.addMessage(new EventMessage(text));
      }
    else if (member === undefined) {
      const conv = state.channelMap[channel.id];
      if (conv === undefined) return;
      state.channelConversations.splice(
        state.channelConversations.indexOf(conv),
        1
      );
      delete state.channelMap[channel.id];
      await state.savePinned();
      if (state.selectedConversation === conv) state.show(state.consoleTab);
    } else {
      const conv = state.channelMap[channel.id];
      if (conv === undefined) return;
      if (
        conv.settings.joinMessages === Interfaces.Setting.False ||
        (conv.settings.joinMessages === Interfaces.Setting.Default &&
          !core.state.settings.joinMessages)
      )
        return;
      const text = l(
        'events.channelLeave',
        `[user]${member.character.name}[/user]`
      );
      await conv.addMessage(new EventMessage(text));
    }
  });
  connection.onMessage('PRI', async (data, time) => {
    const char = core.characters.get(data.character);
    if (char.isIgnored)
      return connection.send('IGN', {
        action: 'notify',
        character: data.character
      });
    const message = createMessage(
      MessageType.Message,
      char,
      decodeHTML(data.message.trimEnd()),
      time
    );

    if ((await testSmartFilterForPrivateMessage(char, message)) === true) {
      return;
    }

    EventBus.$emit('private-message', { message });

    const conv = state.getPrivate(char);
    await conv.addMessage(message);
  });
  connection.onMessage('MSG', async (data, time) => {
    const char = core.characters.get(data.character);
    const conversation = state.channelMap[data.channel.toLowerCase()];
    if (conversation === undefined) return core.channels.leave(data.channel);
    if (char.isIgnored) return;

    const message = createMessage(
      MessageType.Message,
      char,
      decodeHTML(data.message.trimEnd()),
      time
    );

    if ((await testSmartFilterForChannel(char, conversation)) === true) {
      return;
    }

    await conversation.addMessage(message);
    EventBus.$emit('channel-message', { message, channel: conversation });

    const words = conversation.settings.highlightWords.slice();
    const watchedCharacters =
      conversation.settings.horizonHighlightUsers.slice();
    if (conversation.settings.defaultHighlights)
      words.push(...core.state.settings.highlightWords);
    watchedCharacters.push(...core.state.settings.horizonHighlightUsers);
    if (
      (conversation.settings.highlight === Interfaces.Setting.Default &&
        core.state.settings.highlight) ||
      conversation.settings.highlight === Interfaces.Setting.True
    )
      words.push(core.connection.character);
    for (let i = 0; i < words.length; ++i)
      words[i] = words[i].replace(/[^\w]/gi, '\\$&');
    //tslint:disable-next-line:no-null-keyword
    const results =
      words.length > 0
        ? message.text.match(new RegExp(`\\b(${words.join('|')})\\b`, 'i'))
        : null;
    if (results !== null) {
      await core.notifications.notify(
        conversation,
        data.character,
        l('chat.highlight', results[0], conversation.name, message.text),
        characterImage(data.character),
        'attention'
      );
      if (conversation !== state.selectedConversation || !state.windowFocused)
        conversation.unread = Interfaces.UnreadState.Mention;
      message.isHighlight = true;
      await state.consoleTab.addMessage(
        new EventMessage(
          l(
            'events.highlight',
            `[user]${data.character}[/user]`,
            results[0],
            `[session=${conversation.name}]${data.channel}[/session]`
          ),
          time
        )
      );
    } else if (watchedCharacters.indexOf(data.character) !== -1) {
      message.isHighlight = true;
      await core.notifications.notify(
        conversation,
        data.character,
        data.message,
        characterImage(data.character),
        'attention'
      );

      await state.consoleTab.addMessage(
        new EventMessage(
          l(
            'events.watchedUserPosted',
            `[user]${data.character}[/user]`,
            `[session=${conversation.name}]${data.channel}[/session]`
          ),
          time
        )
      );
      if (conversation !== state.selectedConversation || !state.windowFocused)
        conversation.unread = Interfaces.UnreadState.Mention;
    } else if (conversation.settings.notify === Interfaces.Setting.True) {
      await core.notifications.notify(
        conversation,
        conversation.name,
        messageToString(message),
        characterImage(data.character),
        'attention'
      );
      if (conversation !== state.selectedConversation || !state.windowFocused)
        conversation.unread = Interfaces.UnreadState.Mention;
    } else if (
      (message.type === MessageType.Message ||
        message.type === MessageType.Ad) &&
      isWarn(message.text)
    ) {
      const member = conversation.channel.members[message.sender.name];
      if (
        (member !== undefined && member.rank > Channel.Rank.Member) ||
        message.sender.isChatOp
      ) {
        await core.notifications.notify(
          conversation,
          conversation.name,
          data.message,
          characterImage(data.character),
          'modalert'
        );
        if (conversation !== state.selectedConversation || !state.windowFocused)
          conversation.unread = Interfaces.UnreadState.Mention;
      }
    }
  });
  connection.onMessage('LRP', async (data, time) => {
    const char = core.characters.get(data.character);
    const conv = state.channelMap[data.channel.toLowerCase()];
    if (conv === undefined) return core.channels.leave(data.channel);
    if (char.isIgnored || core.state.hiddenUsers.indexOf(char.name) !== -1)
      return;

    const msg = new Message(
      MessageType.Ad,
      char,
      decodeHTML(data.message),
      time
    );

    const p = await core.cache.resolveProfileScore(
      core.conversations.selectedConversation !== conv ||
        char === core.characters.ownCharacter,
      char,
      conv,
      msg
    );

    EventBus.$emit('channel-ad', { message: msg, channel: conv, profile: p });

    await conv.addMessage(msg);
  });
  connection.onMessage('RLL', async (data, time) => {
    const sender = core.characters.get(data.character);
    let text: string;
    if (data.type === 'bottle')
      text = l('chat.bottle', `[user]${data.target}[/user]`);
    else {
      const results =
        data.results.length > 1
          ? `${data.results.join('+')} = ${data.endresult}`
          : data.endresult.toString();
      text = l('chat.roll', data.rolls.join('+'), results);
    }
    const message = new Message(MessageType.Roll, sender, text, time);
    if ('channel' in data) {
      const channel = (<{ channel: string }>data).channel.toLowerCase();
      const conversation = state.channelMap[channel];
      if (conversation === undefined) return core.channels.leave(channel);
      if (sender.isIgnored) return;
      if (data.type === 'bottle' && data.target === core.connection.character) {
        await core.notifications.notify(
          conversation,
          conversation.name,
          messageToString(message),
          characterImage(data.character),
          'attention'
        );
        if (conversation !== state.selectedConversation || !state.windowFocused)
          conversation.unread = Interfaces.UnreadState.Mention;
        message.isHighlight = true;
      }
      await conversation.addMessage(message);
    } else {
      if (sender.isIgnored) return;
      const char = core.characters.get(
        data.character === connection.character
          ? (<{ recipient: string }>data).recipient
          : data.character
      );
      if (char.isIgnored)
        return connection.send('IGN', {
          action: 'notify',
          character: data.character
        });
      const conversation = state.getPrivate(char);
      await conversation.addMessage(message);
    }
  });
  connection.onMessage('NLN', async (data, time) => {
    const message = new EventMessage(
      l('events.login', `[user]${data.identity}[/user]`),
      time
    );
    if (isOfInterest(core.characters.get(data.identity))) {
      await addEventMessage(message);
      //I considered sending the login message too, but this I find this looks better.
      if (core.state.settings.horizonNotifyFriendSignIn)
        await core.notifications.notify(
          state.consoleTab,
          data.identity,
          l('events.login', data.identity),
          characterImage(data.identity),
          'silence'
        );
    }
    const conv = state.privateMap[data.identity.toLowerCase()];
    if (
      conv !== undefined &&
      (!core.state.settings.eventMessages ||
        conv !== state.selectedConversation)
    )
      await conv.addMessage(message);
  });
  connection.onMessage('FLN', async (data, time) => {
    const message = new EventMessage(
      l('events.logout', `[user]${data.character}[/user]`),
      time
    );
    if (isOfInterest(core.characters.get(data.character)))
      await addEventMessage(message);
    const conv = state.privateMap[data.character.toLowerCase()];
    if (conv === undefined) return;
    conv.typingStatus = 'clear';
    if (
      !core.state.settings.eventMessages ||
      conv !== state.selectedConversation
    )
      await conv.addMessage(message);
  });
  connection.onMessage('TPN', data => {
    const conv = state.privateMap[data.character.toLowerCase()];
    if (conv !== undefined) conv.typingStatus = data.status;
  });
  connection.onMessage('CBU', async (data, time) => {
    const conv = state.channelMap[data.channel.toLowerCase()];
    if (conv === undefined) return core.channels.leave(data.channel);
    const text = l('events.ban', conv.name, data.character, data.operator);
    conv.infoText = text;
    return addEventMessage(new EventMessage(text, time));
  });
  connection.onMessage('CKU', async (data, time) => {
    const conv = state.channelMap[data.channel.toLowerCase()];
    if (conv === undefined) return core.channels.leave(data.channel);
    const text = l('events.kick', conv.name, data.character, data.operator);
    conv.infoText = text;
    return addEventMessage(new EventMessage(text, time));
  });
  connection.onMessage('CTU', async (data, time) => {
    const conv = state.channelMap[data.channel.toLowerCase()];
    if (conv === undefined) return core.channels.leave(data.channel);
    const text = l(
      'events.timeout',
      conv.name,
      data.character,
      data.operator,
      data.length.toString()
    );
    conv.infoText = text;
    return addEventMessage(new EventMessage(text, time));
  });
  connection.onMessage('BRO', async (data, time) => {
    if (data.character !== undefined) {
      const content = decodeHTML(
        data.message.substr(data.character.length + 24)
      );
      const char = core.characters.get(data.character);
      const message = new BroadcastMessage(
        l('events.broadcast', `[user]${data.character}[/user]`, content),
        char,
        time
      );
      await state.consoleTab.addMessage(message);
      state.consoleTab.unread = Interfaces.UnreadState.Mention;
      await core.notifications.notify(
        state.consoleTab,
        l('events.broadcast.notification', data.character),
        content,
        characterImage(data.character),
        'attention'
      );
    } else
      return addEventMessage(new EventMessage(decodeHTML(data.message), time));
  });
  connection.onMessage('CIU', async (data, time) => {
    const text = l(
      'events.invite',
      `[user]${data.sender}[/user]`,
      `[session=${data.title}]${data.name}[/session]`
    );
    return addEventMessage(new EventMessage(text, time));
  });
  connection.onMessage('ERR', async (data, time) => {
    state.selectedConversation.errorText = data.message;
    return addEventMessage(
      new EventMessage(
        `[color=red]${l('events.error', data.message)}[/color]`,
        time
      )
    );
  });

  connection.onMessage('IGN', async (data, time) => {
    if (data.action !== 'add' && data.action !== 'delete') return;
    const text = l(`events.ignore_${data.action}`, data.character);
    state.selectedConversation.infoText = text;
    return addEventMessage(new EventMessage(text, time));
  });
  connection.onMessage('RTB', async (data, time) => {
    let url = 'https://www.f-list.net/';
    let text: string, character: string;
    if (data.type === 'comment') {
      //tslint:disable-line:prefer-switch
      switch (data.target_type) {
        case 'newspost':
          url += `newspost/${data.target_id}/#Comment${data.id}`;
          break;
        case 'bugreport':
          url += `view_bugreport.php?id=${data.target_id}/#${data.id}`;
          break;
        case 'changelog':
          url += `log.php?id=${data.target_id}/#${data.id}`;
          break;
        case 'feature':
          url += `vote.php?id=${data.target_id}/#${data.id}`;
      }
      const key = `events.rtbComment${data.parent_id !== 0 ? 'Reply' : ''}`;
      text = l(
        key,
        `[user]${data.name}[/user]`,
        l(`events.rtbComment_${data.target_type}`),
        `[url=${url}]${data.target}[/url]`
      );
      character = data.name;
    } else if (data.type === 'note') {
      // tslint:disable-next-line:no-unsafe-any
      core.siteSession.interfaces.notes.incrementNotes();
      text = l(
        'events.rtb_note',
        `[user]${data.sender}[/user]`,
        `[url=${url}view_note.php?note_id=${data.id}]${data.subject}[/url]`
      );
      character = data.sender;
    } else if (data.type === 'friendrequest') {
      // tslint:disable-next-line:no-unsafe-any
      core.siteSession.interfaces.notes.incrementMessages();
      text = l(`events.rtb_friendrequest`, `[user]${data.name}[/user]`);
      character = data.name;
    } else {
      switch (data.type) {
        case 'grouprequest':
          url += 'panel/group_requests.php';
          break;
        case 'bugreport':
          url += `view_bugreport.php?id=${data.id}`;
          break;
        case 'helpdeskticket':
          url += `view_ticket.php?id=${data.id}`;
          break;
        case 'helpdeskreply':
          url += `view_ticket.php?id=${data.id}`;
          break;
        case 'featurerequest':
          url += `vote.php?fid=${data.id}`;
          break;
        default: //TODO
          return;
      }
      text = l(
        `events.rtb_${data.type}`,
        `[user]${data.name}[/user]`,
        data.title !== undefined ? `[url=${url}]${data.title}[/url]` : url
      );
      character = data.name;
    }
    await addEventMessage(new EventMessage(text, time));
    if (data.type === 'note')
      await core.notifications.notify(
        state.consoleTab,
        character,
        text,
        characterImage(character),
        'newnote'
      );
  });
  const sfcList: Interfaces.SFCMessage[] = [];
  connection.onMessage('SFC', async (data, time) => {
    let text: string, message: Interfaces.Message;
    if (data.action === 'report') {
      text = l(
        'events.report',
        `[user]${data.character}[/user]`,
        decodeHTML(data.tab),
        decodeHTML(data.report)
      );
      if (!data.old)
        await core.notifications.notify(
          state.consoleTab,
          data.character,
          text,
          characterImage(data.character),
          'modalert'
        );
      message = new EventMessage(text, time);
      safeAddMessage(sfcList, message, 500);
      (<Interfaces.SFCMessage>message).sfc = data;
    } else {
      text = l(
        'events.report.confirmed',
        `[user]${data.moderator}[/user]`,
        `[user]${data.character}[/user]`
      );
      for (const item of sfcList)
        if (item.sfc.logid === data.logid) {
          item.sfc.confirmed = true;
          break;
        }
      message = new EventMessage(text, time);
    }
    return addEventMessage(message);
  });
  connection.onMessage('STA', async (data, time) => {
    if (data.character === core.connection.character) {
      await addEventMessage(
        new EventMessage(
          l(
            data.statusmsg.length > 0
              ? 'events.status.ownMessage'
              : 'events.status.own',
            l(`status.${data.status}`),
            decodeHTML(data.statusmsg)
          ),
          time
        )
      );
      return;
    }
    const char = core.characters.get(data.character);
    if (!isOfInterest(char)) return;
    const status = l(`status.${data.status}`);
    const key =
      data.statusmsg.length > 0 ? 'events.status.message' : 'events.status';
    const message = new EventMessage(
      l(
        key,
        `[user]${data.character}[/user]`,
        status,
        decodeHTML(data.statusmsg)
      ),
      time
    );
    await addEventMessage(message);
    const conv = state.privateMap[data.character.toLowerCase()];
    if (
      conv !== undefined &&
      (!core.state.settings.eventMessages ||
        conv !== state.selectedConversation)
    )
      await conv.addMessage(message);
  });
  connection.onMessage('SYS', async (data, time) => {
    state.selectedConversation.infoText = data.message;
    return addEventMessage(new EventMessage(data.message, time));
  });
  connection.onMessage('UPT', async (data, time) =>
    addEventMessage(
      new EventMessage(
        l(
          'events.uptime',
          data.startstring,
          data.channels.toString(),
          data.users.toString(),
          data.accepted.toString(),
          data.maxusers.toString()
        ),
        time
      )
    )
  );
  connection.onMessage('ZZZ', async (data, time) => {
    state.selectedConversation.infoText = data.message;
    return addEventMessage(new EventMessage(data.message, time));
  });
  return state;
}
