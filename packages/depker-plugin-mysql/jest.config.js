/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 300_000,
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
