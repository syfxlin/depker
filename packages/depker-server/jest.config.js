/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 300_000,
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};

export default config;
