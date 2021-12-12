import Ctx, { CtxProps } from "../src/docker/ctx";
import { join } from "path";
import highland from "highland";

test("start", async () => {
  const stream = highland();

  stream.on("data", (d) => {
    console.log(d);
  });

  const props: CtxProps = {
    config: {
      name: "test-start",
      domain: ["wsl.test", "localhost"],
      gzip: true,
      rateLimit: {
        average: 1000,
        burst: 1000,
      },
      env: {
        TEST: "${TEST}",
      },
      labels: {
        TEST: "${TEST}",
      },
      ports: ["3333:3333"],
      volumes: ["test-start:/test-start1", "/data/test-start2:/test-start2"],
      network: ["test-start"],
    },
    stream,
    folder: join(__dirname, "__start__"),
  };

  const ctx = new Ctx(props);

  await ctx.build();
  await ctx.start();
});
