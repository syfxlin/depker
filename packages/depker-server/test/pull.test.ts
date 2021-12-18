import { docker } from "../src/docker/api";

test("pull", async () => {
  await new Promise<void>((resolve, reject) => {
    docker.pull("gitea/gitea", {}, (error, stream: NodeJS.ReadableStream) => {
      if (error) {
        reject(error);
        return;
      }
      stream.on("data", (d) => {
        console.log(d.toString());
      });
      stream.on("end", () => {
        resolve();
      });
    });
  });
});
