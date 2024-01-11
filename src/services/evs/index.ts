import { Depker } from "../../depker.ts";
import { event } from "../../deps.ts";

export class EvsModule extends event.EventEmitter<any> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(private readonly depker: Depker) {
    super(0);
  }
}
