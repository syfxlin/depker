import { depker, nodejs } from "../../mod.ts";

const app = depker();

app.service(
  nodejs.static({
    name: "nodejs_static",
  }),
);

export default app;
