import depker, { image } from "../../mod.ts";

depker.service(
  image({
    name: "image",
    image: "nginx:alpine",
    domain: "nginx.test",
  }),
);
