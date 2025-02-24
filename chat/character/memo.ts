import core from '../core';
import { CharacterMemo } from '../../site/character_page/interfaces';
import { EventBus } from '../preview/event-bus';

export class MemoManager {
  memo?: CharacterMemo;

  constructor(protected character: string) {}

  get(): CharacterMemo {
    if (!this.memo) {
      throw new Error('Missing character memo');
    }

    return this.memo;
  }

  async set(message: string | null): Promise<void> {
    if (!this.memo) {
      await this.load(true);
    }

    const response = await core.connection.queryApi('character-memo-save.php', { target: this.memo!.id, note: message });

    this.memo!.memo = (response as any).note;

    await this.updateStores();
  }

  protected async updateStores(): Promise<void> {
    const character = await core.cache.profileCache.get(this.character);

    if (character && character.character?.memo?.memo !== this.memo!.memo) {
      character.character.memo = this.memo;

      await core.cache.profileCache.register(character.character);
    }

    EventBus.$emit('character-memo', { character: this.character, memo: this.memo! });
  }

  async load(skipStoreUpdate: boolean = false): Promise<void> {
    const memo = await core.connection.queryApi<{ note: string | null; id: number }>('character-memo-get2.php', { target: this.character });
    this.memo = { id: memo.id, memo: memo.note || '' };

    if (!skipStoreUpdate) {
      await this.updateStores();
    }
  }
}
