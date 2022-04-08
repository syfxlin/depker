import {
  blue,
  bold,
  cyan,
  gray,
  green,
  red,
  yellow,
} from "https://deno.land/x/nanocolors@0.1.12/mod.ts";

export class Logger {
  private readonly level: number = parseInt(Deno.env.get("LOG_LEVEL") ?? "4");

  // level 1
  public error(message?: any, ...params: any[]) {
    if (this.level >= 1) {
      if (message instanceof Error) {
        console.log(
          bold(red(`✖ [ERROR] `)) +
            red(`Error: ${message.message}`) +
            "\n" +
            // @ts-ignore
            red(message.stack.split("\n").splice(1).join("\n"))
        );
      } else {
        console.log(bold(red(`✖ [ERROR] `)) + red(message), ...params);
      }
    }
  }

  // level 2
  public warn(message?: any, ...params: any[]) {
    if (this.level >= 2) {
      console.log(bold(yellow(`✖ [WARN] `)) + yellow(message), ...params);
    }
  }

  // level 3
  public success(message?: any, ...params: any[]) {
    if (this.level >= 3) {
      console.log(bold(green(`✔ [SUCCESS] `)) + green(message), ...params);
    }
  }

  public ready(message?: any, ...params: any[]) {
    if (this.level >= 3) {
      console.log(bold(green(`◼ [READY] `)) + green(message), ...params);
    }
  }

  public step(message?: any, ...params: any[]) {
    if (this.level >= 3) {
      console.log(bold(cyan(`❯ [STEP] `)) + cyan(message), ...params);
    }
  }

  // level 4
  public info(message?: any, ...params: any[]) {
    if (this.level >= 4) {
      console.log(bold(blue(`i [INFO] `)) + blue(message), ...params);
    }
  }

  // level 5
  public debug(message?: any, ...params: any[]) {
    if (this.level >= 5) {
      console.log(bold(gray(`☰ [DEBUG] `)) + gray(message), ...params);
    }
  }
}
