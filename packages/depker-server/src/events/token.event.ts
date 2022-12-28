export enum TokenEvent {
  CREATE = "token.create",
  UPDATE = "token.update",
  DELETE = "token.delete",
}

export type TokenEventHandler = {
  [TokenEvent.CREATE]: (name: string) => any;
  [TokenEvent.UPDATE]: (name: string) => any;
  [TokenEvent.DELETE]: (name: string) => any;
};
