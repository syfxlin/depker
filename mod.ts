import { Depker } from "./src/depker.ts";

// modules
export * from "./src/depker.ts";
export * from "./src/modules/cli.module.ts";
export * from "./src/modules/log.module.ts";
export * from "./src/modules/exec.module.ts";
export * from "./src/modules/node.module.ts";
export * from "./src/modules/events.module.ts";
export * from "./src/modules/config.module.ts";

// providers
export * from "./src/providers/docker.ts";
export * from "./src/providers/types.ts";

// plugins
export * from "./src/core/app/ctx.ts";
export * from "./src/core/app/index.ts";

// packs
export * from "./src/core/app/packs/nginx/index.ts";
export * from "./src/core/app/packs/image/index.ts";
export * from "./src/core/app/packs/nodejs/index.ts";
export * from "./src/core/app/packs/nextjs/index.ts";
export * from "./src/core/app/packs/selflare/index.ts";
export * from "./src/core/app/packs/nixpacks/index.ts";
export * from "./src/core/app/packs/dockerfile/index.ts";

// depker
export const depker = Depker.create();
export default depker;
