export enum ServiceEvent {
  CREATE = "service.create",
  UPDATE = "service.update",
  DELETE = "service.delete",
  UP = "service.up",
  DOWN = "service.down",
  RESTART = "service.restart",
  TRIGGER = "service.trigger",
}

export type ServiceEventHandler = {
  [ServiceEvent.CREATE]: (name: string) => any;
  [ServiceEvent.UPDATE]: (name: string) => any;
  [ServiceEvent.DELETE]: (name: string) => any;
  [ServiceEvent.UP]: (name: string) => any;
  [ServiceEvent.DOWN]: (name: string) => any;
  [ServiceEvent.RESTART]: (name: string) => any;
  [ServiceEvent.TRIGGER]: (name: string) => any;
};
