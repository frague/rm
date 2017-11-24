import { visasCols } from '../mappings';

const tag = new RegExp(/<[\/a-z]+[^>]*>/, 'gi');


const amp = new RegExp(/&[a-z]+;/, 'gi');
const whiteSpace = new RegExp(/\s+/, 'gi');
const h3 = new RegExp(/<([/]?h3)[^>]*>/, 'gi');
const table = new RegExp(/<([/]?table)[^>]*>/, 'gi');
const tr = new RegExp(/(<[/]?tr[^>]*>){1,2}/, 'gi');
const tick = new RegExp(/<img[^>]+check\.png[^>]*>/, 'gi');
const date = new RegExp(/(\d{1,2}\s*[a-z]{3}\s*\d{4})/, 'i');
const name = new RegExp(/^[a-z]+ [a-z]+$/, 'i');

var stripTags = (html: string) => {
  return html
    .replace(tick, '1')
    .replace(tag, '')
    .replace(amp, '')
    .replace(whiteSpace, ' ');
}

var makeDate = (dateString: string) => {
  try {
    let date = new Date(dateString);
    return date.toISOString().substr(0, 10);
  } catch (e) {
    return '';
  }
}

var matchDate = (haystack: string) => {
  if (!haystack) return '';
  return makeDate((haystack.match(date) || ['', ''])[1]);
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
    let tableMarkup = locations[location].split(table)[2];
    let colMap = visasCols[location];
    tableMarkup
      .split(tr)
      .map(line => stripTags(line.replace(/<\/td>/g, '|')))
      .forEach(line => {
        let cols = line.replace(/\s*\|\s*/g, '|').split('|');
        if (cols.length >= 4) {
          let visa: any = {};
          colMap.forEach((colName, index) => visa[colName] = cols[index]);
          visa.name = visa.name.trim();
          visa.passport = makeDate(visa.passport);
          visa.visaB = matchDate(visa.visaB);
          visa.visaL = matchDate(visa.visaL);
          delete visa[''];

          if (visa.name.match(name)) {
            visas[visa.name] = visa;
          }
        }
      });

    return visas;
  }, {});

}
