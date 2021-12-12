import Error from "error-cause/Error";

export default class ServerError extends Error {
  constructor(message?: string, error?: unknown) {
    super(message, { cause: error });
    if (error) {
      // @ts-ignore
      this.stack += `\n\nCaused by: ${error.stack}`;
    }
  }
}
