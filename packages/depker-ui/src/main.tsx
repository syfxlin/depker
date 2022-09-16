import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { dequal } from "dequal";
import { SWROutside } from "./utils/swr-outside";
import { ModalsProvider } from "@mantine/modals";
import { NotificationsProvider } from "@mantine/notifications";
import { App } from "./App";
import { UstyledProvider } from "@syfxlin/ustyled";
import { NormalizeCSS } from "./theme/NormalizeCSS";
import { GlobalStyles } from "./theme/GlobalStyles";
import { MantineAdapter } from "./theme/MantineAdapter";

export const Root: React.FC = () => {
  return (
    <React.StrictMode>
      <SWRConfig value={{ compare: dequal }}>
        <SWROutside />
        <UstyledProvider>
          <NormalizeCSS />
          <GlobalStyles />
          <MantineAdapter>
            <ModalsProvider>
              <NotificationsProvider position="top-center" limit={5} zIndex={999}>
                <App />
              </NotificationsProvider>
            </ModalsProvider>
          </MantineAdapter>
        </UstyledProvider>
      </SWRConfig>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
