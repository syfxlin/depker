import { Depker } from "../../depker.ts";
import { ansi, date, nunjucks, table, yaml } from "../../deps.ts";
import { LogLevel } from "./types.ts";

export * from "./types.ts";

export class LogModule {
  constructor(private readonly depker: Depker) {}

  public format(...messages: any[]) {
    const results: string[] = [];
    for (let message of messages) {
      if (message instanceof Error) {
        // @ts-expect-error
        results.push(message?.response?.body?.message ?? message.message);
        // eslint-disable-next-line no-cond-assign
        while ((message = message.cause)) {
          results.push(`  [cause]: ${message?.response?.body?.message ?? message.message}`);
        }
      } else {
        results.push(message);
      }
    }
    return results.join("\n");
  }

  public parse(value: string, data: any) {
    const template = new nunjucks.Environment(null, { autoescape: false, noCache: true });
    template.addGlobal("env", Deno.env);
    template.addGlobal("deno", Deno);
    template.addFilter("json", (value: any) => JSON.stringify(value, undefined, 2), false);
    template.addFilter("yaml", (value: any) => yaml.stringify(value), false);
    if (data instanceof Object) {
      // @ts-expect-error
      return template.renderString(value, data, undefined, undefined).trim();
    } else {
      // @ts-expect-error
      return template.renderString(value, { it: data }, undefined, undefined).trim();
    }
  }

  public json(obj: any) {
    this.raw(JSON.stringify(obj, undefined, 2).trim());
  }

  public yaml(obj: any) {
    this.raw(yaml.stringify(obj, { skipInvalid: true, noRefs: true, indent: 2 }).trim());
  }

  public byte(value: number) {
    const units = [`B`, `KB`, `MB`, `GB`, `TB`, `PB`];
    while (value > 1024 && units.length > 1) {
      units.shift();
      value /= 1024;
    }
    return `${value.toFixed(2)} ${units[0]}`;
  }

  public date(value: string | number) {
    return date.datetime(value).toLocal().format("YYYY-MM-dd HH:mm:ss");
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
    const t = new table.Table()
      .header(header.map(i => ansi.colors.bold.cyan(i)))
      .body(body)
      .border(true);
    this._output("raw", Date.now(), t.toString());
  }

  public render(value: string, data: any) {
    if (Array.isArray(data)) {
      for (const context of data) {
        this._output("raw", Date.now(), this.parse(value, context));
      }
    } else {
      this._output("raw", Date.now(), this.parse(value, data));
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
    const data = Deno.env.get("DEPKER_OPTION_TIMESTAMP") ? `[${this.date(Number.parseInt(time as any))}] ${message}` : message;
    if (level === "step") {
      console.log(`${ansi.colors.bold.cyan("[STEP] ❯ ")}${data}`);
    } else if (level === "debug") {
      console.log(`${ansi.colors.bold.gray("[DEBUG] ☰ ")}${data}`);
    } else if (level === "info") {
      console.log(`${ansi.colors.bold.blue("[INFO] i ")}${data}`);
    } else if (level === "done") {
      console.log(`${ansi.colors.bold.green("[DONE] ✔ ")}${data}`);
    } else if (level === "error") {
      console.error(`${ansi.colors.bold.red("[ERROR] ✖ ")}${data}`);
    }
  }
}
