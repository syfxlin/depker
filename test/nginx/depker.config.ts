import { depker, nginx } from "../../mod.ts";

const app = depker();

app.service(
  nginx({
    name: "nginx",
  }),
);

export default app;
