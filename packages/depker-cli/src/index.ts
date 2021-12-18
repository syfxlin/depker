import cac from "cac";
import { loginCmd } from "./commands/login";
import { tokenCmd } from "./commands/token";
import { secretCmd } from "./commands/secret";
import { deployCmd } from "./commands/deploy";

const cli = cac("depker");

loginCmd(cli);
tokenCmd(cli);
secretCmd(cli);
deployCmd(cli);

cli.help();
cli.parse();
