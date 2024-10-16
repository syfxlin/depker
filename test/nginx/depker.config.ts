import { depker, nginx } from "../../mod.ts";

depker.use(
  nginx({
    name: "nginx",
    secrets: {
      TEST_ENV: "test-env",
    },
  }),
);
