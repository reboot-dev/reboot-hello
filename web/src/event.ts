export class Event {
  resolve: () => void;
  promise: Promise<void>;

  constructor() {
    let _resolve = () => {};
    this.promise = new Promise((resolve, reject) => {
      _resolve = resolve;
    });
    this.resolve = _resolve;
  }

  async wait() {
    return await this.promise;
  }

  set() {
    this.resolve();
  }
}
