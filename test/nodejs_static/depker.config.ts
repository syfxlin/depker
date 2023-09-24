import { depker, docker, nodejs, proxy, service } from "../../mod.ts";

const app = depker();

app.use(proxy());
app.use(service());
app.master(docker());

app.service(
  nodejs.static({
    name: "nginx",
  })
);

export default app;
