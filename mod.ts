import { depker } from "./src/depker.ts";

// dependencies
export * as deps from "./src/deps.ts";

// services
export * from "./src/depker.ts";
export * from "./src/services/cfg.service.ts";
export * from "./src/services/cli.service.ts";
export * from "./src/services/dax.service.ts";
export * from "./src/services/evs.service.ts";
export * from "./src/services/log.service.ts";
export * from "./src/services/ops.service.ts";

// plugins
export * from "./src/plugins/proxy/proxy.plugin.ts";
export * from "./src/plugins/proxy/proxy.type.ts";
export * from "./src/plugins/service/service.plugin.ts";
export * from "./src/plugins/service/service.type.ts";

// packs
export * from "./src/plugins/service/pack.context.ts";
export * from "./src/plugins/service/packs/dockerfile/dockerfile.pack.ts";
export * from "./src/plugins/service/packs/image/image.pack.ts";
export * from "./src/plugins/service/packs/nginx/nginx.pack.ts";
export * from "./src/plugins/service/packs/nodejs/nodejs.pack.ts";
export * from "./src/plugins/service/packs/nextjs/nextjs.pack.ts";
export * from "./src/plugins/service/packs/coline/coline.pack.ts";

// default
export default depker();
