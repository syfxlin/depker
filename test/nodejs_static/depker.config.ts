import { depker, nodejs } from "../../mod.ts";

const app = depker();

app.use(
  nodejs.static({
    name: "nodejs_static",
  }),
);

export default app;
