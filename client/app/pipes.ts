import { Pipe, PipeTransform } from '@angular/core';
import * as marked from 'marked';
import { months, monthsRoman } from './sync/mappings';
import { Utils } from './utils';

const listDiffs = [
  'candidates',
  'proposed',
  'locations',
  'grades',
  'visas',
  'Account Directors',
  'Delivery Directors',
  'Customer Partners',
  'Delivery Managers',
];

// Custom markdown renderer for links
var renderer = new marked.Renderer();
renderer.link = function (href: string, title: string, text: string) {
  let target = `${href}`.replace(/^.+:\/\//, '').replace(/\/.*/, '');
  return `<a href="${href}" title="${title}" target="${target}">${text}</a> <i class="fa fa-external-link-square"></i>`;
};
marked.setOptions({renderer});
//

type dateFormat = 'full' | 'nodate' | 'noyear' | 'ten';

const trailingIndex = new RegExp(/^\d{2} /);
const deCamelExpr = new RegExp(/([^A-Z0-9])([A-Z0-9])/, 'g');
const closedStates = ['Filled', 'Closed', 'Cancelled', 'On hold'];
const states = {
  true: 'Active',
  false: 'Inactive'
};

const formatDate = (date: any, format: dateFormat = 'full') => {
  if (!date) {
    return 'Not set';
  }
  let d = new Date(date);
  let delimiter = ' ';
  let result;
  switch (format) {
    case 'nodate':
      result = [months[d.getMonth()], d.getFullYear()];
      break;
    case 'noyear':
      result = [months[d.getMonth()], d.getDate()];
      delimiter = ', ';
      break;
    case 'ten':
      result = [d.getFullYear(), Utils.leadingZero(1 + d.getMonth()), Utils.leadingZero(d.getDate())];
      delimiter = '-';
      break;
    default:
      result = [d.getDate(), months[d.getMonth()], d.getFullYear()];
  }
  return result.join(delimiter);
}

@Pipe({name: 'date'})
export class PrintableDatePipe implements PipeTransform {
  transform(date: any, format: dateFormat = 'full'): string {
    return formatDate(date, format);
  }
}

@Pipe({name: 'range'})
export class RangePipe implements PipeTransform {
  transform(num: number): any[] {
    return new Array(num + 1).join(' ').split('');
  }
}

@Pipe({name: 'keys'})
export class KeysPipe implements PipeTransform {
  transform(source: Object): string[] {
    if (!source) return [];
    return Object.keys(source);
  }
}

@Pipe({name: 'split'})
export class SplitPipe implements PipeTransform {
  transform(source: string, divider: string): string[] {
    if (!source || !divider) return [source];
    return source.split(divider);
  }
}

const _ellipsis = (source: any, ifEmpty = '...'): string => {
  if (typeof source === 'boolean') {
    source = source.toString();
  }
  return source || ifEmpty;
}

@Pipe({name: 'ellipsis'})
export class EllipsisPipe implements PipeTransform {
  transform(source: any, ifEmpty: string): string {
    return _ellipsis(source, ifEmpty);
  }
}

@Pipe({name: 'cut'})
export class CutByPipe implements PipeTransform {
  transform(source: any, by: number): string {
    if (typeof source !== 'string') {
      source = '' + source;
    }
    return source.length < by ? source : source.substr(0, by) + '...';
  }
}

@Pipe({name: 'cutIndex'})
export class CutIndexPipe implements PipeTransform {
  transform(source: string = '') {
    return source.replace(trailingIndex, '');
  }
}

const _compare = (demand, requisition): string => {
  let result = [];

  // Equally open or closed (filled)
  let [d, r] = [!!demand.login, !closedStates.includes(requisition.jobState)];
  if (d !== r) {
    return `* States: requisition - ${states[''+r]}, demand - ${states[''+d]}`;
  }
  // Set of locations differs
  [d, r] = [
    demand.locations.sort().join(', '),
    requisition.location
  ];
  if (d !== r) {
    result.push(`* Locations: requisition - ${r}, demand - ${d}`);
  }

  return result.join('\n');
}

@Pipe({name: 'column'})
export class ColumnPipe implements PipeTransform {
  transform(line: any, name='') {
    let [primary, secondary] = name.split('.');
    let value = line[primary];
    switch (primary) {
      case 'start':
      case 'end':
      case 'nextPr':
      case 'passport':
      case 'updated':
      case 'birthday':
        return formatDate(value);
      case 'activeUsVisa':
        if (value) {
          return `**${value.type}**: ${formatDate(value.till)}`;
        }
        return '';
      case 'assignment':
        [, secondary] = name.split('.');
        value = line['assignments'];
      case 'assignments':
        if (value) {
          return Object.keys(value)
            .filter(account => account !== 'vacation')
            .map((account: any) => {
              let accountAssignments = value[account];
              if (!(accountAssignments instanceof Array)) {
                accountAssignments = [accountAssignments];
              }
              let assignmentsList = accountAssignments.map(assignment => {
                let result = `__${assignment.account}__: ${assignment.initiative || '-'} (${assignment.involvement}% ${assignment.billability})`;
                if (assignment.demand) {
                  assignment = assignment.demand;
                  result = `Demand for __${assignment.profile}__ @${assignment.account} (${assignment.project})`;
                }
                return secondary ? this.transform(assignment, secondary) : result;
              }).join('\n* ');
              return `* ${assignmentsList}`;
            }).join('\n');
        }
        return '';
      case 'comments':
        if (value) {
          if (secondary) {
            return value
              .filter(comment => comment.source === secondary)
              .map(comment => comment.text)
              .join(', ')
          }
          return value
            .map((comment, index) => {
              return comment  ? (index ? '\n---\n# ' : '# ') + formatDate(comment.date) + (comment.source ? ', ' + comment.source : '') + '\n\n' + comment.text : ''
            })
            .join('\n\n');
        }
      case 'status':
        if (value && typeof value === 'object') {
          return value.text;
        }
      case 'badges': {
        return (value || [])
          .map(badge => secondary ? badge[secondary] : `${badge.short || Utils.abbreviate(badge.title)} (${badge.title})`)
          .join(', ');

      }
      case 'demand':
        if (line.isDemand) {
          return this.transform(line.demand, secondary);
        }
      case 'demands':
        value = value instanceof Array ? value : [];
        return value
          .map(demand => '#' + (demand.id || '').split('_')[0])
          .join(', ');
      case 'discrepancies':
        value = line['demands'];
        value = value instanceof Array ? value : [];
        let isSingle = value.length === 1;
        return value
          .map(demand => {
            let id = '#' + (demand.id || '').split('_')[0];
            let diff = _compare(demand, line);
            return diff ? (isSingle ? '' : `**${id}**\n`) + `${diff}` : '';
          })
          .join('\n\n');
      case 'state':
        if (value) {
          return value.replace(/^\d+ /, '');
        }
      case 'skills':
      return secondary ?
        (value[secondary] || '').toLowerCase() :
        Object.keys(value || {}).sort().map(skill => `* **${skill}**: ${(value[skill] || '').toLowerCase()}`).join('\n');
    }

    if (typeof value !== 'string') {
      value = new String(value).toString();
    }
    return ['undefined', 'null'].includes(value) ? '' : value;
  }
}

@Pipe({name: 'markdown'})
export class MarkdownPipe implements PipeTransform {
  transform(source: string) {
    if (!source) return '';
    return marked(source);
  }
}

@Pipe({name: 'deCamel'})
export class DeCamelPipe implements PipeTransform {
  transform(source: string = '') {
    return source.replace(/\./g, ' ').replace(deCamelExpr, '$1 $2').trim();
  }
}

@Pipe({name: 'diff'})
export class DiffPipe implements PipeTransform {
  transform(source: any, key: string) {
    let diff = source.diff;
    if (!diff || !diff[key]) return '';
    let [before, after] = diff[key];

    if (listDiffs.includes(key)) {
      let [b, a] = [before.split(/ *, */), after.split(/ *, */)];
      if (before) before = b.map(item => a.includes(item) ? item : `*${item}*`).join(', ');
      if (after) after = a.map(item => b.includes(item) ? item : `**${item}**`).join(', ');
    }
    return `${_ellipsis(before)} &rarr; ${_ellipsis(after)}`;
  }
}
