import core from '../chat/core';
import { EventMessage } from '../chat/common';
import { methods } from '../site/character_page/data_store';
import { decodeHTML } from './common';
import { Character as Interfaces, Connection } from './interfaces';
import { Character as CharacterProfile } from '../site/character_page/interfaces';
import { ProfileCache } from '../learn/profile-cache';
import Vue from 'vue';

class Character implements Interfaces.Character {
  gender: Interfaces.Gender = 'None';
  status: Interfaces.Status = 'offline';
  statusText = '';
  isFriend = false;
  isBookmarked = false;
  isCharacterFriend = false;
  isChatOp = false;
  isIgnored = false;
  overrides: CharacterOverrides = {};
  previousStatusText = '';

  constructor(public name: string) {}

  hasStatusTextChanged(): boolean {
    return this.previousStatusText !== this.statusText;
  }
}

export interface CharacterOverrides {
  avatarUrl?: string;
  characterColor?: CharacterColor;
  gender?: Interfaces.Gender;
  status?: Interfaces.Status;
}

export enum CharacterColor {
  red,
  orange,
  yellow,
  green,
  cyan,
  purple,
  blue,
  pink,
  black,
  brown,
  white,
  gray,
  none
}

class State implements Interfaces.State {
  characters: { [key: string]: Character | undefined } = {};

  ownCharacter: Character = <any>undefined; /*tslint:disable-line:no-any*/ //hack
  ownProfile: CharacterProfile = <any>undefined; /*tslint:disable-line:no-any*/ //hack

  friends: Character[] = [];
  characterFriends: Character[] = [];
  bookmarks: Character[] = [];
  ignoreList: string[] = [];
  opList: string[] = [];
  friendList: string[] = [];
  characterFriendList: string[] = [];
  bookmarkList: string[] = [];

