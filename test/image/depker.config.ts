import { depker, image } from "../../mod.ts";

const app = depker();

app.service(
  image({
    name: "image",
    image: "nginx:alpine",
    domain: "nginx.test",
  }),
);

export default app;
