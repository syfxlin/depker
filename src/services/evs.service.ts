import { event } from "../deps.ts";
import { DepkerInner } from "../depker.ts";

export class EvsService extends event.EventEmitter<any> {
  constructor(private readonly depker: DepkerInner) {
    super(0);
  }
}
