import { depker, dockerfile } from "../../mod.ts";

const app = depker();

app.service(
  dockerfile({
    name: "nginx",
    dockerfile: "FROM nginx:alpine",
  })
);

export default app;
