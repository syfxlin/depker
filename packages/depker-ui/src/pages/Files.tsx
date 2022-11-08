import React from "react";
import { Main } from "../components/layout/Main";
import { css } from "@emotion/react";
import { client } from "../api/client";
import { Button, Group } from "@mantine/core";
import { TbKeyboardHide } from "react-icons/all";
import { useClipboard, useCounter } from "@mantine/hooks";
import { token } from "../api/token";

export const Files: React.FC = () => {
  const clipboard = useClipboard({ timeout: 500 });
  const [counter, handlers] = useCounter(0);
  return (
    <Main
      title="Files"
      header={
        <Group>
          <Button
            leftIcon={<TbKeyboardHide />}
            onClick={() => {
              clipboard.copy(token.get());
              handlers.increment();
            }}
          >
            {clipboard.copied ? "Copied!" : "Copy & Reload"}
          </Button>
        </Group>
      }
    >
      <iframe
        key={counter}
        title="Application Files"
        src={client.files.iframe()}
        css={css`
          flex: 1;
          border: 0;
        `}
      />
    </Main>
  );
};