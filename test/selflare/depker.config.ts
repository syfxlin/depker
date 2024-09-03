import { depker, selflare } from "../../mod.ts";

const app = depker();

app.use(
  selflare({
    name: "selflare",
  }),
);

export default app;
