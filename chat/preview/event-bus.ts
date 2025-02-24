// import Vue from 'vue';
import _ from 'lodash';
// import log from 'electron-log'; //tslint:disable-line:match-default-export-name

import { Character } from '../../site/character_page/interfaces';
import { Message } from '../common';
import { Conversation } from '../interfaces';
import ChannelConversation = Conversation.ChannelConversation;

import { NoteCheckerCount } from '../../site/note-checker';

/**
 * 'imagepreview-dismiss': {url: string}
 * 'imagepreview-show': {url: string}
 * 'imagepreview-toggle-stickyness': {url: string}
 * 'character-data': {character: Character}
 * 'character-score': {character: Character, score: number, isFiltered: boolean}
 * 'private-message': {message: Message}
 * 'channel-ad': {message: Message, channel: Conversation, profile: ComplexCharacter | undefined}
 * 'channel-message': {message: Message, channel: Conversation}
 * 'select-conversation': { conversation: Conversation }
 * 'note-counts-update': {},
 * 'character-memo': { character: string, memo: CharacterMemo }
 */

export interface EventBusEvent {
  // tslint:disable: no-any
  [key: string]: any;
}

export interface ChannelMessageEvent extends EventBusEvent {
  message: Message;
  channel: ChannelConversation;
}

// tslint:disable-next-line no-empty-interface
export interface ChannelAdEvent extends ChannelMessageEvent {}

export interface CharacterDataEvent {
  character: Character;
}

export interface SelectConversationEvent extends EventBusEvent {
  conversation: Conversation | null;
}

export type EventCallback = (data: any) => void | Promise<void>;

// tslint:disable-next-line no-empty-interface
export interface NoteCountsUpdate extends EventBusEvent, NoteCheckerCount {}

class EventBusManager {
  private eventCallbacks: Record<string, EventCallback[]> = {};

  $on(eventName: string, callback: EventCallback): void {
    this.$off(eventName, callback);

    if (!(eventName in this.eventCallbacks)) {
      this.eventCallbacks[eventName] = [];
    }

    this.eventCallbacks[eventName].push(callback);
  }

  $off(eventName: string, callback: EventCallback): void {
    if (!(eventName in this.eventCallbacks)) {
      return;
    }

    this.eventCallbacks[eventName] = _.filter(this.eventCallbacks[eventName], cb => cb !== callback);
  }

  $emit(eventName: string, eventData: EventBusEvent): void {
    // const d = Date.now();

    _.each(this.eventCallbacks[eventName] || [], cb => cb(eventData));

    // log.silly('event.bus.emit', { eventName, eventData, time: (Date.now() - d) / 1000 });
  }

  clear(): void {
    this.eventCallbacks = {};
  }
}

export const EventBus = new EventBusManager();
// export const EventBus = new Vue();
