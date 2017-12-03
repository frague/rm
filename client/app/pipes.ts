import { Pipe, PipeTransform } from '@angular/core';
import { Utils } from './utils';
import { months } from './sync/mappings';

@Pipe({name: 'date'})
export class PrintableDatePipe implements PipeTransform {
  transform(date: string): string {
    if (!date) {
      return 'Not set';
    }
    let d = new Date(date);
    return [d.getDate(), months[d.getMonth()], d.getFullYear()].join(' ');
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


