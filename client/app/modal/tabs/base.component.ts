export abstract class BaseTabComponent {
  isLoading = false;
  state = {};

  fetchData() {}

  ngOnInit() {
    this.fetchData();
  }

  getState(type: string, key: string): any {
    return (this.state[type] || {})[key];
  }

  setState(type: string, key: string, value: any): void {
    let storage = this.state[type] || {};
    storage[key] = value;
    this.state[type] = storage;
  }
}