import { LoadedDepkerPlugin } from "./plugin.types";
import { image } from "./buildpacks/image/image.plugin";
import { nginx } from "./buildpacks/nginx/nginx.plugin";
import { dockerfile } from "./buildpacks/dockerfile/dockerfile.plugin";

export const internal: LoadedDepkerPlugin[] = [dockerfile, image, nginx];
