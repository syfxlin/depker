import YAML from "../deps/std/yaml.ts";
import nunjucks from "../deps/npm/nunjucks.ts";
import { Table } from "../deps/jsr/table.ts";
import { colors } from "../deps/jsr/colors.ts";
import { Depker } from "../depker.ts";

export class LogModule {
  constructor(_depker: Depker) {}

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
    template.addFilter("yaml", (value: any) => YAML.stringify(value), false);
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
    this.raw(YAML.stringify(obj, { skipInvalid: true, indent: 2 }).trim());
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
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
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
    const t = new Table()
      .header(header.map(i => colors.bold.cyan(i)))
      .body(body)
      .border(true);
    this._output("raw", Date.now(), t.toString());
  }

  private _output(level: "raw" | "step" | "debug" | "done" | "info" | "error", time: number, message: string) {
    if (level === "debug" && Deno.env.get("DEPKER_OPTION_DEBUG") !== "true") {
      return;
    }
    if (level === "raw") {
      console.log(message);
      return;
    }
    const data = Deno.env.get("DEPKER_OPTION_TIMESTAMP") ? `[${this.date(Number.parseInt(time as any))}] ${message}` : message;
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
