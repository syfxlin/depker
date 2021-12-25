import { io } from "socket.io-client";

test("mysql:list", async () => {
  await new Promise<void>((resolve, reject) => {
    const socket = io("http://localhost:3000/plugin", {
      auth: {
        token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2dnZWQiOnRydWUsImlhdCI6MTY0MDM1NjUzM30.VxWIrYRfsm9dIougMYSQNWtNjb6rhBkuE9eTNS4qxas`,
      },
    });
    socket.on("connect", () => {
      socket.emit("mysql:list");
    });
    socket.on("ok", (result) => {
      console.log(result);
      resolve();
    });
    socket.on("error", (err) => {
      reject(err.error);
    });
  });
});
