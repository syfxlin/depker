module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "prettier",
    "react-app",
  ],
  plugins: ["react", "react-hooks", "jsx-a11y", "@typescript-eslint"],
  env: {
    browser: true,
    es6: true,
  },
  rules: {
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "react/prop-types": "off",
    "react/display-name": "off",
    "react/no-unknown-property": "off",
    "react-hooks/exhaustive-deps": "off",
    "max-len": ["warn", { code: 120, ignoreUrls: true }],
  },
};
