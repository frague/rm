export class CacheService {
  private store = {};

  get(key: string) {
    return (this.store && this.store[key]) || null;
  }

  set(key: string, value: any) {
    this.store[key] = value;
  }

  reset() {
    this.store = {};
  }
}