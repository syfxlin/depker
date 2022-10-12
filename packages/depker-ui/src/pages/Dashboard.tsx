import React from "react";
import { Sidebar } from "../components/layout/Sidebar";
import { Outlet } from "react-router-dom";
import { AuthorizeView } from "../router/AuthorizeView";

export const Dashboard: React.FC = () => {
  return (
    <AuthorizeView>
      <Sidebar />
      <Outlet />
    </AuthorizeView>
  );
};
