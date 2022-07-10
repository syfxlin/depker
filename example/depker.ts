/// <reference path="../mod.ts" />

depker.events.on("init", () => {
  depker.logger.info("init");
});

// run command: bin/depker do task up -f example/depker.ts
export const task = depker.docker.of(
  async () => ({
    name: "nginx1",
    image: "nginx",
  }),
  async () => ({
    name: "nginx2",
    image: "syfxlin/nginx2",
    build: {
      dockerfile_contents: depker.template.nginx(),
    },
  })
);
