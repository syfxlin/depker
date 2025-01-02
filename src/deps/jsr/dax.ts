export * from "https://jsr.io/@david/dax/0.42.0/mod.ts";

declare module "https://jsr.io/@david/dax/0.42.0/mod.ts" {
  // @ts-expect-error
  import { CommandBuilder as CB, RequestBuilder as RB } from "https://jsr.io/@david/dax/0.42.0/mod.ts";

  // @ts-expect-error
  interface CommandBuilder extends CB {
    // eslint-disable-next-line ts/method-signature-style
    jsonl<T = any>(): Promise<T>;
  }

  // @ts-expect-error
  interface RequestBuilder extends RB {
    // eslint-disable-next-line ts/method-signature-style
    jsonl<T = any>(): Promise<T>;
  }
}
