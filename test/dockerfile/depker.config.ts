import { depker, dockerfile } from "../../mod.ts";

const app = depker();

app.service(
  dockerfile({
    name: "dockerfile",
    dockerfile: "FROM nginx:alpine",
  }),
);

export default app;
