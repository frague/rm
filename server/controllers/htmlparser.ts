const tag = new RegExp(/<[\/a-z]+[^>]*>/, 'gi');
const amp = new RegExp(/&[a-z]+;/, 'gi');
const whiteSpace = new RegExp(/\s+/, 'gi');
const table = new RegExp(/<([/]?table)[^>]*>/, 'gi');
const tr = new RegExp(/(<[/]?tr[^>]*>){1,2}/, 'gi');
const tick = new RegExp(/<img[^>]+check\.png[^>]*>/, 'gi');
const date = new RegExp(/(\d{1,2}\s*[a-z]{3}\s*\d{4})/, 'i');

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

export var htmlParse = (html: string) => {
  return html.split(table).reduce((result, part, index, tables) => {
    console.log(part.substr(0, 5).toLowerCase());
    if (part.substr(0, 5).toLowerCase() === 'table') {
      tables[index + 1]
        .split(tr)
        .map(line => stripTags(line.replace(/<\/td>/g, '|')))
        .forEach(line => {
          let cols = line.replace(/\s*\|\s*/g, '|').split('|');
          if (cols.length >= 4) {
            if (cols[0] == (+cols[0]).toString()) {
              cols.splice(0, 1);
            }
            let name = cols.shift().trim();
            if (name.indexOf(' ') < 0) return;

            let license = !!cols[cols.length - 2];

            cols.shift();
            let passport = makeDate(cols.shift());

            let visaB: any = cols.shift().match(date);
            if (visaB) {
              visaB = visaB[1];
            } else {
              visaB = (cols.shift().match(date) || ['', ''])[1];
            }

            let visaL: any = cols.shift().match(date);
            if (visaL) {
              visaL = visaL[1];
            } else {
              visaL = (cols.shift().match(date) || ['', ''])[1];
            }

            let data = {
              passport,
              license,
              visaB: makeDate(visaB),
              visaL: makeDate(visaL)
            };
            result[name] = data;
          }
        });
    }
    return result;
  }, {});
}
