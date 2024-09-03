import { depker, nginx } from "../../mod.ts";

const app = depker();

app.use(
  nginx({
    name: "nginx",
    secrets: {
      TEST_ENV: "test-env",
    },
  }),
);

export default app;
