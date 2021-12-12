import Dockerode from "dockerode";

export const docker = new Dockerode({
  host: "::1",
  port: 2375,
});
