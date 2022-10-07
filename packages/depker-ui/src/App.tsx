import React from "react";
import BrowserRouter from "./router/BrowserRouter";
import { history } from "./router/history";
import { Navigate, Route, Routes } from "react-router-dom";
import { Login } from "./pages/Login";
import { Box } from "@mantine/core";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Apps } from "./pages/Apps";

export const App: React.FC = () => {
  const { u } = useU();
  return (
    <Box
      className="App"
      css={css`
        background-color: ${u.c("gray0", "dark6")};
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        padding: 0;
        margin: 0;
      `}
    >
      <BrowserRouter history={history}>
        <React.Suspense fallback={<div>loading...</div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<Dashboard />}>
              <Route index element={<Navigate to="/home" />} />
              <Route path="/home" element={<Home />} />
              <Route path="/apps" element={<Apps />} />
            </Route>
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </Box>
  );
};
