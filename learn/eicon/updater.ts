import Axios from 'axios';
import _ from 'lodash';

export interface EIconRecord {
  eicon: string;
  timestamp: number;
}

export interface EIconRecordUpdate extends EIconRecord {
  action: '+' | '-';
}

export class EIconUpdater {
  static readonly FULL_DATA_URL = 'https://xariah.net/eicons/Home/EiconsDataBase/base.doc';

  static readonly DATA_UPDATE_URL = 'https://xariah.net/eicons/Home/EiconsDataDeltaSince';

  async fetchAll(): Promise<{ records: EIconRecord[]; asOfTimestamp: number }> {
    const result = await Axios.get(EIconUpdater.FULL_DATA_URL);
    const lines = _.split(result.data, '\n');

    const records = _.map(
      _.filter(lines, line => line.trim().substr(0, 1) !== '#' && line.trim() !== ''),
      line => {
        const [eicon, timestamp] = _.split(line, '\t', 2);
        return { eicon: eicon.toLowerCase(), timestamp: parseInt(timestamp, 10) };
      }
    );

    const asOfLine = _.first(_.filter(lines, (line: string) => line.substring(0, 9) === '# As Of: '));
    const asOfTimestamp = asOfLine ? parseInt(asOfLine.substring(9), 10) : 0;

    return { records, asOfTimestamp };
  }

  async fetchUpdates(fromTimestampInSecs: number): Promise<{ recordUpdates: EIconRecordUpdate[]; asOfTimestamp: number }> {
    const result = await Axios.get(`${EIconUpdater.DATA_UPDATE_URL}/${fromTimestampInSecs}`);
    const lines = _.split(result.data, '\n');

    const recordUpdates = _.map(
      _.filter(lines, line => line.trim().substr(0, 1) !== '#' && line.trim() !== ''),
      line => {
        const [action, eicon, timestamp] = _.split(line, '\t', 3);
        return { action: action as '+' | '-', eicon: eicon.toLowerCase(), timestamp: parseInt(timestamp, 10) };
      }
    );

    const asOfLine = _.first(_.filter(lines, (line: string) => line.substring(0, 9) === '# As Of: '));
    const asOfTimestamp = asOfLine ? parseInt(asOfLine.substring(9), 10) : 0;

    return { recordUpdates, asOfTimestamp };
  }
}
