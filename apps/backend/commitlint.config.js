module.exports = {
  extends: ["@commitlint/config-conventional"],

  rules: {
    "header-max-length": [2, "always", 190],
    "subject-case": [2, "always", "lower-case"],
    "type-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      [
        "feat",
        "fix",
        "docs",
        "style",
        "refactor",
        "perf",
        "test",
        "chore",
        "revert",
        "merge",
      ],
    ],
    "references-empty": [0],
    "body-leading-blank": [1, "always"],
  },
};
