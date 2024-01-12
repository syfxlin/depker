import { dax } from "../../deps.ts";

dax.CommandBuilder.prototype.jsonl = async function <T = any>(this: dax.CommandBuilder): Promise<T> {
  const lines = await this.lines();
  return lines.map(i => JSON.parse(i)) as T;
};

dax.RequestBuilder.prototype.jsonl = async function <T = any>(this: dax.RequestBuilder): Promise<T> {
  const texts = await this.text();
  const lines = texts.split(/\r?\n/g);
  return lines.map(i => JSON.parse(i)) as T;
};

interface Template<TE = object>
  extends Omit<
    // @ts-expect-error
    dax.$BuiltInProperties<TE>,
    | "log"
    | "logLight"
    | "logStep"
    | "logError"
    | "logWarn"
    | "logGroup"
    | "logGroupEnd"
    | "logDepth"
    | "setInfoLogger"
    | "setWarnLogger"
    | "setErrorLogger"
    | "maybeConfirm"
    | "confirm"
    | "maybeSelect"
    | "select"
    | "maybeMultiSelect"
    | "multiSelect"
    | "maybePrompt"
    | "prompt"
    | "progress"
  > {
  (strings: TemplateStringsArray, ...exprs: any[]): dax.CommandBuilder;
}

export type Dax<TExtras = object> = Template<TExtras> & TExtras;

export function createDax<TExtras = object>(): Dax<TExtras> {
  const command = new dax.CommandBuilder().stdin("null").stdout("piped").stderr("inherit").env(Deno.env.toObject());
  // @ts-expect-error
  return dax.build$({ commandBuilder: command });
}
