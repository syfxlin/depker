import { CacFn, ClientConfig } from "../types";
import React, { useState } from "react";
import { Icon } from "../components/Icon";
import { Bold } from "../components/Bold";
import { UncontrolledTextInput } from "ink-text-input";
import { Box, Newline, Text } from "ink";
import { render } from "../utils/ink";
import { basename, join, resolve } from "path";
import { useEndFn } from "../hooks/use-end";
import SelectInput from "ink-select-input";
import { writeYml } from "@syfxlin/depker-client";

const Init: React.FC<{ folder: string }> = ({ folder }) => {
  const [config, setConfig] = useState<ClientConfig>({
    name: basename(folder),
  });
  const [property, setProperty] = useState(0);
  const end = useEndFn();

  const onSubmit = (config: ClientConfig) => {
    writeYml(join(folder, "depker.yml"), config);
    end();
  };

  return (
    <>
      {property === 0 && (
        <Text>
          <Icon color={"green"}>?</Icon>
          <Bold>App Name (default: {config.name}): </Bold>
          <UncontrolledTextInput
            onSubmit={(value) => {
              if (value) {
                setConfig((prev) => ({
                  ...prev,
                  name: value,
                }));
              }
              setProperty(1);
            }}
          />
        </Text>
      )}
      {property === 1 && (
        <Text>
          <Icon color={"green"}>?</Icon>
          <Bold>Using predefined template? </Bold>
          <UncontrolledTextInput
            onSubmit={(value) => {
              if (value) {
                setConfig((prev) => ({
                  ...prev,
                  template: value,
                }));
              }
              setProperty(2);
            }}
          />
        </Text>
      )}
      {property === 2 && (
        <Text>
          <Icon color={"green"}>?</Icon>
          <Bold>Add domain(s), comma division: </Bold>
          <UncontrolledTextInput
            onSubmit={(value) => {
              if (value) {
                setConfig((prev) => ({
                  ...prev,
                  domain: value.split(",").map((v) => v.trim()),
                }));
              }
              setProperty(3);
            }}
          />
        </Text>
      )}
      {property === 3 && (
        <Text>
          <Icon color={"green"}>?</Icon>
          <Bold>Using predefined reverse proxy port? </Bold>
          <UncontrolledTextInput
            onSubmit={(value) => {
              if (value) {
                setConfig((prev) => ({
                  ...prev,
                  port: parseInt(value),
                }));
              }
              setProperty(4);
            }}
          />
        </Text>
      )}
      {property === 4 && (
        <Text>
          <Icon color={"green"}>?</Icon>
          <Bold>Add network(s), comma division: </Bold>
          <UncontrolledTextInput
            onSubmit={(value) => {
              if (value) {
                setConfig((prev) => ({
                  ...prev,
                  networks: value.split(",").map((v) => v.trim()),
                }));
              }
              setProperty(5);
            }}
          />
        </Text>
      )}
      {property === 5 && (
        <Box>
          <Text>
            <Icon color={"green"}>?</Icon>
            <Bold>Set restart policy (default: on-failure:2): </Bold>
            <Newline />
          </Text>
          <SelectInput
            items={[
              {
                label: "default",
                value: "default",
              },
              {
                label: "always",
                value: "always",
              },
              {
                label: "on-failure:2",
                value: "on-failure:2",
              },
              {
                label: "unless-stopped",
                value: "unless-stopped",
              },
              {
                label: "no",
                value: "no",
              },
            ]}
            onSelect={(item) => {
              if (item.value !== "default") {
                setConfig((prev) => ({
                  ...prev,
                  restart: item.value,
                }));
              }
              setProperty(6);
            }}
          />
        </Box>
      )}
      {property === 6 && (
        <Box>
          <Text>
            <Icon color={"green"}>?</Icon>
            <Bold>Using gzip (default: no)? </Bold>
            <Newline />
          </Text>
          <SelectInput
            items={[
              {
                label: "default",
                value: "default",
              },
              {
                label: "no",
                value: "no",
              },
              {
                label: "yes",
                value: "yes",
              },
            ]}
            onSelect={(item) => {
              if (item.value !== "default") {
                setConfig((prev) => ({
                  ...prev,
                  gzip: item.value === "yes",
                }));
              }
              setProperty(7);
            }}
          />
        </Box>
      )}
      {property === 7 && (
        <Box>
          <Text>
            <Icon color={"green"}>?</Icon>
            <Bold>Using Let's Encrypt (default: no)? </Bold>
            <Newline />
          </Text>
          <SelectInput
            items={[
              {
                label: "default",
                value: "default",
              },
              {
                label: "no",
                value: "no",
              },
              {
                label: "yes",
                value: "yes",
              },
            ]}
            onSelect={(item) => {
              if (item.value !== "default") {
                setConfig((prev) => ({
                  ...prev,
                  letsencrypt: item.value === "yes",
                }));
              }
              onSubmit(config);
            }}
          />
        </Box>
      )}
    </>
  );
};

export const initCmd: CacFn = (cli) => {
  cli
    .command("init [folder]", "Init project config (depker.yml)")
    .action((folder) => {
      render(<Init folder={resolve(folder || process.cwd())} />);
    });
};
