export default class Logger {
  private stream: Highland.Stream<any>;

  constructor(stream: Highland.Stream<any>) {
    this.stream = stream;
  }

  public info(message: string, data?: any) {
    this.stream.write(
      `${JSON.stringify({
        data,
        message,
        level: "info",
      })}`
    );
  }

  public error(message: string, data?: any) {
    this.stream.write(
      `${JSON.stringify({
        data,
        message,
        level: "error",
      })}`
    );
  }

  public verbose(message: string, data?: any) {
    this.stream.write(
      `${JSON.stringify({
        data,
        message,
        level: "verbose",
      })}`
    );
  }
}
