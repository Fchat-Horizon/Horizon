import { decodeHTML } from './common';
import { Channel as Interfaces, Character, Connection } from './interfaces';
import core from '../chat/core';

interface SortableMember extends Interfaces.Member {
  rank: Interfaces.Rank;
  key: string;
}

export function queuedJoin(this: void, channels: string[]): void {
  const timer: NodeJS.Timer = setInterval(() => {
    const channel = channels.shift();
    if (channel === undefined) return clearInterval(timer);
    state.join(channel);
  }, 100);
}

function sortMember(this: void | never, array: SortableMember[], member: SortableMember): void {
  let i = 0;
  for (; i < array.length; ++i) {
    const other = array[i];
    if (other.character.isChatOp && !member.character.isChatOp) continue;
    if (member.character.isChatOp && !other.character.isChatOp) break;
    if (other.rank > member.rank) continue;
    if (member.rank > other.rank) break;
    if (!member.character.isFriend) {
      if (other.character.isFriend) continue;
      if (other.character.isBookmarked && !member.character.isBookmarked) continue;
      if (member.character.isBookmarked && !other.character.isBookmarked) break;
    } else if (!other.character.isFriend) break;
    if (member.key < other.key) break;
  }
  array.splice(i, 0, member);
}

class Channel implements Interfaces.Channel {
  description = '';
  opList: string[] = [];
  owner = '';
  mode: Interfaces.Mode = 'both';
  members: { [key: string]: SortableMember | undefined } = {};
  sortedMembers: SortableMember[] = [];

  constructor(
    readonly id: string,
    readonly name: string
  ) {}

  async addMember(member: SortableMember): Promise<void> {
    this.members[member.character.name] = member;
    sortMember(this.sortedMembers, member);
    for (const handler of state.handlers) await handler('join', this, member);
  }

  async removeMember(name: string): Promise<void> {
    const member = this.members[name];
    if (member !== undefined) {
      delete this.members[name];
      this.sortedMembers.splice(this.sortedMembers.indexOf(member), 1);
      for (const handler of state.handlers) await handler('leave', this, member);
    }
  }

  reSortMember(member: SortableMember): void {
    this.sortedMembers.splice(this.sortedMembers.indexOf(member), 1);
    sortMember(this.sortedMembers, member);
  }

  createMember(character: Character): SortableMember {
    return {
      character,
      rank:
        this.owner === character.name
          ? Interfaces.Rank.Owner
          : this.opList.indexOf(character.name) !== -1
            ? Interfaces.Rank.Op
            : Interfaces.Rank.Member,
      key: character.name.toLowerCase()
    };
  }
}

class ListItem implements Interfaces.ListItem {
  isJoined = false;

  constructor(
    readonly id: string,
    readonly name: string,
    public memberCount: number
  ) {}
}

class State implements Interfaces.State {
  officialChannels: { readonly [key: string]: ListItem | undefined } = {};
  openRooms: { readonly [key: string]: ListItem | undefined } = {};
  joinedChannels: Channel[] = [];
  joinedMap: { [key: string]: Channel | undefined } = {};
  handlers: Interfaces.EventHandler[] = [];
  lastRequest = 0;

  constructor(private connection: Connection) {}

  join(channel: string): void {
    this.connection.send('JCH', { channel });
  }

  leave(channel: string): void {
    this.connection.send('LCH', { channel });
  }

  getChannelItem(id: string): ListItem | undefined {
    id = id.toLowerCase();
    return (id.substr(0, 4) === 'adh-' ? this.openRooms : this.officialChannels)[id];
  }

  onEvent(handler: Interfaces.EventHandler): void {
    this.handlers.push(handler);
  }

  getChannel(id: string): Channel | undefined {
    return this.joinedMap[id.toLowerCase()];
  }

  requestChannelsIfNeeded(maxAge: number): void {
    if (this.lastRequest + maxAge > Date.now()) return;
    this.lastRequest = Date.now();
    this.connection.send('CHA');
    this.connection.send('ORS');
  }
}

let state: State;

