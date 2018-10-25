import { Pipe, PipeTransform } from '@angular/core';
import * as marked from 'marked';
import { months, monthsRoman } from './sync/mappings';
import { Utils } from './utils';

// Custom markdown renderer for links
var renderer = new marked.Renderer();
renderer.link = function (href: string, title: string, text: string) {
  return `<a href="${href}" title="${title}" target="_blank">${text}</a> <i class="fa fa-external-link-square"></i>`;
};
marked.setOptions({renderer});
//

type dateFormat = 'full' | 'nodate' | 'noyear' | 'ten';

const trailingIndex = new RegExp(/^\d{2} /);
const deCamelExpr = new RegExp(/([^A-Z0-9])([A-Z0-9])/, 'g');

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
    console.log(source, divider);
    if (!source || !divider) return [source];
    return source.split(divider);
  }
}

@Pipe({name: 'ellipsis'})
export class EllipsisPipe implements PipeTransform {
  transform(source: any, ifEmpty: string): string {
    if (typeof source === 'boolean') {
      source = source.toString();
    }
    return source || ifEmpty;
  }
}

@Pipe({name: 'cutIndex'})
export class CutIndexPipe implements PipeTransform {
  transform(source: string = '') {
    return source.replace(trailingIndex, '');
  }
}

@Pipe({name: 'column'})
export class ColumnPipe implements PipeTransform {
  transform(line: any, name: string) {
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
      case 'assignments':
        if (value) {
          if (!secondary) {
            secondary = 'login';
          }
          return Object.values(value).map((assignments: any) => {
            if (!(assignments instanceof Array)) {
              assignments = [assignments];
            }
            return assignments.map(assignment => {
              if (assignment.demand) {
                assignment = assignment.demand;
              }
              return assignment[secondary] || '';
            }).join('\n* ');
          }).join(', ');
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
      case 'demand':
        value = (value && secondary) ? value[secondary] : '';
        switch (secondary) {
          case 'start':
          case 'end':
            return formatDate(value);
        }
    }
    if (typeof value !== 'string') {
      value = new String(value).toString();
    }
    return value === 'undefined' ? '' : value;
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
    return source.replace(deCamelExpr, '$1 $2').trim();
  }
}
