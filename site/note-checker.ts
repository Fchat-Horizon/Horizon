import { SiteSession, SiteSessionInterface } from './site-session';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import { EventBus } from '../chat/preview/event-bus';
import core from '../chat/core';
/* tslint:disable:no-unsafe-any */

export interface NoteCheckerCount {
  unreadNotes: number;
  unreadMessages: number;
  onlineUsers: number;
}

export class NoteChecker implements SiteSessionInterface {
  private static readonly CHECK_FREQUENCY = 15 * 60 * 1000;

  private latestCount: NoteCheckerCount = {
    unreadNotes: 0,
    unreadMessages: 0,
    onlineUsers: 0
  };
  private timer?: any;

  constructor(private session: SiteSession) {}

  async start(): Promise<void> {
    try {
      await this.stop();
      await this.check();

      this.timer = setInterval(async () => {
        try {
          await this.check();
        } catch (err) {
          log.error('notechecker.check.error', err);
        }
      }, NoteChecker.CHECK_FREQUENCY);
    } catch (err) {
      log.error('notechecker.start.error', err);
    }
  }

  async stop(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }

    this.latestCount = { unreadNotes: 0, unreadMessages: 0, onlineUsers: 0 };
  }

  private async check(): Promise<NoteCheckerCount> {
    log.debug('notechecker.check');
    if (!core.state.settings.risingShowUnreadOfflineCount)
      return this.latestCount;
    const res = await this.session.get('/', true);
    const messagesMatch = res.body.match(
      /NavigationMessages.*?([0-9]+?) Messages/
    );
    const notesMatch = res.body.match(/NavigationNotecount.*?([0-9]+?) Notes/);
    const statsMatch = res.body.match(/Frontpage_Stats.*?([0-9]+?) characters/);

    // console.log('MATCH', messagesMatch[1], notesMatch[1], statsMatch[1]);

    const summary = {
      unreadNotes:
        notesMatch && notesMatch.length > 1 ? parseInt(notesMatch[1], 10) : 0,
      unreadMessages:
        messagesMatch && messagesMatch.length > 1
          ? parseInt(messagesMatch[1], 10)
          : 0,
      onlineUsers:
        statsMatch && statsMatch.length > 1 ? parseInt(statsMatch[1], 10) : 0
    };

    this.latestCount = summary;

    log.debug('notechecker.check.success', summary);
    EventBus.$emit('note-counts-update', summary);

    return summary;
  }

  incrementMessages(): void {
    this.latestCount.unreadMessages++;
    EventBus.$emit('note-counts-update', this.latestCount);
  }

  incrementNotes(): void {
    this.latestCount.unreadNotes++;
    EventBus.$emit('note-counts-update', this.latestCount);
  }

  getCounts(): NoteCheckerCount {
    return this.latestCount;
  }
}
