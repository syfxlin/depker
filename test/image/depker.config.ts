import { depker, docker, image, proxy, service } from "../../mod.ts";

const app = depker();

app.use(proxy());
app.use(service());
app.master(docker());

app.service(
  image({
    name: "nginx",
    image: "nginx:alpine",
  })
);

export default app;
