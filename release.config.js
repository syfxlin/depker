export default {
  plugins: [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "semantic-release-replace-plugin",
      {
        replacements: [
          {
            files: ["src/depker.ts"],
            from: `this.version = ".*"`,
            to: `this.version = "\${nextRelease.version}"`,
          },
        ],
      },
    ],
    [
      "@semantic-release/git",
      {
        assets: ["src/depker.ts"],
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [
          { label: "depker.win.amd64.exe", path: "bin/depker.win.amd64.exe" },
          { label: "depker.win.arm64.exe", path: "bin/depker.win.arm64.exe" },
          { label: "depker.linux.amd64", path: "bin/depker.linux.amd64" },
          { label: "depker.linux.arm64", path: "bin/depker.linux.arm64" },
          { label: "depker.mac.amd64", path: "bin/depker.mac.amd64" },
          { label: "depker.mac.arm64", path: "bin/depker.mac.arm64" },
        ],
      },
    ],
  ],
};
