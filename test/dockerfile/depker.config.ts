import { depker, dockerfile } from "../../mod.ts";

depker.use(
  dockerfile({
    name: "dockerfile",
    dockerfile: "FROM nginx:alpine",
  }),
);
