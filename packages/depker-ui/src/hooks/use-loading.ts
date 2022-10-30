import { useState } from "react";

export const useLoading = () => {
  const [value, setValue] = useState(false);
  return { value, update: setValue };
};
