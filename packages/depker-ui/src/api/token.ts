export const TOKEN_NAME = "depker-token";

export const token = {
  get: () => localStorage.getItem(TOKEN_NAME),
  set: (value?: string | null) => {
    if (value) {
      localStorage.setItem(TOKEN_NAME, value);
    } else {
      localStorage.removeItem(TOKEN_NAME);
    }
  },
};
