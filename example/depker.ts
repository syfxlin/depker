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

export const error1 = depker.docker.of(() => ({
  name: "nginx3",
  image: "syfxlin/nginx3",
  build: {
    dockerfile_contents: `
      FROM nginx:latest
      RUN exit 1
    `,
  },
}));

export const error2 = async () => {
  await depker.exec({
    cmd: ["powershell.exe", "aa"],
  });
};
