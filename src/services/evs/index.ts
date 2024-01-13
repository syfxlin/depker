import { Depker } from "../../depker.ts";
import { event } from "../../deps.ts";

export class EvsModule extends event.EventEmitter<any> {
  constructor(private readonly depker: Depker) {
    super(0);
  }
}
