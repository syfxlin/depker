import { LoadedDepkerPlugin } from "../../plugin.types";
import path from "path";
import { fileURLToPath } from "url";

export const dockerfile: LoadedDepkerPlugin = {
  pkg: "dockerfile",
  dir: path.dirname(fileURLToPath(import.meta.url)),
  name: "dockerfile",
  label: "Dockerfile",
  group: "General",
  icon: "docker",
  buildpack: {
    options: [
      {
        type: "text",
        name: "dockerfile",
        label: "Dockerfile",
        description:
          "Dockerfile is a text document that contains all the commands. If not defined use the Dockerfile inside the project folder.",
        placeholder: "FROM nginx:alpine",
      },
    ],
    handler: async (ctx) => {
      const dockerfile = await ctx.extensions("dockerfile");
      if (dockerfile) {
        ctx.dockerfile(dockerfile);
      }
      await ctx.deployment();
    },
  },
};
