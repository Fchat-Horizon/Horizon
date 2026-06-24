import Axios from 'axios';

export interface EIconRecordUpdate {
  eicon: string;
  action: '+' | '-';
}

export class EIconUpdater {
  static readonly FULL_DATA_URL =
    'https://xariah.net/eicons/Home/EiconsDataBase/base.doc';

  static readonly DATA_UPDATE_URL =
    'https://xariah.net/eicons/Home/EiconsDataDeltaSince';

  async fetchAll(): Promise<{ eicons: string[]; asOfTimestamp: number }> {
    const result = await Axios.get(EIconUpdater.FULL_DATA_URL).catch(
      () => undefined
    );

    if (!result) return { asOfTimestamp: 0, eicons: [] };

    const lines = (result.data as string).split('\n');

    const eicons = lines
      .filter(line => line.trim() !== '' && !line.trim().startsWith('#'))
      .map(line => line.split('\t', 2)[0].toLowerCase());

    const asOfLine = lines.find(line => line.startsWith('# As Of: '));
    const asOfTimestamp = asOfLine ? parseInt(asOfLine.substring(9), 10) : 0;

    return { eicons, asOfTimestamp };
  }

  async fetchUpdates(
    fromTimestampInSecs: number
  ): Promise<{ recordUpdates: EIconRecordUpdate[]; asOfTimestamp: number }> {
    const result = await Axios.get(
      `${EIconUpdater.DATA_UPDATE_URL}/${fromTimestampInSecs}`
    ).catch(() => undefined);

    if (!result) return { asOfTimestamp: 0, recordUpdates: [] };

    const lines = (result.data as string).split('\n');

    const recordUpdates = lines
      .filter(line => line.trim() !== '' && !line.trim().startsWith('#'))
      .map(line => {
        const [action, eicon] = line.split('\t', 3);
        return { action: action as '+' | '-', eicon: eicon.toLowerCase() };
      });

    const asOfLine = lines.find(line => line.startsWith('# As Of: '));
    const asOfTimestamp = asOfLine ? parseInt(asOfLine.substring(9), 10) : 0;

    return { recordUpdates, asOfTimestamp };
  }
}
