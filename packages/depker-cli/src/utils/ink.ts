import { ReactElement } from "react";
import { render as ink, RenderOptions as InkOptions } from "ink";

export type RenderOptions = InkOptions & {
  exit?: (error?: Error) => void | Promise<void>;
};

export const render = <Props>(
  tree: ReactElement<Props>,
  options?: RenderOptions
) => {
  const instance = ink(tree, options);
  instance
    .waitUntilExit()
    .then(async () => {
      await options?.exit?.();
      process.exit();
    })
    .catch(async (err) => {
      await options?.exit?.(err);
      process.exit(1);
    });
  return instance;
};
