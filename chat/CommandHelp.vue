<template>
  <modal dialogClass="modal-lg" :buttons="false" :action="l('commands.help')" id="command-help">
    <div style="overflow: auto">
      <div v-for="command in filteredCommands">
        <h4>{{ command.name }}</h4>
        <i>{{ l('commands.help.syntax', command.syntax) }}</i>
        <div>{{ command.help }}</div>
        <div v-if="command.params.length">
          {{ l('commands.help.parameters') }}
          <div v-for="param in command.params" class="params">
            <b>{{ param.name }}</b> - {{ param.help }}
          </div>
        </div>
        <div v-if="command.context">
          <i>{{ command.context }}</i>
        </div>
        <div v-if="command.permission">
          <i>{{ command.permission }}</i>
        </div>
      </div>
    </div>
    <div class="input-group" style="padding: 10px 0; flex-shrink: 0">
      <div class="input-group-prepend">
        <div class="input-group-text"><span class="fas fa-search"></span></div>
      </div>
      <input class="form-control" v-model="filter" :placeholder="l('filter')" />
    </div>
  </modal>
</template>

<script lang="ts">
  import { Component, Hook } from '@f-list/vue-ts';
  import CustomDialog from '../components/custom_dialog';
  import Modal from '../components/Modal.vue';
  import core from './core';
  import l from './localize';
  import commands, { CommandContext, ParamType, Permission } from './slash_commands';

  type CommandItem = {
    name: string;
    help: string;
    context: string | undefined;
    permission: string | undefined;
    params: { name: string; help: string }[];
    syntax: string;
  };

  @Component({
    components: { modal: Modal }
  })
  export default class CommandHelp extends CustomDialog {
    commands: CommandItem[] = [];
    filter = '';
    l = l;

    get filteredCommands(): ReadonlyArray<CommandItem> {
      if (this.filter.length === 0) return this.commands;
      const filter = new RegExp(this.filter.replace(/[^\w]/gi, '\\$&'), 'i');
      return this.commands.filter(x => filter.test(x.name));
    }

    @Hook('mounted')
    mounted(): void {
      const permissions = core.connection.vars.permissions;
      for (const key in commands) {
        const command = commands[key]!;
        if (
          command.documented !== undefined ||
          (command.permission !== undefined && command.permission > 0 && (command.permission & permissions) === 0)
        )
          continue;
        const params = [];
        let syntax = `/${key} `;
        if (command.params !== undefined)
          for (let i = 0; i < command.params.length; ++i) {
            const param = command.params[i];
            const paramKey = param.type === ParamType.Character ? 'param_character' : `${key}.param${i}`;
            const name = l(`commands.${paramKey}`);
            const data = {
              name: param.optional !== undefined ? l('commands.help.paramOptional', name) : name,
              help: l(`commands.${paramKey}.help`)
            };
            params.push(data);
            syntax += (param.optional !== undefined ? `[${name}]` : `<${name}>`) + (param.delimiter !== undefined ? param.delimiter : ' ');
          }
        let context = '';
        if (command.context !== undefined) {
          if ((command.context & CommandContext.Channel) > 0) context += `${l('commands.help.contextChannel')}\n`;
          if ((command.context & CommandContext.Private) > 0) context += `${l('commands.help.contextPrivate')}\n`;
          if ((command.context & CommandContext.Console) > 0) context += `${l('commands.help.contextConsole')}\n`;
        }
        this.commands.push({
          name: `/${key} - ${l(`commands.${key}`)}`,
          help: l(`commands.${key}.help`),
          context,
          permission: command.permission !== undefined ? l(`commands.help.permission${Permission[command.permission]}`) : undefined,
          params,
          syntax
        });
      }
    }
  }
</script>

<style lang="scss">
  #command-help {
    h4 {
      margin-bottom: 0;
    }

    .params {
      padding-left: 20px;
    }
    .modal-body {
      display: flex;
      flex-direction: column;
    }
  }
</style>
