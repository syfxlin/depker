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
};
