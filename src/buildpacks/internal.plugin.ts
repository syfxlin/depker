import { LoadedBuildpack } from "./buildpack.type";
import { image } from "./image/image.plugin";
import { dockerfile } from "./dockerfile/dockerfile.plugin";
import { nginx } from "./nginx/nginx.plugin";

export const internal: LoadedBuildpack[] = [image, dockerfile, nginx];
