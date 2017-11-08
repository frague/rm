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