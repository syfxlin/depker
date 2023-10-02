import { depker, image } from "../../mod.ts";

const app = depker();

app.service(
  image({
    name: "nginx",
    image: "nginx:alpine",
  })
);

export default app;
