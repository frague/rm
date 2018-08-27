import { visasCols, dePolish } from '../mappings';

const tag = new RegExp(/<\/*[a-z]+[^>]*>/, 'gi');
const paragraph = new RegExp(/<[\/]*p>/, 'gi');
const tild = new RegExp(/~/, 'g');
const deTild = new RegExp(/(^~|~$)/, 'g');

const amp = new RegExp(/&[a-z]+;/, 'gi');
const whiteSpace = new RegExp(/\s+/, 'gi');
const h3 = new RegExp(/<([/]?h3)[^>]*>/, 'gi');
const table = new RegExp(/<([/]?table)[^>]*>/, 'gi');
const tr = new RegExp(/(<[/]?tr[^>]*>){1,2}/, 'gi');
const tick = new RegExp(/<img[^>]+check\.png[^>]*>/, 'gi');
const date = new RegExp(/(\d{1,2}[\s\-]*[a-z]{3,}[\s\-]*\d{4})/, 'i');
const name = new RegExp(/^[a-z]+ [a-z]+$/, 'i');
const types = new RegExp(/(B1\/B2|L1)/, 'ig');
const typesMap = {'L1': 'visaL', 'B1/B2': 'visaB'};
const visaTypes = {
  'B1/B2': /\/B2/,
  'B1 in lieu of H1B': /lieu/,
  'L1': /L\s*1/,
  'Polish': /VWP/,
  'Schengen': /schengen/i
};
const usTypes = ['B1/B2', 'L1', 'B1 in lieu of H1B'];
const visaTypesKeys = Object.keys(visaTypes);

var stripTags = (html: string) => {
  return html
    .replace(tick, '1')
    .replace(deTild, '')
    .replace(tag, '')
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
    isUs: usTypes.includes(foundType)
  });
}

export var htmlParse = (html: string) => {
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
