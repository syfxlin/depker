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
    if (typeof handler === "function") {
      await handler.apply(this, args);
    } else {
      const listeners = [...handler];
      for (const listener of listeners) {
        await listener.apply(this, args);
      }
    }
    return true;
  }
}

export const events = new AsyncEventEmitter();
