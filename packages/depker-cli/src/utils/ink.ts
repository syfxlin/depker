import { ReactElement } from "react";
import { render as ink, RenderOptions } from "ink";

export const render = <Props, K extends NodeJS.WriteStream | RenderOptions>(
  tree: ReactElement<Props>,
  options?: K
) => {
  const instance = ink(tree, options);
  instance
    .waitUntilExit()
    .then(() => {
      process.exit();
    })
    .catch(() => {
      process.exit(1);
    });
  return instance;
};
