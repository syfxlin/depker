import { render } from "../utils/ink";
import React from "react";
import { Error } from "./Error";

export const cacError = (error: any) => {
  render(<Error message={"Oops!"} error={error} />);
};
