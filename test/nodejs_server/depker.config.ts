import { depker, nodejs } from "../../mod.ts";

const app = depker();

app.use(
  nodejs.server({
    name: "nodejs_server",
  }),
);

export default app;
