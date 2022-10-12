import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { dequal } from "dequal";
import { SWROutside } from "./utils/swr-outside";
import { ModalsProvider } from "@mantine/modals";
import { NotificationsProvider } from "@mantine/notifications";
import { App } from "./App";
import { NormalizeCSS } from "./theme/NormalizeCSS";
import { GlobalStyles } from "./theme/GlobalStyles";
import { MantineProvider } from "@mantine/core";

export const Root: React.FC = () => {
  return (
    <React.StrictMode>
      <SWRConfig value={{ compare: dequal }}>
        <SWROutside />
        <MantineProvider theme={{ primaryColor: "violet" }} withNormalizeCSS={false} withGlobalStyles={false}>
          <NormalizeCSS />
          <GlobalStyles />
          <ModalsProvider>
            <NotificationsProvider position="top-center" limit={5} zIndex={1999}>
              <App />
            </NotificationsProvider>
          </ModalsProvider>
        </MantineProvider>
      </SWRConfig>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
