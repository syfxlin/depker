import { DepkerPlugin } from "./plugin.types";

export const name = "example";
export const label = "Example";
export const icon = "nodedotjs";
export const group = "General";

export const init: DepkerPlugin["init"] = async (ctx) => {
  ctx.logger.log(`init`);
  await ctx.options("test", "value1");
  await ctx.options("test");
  await ctx.options("test", null);
};

export const destroy: DepkerPlugin["destroy"] = async (ctx) => {
  ctx.logger.log(`destroy`);
};

export const buildpack: DepkerPlugin["buildpack"] = {
  options: [
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
  handler: async (ctx) => {
    await ctx.extensions("test", "value1");
    await ctx.extensions("test");
    await ctx.extensions("test", null);
  },
};

export const routes: DepkerPlugin["routes"] = async (ctx) => {
  return "example work!";
};
