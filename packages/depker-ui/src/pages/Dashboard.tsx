import React from "react";
import { NavLink } from "../components/NavLink";
import { IconApps, IconHome2 } from "@tabler/icons";
import { Nav } from "../components/Nav";
import { Outlet } from "react-router-dom";
import { AuthorizeView } from "../router/AuthorizeView";

export const Dashboard: React.FC = () => {
  return (
    <AuthorizeView>
      <Nav>
        <NavLink icon={IconHome2} label="Home" action="/home" />
        <NavLink icon={IconApps} label="Apps" action="/apps" />
      </Nav>
      <Outlet />
    </AuthorizeView>
  );
};
