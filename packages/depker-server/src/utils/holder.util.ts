export const holder = () => {
  const running = { value: false };
  return async (fn: () => Promise<any>) => {
    if (running.value) {
      return;
    }
    running.value = true;
    try {
      await fn();
    } finally {
      running.value = false;
    }
  };
};
