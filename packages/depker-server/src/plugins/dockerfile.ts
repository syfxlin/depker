import { DepkerPlugin } from "./plugin.types";

export const name = "dockerfile";
export const label = "Dockerfile";
export const icon = "/api/icons/docker";
export const group = "General";

export const options: DepkerPlugin["options"] = {
  buildpack: [
    {
      type: "boolean",
      name: "boolean",
      label: "boolean",
      description: "boolean value",
      placeholder: "boolean value",
    },
    {
      type: "string",
      name: "string",
      label: "string",
      description: "string value",
      placeholder: "string value",
    },
    {
      type: "text",
      name: "text",
      label: "text",
      description: "text value",
      placeholder: "text value",
    },
    {
      type: "json",
      name: "json",
      label: "json",
      description: "json value",
      placeholder: "json value",
    },
    {
      type: "number",
      name: "number",
      label: "number",
      description: "number value",
      placeholder: "number value",
    },
    {
      type: "list",
      name: "list",
      label: "list",
      description: "list value",
      placeholder: "list value",
    },
    {
      type: "object",
      name: "object",
      label: "object",
      description: "object value",
      placeholder: "object value",
    },
    {
      type: "select",
      name: "select1",
      label: "select1",
      description: "select value",
      placeholder: "select value",
      options: [
        { label: "O1", value: "o1" },
        { label: "O2", value: "o2" },
      ],
    },
    {
      type: "select",
      name: "select2",
      label: "select2",
      description: "select value",
      placeholder: "select value",
      multiple: true,
      options: [
        { label: "O1", value: "o1" },
        { label: "O2", value: "o2" },
      ],
    },
  ],
};

export const buildpack: DepkerPlugin["buildpack"] = async (ctx) => {
  await ctx.values("dockerfile", "value1");
  await ctx.values("dockerfile");
  await ctx.values("dockerfile", null);
};
