import { Process } from "./process.ts";

export class ProcessError extends Error {
  public readonly status: Deno.ProcessStatus;
  public readonly process: Process;

  constructor(message: string, status: Deno.ProcessStatus, process: Process) {
    super(message);
    Object.setPrototypeOf(this, ProcessError.prototype);
    this.status = status;
    this.process = process;
  }
}
