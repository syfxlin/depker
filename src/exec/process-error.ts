import { Process } from "./process.ts";

export class ProcessError extends Error {
  public readonly status: Deno.ProcessStatus;
  public readonly process: Process;

  constructor(status: Deno.ProcessStatus, process: Process) {
    super();
    Object.setPrototypeOf(this, Process.prototype);
    this.status = status;
    this.process = process;
  }
}
