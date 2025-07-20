import core from '../chat/core';
import { methods } from '../site/character_page/data_store';
import { decodeHTML } from './common';
import { Character as Interfaces, Connection } from './interfaces';
import { Character as CharacterProfile } from '../site/character_page/interfaces';
import Vue from 'vue';

class Character implements Interfaces.Character {
  gender: Interfaces.Gender = 'None';
  status: Interfaces.Status = 'offline';
  statusText = '';
  isFriend = false;
  isBookmarked = false;
  isChatOp = false;
  isIgnored = false;
  overrides: CharacterOverrides = {};

  constructor(public name: string) {}
}

export interface CharacterOverrides {
  avatarUrl?: string;
  characterColor?: string;
  gender?: Interfaces.Gender;
  status?: Interfaces.Status;
}

class State implements Interfaces.State {
  characters: { [key: string]: Character | undefined } = {};

  ownCharacter: Character = <any>undefined; /*tslint:disable-line:no-any*/ //hack
  ownProfile: CharacterProfile = <any>undefined; /*tslint:disable-line:no-any*/ //hack

  friends: Character[] = [];
  bookmarks: Character[] = [];
  ignoreSet: Set<string> = new Set<string>();
  opSet: Set<string> = new Set<string>();
  friendSet: Set<string> = new Set<string>();
  bookmarkSet: Set<string> = new Set<string>();

  get(name: string): Character {
    const key = name.toLowerCase();
    let char = this.characters[key];
    if (char === undefined) {
      char = new Character(name);
      char.isFriend = this.friendSet.has(key);
      char.isBookmarked = this.bookmarkSet.has(key);
      char.isChatOp = this.opSet.has(key);
      char.isIgnored = this.ignoreSet.has(key);
      this.characters[key] = char;
    }
    return char;
  }

  setStatus(
    character: Character,
    status: Interfaces.Status,
    text: string
  ): void {
    if (character.status === 'offline' && status !== 'offline') {
      if (character.isFriend) this.friends.push(character);
      if (character.isBookmarked) this.bookmarks.push(character);
    } else if (status === 'offline' && character.status !== 'offline') {
      if (character.isFriend)
        this.friends.splice(this.friends.indexOf(character), 1);
      if (character.isBookmarked)
        this.bookmarks.splice(this.bookmarks.indexOf(character), 1);
    }
    character.status = status;
    character.statusText = decodeHTML(text);
  }

  setOverride(name: string, type: 'avatarUrl', value: string | undefined): void;
  setOverride(
    name: string,
    type: 'gender',
    value: Interfaces.Gender | undefined
  ): void;
  setOverride(
    name: string,
    type: 'status',
    value: Interfaces.Status | undefined
  ): void;
  setOverride(name: string, type: keyof CharacterOverrides, value: any): void {
    const char = this.get(name);

    Vue.set(char.overrides, type, value);
  }

  async resolveOwnProfile(): Promise<void> {
    await methods.fieldsGet();

    this.ownProfile = await methods.characterData(
      this.ownCharacter.name,
      -1,
      false
    );
  }
}

let state: State;

export default function (this: void, connection: Connection): Interfaces.State {
  state = new State();
  let reconnectStatus: Connection.ClientCommands['STA'];
  connection.onEvent('connecting', async isReconnect => {
    state.friends = [];
    state.bookmarks = [];
    state.bookmarkSet = new Set(
      (
        await connection.queryApi<{ characters: string[] }>('bookmark-list.php')
      ).characters.map(c => c.toLowerCase())
    );
    state.friendSet = new Set(
      (
        await connection.queryApi<{
          friends: { source: string; dest: string; last_online: number }[];
        }>('friend-list.php')
      ).friends.map(x => x.dest.toLowerCase())
    );
    if (isReconnect && <Character | undefined>state.ownCharacter !== undefined)
      reconnectStatus = {
        status: state.ownCharacter.status,
        statusmsg: state.ownCharacter.statusText
      };
    for (const key in state.characters) {
      const character = state.characters[key]!;
      character.isFriend = state.friendSet.has(key);
      character.isBookmarked = state.bookmarkSet.has(key);
      character.status = 'offline';
      character.statusText = '';
    }
  });
  connection.onEvent('connected', async isReconnect => {
    if (!isReconnect) return;
    connection.send('STA', reconnectStatus);
    for (const key in state.characters) {
      const char = state.characters[key]!;
      char.isIgnored = state.ignoreSet.has(key);
      char.isChatOp = state.opSet.has(key);
    }
  });
  connection.onMessage('IGN', data => {
    switch (data.action) {
      case 'init':
        state.ignoreSet = new Set(data.characters);
        break;
      case 'add':
        state.ignoreSet.add(data.character.toLowerCase());
        state.get(data.character).isIgnored = true;
        break;
      case 'delete':
        state.ignoreSet.delete(data.character.toLowerCase());
        state.get(data.character).isIgnored = false;
    }
  });
  connection.onMessage('ADL', data => {
    state.opSet = new Set(data.ops.map(op => op.toLowerCase()));
  });
  connection.onMessage('LIS', data => {
    for (const char of data.characters) {
      const character = state.get(char[0]);
      character.gender = char[1];
      state.setStatus(character, char[2], char[3]);
    }
  });
  connection.onMessage('FLN', data => {
    state.setStatus(state.get(data.character), 'offline', '');
  });
  connection.onMessage('NLN', async data => {
    const character = state.get(data.identity);

    if (data.identity === connection.character) {
      state.ownCharacter = character;

      await state.resolveOwnProfile();

      // tslint:disable-next-line no-unnecessary-type-assertion
      core.cache.setProfile(state.ownProfile as CharacterProfile);
    }

    character.name = data.identity;
    character.gender = data.gender;
    state.setStatus(character, data.status, '');
  });
  connection.onMessage('STA', data => {
    state.setStatus(state.get(data.character), data.status, data.statusmsg);
  });
  connection.onMessage('AOP', data => {
    state.opSet.add(data.character.toLowerCase());
    const char = state.get(data.character);
    char.isChatOp = true;
  });
  connection.onMessage('DOP', data => {
    state.opSet.delete(data.character.toLowerCase());
    const char = state.get(data.character);
    char.isChatOp = false;
  });
  connection.onMessage('RTB', data => {
    if (
      data.type !== 'trackadd' &&
      data.type !== 'trackrem' &&
      data.type !== 'friendadd' &&
      data.type !== 'friendremove'
    )
      return;
    const character = state.get(data.name);
    switch (data.type) {
      case 'trackadd':
        state.bookmarkSet.add(data.name.toLowerCase());
        character.isBookmarked = true;
        if (character.status !== 'offline') state.bookmarks.push(character);
        break;
      case 'trackrem':
        state.bookmarkSet.delete(data.name.toLowerCase());
        character.isBookmarked = false;
        if (character.status !== 'offline')
          state.bookmarks.splice(state.bookmarks.indexOf(character), 1);
        break;
      case 'friendadd':
        if (character.isFriend) return;
        state.friendSet.add(data.name.toLowerCase());
        character.isFriend = true;
        if (character.status !== 'offline') state.friends.push(character);
        break;
      case 'friendremove':
        state.friendSet.delete(data.name.toLowerCase());
        character.isFriend = false;
        if (character.status !== 'offline')
          state.friends.splice(state.friends.indexOf(character), 1);
    }
  });
  return state;
}
