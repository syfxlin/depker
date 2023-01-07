import React, { useMemo } from "react";
import { client } from "../api/client";
import { Heading } from "../components/parts/Heading";
import { XTerm } from "../components/core/XTerm";
import { Tab } from "../components/layout/Tab";

export const SettingShellTab: React.FC = () => {
  const socket = useMemo(() => () => client.systems.shell(), []);
  return (
    <Tab>
      <Heading>Node Shell</Heading>
      <XTerm client={socket} />
    </Tab>
  );
};
