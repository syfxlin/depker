import { deploy } from "../src/deploy";
import { login } from "../src/auth";
import { join } from "path";

const endpoint = "http://localhost:3000";

test("deploy", async () => {
  const token = await login({ endpoint, token: "token" });

  await new Promise(async (resolve) => {
    const request = await deploy({
      endpoint,
      token,
      folder: join(__dirname, "__deploy__"),
    });
    request.on("data", (d) => {
      console.log(d.toString());
    });
    request.on("end", () => {
      resolve(undefined);
    });
  });
});
