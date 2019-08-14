import { from, Observable } from 'rxjs';

export class CacheService {
  private store = {};

  get(key: string) {
    let result = (this.store && this.store[key]) || null;
    // console.log(`Getting ${key}: ${JSON.stringify(result).substr(0, 100)}...`);
    return result;
  }

  getObservable(key: string): Observable<any> {
    let result = this.get(key);
    return result ? from([result]) : null;
  }

  set(key: string, value: any) {
    // console.log(`Setting ${key} to ${JSON.stringify(value).substr(0, 100)}...`);
    this.store[key] = value;
  }

  reset(key?: string) {
    if (key) {
      // console.log('Store ${key} cleanup ------------');
      delete this.store[key];
    } else {
      // console.log('Store cleanup ------------');
      this.store = {}
    }
  }
}