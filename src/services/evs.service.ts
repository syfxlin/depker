import { Depker } from "../depker.ts";
import { EventEmitter } from "../deps.ts";

export class EvsService extends EventEmitter<any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly depker: Depker) {
    super(0);
  }
}
