import React from "react";
import BrowserRouter from "./router/BrowserRouter";
import { history } from "./router/history";
import { Route, Routes } from "react-router-dom";
import { AnonymousView } from "./router/AnonymousView";
import { Login } from "./pages/Login";
import { Box } from "@mantine/core";
import { Dashboard } from "./pages/Dashboard";
import { useU } from "@syfxlin/ustyled";
import { css } from "@emotion/react";

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
            <Route
              path="/login"
              element={
                <AnonymousView>
                  <Login />
                </AnonymousView>
              }
            />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    </Box>
  );
};
