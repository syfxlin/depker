import { BuildpackContext } from "./buildpack.context";

export interface Buildpack {
  init?: (ctx: BuildpackContext) => Promise<void> | void;
  build?: (ctx: BuildpackContext) => Promise<void> | void;
  destroy?: (ctx: BuildpackContext) => Promise<void> | void;
}

export interface LoadedBuildpack extends Buildpack {
  name: string;
  directory: string;
}
