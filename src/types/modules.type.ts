export interface DepkerModule {
  name: string;
  init?: () => Promise<void> | void;
  destroy?: () => Promise<void> | void;
}
