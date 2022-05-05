/// <reference path="../mod.ts" />

// run command: bin/depker do task up -f example/depker.ts
export const task = depker.docker.of(
  async () => ({
    name: "nginx1",
    image: "nginx",
  }),
  async () => ({
    name: "nginx2",
    image: "nginx",
  })
);
