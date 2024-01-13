import config from "@syfxlin/eslint-config";

export default config({
  stylistic: {
    quotes: "double",
    indent: 2,
    semi: true,
  },
  rules: {
    "curly": ["error", "multi-line", "consistent"],
    "no-console": ["off"],
    "style/brace-style": ["error", "1tbs"],
    "style/member-delimiter-style": ["error", { multiline: { delimiter: "semi" }, singleline: { delimiter: "semi" } }],
    "ts/ban-ts-comment": ["off"],
    "ts/consistent-type-imports": ["off"],
  },
});
