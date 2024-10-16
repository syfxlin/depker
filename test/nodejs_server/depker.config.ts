import { depker, nodejs } from "../../mod.ts";

depker.use(
  nodejs.server({
    name: "nodejs_server",
  }),
);
