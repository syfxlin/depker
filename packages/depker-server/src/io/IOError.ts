import { ExtendedError } from "socket.io/dist/namespace";

export default class IOError extends Error implements ExtendedError {
  public readonly data: any;

  constructor(message?: string, data?: any) {
    super(message);
    this.data = data;
  }
}
