import core from './core';
import { Character, Conversation, userStatuses } from './interfaces';
import l from './localize';
import ChannelConversation = Conversation.ChannelConversation;
import PrivateConversation = Conversation.PrivateConversation;

export const enum ParamType {
  String,
  Number,
  Character,
  Enum
}

const defaultDelimiters: { [key: number]: string | undefined } = {
  [ParamType.Character]: ',',
  [ParamType.String]: ''
};

export function isAction(this: void, text: string): boolean {
  return /^\/me\b/i.test(text);
}

export function isWarn(this: void, text: string): boolean {
  return /^\/warn\b/i.test(text);
}

export function isCommand(this: void, text: string): boolean {
  return text.charAt(0) === '/' && !isAction(text) && !isWarn(text);
}

export function parse(
  this: void | never,
  input: string,
  context: CommandContext
): ((this: Conversation) => void) | string {
  const commandEnd = input.indexOf(' ');
  const name = input
    .substring(1, commandEnd !== -1 ? commandEnd : undefined)
    .toLowerCase();
  const command = commands[name];
  if (command === undefined) return l('commands.unknown');
  const args = `${commandEnd !== -1 ? input.substr(commandEnd + 1) : ''}`;
  if (command.context !== undefined && (command.context & context) === 0)
    return l('commands.badContext');

  let index = 0;
  const values: (string | number)[] = [];

  if (command.params !== undefined)
    for (let i = 0; i < command.params.length; ++i) {
      while (args[index] === ' ') ++index;
      const param = command.params[i];
      if (index === -1) {
        if (param.optional !== undefined) continue;
        return l('commands.tooFewParams');
      }
      let delimiter =
        param.delimiter !== undefined
          ? param.delimiter
          : defaultDelimiters[param.type];
      if (delimiter === undefined) delimiter = ' ';
      const endIndex =
        delimiter.length > 0 ? args.indexOf(delimiter, index) : args.length;
      const value = args.substring(
        index,
        endIndex !== -1 ? endIndex : undefined
      );
      if (value.length === 0) {
        if (param.optional !== undefined) continue;
        return l('commands.tooFewParams');
      }
      values[i] = value;
      switch (param.type) {
        case ParamType.String:
          if (i === command.params.length - 1) values[i] = args.substr(index);
          break;
        case ParamType.Enum:
          // For status command, do case-insensitive matching
          if (name === 'status' && i === 0) {
            const options = param.options !== undefined ? param.options : [];
            const matchedOption = options.find(
              opt => opt.toLowerCase() === value.toLowerCase()
            );
            if (matchedOption) values[i] = matchedOption;
            else
              return l(
                'commands.invalidParam',
                l(`commands.${name}.param${i}`)
              );
          } else if (
            (param.options !== undefined ? param.options : []).indexOf(
              value
            ) === -1
          )
            return l('commands.invalidParam', l(`commands.${name}.param${i}`));
          break;
        case ParamType.Number:
          const num = parseInt(value, 10);
          if (isNaN(num))
            return l('commands.invalidParam', l(`commands.${name}.param${i}`));
          values[i] = num;
          break;
        case ParamType.Character:
          if (
            value.charAt(0) === '"' &&
            value.charAt(value.length - 1) === '"'
          ) {
            values[i] = value.substring(1, value.length - 1);
            if (!values[i]) return l('commands.emptyCharacter');
            break;
          }
          const char = core.characters.get(value);
          if (char.status === 'offline') return l('commands.invalidCharacter');
      }
      index = endIndex === -1 ? args.length : endIndex + 1;
    }
  return function (this: Conversation): void {
    command.exec(this, ...values);
  };
}

export const enum CommandContext {
  Console = 1 << 0,
  Channel = 1 << 1,
  Private = 1 << 2
}

export enum Permission {
  RoomOp = -1,
  RoomOwner = -2,
  ChannelMod = 4,
  ChatOp = 2,
  Admin = 1
}

export interface Command {
  readonly context?: CommandContext; //default implicit Console | Channel | Private
  readonly permission?: Permission;
  readonly documented?: false; //default true
  readonly params?: {
    readonly type: ParamType;
    readonly options?: ReadonlyArray<string>; //default undefined
    readonly optional?: true; //default false
    readonly delimiter?: string; //default ' ' (',' for type: Character)
    validator?(data: string | number): boolean; //default undefined
  }[];
  exec(context: Conversation, ...params: (string | number | undefined)[]): void;
}

