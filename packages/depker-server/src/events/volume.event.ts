import { PortEvent } from "./port.event";

export enum VolumeEvent {
  CREATE = "volume.create",
  DELETE = "volume.delete",
}

export type VolumeEventHandler = {
  [PortEvent.CREATE]: (volume: string) => any;
  [PortEvent.DELETE]: (volume: string) => any;
};
