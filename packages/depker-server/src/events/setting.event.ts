import { Setting } from "../entities/setting.entity";

export enum SettingEvent {
  UPDATE = "setting.update",
}

export type SettingEventHandler = {
  [SettingEvent.UPDATE]: (setting: Setting) => any;
};
