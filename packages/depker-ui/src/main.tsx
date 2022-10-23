import React from "react";
import ReactDOM from "react-dom/client";
import { SWRConfig } from "swr";
import { dequal } from "dequal";
import { SWROutside } from "./utils/swr-outside";
import { App } from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";

export const Root: React.FC = () => {
  return (
    <React.StrictMode>
      <SWRConfig value={{ compare: dequal }}>
        <SWROutside />
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </SWRConfig>
    </React.StrictMode>
  );
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(<Root />);
