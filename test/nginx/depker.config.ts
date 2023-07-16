import { depker, docker, proxy, service } from "../../mod.ts";

const app = depker();

app.use(proxy());
app.use(service());
app.master(docker());

app.service(
  nginx({
    name: "nginx",
  })
);

export default app;
