import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { BaseService } from './base.service';

const serviceKeys = ['columns', 'order', 'group', 'limit'];

@Injectable()
export class FilterService extends BaseService {

  constructor(http: Http) {
    super('filter', http);
  }

  private _parseParam(name: string, value: string = '') {
    switch (name) {
      case'columns':
        return value.split('|').reduce((result, value) => {
          let [param, alias] = value.split(' as ');
          result[param] = alias || param;
          return result;
        }, {});
      case 'order':
        return value.split('|').reduce((result, value) => {
          let order = 1;
          if (value && value.charAt(0) === '-') {
            order = -1;
          }
          value = value.replace(/^[+\-]/, '');
          result.push(value + ':' + order);
          return result;
        }, []).join(',');
    }
    return true;
  }

  parseCriteria(criteria: string = '', timeShift=0) {
    let andOperator = [];
    let orOperator = [];
    let inOperator = {};
    let serviceData = {
      'shift': timeShift
    };
    let result = {};

    if (criteria) {
      criteria.split(',').forEach(pair => {
        let [param, operation, value]: any[] = pair.replace(/([+!]{0,1}[=~])/g, '\n$1\n').split('\n', 3);
        if (!operation && !value) {
          [param, operation, value] = ['name', '~', param];
        }
        if (serviceKeys.includes(param)) {
          serviceData[param] = this._parseParam(param, value);
        } else {
          let addition = false;
          let regexValue = `/${value}/i`;
          switch (operation) {
            case '+~':
              addition = true;
            case '~':
              value = {[param]: regexValue};
              break;
            case '+=':
              addition = true;
              value = {[param]: value};
              break;
            case '!=':
              value = {[param]: {'$ne': value}};
              break;
            case '=':
              if (!inOperator[param]) {
                inOperator[param] = [];
              }
              inOperator[param].push(value);
              return;
          }
          (addition ? orOperator : andOperator).push(value);
        }
      });

      Object.keys(inOperator).forEach(key => {
        let values = inOperator[key];
        if (values.length > 1) {
          andOperator.push({[key]: {'$in': inOperator[key]}});
        } else {
          andOperator.push({[key]: values[0]});
        }
      });

      orOperator.push({'$and': andOperator});
      result = orOperator.length ? {'or': orOperator} : {};
    } else {
      result = {or: []};
    }
    return [result, serviceData];
  }
}
