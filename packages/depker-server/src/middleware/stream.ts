import { Context } from "koa";
import { PassThrough, Readable, Writable } from "stream";
import parser from "stream-json/jsonl/Parser";
import stringer from "stream-json/jsonl/Stringer";

export const requestStream = (ctx: Context, json?: boolean): Readable => {
  if (json) {
    return ctx.req.pipe(parser.parser());
  } else {
    return ctx.req;
  }
};

export const responseStream = (ctx: Context, json?: boolean): Writable => {
  const output = new PassThrough({ objectMode: true });
  ctx.respond = false;
  ctx.res.socket?.setTimeout(0);
  ctx.res.socket?.setNoDelay(true);
  ctx.res.socket?.setKeepAlive(true);
  ctx.res.writeHead(200, "OK", {
    "Content-Type": "application/octet-stream",
    "Transfer-Encoding": "chunked",
  });
  if (json) {
    output.pipe(stringer.stringer()).pipe(ctx.res);
  } else {
    output.pipe(ctx.res);
  }
  return output;
};
