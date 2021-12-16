import { deploy } from "../src/api/deploy";
import { login } from "../src/api/auth";
import { join } from "path";

const endpoint = "http://localhost:3000";

test("deploy", async () => {
  const token = await login({ endpoint, token: "token" });

  await new Promise<void>((resolve) => {
    const socket = deploy({
      endpoint,
      token,
      folder: join(__dirname, "__deploy__"),
    });
    socket.on("info", (data) => {
      console.log(data);
    });
    socket.on("error", (data) => {
      console.log(data);
    });
    socket.on("verbose", (data) => {
      console.log(data);
    });
    socket.on("end", () => {
      resolve();
    });
  });
});
