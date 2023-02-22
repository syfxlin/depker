import { LoadedBuildpack } from "./buildpack.type";
import { image } from "./image/image.plugin";
import { dockerfile } from "./dockerfile/dockerfile.plugin";
import { nginx } from "./nginx/nginx.plugin";
import { nodejs } from "./nodejs/nodejs.plugin";

export const internal: LoadedBuildpack[] = [image, dockerfile, nginx, nodejs];
