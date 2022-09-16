import React, { ReactNode } from "react";
import { BrowserHistory } from "history";
import { Router } from "react-router-dom";

export interface BrowserRouterProps {
  basename?: string;
  history: BrowserHistory;
  children: ReactNode;
}

const BrowserRouter: React.FC<BrowserRouterProps> = ({ basename, children, history }) => {
  const [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router basename={basename} location={state.location} navigationType={state.action} navigator={history}>
      {children}
    </Router>
  );
};

export default BrowserRouter;
