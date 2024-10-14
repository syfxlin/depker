import { depker, nodejs } from "../../mod.ts";

depker.use(
  nodejs.static({
    name: "nodejs_static",
  }),
);
