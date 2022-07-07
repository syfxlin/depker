export type DepkerEvents = {
  init: [];
  destroy: [];
};

export class EventEmitter<E extends Record<string, unknown[]>> {
  // prettier-ignore
  private readonly listeners = new Map<any, Set<{ once: boolean; handler: any }>>();

  // prettier-ignore
  private add<K extends keyof E>(event: K, once: boolean, handler: (...args: E[K]) => void | Promise<void>) {
    const set = this.listeners.get(event)?.add({once, handler}) ?? new Set([{once, handler}]);
    this.listeners.set(event, set);
  }

  public on<K extends keyof E>(
    event: K,
    handler: (...args: E[K]) => void | Promise<void>
  ) {
    this.add(event, false, handler);
  }

  public once<K extends keyof E>(
    event: K,
    handler: (...args: E[K]) => void | Promise<void>
  ) {
    this.add(event, true, handler);
  }

  public off<K extends keyof E>(
    event?: K,
    handler?: (...args: E[K]) => void | Promise<void>
  ) {
    if (event === undefined) {
      this.listeners.clear();
    } else if (handler === undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.get(event)?.forEach((payload, _, payloads) => {
        handler === payload.handler && payloads.delete(payload);
      });
    }
  }

  public async emit<K extends keyof E>(event: K, ...args: E[K]) {
    for (const item of this.listeners.get(event) ?? []) {
      await item.handler(...args);
      item.once && this.off(event, item.handler);
    }
  }
}

export const events = new EventEmitter<DepkerEvents>();
