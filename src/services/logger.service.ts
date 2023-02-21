import util from "util";
import chalk from "chalk";
import table from "tty-table";
import { $date } from "../utils/human.util";
import { DateTime } from "luxon";
import { Command } from "commander";
import { Environment } from "nunjucks";
import YAML from "yaml";

export type LogLevel = "raw" | "step" | "debug" | "done" | "info" | "error";

export class LoggerService {
  constructor(private readonly cli: Command) {}

  public format(message: string, ...params: any[]) {
    const _params = params.map((i) => {
      if (i instanceof Error) {
        // @ts-ignore
        const message = [i?.response?.body?.message ?? i.message];
        while ((i = i.cause)) {
          message.push(i?.response?.body?.message ?? i.message);
        }
        return message.join(`\n    [cause] `);
      }
      return i;
    });
    return util.format(message, ..._params);
  }

  public parse(value: string, context: Record<string, any>) {
    const template = new Environment(null, { autoescape: false, noCache: true });
    template.addGlobal("ctx", context);
    template.addGlobal("env", process.env);
    template.addGlobal("process", process);
    template.addFilter("json", (value: any) => JSON.stringify(value, undefined, 2));
    template.addFilter("yaml", (value: any) => YAML.stringify(value));
    return template.renderString(value, context).trim();
  }

  public filter(value: string, context: Record<string, any>) {
    return value ? this.parse(`{{ ${value} }}`, context) === "true" : true;
  }

  public raw(message: string, ...params: any[]) {
    this._output("raw", DateTime.utc().valueOf(), this.format(message, ...params));
  }

  public step(message: string, ...params: any[]) {
    this._output("step", DateTime.utc().valueOf(), this.format(message, ...params));
  }

  public debug(message: string, ...params: any[]) {
    this._output("debug", DateTime.utc().valueOf(), this.format(message, ...params));
  }

  public info(message: string, ...params: any[]) {
    this._output("info", DateTime.utc().valueOf(), this.format(message, ...params));
  }

  public done(message: string, ...params: any[]) {
    this._output("done", DateTime.utc().valueOf(), this.format(message, ...params));
  }

  public error(message: string, ...params: any[]) {
    this._output("error", DateTime.utc().valueOf(), this.format(message, ...params));
  }

  public table(header: string[], body: string[][]) {
    const values = table(
      // @ts-ignore
      header.map((h) => ({ value: h })),
      body,
      {
        headerAlign: "left",
        headerColor: "cyan",
        align: "left",
        marginTop: 0,
        marginBottom: 0,
        marginLeft: 0,
        marginRight: 0,
      }
    );
    this._output("raw", DateTime.utc().valueOf(), values.render().trim());
  }

  public render(value: string, contexts: Array<Record<string, any>>) {
    for (const context of contexts) {
      this._output("raw", DateTime.utc().valueOf(), this.parse(value, context));
    }
  }

  private _output(level: LogLevel, time: number, message: string) {
    if (level === "debug" && !this.cli.getOptionValue("debug")) {
      return;
    }
    if (level === "raw") {
      console.log(message);
      return;
    }
    const data = this.cli.getOptionValue("timestamp") ? `[${$date(parseInt(time as any))}] ${message}` : message;
    if (level === "step") {
      console.log(`${chalk.bold.cyan("[STEP] ❯ ")}${data}`);
    } else if (level === "debug") {
      console.log(`${chalk.bold.gray("[DEBUG] ☰ ")}${data}`);
    } else if (level === "info") {
      console.log(`${chalk.bold.blue("[INFO] i ")}${data}`);
    } else if (level === "done") {
      console.log(`${chalk.bold.green("[DONE] ✔ ")}${data}`);
    } else if (level === "error") {
      console.error(`${chalk.bold.red("[ERROR] ✖ ")}${data}`);
    }
  }
}
