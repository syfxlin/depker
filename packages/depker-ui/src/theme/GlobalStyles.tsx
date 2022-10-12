import React from "react";
import { css, Global } from "@emotion/react";
import { useMantineTheme } from "@mantine/core";

export const GlobalStyles: React.FC = () => {
  const t = useMantineTheme();
  return (
    <Global
      styles={css`
        *,
        *::before,
        *::after {
          box-sizing: border-box;
        }

        html {
          background-color: ${t.colorScheme === "light" ? t.white : t.colors.dark[7]};
        }

        html,
        body {
          font-family: ${t.fontFamily};
          color: ${t.colorScheme === "light" ? t.colors.gray[7] : t.colors.dark[0]};
          font-size: ${t.fontSizes.md}px;
          font-weight: 400;
          line-height: 1.5;
          transition: color 0.3s, background-color 0.3s;
          scroll-behavior: smooth;
          word-break: break-word;
        }

        .App {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding: 0;
          margin: 0;
        }

        .icon {
          font-size: ${t.fontSizes.md}px;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        ::-webkit-scrollbar-track {
          border-radius: 3px;
          background: ${t.colorScheme === "light" ? t.fn.rgba(t.black, 0.1) : t.fn.rgba(t.white, 0.1)};
          box-shadow: inset 0 0 5px ${t.colorScheme === "light" ? t.fn.rgba(t.black, 0.1) : t.fn.rgba(t.white, 0.1)};
        }
        ::-webkit-scrollbar-thumb {
          border-radius: 3px;
          background: ${t.colorScheme === "light" ? t.fn.rgba(t.black, 0.2) : t.fn.rgba(t.white, 0.2)};
          box-shadow: inset 0 0 20px ${t.colorScheme === "light" ? t.fn.rgba(t.black, 0.2) : t.fn.rgba(t.white, 0.2)};
        }

        * {
          scrollbar-width: thin;
        }
      `}
    />
  );
};
