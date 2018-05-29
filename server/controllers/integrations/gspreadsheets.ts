import { creds } from '../../google.credentials';

const GoogleSpreadsheet = require('google-spreadsheet');
const env = process.env;
const doc = new GoogleSpreadsheet(env.DEMAND_SHEET);

export default class {
  _googleAuth(callback: Function) {
    doc.useServiceAccountAuth(creds, callback);
  }

  getSheetPortion = (sheet, min, max): Promise<any> => {
    return new Promise((resolve, reject) => {
      sheet.getCells({
          'min-row': min,
          'max-row': max,
          'return-empty': true
        }, (err, cells) => {
          if (err) {
            console.log(err);
            reject(err);
          }
          let result = [];
          let row = [];
          cells.forEach(cell => {
            if (cell.col == 1 && cell.row) {
              if (row[1]) result.push(row);
              row = [cell.row];
            }
            row.push(cell.value);
          });
          if (row[0]) result.push(row);
          resolve(result);
        });
      }
    )
    .catch(err => console.log(err));
  }

  googleGetSheet = () => {
    return new Promise((resolve, reject) => {
      this._googleAuth(() => {
        doc.getInfo(async (err, info) => {
          if (err) return reject(err);
          resolve(info.worksheets[1]);
        });
      });
    })
    .catch(err => console.log(err));
  }
}