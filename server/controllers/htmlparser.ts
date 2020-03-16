import { visasCols, dePolish } from '../mappings';

const tag = new RegExp(/<\/*[a-z]+[^>]*>/, 'gi');
const paragraph = new RegExp(/<[\/]*p>/, 'gi');
const tild = new RegExp(/~/, 'g');
const deTild = new RegExp(/(^~|~$)/, 'g');

const ampItself = new RegExp(/&amp;/, 'gi');
const amp = new RegExp(/&[a-z]+;/, 'gi');
const whiteSpace = new RegExp(/\s+/, 'gi');
const h3 = new RegExp(/<([/]?h3)[^>]*>/, 'gi');
const table = new RegExp(/<([/]?table)[^>]*>/, 'gi');
const tbody = new RegExp(/<([/]?tbody)[^>]*>/, 'gi');
const tr = new RegExp(/(<[/]?tr[^>]*>){1,2}/, 'gi');
const tick = new RegExp(/<img[^>]+check\.png[^>]*>/, 'gi');
const date = new RegExp(/(\d{1,2}[\s\-]*[a-z]{3,}[\s\-]*\d{4})/, 'i');
const name = new RegExp(/^[a-z]+ [a-z]+$/, 'i');
const types = new RegExp(/(B1\/B2|L1)/, 'ig');
const typesMap = {'L1': 'visaL', 'B1/B2': 'visaB'};
const visaTypes = {
  'B1/B2': /\/B2/,
  'B-1 in lieu of H-1b': /lieu/,
  'L1': /L\s*1/,
  'J visa': /J/,
  'Polish': /VWP/,
  'Schengen': /schengen/i
};

export const usPriorities = {
  'B1/B2': 1,
  'B1 in lieu of H1B': 2,
  'B-1 in lieu of H-1b': 2,
  'J visa': 3,
  'L1': 3,
  'H-1b': 4,
};



const usTypes = Object.keys(usPriorities);
const visaTypesKeys = Object.keys(visaTypes);

var stripTags = (html: string) => {
  return html
    .replace(tick, '1')
    .replace(deTild, '')
    .replace(tag, '')
    .replace(ampItself, '&')
    .replace(amp, '')
    .replace(whiteSpace, ' ')
    .replace(paragraph, '~');
}

var makeDate = (dateString: string) => {
  try {
    let date = new Date(dateString);
    date.setDate(1 + date.getDate());
    return date.toISOString().substr(0, 10);
  } catch (e) {
    return '';
  }
}

var matchDate = (haystack: string) => {
  if (!haystack) return '';
  return makeDate((haystack.match(date) || ['', ''])[1]);
}

var addVisa = (where, type, till) => {
  if (!type) return;
  let foundType = visaTypesKeys.find(typeName => visaTypes[typeName].test(type));
  if (!foundType) return;
  let d = matchDate(till);
  where.push({
    type: foundType,
    till: d ? new Date(d) : null,
    isUs: usPriorities[foundType] || 0
  });
}

export var visasParse = (html: string) => {
  let headers = html.split(h3);
  let locations = {};
  for (var i = 0,l = headers.length; i < l; i++) {
    if (headers[i] === 'h3') {
      let title = stripTags(headers[i + 1]) || 'Saratov';
      locations[title] = headers[i + 3];
    }
  }
  return Object.keys(locations).reduce((visas, location) => {
    let tableMarkup = (locations[location].split(table) || ['', '', ''])[2];
    if (tableMarkup) {
      let colMap = visasCols[location];
      let isPoland = location === 'Krakw';
      tableMarkup
        .split(tr)
        .map(line => stripTags(line.replace(/<\/td>/g, '|')))
        .forEach(line => {
          let cols = line.replace(/\s*\|\s*/g, '|').split('|');
          if (cols.length >= 4) {
            let visa: any = {};
            colMap.forEach((colName, index) => {
              colName.split('|').forEach(col => visa[col] = cols[index]);
            });
            visa.name = visa.name.trim().replace(tild, '');
            if (isPoland) {
              visa.name = visa.name.replace(/[^\w ]/g, char => dePolish[char] || char);
            }
            visa.passport = makeDate(visa.passport);
            visa.visas = [];

            [1, 2, 3].forEach(visaN => {
              let [type, till] = [visa[`type${visaN}`], visa[`till${visaN}`]];
              if (type && till) {
                let [types, tills] = [type.split('~'), till.split('~')];
                types.forEach((type, index) => {
                  addVisa(visa.visas, type || usTypes[visaN - 1], tills[index]);
                });
              }
            });

            if (visa.name.match(name)) {
              visas[visa.name] = {
                visas: visa.visas,
                passport: visa.passport,
                license: visa.license
              };
            }
          }
        });
    } else {
      console.log('Unable to parse visas for', location);
    }

    return visas;
  }, {});

}

export var accountsParse = (html: string) => {
    let tableMarkup = (html.split(tbody) || ['', '', ''])[2];
    let result = [];
    if (tableMarkup) {
      tableMarkup
        .split(tr)
        .map(line => stripTags(line.replace(/<\/td>/g, '|').replace(/<br[^>]*>/gi, '+')))
        .forEach(line => {
          let [account, project, ams, dds, cp, dms, timesheets, ] =
            line.split('|').map(param =>
              param.includes('+') ?
              param.split('+').map(name => name.trim()).join(', ') :
              param.trim()
            );
          if (account && project) {
            result.push({ account, project, ams, dds, cp, dms });
          }
        });
    } else {
      console.log('Unable to parse accounts management data');
    }

    return result;
}
