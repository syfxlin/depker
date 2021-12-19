import Dockerode from "dockerode";
import { config } from "../config/config";

export const docker = new Dockerode(config.docker);
