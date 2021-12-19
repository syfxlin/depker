import { docker } from "../src/docker/api";

test("list containers", async () => {
  const containers = await docker.listContainers({ all: true });
  console.log();
});
