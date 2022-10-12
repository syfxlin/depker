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
import { AppGeneralTab } from "./pages/AppGeneralTab";

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
              <Route path="/apps/:name" element={<AppSetting />}>
                <Route index element={<AppGeneralTab />} />
              </Route>
            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </Box>
  );
};
