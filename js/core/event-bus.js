class EventBus {
  constructor() {
    this.listeners = new Map();
  }
  on(event, callback) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(callback);
    return () => this.listeners.get(event).delete(callback);
  }
  emit(event, payload) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach((cb) => cb(payload));
  }
}

export const bus = new EventBus();
