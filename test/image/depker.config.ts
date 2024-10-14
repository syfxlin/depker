import { depker, image } from "../../mod.ts";

depker.use(
  image({
    name: "image",
    image: "nginx:alpine",
    domain: "nginx.test",
  }),
);
