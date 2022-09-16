import React, { PropsWithChildren } from "react";
import { token } from "../api/token";
import { Navigate } from "react-router-dom";

// eslint-disable-next-line @typescript-eslint/ban-types
export const AnonymousView: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  return <>{token.get() ? <Navigate to="/" /> : children}</>;
};
