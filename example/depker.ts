/// <reference path="https://raw.githubusercontent.com/syfxlin/depker/master/mod.ts" />

// run command: bin/depker do task -f example/depker.ts
export const task = async () => {
  depker.logger.info("Test");
  await depker.exec({
    cmd: ["ls"],
    output: "inherit",
  });
};
