import { EventEmitter } from "events";

export class AsyncEventEmitter extends EventEmitter {
  public async emitAsync(
    eventName: string | symbol,
    ...args: any[]
  ): Promise<boolean> {
    // @ts-ignore
    const handler = this._events[eventName];
    if (handler === undefined) {
      return false;
    }
    const promises: Promise<any>[] = [];
    if (typeof handler === "function") {
      promises.push(handler.apply(this, args));
    } else {
      const listeners = [...handler];
      for (const listener of listeners) {
        promises.push(listener.apply(this, args));
      }
    }
    await Promise.all(promises);
    return true;
  }
}

export const events = new AsyncEventEmitter();