const commands: { readonly [key: string]: Command | undefined } = {
  me: {
    exec: () => 'stub',
    context: CommandContext.Channel | CommandContext.Private,
    params: [{ type: ParamType.String }]
  },
  reward: {
    exec: (_, character: string) => core.connection.send('RWD', { character }),
    permission: Permission.Admin,
    params: [{ type: ParamType.Character }]
  },
  greports: {
    permission: Permission.ChannelMod,
    exec: () => core.connection.send('PCR')
  },
  join: {
    exec: (_, channel: string) => core.connection.send('JCH', { channel }),
    params: [{ type: ParamType.String }]
  },
  close: {
    exec: (conv: PrivateConversation | ChannelConversation) => conv.close(),
    context: CommandContext.Private | CommandContext.Channel
  },
  priv: {
    exec: (_, character: string) =>
      core.conversations.getPrivate(core.characters.get(character)).show(),
    params: [{ type: ParamType.Character }]
  },
  uptime: {
    exec: () => core.connection.send('UPT')
  },
  clear: {
    exec: (conv: Conversation) => conv.clear()
  },
  status: {
    exec: (_, status: Character.Status, statusmsg: string = '') => {
      // Convert status to proper case by finding the matching option
      if (typeof status === 'string') {
        const matchedStatus = userStatuses.find(
          s => s.toLowerCase() === status.toLowerCase()
        );
        if (matchedStatus) status = matchedStatus as Character.Status;
      }
      core.connection.send('STA', { status, statusmsg });
    },
    params: [
      { type: ParamType.Enum, options: userStatuses },
      { type: ParamType.String, optional: true }
    ]
  },
  roll: {
    exec: (conv: ChannelConversation | PrivateConversation, dice: string) => {
      if (dice.toLocaleLowerCase().includes('inf')) {
        conv.infoText =
          'Inf took many lives during its reign. Thankfully, you have been spared.';
        return;
      } else if (Conversation.isChannel(conv))
        core.connection.send('RLL', { channel: conv.channel.id, dice });
      else
        core.connection.send('RLL', {
          recipient: conv.character.name,
          dice
        });
    },
    context: CommandContext.Channel | CommandContext.Private,
    params: [{ type: ParamType.String }]
  },
  bottle: {
    exec: (conv: ChannelConversation | PrivateConversation) => {
      if (Conversation.isChannel(conv))
        core.connection.send('RLL', {
          channel: conv.channel.id,
          dice: 'bottle'
        });
      else
        core.connection.send('RLL', {
          recipient: conv.character.name,
          dice: 'bottle'
        });
    },
    context: CommandContext.Channel | CommandContext.Private
  },
  warn: {
    exec: () => 'stub',
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [{ type: ParamType.String }]
  },
  kick: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('CKU', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  ban: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('CBU', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  unban: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('CUB', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  banlist: {
    exec: (conv: ChannelConversation) =>
      core.connection.send('CBL', { channel: conv.channel.id }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel
  },
  timeout: {
    exec: (conv: ChannelConversation, character: string, length: number) =>
      core.connection.send('CTU', {
        channel: conv.channel.id,
        character,
        length
      }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [
      { type: ParamType.Character, delimiter: ',' },
      {
        type: ParamType.Number,
        validator: x => typeof x === 'number' && x >= 1
      }
    ]
  },
  gkick: {
    exec: (_, character: string) => core.connection.send('KIK', { character }),
    permission: Permission.ChatOp,
    params: [{ type: ParamType.Character }]
  },
  gban: {
    exec: (_, character: string) => core.connection.send('ACB', { character }),
    permission: Permission.ChatOp,
    params: [{ type: ParamType.Character }]
  },
  gunban: {
    exec: (_, character: string) => core.connection.send('UNB', { character }),
    permission: Permission.ChatOp,
    params: [{ type: ParamType.Character }]
  },
  gtimeout: {
    exec: (_, character: string, time: number, reason: string) =>
      core.connection.send('TMO', { character, time, reason }),
    permission: Permission.ChatOp,
    params: [
      { type: ParamType.Character, delimiter: ',' },
      {
        type: ParamType.Number,
        validator: x => typeof x === 'number' && x >= 1
      },
      { type: ParamType.String }
    ]
  },
  setowner: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('CSO', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  ignore: {
    exec: (_, character: string) =>
      core.connection.send('IGN', { action: 'add', character }),
    params: [{ type: ParamType.Character }]
  },
  unignore: {
    exec: (_, character: string) =>
      core.connection.send('IGN', { action: 'delete', character }),
    params: [{ type: ParamType.Character }]
  },
  ignorelist: {
    exec: (conv: Conversation) =>
      (conv.infoText = l(
        'chat.ignoreList',
        core.characters.ignoreList.join(', ')
      ))
  },
  makeroom: {
    exec: (_, channel: string) => core.connection.send('CCR', { channel }),
    params: [{ type: ParamType.String }]
  },
  gop: {
    exec: (_, character: string) => core.connection.send('AOP', { character }),
    permission: Permission.Admin,
    params: [{ type: ParamType.Character }]
  },
  gdeop: {
    exec: (_, character: string) => core.connection.send('DOP', { character }),
    permission: Permission.Admin,
    params: [{ type: ParamType.Character }]
  },
  op: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('COA', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  deop: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('COR', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  scop: {
    exec: (_, character: string) =>
      core.connection.send('SCP', { action: 'add', character }),
    permission: Permission.Admin,
    params: [{ type: ParamType.Character }]
  },
  scdeop: {
    exec: (_, character: string) =>
      core.connection.send('SCP', { action: 'remove', character }),
    permission: Permission.Admin,
    params: [{ type: ParamType.Character }]
  },
  oplist: {
    exec: (conv: ChannelConversation) =>
      core.connection.send('COL', { channel: conv.channel.id }),
    context: CommandContext.Channel
  },
  invite: {
    exec: (conv: ChannelConversation, character: string) =>
      core.connection.send('CIU', {
        channel: conv.channel.id,
        character
      }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Character }]
  },
  closeroom: {
    exec: (conv: ChannelConversation) =>
      core.connection.send('RST', {
        channel: conv.channel.id,
        status: 'private'
      }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel
  },
  openroom: {
    exec: (conv: ChannelConversation) =>
      core.connection.send('RST', {
        channel: conv.channel.id,
        status: 'public'
      }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel
  },
  setmode: {
    exec: (conv: ChannelConversation, mode: 'ads' | 'chat' | 'both') =>
      core.connection.send('RMO', { channel: conv.channel.id, mode }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel,
    params: [{ type: ParamType.Enum, options: ['ads', 'chat', 'both'] }]
  },
  setdescription: {
    exec: (conv: ChannelConversation, description: string) =>
      core.connection.send('CDS', {
        channel: conv.channel.id,
        description
      }),
    permission: Permission.RoomOp,
    context: CommandContext.Channel,
    params: [{ type: ParamType.String }]
  },
  code: {
    exec: (conv: ChannelConversation) => {
      const active = <HTMLElement>document.activeElement;
      const elm = document.createElement('textarea');
      elm.value = `[session=${conv.channel.name}]${conv.channel.id}[/session]`;
      document.body.appendChild(elm);
      elm.select();
      document.execCommand('copy');
      document.body.removeChild(elm);
      active.focus();
      conv.infoText = l('commands.code.success');
    },
    permission: Permission.RoomOwner,
    context: CommandContext.Channel
  },
  killchannel: {
    exec: (conv: ChannelConversation) =>
      core.connection.send('KIC', { channel: conv.channel.id }),
    permission: Permission.RoomOwner,
    context: CommandContext.Channel
  },
  createchannel: {
    exec: (_, channel: string) => core.connection.send('CRC', { channel }),
    permission: Permission.ChatOp,
    params: [{ type: ParamType.String }]
  },
  broadcast: {
    exec: (_, message: string) => core.connection.send('BRO', { message }),
    permission: Permission.Admin,
    params: [{ type: ParamType.String }]
  },
  reloadconfig: {
    exec: (_, save?: 'save') =>
      core.connection.send('RLD', save !== undefined ? { save } : undefined),
    permission: Permission.Admin,
    params: [{ type: ParamType.Enum, options: ['save'], optional: true }]
  },
  xyzzy: {
    exec: (_, command: string, arg: string) =>
      core.connection.send('ZZZ', { command, arg }),
    permission: Permission.Admin,
    params: [
      { type: ParamType.String, delimiter: ' ' },
      { type: ParamType.String }
    ]
  },
  elf: {
    exec: (conv: Conversation) =>
      (conv.infoText = elf[Math.floor(Math.random() * elf.length)]),
    documented: false
  }
};

const elf = [
  //Ceran is to be thanked for most of these.
  `Now no one can say there's "not enough Elf." It's a well-kept secret, but elves love headpets. You should try it sometime.`,
  `Your task for the day: provide a soft cushion in a sunny area for maximum elf comfort, earn +2 Bliss pts.`,
  `Your task for the day: pet an elf at least (3) times, receive Good Karma.`,
  `Your task for the day: make dinner for an elf, receive +3 Luck pts.`,
  `The reason that elves' ears are so long is so that they can better hear your sins. Now that's an Elf Fact!`,
  `A "straight" elf is basically an oxymoron.`,
  `Don't forget to water your elf today!`,
  `Please don't let your elf eat out of the trash can.`,
  `Elves are not allowed to have soda after 12pm, but they will anyway.`,
  `Pet an elf on the ears (4) times. Any more and the elf will bite. Now that's an Elf Fact!`,
  `There are two kinds of people in the world. People who like elves. And people with questionable taste.`,
  `Love yourself, pet an elf!!!`,
  `Your task for the day: leave out snacks for your local elves, they'll help dispel vermin!`,
  `An elf in your home will discourage the presence of predators! Or summon them. I forget which.`,
  `If you crack open an elf, there's just a smaller elf within. It's just smaller and smaller elves all the way down.`,
  `In case of an emergency, an elf's ass can be used as a flotation device. Now that's an Elf Fact!`,
  `Running low on inventory space? An elf can be used to slot additional cylindrical artifacts! Now that's an Elf Fact!`,
  `The average elf can consume half their body weight in cum. Now that's an Elf Fact!`,
  `Your task for the day: subjugate yourself to your elven overlords in order to achieve righteous bliss.`,
  `Your task for the day: Rub an elf's tummy. Be wary of them bear-trapping your arm as the forces of darkness consume their soul.`,
  `Listen, that elfroot you found in my sock drawer is PURELY medicinal!`,
  `What are elves? We just don't know.`,
  `As long as you pet an elf's head, they will be content. What will happen if you stop? No one's ever come back to tell the tale.`,
  `Elves are very helpful creatures. Just ask them to carry something for you, and they will. Especially eggs.`
];

export default commands;