  get(name: string): Character {
    const key = name.toLowerCase();
    let char = this.characters[key];
    if (char === undefined) {
      char = new Character(name);
      char.isFriend = this.friendList.indexOf(name) !== -1;
      char.isBookmarked = this.bookmarkList.indexOf(name) !== -1;
      char.isChatOp = this.opList.indexOf(name) !== -1;
      char.isIgnored = this.ignoreList.indexOf(key) !== -1;
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
      if (this.characterFriendList.indexOf(character.name) !== -1) {
        if (this.characterFriends.indexOf(character) === -1) {
          this.characterFriends.push(character);
        }
      }
    } else if (status === 'offline' && character.status !== 'offline') {
      if (character.isFriend)
        this.friends.splice(this.friends.indexOf(character), 1);
      if (character.isBookmarked)
        this.bookmarks.splice(this.bookmarks.indexOf(character), 1);
      if (this.characterFriendList.indexOf(character.name) !== -1) {
        const index = this.characterFriends.indexOf(character);
        if (index !== -1) {
          this.characterFriends.splice(index, 1);
        }
      }
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
  setOverride(
    name: string,
    type: 'characterColor',
    value: string | undefined | null
  ): void;
  setOverride(name: string, type: keyof CharacterOverrides, value: any): void {
    const char = this.get(name);
    let newValue: any;

    if (type === 'characterColor') {
      if (value === 'none' || value === undefined || value === null) {
        newValue = CharacterColor.none;
      } else {
        // This will work well, provided the bbcode colors never get expanded.
        // Funny joke. we all know they won't.
        const colorKey = value.toLowerCase() as keyof typeof CharacterColor;
        newValue =
          CharacterColor[colorKey] !== undefined
            ? CharacterColor[colorKey]
            : CharacterColor.none;
      }
    } else {
      newValue = value;
    }

    if (char.overrides[type] === newValue) {
      return;
    }

    Vue.set(char.overrides, type, newValue);
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
    state.characterFriends = [];
    state.bookmarkList = (
      await connection.queryApi<{ characters: string[] }>('bookmark-list.php')
    ).characters;
    const friendResponse = await connection.queryApi<{
      friends: { source: string; dest: string; last_online: number }[];
    }>('friend-list.php');
    state.friendList = friendResponse.friends.map(x => x.dest);
    state.characterFriendList = [];
    if (isReconnect && <Character | undefined>state.ownCharacter !== undefined)
      reconnectStatus = {
        status: state.ownCharacter.status,
        statusmsg: state.ownCharacter.statusText
      };
    for (const key in state.characters) {
      const character = state.characters[key]!;
      character.isFriend = state.friendList.indexOf(character.name) !== -1;
      character.isBookmarked =
        state.bookmarkList.indexOf(character.name) !== -1;
      character.status = 'offline';
      character.statusText = '';
    }
  });
  connection.onEvent('connected', async isReconnect => {
    if (!isReconnect) return;
    connection.send('STA', reconnectStatus);
    for (const key in state.characters) {
      const char = state.characters[key]!;
      char.isIgnored = state.ignoreList.indexOf(key) !== -1;
      char.isChatOp = state.opList.indexOf(char.name) !== -1;
    }
  });
  connection.onMessage('IGN', data => {
    switch (data.action) {
      case 'init':
        state.ignoreList = data.characters.slice();
        break;
      case 'add':
        state.ignoreList.push(data.character.toLowerCase());
        state.get(data.character).isIgnored = true;
        break;
      case 'delete':
        state.ignoreList.splice(
          state.ignoreList.indexOf(data.character.toLowerCase()),
          1
        );
        state.get(data.character).isIgnored = false;
    }
  });
  connection.onMessage('ADL', data => {
    state.opList = data.ops.slice();
  });
  connection.onMessage('LIS', data => {
    for (const char of data.characters) {
      const character = state.get(char[0]);
      character.gender = char[1];
      state.setStatus(character, char[2], char[3]);
    }
  });
  connection.onMessage('FLN', data => {
    //Going offline counts as changing status too for the previous status var
    let char = state.get(data.character);
    char.previousStatusText = char.statusText;
    state.setStatus(char, 'offline', '');
  });
  connection.onMessage('NLN', async data => {
    const character = state.get(data.identity);

    if (data.identity === connection.character) {
      state.ownCharacter = character;

      const friendResponse = await connection.queryApi<{
        friends: { source: string; dest: string; last_online: number }[];
      }>('friend-list.php');
      state.characterFriendList = friendResponse.friends
        .filter(x => x.source === state.ownCharacter.name)
        .map(x => x.dest);
      for (const key in state.characters) {
        const existing = state.characters[key]!;
        if (
          existing.status !== 'offline' &&
          state.characterFriendList.indexOf(existing.name) !== -1 &&
          state.characterFriends.indexOf(existing) === -1
        ) {
          state.characterFriends.push(existing);
          existing.isCharacterFriend = true;
        }
      }

      await state.resolveOwnProfile();

      // tslint:disable-next-line no-unnecessary-type-assertion
      core.cache.setProfile(state.ownProfile as CharacterProfile);

      const hqPortraitUrl = ProfileCache.extractHighQualityPortraitURL(
        state.ownProfile.character.description
      );
      if (hqPortraitUrl && ProfileCache.isImgurURL(hqPortraitUrl)) {
        core.conversations.consoleTab.addMessage(
          new EventMessage(
            '[color=red][b]Warning:[/b][/color] [i]Your high-quality portrait uses Imgur, which is no longer supported[/i]. [b]We suggest you move your Imgur portrait to F-List itself[/b], but other hosts are also supported (freeimage.host, e621.net, iili.io, imgchest.com, toyhou.se, or redgifs.com.) Once imgur is removed from your profile, this warning will not appear after login.'
          )
        );
      }
    }

    character.name = data.identity;
    character.gender = data.gender;
    state.setStatus(character, data.status, '');
  });
  connection.onMessage('STA', data => {
    //This is so it won't clear the previous status when their client reconnects and sends a STA message
    let char = state.get(data.character);
    if (char.statusText.length > 0 && data.statusmsg.length > 0) {
      char.previousStatusText = char.statusText;
    }
    state.setStatus(char, data.status, data.statusmsg);
  });
  connection.onMessage('AOP', data => {
    state.opList.push(data.character);
    const char = state.get(data.character);
    char.isChatOp = true;
  });
  connection.onMessage('DOP', data => {
    state.opList.splice(state.opList.indexOf(data.character), 1);
    const char = state.get(data.character);
    char.isChatOp = false;
  });
  connection.onMessage('RTB', async data => {
    console.log('got rtb:', data);
    if (
      data.type !== 'trackadd' &&
      data.type !== 'trackrem' &&
      data.type !== 'friendadd' &&
      data.type !== 'friendremove'
    )
      return;
    const character = state.get(data.name);
    const ownName = (state.ownCharacter as Character | undefined)?.name;
    switch (data.type) {
      case 'trackadd':
        state.bookmarkList.push(data.name);
        character.isBookmarked = true;
        if (character.status !== 'offline') state.bookmarks.push(character);
        break;
      case 'trackrem':
        state.bookmarkList.splice(state.bookmarkList.indexOf(data.name), 1);
        character.isBookmarked = false;
        if (character.status !== 'offline')
          state.bookmarks.splice(state.bookmarks.indexOf(character), 1);
        break;
      case 'friendadd':
        // Always add to global friends
        state.friendList.push(data.name);
        character.isFriend = true;
        if (character.status !== 'offline') state.friends.push(character);

        // Always update character-specific friends list. This shouldn't add any excessive overhead.
        const friendAddResponse = await connection.queryApi<{
          friends: { source: string; dest: string; last_online: number }[];
        }>('friend-list.php');
        state.characterFriendList = ownName
          ? friendAddResponse.friends
              .filter(x => x.source === ownName)
              .map(x => x.dest)
          : [];

        // If this character is now a friend of our character and is online, add to characterFriends.
        // TODO: We may want to alter this in the future for the 'all' list. For now, it's fine.
        if (
          ownName &&
          state.characterFriendList.indexOf(character.name) !== -1 &&
          character.status !== 'offline' &&
          state.characterFriends.indexOf(character) === -1
        ) {
          state.characterFriends.push(character);
          character.isCharacterFriend = true;
        }
        break;
      case 'friendremove':
        // Always remove from global friends
        state.friendList.splice(state.friendList.indexOf(data.name), 1);
        character.isFriend = false;
        if (character.status !== 'offline') {
          state.friends.splice(state.friends.indexOf(character), 1);
        }

        // Once again, update character-specific friends list, regardless of setting
        const friendRemoveResponse = await connection.queryApi<{
          friends: { source: string; dest: string; last_online: number }[];
        }>('friend-list.php');
        state.characterFriendList = ownName
          ? friendRemoveResponse.friends
              .filter(x => x.source === ownName)
              .map(x => x.dest)
          : [];

        // If this character is no longer a friend of our character, remove from characterFriends
        if (
          ownName &&
          state.characterFriendList.indexOf(character.name) === -1 &&
          character.status !== 'offline'
        ) {
          const index = state.characterFriends.indexOf(character);
          if (index !== -1) {
            state.characterFriends.splice(index, 1);
            character.isCharacterFriend = false;
          }
        }
    }
  });
  return state;
}
