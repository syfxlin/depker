import { readLines } from "https://deno.land/std@0.133.0/io/mod.ts";
import { Duplex } from "./duplex.ts";
import { ProcessError } from "./process-error.ts";
import { deferred } from "https://deno.land/std@0.133.0/async/deferred.ts";

export type ProcessOptions = {
  cmd: (string | boolean | undefined | null)[];
  cwd?: string;
  env?: Record<string, string>;
  type?: "piped" | "inherit";
};

export class Process implements Promise<Deno.ProcessStatus> {
  private readonly _stdout = new Duplex();
  private readonly _stderr = new Duplex();
  private readonly _combined = new Duplex();
  private readonly _process: Deno.Process<Deno.RunOptions>;

  private _started = false;
  private _throws = true;
  private _defer = deferred<Deno.ProcessStatus>();

  constructor(options: ProcessOptions) {
    this._process = Deno.run({
      cmd: options.cmd.filter((i) => i) as string[],
      cwd: options.cwd,
      env: Object.assign(Deno.env.toObject(), options.env ?? {}),
      stdin: "piped",
      stdout: options.type ?? "piped",
      stderr: options.type ?? "piped",
    });
  }

  private async process(): Promise<Deno.ProcessStatus> {
    const [status]: [Deno.ProcessStatus, void, void] = await Promise.all([
      this._process.status(),
      Process.line(this._process.stdout, (line) => {
        this._stdout.push(line);
        this._combined.push(line);
      }),
      Process.line(this._process.stderr, (line) => {
        this._stderr.push(line);
        this._combined.push(line);
      }),
    ]);

    this._stdout.end();
    this._stderr.end();
    this._combined.end();
    this._process.stdin?.close();
    this._process.stdout?.close();
    this._process.stderr?.close();
    this._process.close();

    if (!status.success && this._throws) {
      // prettier-ignore
      const msg = `Run command error!\nExit code: ${status.code}\nMessage: ${(await this._combined).join("\n")}`;
      throw new ProcessError(msg, status, this);
    }

    return status;
  }

  private run(): Promise<Deno.ProcessStatus> {
    if (!this._started) {
      this._started = true;
      this.process().then(this._defer.resolve).catch(this._defer.reject);
    }
    return this._defer;
  }

  public get rid() {
    return this._process.rid;
  }

  public get pid() {
    return this._process.pid;
  }

  public get status() {
    return this.noThrow.run();
  }

  public get stdin() {
    this.run();
    return this._process.stdin;
  }

  public get stdout() {
    this.run();
    return this._stdout;
  }

  public get stderr() {
    this.run();
    return this._stderr;
  }

  public get combined() {
    this.run();
    return this._combined;
  }

  public get noThrow(): this {
    this._throws = false;
    return this;
  }

  public kill(signo: Deno.Signal) {
    this._process.kill(signo);
  }

  // =============

  public get [Symbol.toStringTag](): string {
    return "Process";
  }

  public async then<R = Deno.ProcessStatus, S = never>(
    resolve?:
      | ((value: Deno.ProcessStatus) => PromiseLike<R> | R)
      | undefined
      | null,
    reject?: ((reason: any) => PromiseLike<S> | S) | undefined | null
  ): Promise<R | S> {
    return await this.run().then(resolve, reject);
  }

  public async catch<R = never>(
    reject?: ((reason: any) => PromiseLike<R> | R) | undefined | null
  ): Promise<Deno.ProcessStatus | R> {
    return await this.run().catch(reject);
  }

  public async finally(
    onfinally?: (() => void) | undefined | null
  ): Promise<Deno.ProcessStatus> {
    return await this.run().finally(onfinally);
  }

  private static async line(
    reader: Deno.Reader | null,
    fn: (line: string) => void
  ) {
    if (!reader) {
      return;
    }
    for await (const line of readLines(reader)) {
      fn(line);
    }
  }
}
