import { depker, nodejs } from "../../mod.ts";

const app = depker();

app.service(
  nodejs.server({
    name: "nginx",
  })
);

export default app;
