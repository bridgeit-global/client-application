// Mock keyv module for browser/Turbopack compatibility
// Keyv uses dynamic requires that aren't compatible with bundlers
class Keyv {
  constructor(options = {}) {
    this.store = new Map();
    this.namespace = options.namespace || 'keyv';
  }
  get(key) {
    const namespacedKey = `${this.namespace}:${key}`;
    return Promise.resolve(this.store.get(namespacedKey));
  }
  set(key, value, ttl) {
    const namespacedKey = `${this.namespace}:${key}`;
    this.store.set(namespacedKey, value);
    if (ttl) {
      setTimeout(() => {
        this.store.delete(namespacedKey);
      }, ttl);
    }
    return Promise.resolve(true);
  }
  delete(key) {
    const namespacedKey = `${this.namespace}:${key}`;
    return Promise.resolve(this.store.delete(namespacedKey));
  }
  clear() {
    this.store.clear();
    return Promise.resolve();
  }
}

module.exports = Keyv;

