import { Duplex, PassThrough, Readable, Writable } from "stream";

export const $multipipe = (input: Readable | null | undefined, ...streams: Array<Writable>) => {
  let stream = input ?? new PassThrough({ objectMode: true });
  while (streams.length) {
    const item = streams.shift() as Duplex;
    stream.on("error", (e) => item.emit("error", e));
    stream.pipe(item);
    stream = item;
  }
  return stream as Duplex;
};
