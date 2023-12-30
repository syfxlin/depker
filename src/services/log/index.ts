import { Depker } from "../../depker.ts";
import { colors, datetime, nunjucks, Table, yaml } from "../../deps.ts";
import { LogLevel } from "./types.ts";

export * from "./types.ts";

export class LogModule {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly depker: Depker) {}

  public format(...messages: any[]) {
    const results: string[] = [];
    for (let message of messages) {
      if (message instanceof Error) {
        // @ts-ignore
        results.push(message?.response?.body?.message ?? message.message);
        while ((message = message.cause)) {
          results.push(`  [cause]: ${message?.response?.body?.message ?? message.message}`);
        }
      } else {
        results.push(message);
      }
    }
    return results.join("\n");
  }

  // prettier-ignore
  public parse(value: string, context: Record<string, any>) {
    const template = new nunjucks.Environment(null, { autoescape: false, noCache: true });
    template.addGlobal("ctx", context);
    template.addGlobal("env", Deno.env);
    template.addGlobal("deno", Deno);
    // @ts-ignore
    template.addFilter("json", (value: any) => JSON.stringify(value, undefined, 2), false);
    template.addFilter("yaml", (value: any) => yaml.stringify(value), false);
    // @ts-ignore
    return template.renderString(value, context, undefined, undefined).trim();
  }

  public json(obj: any) {
    this.raw(JSON.stringify(obj, undefined, 2).trim());
  }

  public yaml(obj: any) {
    this.raw(yaml.stringify(obj, { skipInvalid: true, noRefs: true, indent: 2 }).trim());
  }

  public raw(...message: string[]) {
    this._output("raw", Date.now(), this.format(...message));
  }

  public step(...message: string[]) {
    this._output("step", Date.now(), this.format(...message));
  }

  public debug(...message: string[]) {
    this._output("debug", Date.now(), this.format(...message));
  }

  public info(...message: string[]) {
    this._output("info", Date.now(), this.format(...message));
  }

  public done(...message: string[]) {
    this._output("done", Date.now(), this.format(...message));
  }

  public error(...message: any[]) {
    this._output("error", Date.now(), this.format(...message));
  }

  public table(header: string[], body: string[][]) {
    const table = new Table()
      .header(header.map((i) => colors.bold.cyan(i)))
      .body(body)
      .border(true);
    this._output("raw", Date.now(), table.toString());
  }

  public render(value: string, contexts: Array<Record<string, any>>) {
    for (const context of contexts) {
      this._output("raw", Date.now(), this.parse(value, context));
    }
  }

  private _output(level: LogLevel, time: number, message: string) {
    if (level === "debug" && Deno.env.get("DEPKER_OPTION_DEBUG") !== "true") {
      return;
    }
    if (level === "raw") {
      console.log(message);
      return;
    }
    // prettier-ignore
    const data = Deno.env.get("DEPKER_OPTION_TIMESTAMP") ? `[${datetime(parseInt(time as any)).format("yyyy/MM/dd HH:mm:ss")}] ${message}` : message;
    if (level === "step") {
      console.log(`${colors.bold.cyan("[STEP] ❯ ")}${data}`);
    } else if (level === "debug") {
      console.log(`${colors.bold.gray("[DEBUG] ☰ ")}${data}`);
    } else if (level === "info") {
      console.log(`${colors.bold.blue("[INFO] i ")}${data}`);
    } else if (level === "done") {
      console.log(`${colors.bold.green("[DONE] ✔ ")}${data}`);
    } else if (level === "error") {
      console.error(`${colors.bold.red("[ERROR] ✖ ")}${data}`);
    }
  }
}
