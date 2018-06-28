import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from './utils';
import { months } from './sync/mappings';

const trailingIndex = new RegExp(/^\d{2} /);

const formatDate = (date: any, cutDay=false) => {
  if (!date) {
    return 'Not set';
  }
  let d = new Date(date);
  return [cutDay ? null : d.getDate(), months[d.getMonth()], d.getFullYear()].join(' ');
}

@Pipe({name: 'date'})
export class PrintableDatePipe implements PipeTransform {
  transform(date: any, cutDay=false): string {
    return formatDate(date, cutDay);
  }
}

@Pipe({name: 'avatarUrl'})
export class AvatarUrlPipe implements PipeTransform {
  transform(login: string): string {
    return 'https://in.griddynamics.net/service/photos/' + login + '.jpg';
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
  transform(source: string) {
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
      case 'visaB':
      case 'visaL':
      case 'updated':
      case 'birthday':
        return formatDate(value);
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
    }
    if (typeof value !== 'string') {
      value = new String(value).toString();
    }
    return value === 'undefined' ? '' : value;
  }
}


