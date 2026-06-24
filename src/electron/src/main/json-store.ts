import * as fs from 'fs';
import * as path from 'path';

export interface KeyValueStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  unset(key: string): Promise<void>;
}

export class JsonStore implements KeyValueStore {
  constructor(private readonly file: string) {}

  private async read(): Promise<Record<string, unknown>> {
    try {
      return JSON.parse(await fs.promises.readFile(this.file, 'utf8'));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }

  private async write(data: Record<string, unknown>): Promise<void> {
    // Write-then-rename keeps the file intact if the app dies mid-write.
    const tmpFile = `${this.file}.tmp`;
    await fs.promises.mkdir(path.dirname(this.file), { recursive: true });
    await fs.promises.writeFile(tmpFile, JSON.stringify(data, null, 2));
    await fs.promises.rename(tmpFile, this.file);
  }

  async get(key: string): Promise<unknown> {
    return (await this.read())[key];
  }

  async set(key: string, value: unknown): Promise<void> {
    const data = await this.read();
    data[key] = value;
    await this.write(data);
  }

  async unset(key: string): Promise<void> {
    const data = await this.read();
    delete data[key];
    await this.write(data);
  }
}
