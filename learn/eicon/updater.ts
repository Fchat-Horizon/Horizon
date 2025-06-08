import Axios from 'axios';
import _ from 'lodash';

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
    const result = await Axios.get(EIconUpdater.FULL_DATA_URL);
    const lines = _.split(result.data, '\n');

    const eicons = lines
      .filter(line => line.trim() !== '' && !line.trim().startsWith('#'))
      .map(line => line.split('\t', 2)[0].toLowerCase());

    const asOfLine = _.first(
      _.filter(lines, (line: string) => line.substring(0, 9) === '# As Of: ')
    );
    const asOfTimestamp = asOfLine ? parseInt(asOfLine.substring(9), 10) : 0;

    return { eicons, asOfTimestamp };
  }

  async fetchUpdates(
    fromTimestampInSecs: number
  ): Promise<{ recordUpdates: EIconRecordUpdate[]; asOfTimestamp: number }> {
    const result = await Axios.get(
      `${EIconUpdater.DATA_UPDATE_URL}/${fromTimestampInSecs}`
    );
    const lines = _.split(result.data, '\n');

    const recordUpdates = lines
      .filter(line => line.trim() !== '' && !line.trim().startsWith('#'))
      .map(line => {
        const [action, eicon] = line.split('\t', 3);
        return { action: action as '+' | '-', eicon: eicon.toLowerCase() };
      });

    const asOfLine = _.first(
      _.filter(lines, (line: string) => line.substring(0, 9) === '# As Of: ')
    );
    const asOfTimestamp = asOfLine ? parseInt(asOfLine.substring(9), 10) : 0;

    return { recordUpdates, asOfTimestamp };
  }
}
