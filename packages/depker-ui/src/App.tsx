import React from "react";
import BrowserRouter from "./router/BrowserRouter";
import { history } from "./router/history";
import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Box } from "@mantine/core";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { AppList } from "./pages/AppList";
import { AppSetting } from "./pages/AppSetting";
import { Loading } from "./components/core/Loading";
import { AppConfigsTab } from "./pages/AppConfigsTab";
import { AppDeploysTab } from "./pages/AppDeploysTab";
import { AppLogsTab } from "./pages/AppLogsTab";
import { AppMetricsTab } from "./pages/AppMetricsTab";
import { AppTerminalTab } from "./pages/AppTerminalTab";
import { Files } from "./pages/Files";
import { AppHistoryTab } from "./pages/AppHistoryTab";
import { AppDangerTab } from "./pages/AppDangerTab";
import { Tokens } from "./pages/Tokens";

export const App: React.FC = () => {
  return (
    <Box className="App">
      <BrowserRouter history={history}>
        <React.Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Dashboard />}>
              <Route index element={<Navigate to="/home" />} />
              <Route path="/home" element={<Home />} />
              <Route path="/apps" element={<AppList />} />
              <Route path="/apps/:app" element={<AppSetting />}>
                <Route index element={<AppConfigsTab />} />
                <Route path="metrics" element={<AppMetricsTab />} />
                <Route path="logs" element={<AppLogsTab />} />
                <Route path="terminal" element={<AppTerminalTab />} />
                <Route path="history" element={<AppHistoryTab />} />
                <Route path="danger" element={<AppDangerTab />} />
                <Route path="deploys" element={<AppDeploysTab />} />
                <Route path="deploys/:deploy" element={<AppDeploysTab />} />
              </Route>
              <Route path="/files" element={<Files />} />
              <Route path="/tokens" element={<Tokens />} />
            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </Box>
  );
};
