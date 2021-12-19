import { CacFn } from "../types";
import React from "react";
import { render } from "../utils/ink";
import { Newline, Text } from "ink";
import { Icon } from "../components/Icon";
import { Bold } from "../components/Bold";
import { config, updateConfig } from "../config/config";
import yaml from "yaml";
import { Success } from "../components/Success";

const Config: React.FC = () => {
  return (
    <Text>
      <Icon color={"green"}>!</Icon>
      <Bold>Config:</Bold>
      <Newline />
      <Text color={"cyan"}>=========================</Text>
      <Newline />
      {yaml.stringify(config)}
      <Text color={"cyan"}>=========================</Text>
    </Text>
  );
};

const SetEndpoint: React.FC<{ endpoint: string }> = ({ endpoint }) => {
  return (
    <Text>
      <Success message={"Set depker-server endpoint:"} />
      <Text>{endpoint}</Text>
    </Text>
  );
};

export const configCmd: CacFn = (cli) => {
  cli
    .command("config:show", "Show your depker cli config")
    .alias("config")
    .action(() => {
      render(<Config />);
    });
  // set endpoint
  cli
    .command("config:endpoint <endpoint>", "Set depker-server endpoint")
    .action((endpoint) => {
      updateConfig({ endpoint });
      render(<SetEndpoint endpoint={endpoint} />);
    });
};
