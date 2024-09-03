import { $BuiltInProperties, CommandBuilder, RequestBuilder, build$ } from "../deps/jsr/dax.ts";

CommandBuilder.prototype.jsonl = async function <T = any>(this: CommandBuilder): Promise<T> {
  const lines = await this.lines();
  return lines.filter(i => i).map(i => JSON.parse(i)) as T;
};

RequestBuilder.prototype.jsonl = async function <T = any>(this: RequestBuilder): Promise<T> {
  const texts = await this.text();
  const lines = texts.split(/\r?\n/g);
  return lines.filter(i => i).map(i => JSON.parse(i)) as T;
};

interface Template<TE = object>
  extends Omit<
    // @ts-expect-error
    $BuiltInProperties<TE>,
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
  (strings: TemplateStringsArray, ...exprs: any[]): CommandBuilder;
}

export type ExecModule<TExtras = object> = Template<TExtras> & TExtras;

export function createExec<TExtras = object>(): ExecModule<TExtras> {
  const command = new CommandBuilder().stdin("null").stdout("piped").stderr("inherit").env(Deno.env.toObject());
  // @ts-expect-error
  return build$({ commandBuilder: command });
}
