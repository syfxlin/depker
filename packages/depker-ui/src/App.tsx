import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Box } from "@mantine/core";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Services } from "./pages/Services";
import { ServiceSetting } from "./pages/ServiceSetting";
import { Loading } from "./components/core/Loading";
import { ServiceConfigsTab } from "./pages/ServiceConfigsTab";
import { ServiceDeploysTab } from "./pages/ServiceDeploysTab";
import { ServiceLogsTab } from "./pages/ServiceLogsTab";
import { ServiceMetricsTab } from "./pages/ServiceMetricsTab";
import { ServiceTerminalTab } from "./pages/ServiceTerminalTab";
import { Files } from "./pages/Files";
import { ServiceHistoryTab } from "./pages/ServiceHistoryTab";
import { ServiceDangerTab } from "./pages/ServiceDangerTab";
import { Tokens } from "./pages/Tokens";
import { Ports } from "./pages/Ports";
import { Volumes } from "./pages/Volumes";
import { Settings } from "./pages/Settings";
import { SettingGeneralTab } from "./pages/SettingGeneralTab";
import { ServiceCronsTab } from "./pages/ServiceCronsTab";
import { SettingPluginsTab } from "./pages/SettingPluginsTab";
import { SettingNetworksTab } from "./pages/SettingNetworksTab";
import { SettingImagesTab } from "./pages/SettingImagesTab";

export const App: React.FC = () => {
  return (
    <Box className="App">
      <React.Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Dashboard />}>
            <Route index element={<Navigate to="/home" />} />
            <Route path="/home" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:service" element={<ServiceSetting />}>
              <Route index element={<ServiceConfigsTab />} />
              <Route path="metrics" element={<ServiceMetricsTab />} />
              <Route path="logs" element={<ServiceLogsTab />} />
              <Route path="terminal" element={<ServiceTerminalTab />} />
              <Route path="history" element={<ServiceHistoryTab />} />
              <Route path="danger" element={<ServiceDangerTab />} />
              <Route path="deploys" element={<ServiceDeploysTab />} />
              <Route path="deploys/:deploy" element={<ServiceDeploysTab />} />
              <Route path="crons" element={<ServiceCronsTab />} />
              <Route path="crons/:cron" element={<ServiceCronsTab />} />
            </Route>
            <Route path="/tokens" element={<Tokens />} />
            <Route path="/ports" element={<Ports />} />
            <Route path="/volumes" element={<Volumes />} />
            <Route path="/files" element={<Files />} />
            <Route path="/files/*" element={<Files />} />
            <Route path="/settings" element={<Settings />}>
              <Route index element={<SettingGeneralTab />} />
              <Route path="images" element={<SettingImagesTab />} />
              <Route path="networks" element={<SettingNetworksTab />} />
              <Route path="plugins" element={<SettingPluginsTab />} />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </Box>
  );
};