export default function (this: void, connection: Connection, characters: Character.State): Interfaces.State {
  state = new State(connection);
  let rejoin: string[] | undefined;
  connection.onEvent('connecting', isReconnect => {
    if (isReconnect && rejoin === undefined) rejoin = Object.keys(state.joinedMap);
    state.joinedChannels = [];
    state.joinedMap = {};
  });
  connection.onEvent('connected', () => {
    if (rejoin !== undefined) {
      queuedJoin(rejoin);
      rejoin = undefined;
    }
  });

  connection.onMessage('CHA', data => {
    const channels: { [key: string]: ListItem } = {};
    for (const channel of data.channels) {
      const id = channel.name.toLowerCase();
      const item = new ListItem(id, channel.name, channel.characters);
      if (state.joinedMap[id] !== undefined) item.isJoined = true;
      channels[id] = item;
    }
    state.officialChannels = channels;
  });
  connection.onMessage('ORS', data => {
    const channels: { [key: string]: ListItem } = {};
    for (const channel of data.channels) {
      const id = channel.name.toLowerCase();
      const item = new ListItem(id, decodeHTML(channel.title), channel.characters);
      if (state.joinedMap[id] !== undefined) item.isJoined = true;
      channels[id] = item;
    }
    state.openRooms = channels;
  });
  connection.onMessage('JCH', async data => {
    const item = state.getChannelItem(data.channel);
    if (data.character.identity === connection.character) {
      const id = data.channel.toLowerCase();
      if (state.joinedMap[id] !== undefined) return;
      const channel = (state.joinedMap[id] = new Channel(id, decodeHTML(data.title)));
      state.joinedChannels.push(channel);
      if (item !== undefined) item.isJoined = true;
    } else {
      const channel = state.getChannel(data.channel);
      if (channel === undefined) return state.leave(data.channel);
      if (channel.members[data.character.identity] !== undefined) return;
      const member = channel.createMember(characters.get(data.character.identity));
      await channel.addMember(member);
    }
    if (item !== undefined) item.memberCount++;
  });
  connection.onMessage('ICH', async data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    channel.mode = data.mode;
    const members: { [key: string]: SortableMember } = {};
    const sorted: SortableMember[] = [];
    for (const user of data.users) {
      const name = user.identity;
      const member = channel.createMember(characters.get(name));
      members[name] = member;
      sortMember(sorted, member);
    }
    channel.members = members;
    channel.sortedMembers = sorted;
    const item = state.getChannelItem(data.channel);
    if (item !== undefined) item.memberCount = data.users.length;
    for (const handler of state.handlers) await handler('join', channel);
  });
  connection.onMessage('CDS', data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    channel.description = decodeHTML(data.description);
  });
  connection.onMessage('LCH', async data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return;
    const item = state.getChannelItem(data.channel);
    if (data.character === connection.character) {
      const conv = core.conversations.channelConversations.find(c => c.channel.id === channel.id);

      if (conv) {
        conv.adManager.stop();
      }

      state.joinedChannels.splice(state.joinedChannels.indexOf(channel), 1);
      delete state.joinedMap[channel.id];
      for (const handler of state.handlers) await handler('leave', channel);
      if (item !== undefined) item.isJoined = false;
    } else {
      await channel.removeMember(data.character);
      if (item !== undefined) item.memberCount--;
    }
  });
  connection.onMessage('COA', data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    const member = channel.members[data.character];
    if (member === undefined || member.rank === Interfaces.Rank.Owner) return;
    member.rank = Interfaces.Rank.Op;
    channel.reSortMember(member);
  });
  connection.onMessage('COL', data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    channel.owner = data.oplist[0];
    channel.opList = data.oplist.slice(1);
  });
  connection.onMessage('COR', data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    const member = channel.members[data.character];
    if (member === undefined || member.rank === Interfaces.Rank.Owner) return;
    member.rank = Interfaces.Rank.Member;
    channel.reSortMember(member);
  });
  connection.onMessage('CSO', data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    const oldOwner = channel.members[channel.owner];
    if (oldOwner !== undefined) {
      oldOwner.rank = Interfaces.Rank.Member;
      channel.reSortMember(oldOwner);
    }
    channel.owner = data.character;
    const newOwner = channel.members[data.character];
    if (newOwner !== undefined) {
      newOwner.rank = Interfaces.Rank.Owner;
      channel.reSortMember(newOwner);
    }
  });
  connection.onMessage('RMO', data => {
    const channel = state.getChannel(data.channel);
    if (channel === undefined) return state.leave(data.channel);
    channel.mode = data.mode;
  });
  connection.onMessage('FLN', async data => {
    for (const key in state.joinedMap) await state.joinedMap[key]!.removeMember(data.character);
  });
  const globalHandler = (data: Connection.ServerCommands['AOP'] | Connection.ServerCommands['DOP']) => {
    for (const key in state.joinedMap) {
      const channel = state.joinedMap[key]!;
      const member = channel.members[data.character];
      if (member !== undefined) channel.reSortMember(member);
    }
  };
  connection.onMessage('AOP', globalHandler);
  connection.onMessage('DOP', globalHandler);
  connection.onMessage('RTB', data => {
    if (data.type !== 'trackadd' && data.type !== 'trackrem' && data.type !== 'friendadd' && data.type !== 'friendremove') return;
    for (const key in state.joinedMap) {
      const channel = state.joinedMap[key]!;
      const member = channel.members[data.name];
      if (member !== undefined) channel.reSortMember(member);
    }
  });
  return state;
}
