import { from, Observable } from 'rxjs';

export class CacheService {
  private store = {};

  get(key: string) {
    let result = (this.store && this.store[key]) || null;
    // console.log(`Getting ${key}: ${JSON.stringify(result).substr(0, 100)}...`);
    return Object.seal(result);
  }

  getObservable(key: string): Observable<any> {
    let result = this.get(key);
    return result ? from([result]) : null;
  }

  set(key: string, value: any) {
    // console.log(`Setting ${key} to ${JSON.stringify(value).substr(0, 200)}...`);
    this.store[key] = value;
  }

  reset(key?: string|string[]) {
    if (key) {
      // console.log(`Store ${key} cleanup ------------`);
      if (Array.isArray(key)) {
        key.forEach(subKey => delete this.store[subKey]);
      } else {
        delete this.store[key];
      }
    } else {
      // console.log('Store full cleanup ------------');
      this.store = {}
    }
  }
}