import Error from "error-cause/Error";

export default class ClientError extends Error {
  constructor(message?: string, error?: any) {
    super(message, { cause: error });
    if (error) {
      // @ts-ignore
      this.stack += `\n\nCaused by: ${error.stack}`;
    }
  }
}
