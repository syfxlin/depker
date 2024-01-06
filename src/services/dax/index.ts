import { $BuiltInProperties, build$, CommandBuilder, RequestBuilder } from "../../deps.ts";

CommandBuilder.prototype.jsonl = async function <T = any>(this: CommandBuilder): Promise<T> {
  const lines = await this.lines();
  return lines.map((i) => JSON.parse(i)) as T;
};

RequestBuilder.prototype.jsonl = async function <T = any>(this: RequestBuilder): Promise<T> {
  const texts = await this.text();
  const lines = texts.split(/\r?\n/g);
  return lines.map((i) => JSON.parse(i)) as T;
};

interface Template<TE = {}>
  extends Omit<
    // @ts-ignore
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

export type Dax<TExtras = {}> = Template<TExtras> & TExtras;

export function dax<TExtras = {}>(): Dax<TExtras> {
  const command = new CommandBuilder().stdin("null").stdout("piped").stderr("inherit").env(Deno.env.toObject());
  // @ts-ignore
  return build$({ commandBuilder: command });
}
