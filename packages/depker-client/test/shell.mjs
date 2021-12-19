import { io } from "socket.io-client";
import ss from "@sap_oss/node-socketio-stream";

const socket = io("http://localhost:3000/dev");
const stdin = ss.createStream();
const stdout = ss.createStream();
process.stdin.setRawMode(true);
stdout.pipe(process.stdout);
process.stdin.pipe(stdin);
ss(socket).emit("exec", "depker-example", ["sh"], stdin, stdout);

await new Promise((resolve) => {
  stdout.on("end", resolve);
});

process.stdin.setRawMode(false);
process.stdin.resume();
