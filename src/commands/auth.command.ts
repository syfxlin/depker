import { Command } from "commander";

type AuthResponse = {
  code: number;
  token: string;
};

export const $auth = (cli: Command) => {
  // // auth
  // cli
  //   .command("auth <mail> <pass>", "Log in to depker")
  //   .example((bin) => `${bin} auth admin@example password`)
  //   .action(async (mail: string, pass: string) => {
  //     logger.step(`Authing depker started.`);
  //     try {
  //       const http = await config.http();
  //       const response = await http.post(`api/auth`, { json: { mail, pass } }).json<AuthResponse>();
  //       const setting = await config.local();
  //       setting.token = response.token;
  //       await config.local(setting);
  //       logger.done(`Authing depker successfully.`);
  //     } catch (e: any) {
  //       logger.error(`Authing depker failed.`, e);
  //     }
  //   });
  // // token
  // cli
  //   .command("token", "Request a new token")
  //   .option("-r, --raw", "Row output")
  //   .example((bin) => `${bin} token`)
  //   .example((bin) => `${bin} token --raw`)
  //   .action(async (options: Record<string, any>) => {
  //     if (!options.raw) {
  //       logger.step(`Requesting access token started.`);
  //     }
  //     try {
  //       const http = await config.http();
  //       const response = await http.post(`api/token`).json<AuthResponse>();
  //       if (!options.raw) {
  //         logger.info(`Token: ${response.token}`);
  //         logger.done(`Requesting access token successfully.`);
  //       } else {
  //         logger.raw(response.token);
  //       }
  //     } catch (e) {
  //       logger.error(`Requesting access token failed.`, e);
  //     }
  //   });
};
