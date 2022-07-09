import { deferred } from "https://deno.land/std@0.133.0/async/deferred.ts";

type PullItem = (value: string | null) => void;
type PushItem = string | null;

export class Duplex
  implements Promise<string[]>, AsyncIterableIterator<string>
{
  private readonly pulls: PullItem[] = [];
  private readonly pushs: PushItem[] = [];
  private readonly store: string[] = [];
  private readonly defer = deferred<string[]>();

  public push(value: string | null) {
    if (value !== null) {
      this.store.push(value);
    } else {
      this.defer.resolve(this.store);
    }
    if (this.pulls.length) {
      this.pulls.shift()?.(value);
    } else {
      this.pushs.push(value);
    }
  }

  public pull() {
    return new Promise<string | null>((resolve) => {
      if (this.pushs.length) {
        resolve(this.pushs.shift() ?? null);
      } else {
        this.pulls.push(resolve);
      }
    });
  }

  public end() {
    this.push(null);
  }

  public get [Symbol.toStringTag](): string {
    return "Duplex";
  }

  public async then<R = string[], S = never>(
    resolve?: ((value: string[]) => PromiseLike<R> | R) | undefined | null,
    reject?: ((reason: any) => PromiseLike<S> | S) | undefined | null
  ): Promise<R | S> {
    return await this.defer.then(resolve, reject);
  }

  public async catch<R = never>(
    reject?: ((reason: any) => PromiseLike<R> | R) | undefined | null
  ): Promise<string[] | R> {
    return await this.defer.catch(reject);
  }

  public async finally(
    onfinally?: (() => void) | undefined | null
  ): Promise<string[]> {
    // @ts-ignore
    return await this.defer.finally(onfinally);
  }

  public [Symbol.asyncIterator](): AsyncIterableIterator<string> {
    return this;
  }

  public async next(): Promise<IteratorResult<string>> {
    const value = await this.pull();
    return value
      ? { done: false, value: value }
      : { done: true, value: undefined };
  }
}
