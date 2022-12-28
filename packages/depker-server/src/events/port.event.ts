export enum PortEvent {
  CREATE = "port.create",
  DELETE = "port.delete",
}

export type PortEventHandler = {
  [PortEvent.CREATE]: (port: number) => any;
  [PortEvent.DELETE]: (port: number) => any;
};
