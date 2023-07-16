import { depker, docker, dockerfile, proxy, service } from "../../mod.ts";

const app = depker();

app.use(proxy());
app.use(service());
app.master(docker());

app.service(
  dockerfile({
    name: "nginx",
    dockerfile: "FROM nginx:alpine",
  })
);

export default app;
