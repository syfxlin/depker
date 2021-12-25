import type { DepkerTemplate } from "@syfxlin/depker-server";

export const name: DepkerTemplate["name"] = "static";

export const check: DepkerTemplate["check"] = async (ctx) => {
  return ctx.existsFile("index.html");
};

export const execute: DepkerTemplate["execute"] = async (ctx) => {
  ctx.dockerfile(`
    FROM nginx:alpine
    COPY . /usr/share/nginx/html
    RUN chmod -R 755 /usr/share/nginx/html
  `);
  await ctx.build();
  await ctx.start();
};
