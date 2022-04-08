import * as builtin from "../extensions/index.ts";

declare global {
  type BuiltinExtension = typeof builtin;

  type Depker = BuiltinExtension & {
    // args
    readonly command: string;
    readonly args?: ReadonlyArray<string>;
    readonly options?: Readonly<Record<string, any>>;
    // system
    readonly ctx: Map<string, any>;
    readonly [key: string]: any;
  };

  const depker: Depker;

  interface Window {
    depker: Depker;
  }
}
