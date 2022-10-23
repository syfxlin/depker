import React, { PropsWithChildren, useState } from "react";
import { ColorScheme, ColorSchemeProvider, MantineProvider, MantineThemeOverride } from "@mantine/core";
import { NormalizeCSS } from "./NormalizeCSS";
import { GlobalStyles } from "./GlobalStyles";
import { ModalsProvider } from "@mantine/modals";
import { NotificationsProvider } from "@mantine/notifications";

export const theme: MantineThemeOverride = {
  primaryColor: "violet",
  components: {
    Tooltip: {
      defaultProps: {
        withArrow: true,
        transition: "pop",
        transitionDuration: 300,
        zIndex: 1998,
      },
    },
  },
};

export const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [colorScheme, setColorScheme] = useState<ColorScheme>("light");
  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={(value?: ColorScheme) => {
        setColorScheme((prev) => value || (prev === "dark" ? "light" : "dark"));
      }}
    >
      <MantineProvider theme={{ ...theme, colorScheme }} withNormalizeCSS={false} withGlobalStyles={false}>
        <NormalizeCSS />
        <GlobalStyles />
        <ModalsProvider>
          <NotificationsProvider position="top-center" limit={5} zIndex={1999}>
            {children}
          </NotificationsProvider>
        </ModalsProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
};
