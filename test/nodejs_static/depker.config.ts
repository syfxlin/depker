import { depker, nodejs } from "../../mod.ts";

const app = depker();

app.service(
  nodejs.static({
    name: "nginx",
  })
);

export default app;
