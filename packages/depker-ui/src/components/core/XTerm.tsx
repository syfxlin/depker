import React, { useEffect, useRef } from "react";
import "xterm/css/xterm.css";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { colors } from "../../utils/color";
import { Box, BoxProps, useMantineTheme } from "@mantine/core";
import { Socket } from "socket.io-client";
import { css } from "@emotion/react";

export type XTermProps = BoxProps & {
  client: () => Socket;
};

export const XTerm: React.FC<XTermProps> = ({ client, ...props }) => {
  const t = useMantineTheme();
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current) {
      return;
    }
    const term = new Terminal({ theme: colors });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(element.current);
    fit.fit();

    const socket = client();

    // connect
    socket.on("connect", () => {
      term.writeln("\u001b[32mSession started.\u001b[0m\n\r  - Press \u001b[33m<ctrl-q>\u001b[0m to exit session.\n\r");
      socket.emit("resize", { rows: term.rows, cols: term.cols });
    });
    // disconnect
    socket.on("disconnect", () => {
      term.writeln(
        `\n\r\u001b[34mSession stopped.\u001b[0m\n\r  - Press \u001b[33m<return>\u001b[0m to restart session.`
      );
    });
    // error
    socket.on("error", (data) => {
      term.writeln(`\n\r\u001b[31mERROR: ${data}\n\r`);
    });
    socket.on("connect_error", (err) => {
      term.writeln(
        `\n\r\u001b[34mSession stopped.\u001b[0m\n\r  - \u001b[31mERROR: ${err.message}\n\r\u001b[0m  - Press \u001b[33m<return>\u001b[0m to restart session.`
      );
    });

    // input
    socket.on("data", (data) => {
      term.write(data);
    });
    // output
    term.onData((data) => {
      socket.emit("data", data);
    });

    term.onKey(({ key }) => {
      if (socket.disconnected && key.charCodeAt(0) === 13) {
        term.writeln(`\n\r\u001b[36mReconnecting.\u001b[0m\n\r`);
        socket.connect();
      }
    });

    return () => {
      socket.close();
      term.dispose();
      fit.dispose();
    };
  }, [client]);

  return (
    <Box
      {...props}
      css={css`
        flex: 1;
        padding: ${t.spacing.md}px;
        border-radius: ${t.radius.sm}px;
        color: ${colors.foreground};
        background-color: ${colors.background};
        min-height: ${t.fontSizes.md * 10}px;

        > div {
          height: 100%;
        }
      `}
    >
      <div ref={element} />
    </Box>
  );
};
