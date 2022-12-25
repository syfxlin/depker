import { Deploy } from "../entities/deploy.entity";
import { PackContext } from "../plugins/pack.context";

export enum DeployEvent {
  CANCEL = "deploy.cancel",
  PRE_START = "deploy.pre_start",
  POST_START = "deploy.post_start",
  PRE_INIT = "deploy.pre_init",
  POST_INIT = "deploy.post_init",
  PRE_PACK = "deploy.pre_pack",
  POST_PACK = "deploy.post_pack",
  PURGED = "deploy.purged",
  SUCCESS = "deploy.success",
  FAILED = "deploy.failed",
}

export type DeployEventHandler = {
  [DeployEvent.CANCEL]: (name: string, id: number) => any;
  [DeployEvent.PRE_START]: (deploy: Deploy) => any;
  [DeployEvent.POST_START]: (deploy: Deploy) => any;
  [DeployEvent.PRE_INIT]: (deploy: Deploy) => any;
  [DeployEvent.POST_INIT]: (deploy: Deploy) => any;
  [DeployEvent.PRE_PACK]: (context: PackContext) => any;
  [DeployEvent.POST_PACK]: (context: PackContext) => any;
  [DeployEvent.PURGED]: (deploy: Deploy) => any;
  [DeployEvent.SUCCESS]: (deploy: Deploy) => any;
  [DeployEvent.FAILED]: (deploy: Deploy) => any;
};
