// Mock keyv module for browser/Turbopack compatibility
// Keyv uses dynamic requires that aren't compatible with bundlers
class Keyv {
  constructor() {
    this.store = new Map();
  }
  get(key) {
    return Promise.resolve(this.store.get(key));
  }
  set(key, value) {
    this.store.set(key, value);
    return Promise.resolve(true);
  }
  delete(key) {
    return Promise.resolve(this.store.delete(key));
  }
  clear() {
    this.store.clear();
    return Promise.resolve();
  }
}

module.exports = Keyv;
