import { CronHistory } from "../entities/cron-history.entity";

export enum CronEvent {
  CANCEL = "cron.cancel",
  PRE_START = "cron.pre_start",
  POST_START = "cron.post_start",
  PRE_RUN = "cron.pre_run",
  POST_RUN = "cron.post_run",
  SUCCESS = "cron.success",
  FAILED = "cron.failed",
}

export type CronEventHandler = {
  [CronEvent.CANCEL]: (name: string, id: number) => any;
  [CronEvent.PRE_START]: (history: CronHistory) => any;
  [CronEvent.POST_START]: (history: CronHistory) => any;
  [CronEvent.PRE_RUN]: (history: CronHistory) => any;
  [CronEvent.POST_RUN]: (history: CronHistory) => any;
  [CronEvent.SUCCESS]: (history: CronHistory) => any;
  [CronEvent.FAILED]: (history: CronHistory) => any;
};
