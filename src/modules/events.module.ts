import { Depker } from "../depker.ts";
import { EventEmitter } from "../deps/jsr/event.ts";

export class EventsModule extends EventEmitter<any> {
  constructor(_depker: Depker) {
    super(0);
  }
}
