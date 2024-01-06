import { depker, nodejs } from "../../mod.ts";

const app = depker();

app.service(
  nodejs.server({
    name: "nodejs_server",
  }),
);

export default app;
