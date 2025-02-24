import Axios from 'axios';
import * as electron from 'electron';
import log from 'electron-log'; //tslint:disable-line:match-default-export-name
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as _ from 'lodash';

const dictDir = path.join(electron.app.getPath('userData'), 'spellchecker');
fs.mkdirSync(dictDir, { recursive: true });

const downloadedPath = path.join(dictDir, 'downloaded.json');
const downloadUrl = 'https://client.f-list.net/dicts/';
type File = { name: string; hash: string };
type DictionaryIndex = { [key: string]: { dic: File; aff: File } | undefined };
let availableDictionaries: DictionaryIndex | undefined;
let downloadedDictionaries: { [key: string]: File | undefined } = {};
const writeFile = promisify(fs.writeFile);

export async function getAvailableDictionaries(): Promise<ReadonlyArray<string>> {
  if (availableDictionaries === undefined)
    try {
      availableDictionaries = (await Axios.get<DictionaryIndex>(`${downloadUrl}index.json`)).data;
      if (fs.existsSync(downloadedPath))
        downloadedDictionaries = <{ [key: string]: File }>JSON.parse(fs.readFileSync(downloadedPath, 'utf-8'));
    } catch (e) {
      availableDictionaries = {};
      log.error(`Error loading dictionaries: ${e}`);
    }
  return Object.keys(availableDictionaries).sort();
}

export async function ensureDictionary(lang: string): Promise<void> {
  await getAvailableDictionaries();
  const dict = availableDictionaries![lang];
  if (dict === undefined) return;
  async function ensure(type: 'aff' | 'dic'): Promise<void> {
    const file = dict![type];
    const filePath = path.join(dictDir, `${lang}.${type}`);
    const downloaded = downloadedDictionaries[file.name];
    if (downloaded === undefined || downloaded.hash !== file.hash || !fs.existsSync(filePath)) {
      const dictionary = (await Axios.get<string>(`${downloadUrl}${file.name}`, { responseType: 'arraybuffer' })).data;
      await writeFile(filePath, Buffer.from(dictionary));
      downloadedDictionaries[file.name] = file;
      await writeFile(downloadedPath, JSON.stringify(downloadedDictionaries));
    }
  }
  await ensure('aff');
  await ensure('dic');
}
