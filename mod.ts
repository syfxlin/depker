import { depker } from "./src/depker.ts";

// services
export * from "./src/depker.ts";
export * from "./src/services/docker/index.ts";

// modules
export * from "./src/modules/proxy/proxy.module.ts";
export * from "./src/modules/proxy/proxy.type.ts";
export * from "./src/modules/service/service.module.ts";
export * from "./src/modules/service/service.type.ts";

// packs
export * from "./src/modules/service/packs/dockerfile/dockerfile.pack.ts";
export * from "./src/modules/service/packs/image/image.pack.ts";
export * from "./src/modules/service/packs/nextjs/nextjs.pack.ts";
export * from "./src/modules/service/packs/nginx/nginx.pack.ts";
export * from "./src/modules/service/packs/nodejs/nodejs.pack.ts";

// types
export * from "./src/types/master.type.ts";
export * from "./src/types/runner.type.ts";
export * from "./src/types/results.type.ts";
export * from "./src/types/modules.type.ts";

// default
export default depker();
