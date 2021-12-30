import ClientError from "./ClientError";

export default class ServerError extends ClientError {
  constructor(error?: any) {
    super(error.message);
    if (error.response && error.response.body) {
      const body = JSON.parse(error.response.body);
      const c1 = new ClientError(body.message);
      if (body.error) {
        c1.cause = new ClientError(body.error);
      }
      this.cause = c1;
    }
  }
}
