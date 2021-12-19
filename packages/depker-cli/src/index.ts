import cac from "cac";
import { loginCmd } from "./commands/login";
import { tokenCmd } from "./commands/token";
import { secretCmd } from "./commands/secret";
import { deployCmd } from "./commands/deploy";
import { appCmd } from "./commands/app";
import { configCmd } from "./commands/config";
import { cacError } from "./components/CACError";
import { initCmd } from "./commands/init";
import { storageCmd } from "./commands/storage";
import { templateCmd } from "./commands/template";
import { devCmd } from "./commands/dev";
import { versionCmd } from "./commands/version";

const cli = cac("depker");

loginCmd(cli);
tokenCmd(cli);
secretCmd(cli);
deployCmd(cli);
appCmd(cli);
configCmd(cli);
initCmd(cli);
storageCmd(cli);
templateCmd(cli);
devCmd(cli);
versionCmd(cli);

cli.help();

try {
  cli.parse(process.argv, { run: false });
  cli.runMatchedCommand();
} catch (e) {
  cacError(e);
}
