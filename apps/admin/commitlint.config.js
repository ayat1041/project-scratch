module.exports = {
  extends: ['@commitlint/config-conventional'],

  rules: {
    'header-max-length': [2, 'always', 190], // Enforce max length for header
    'subject-case': [2, 'always', 'lower-case'], // Subject should be lowercase
    'type-case': [2, 'always', 'lower-case'], // Type should be lowercase
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation change
        'style', // Code style change
        'refactor', // Code refactor without adding new functionality
        'perf', // Performance improvement
        'test', // Adding or updating tests
        'chore', // Maintenance or chore tasks
        'revert', // Reverting a previous commit
        'merge',
      ],
    ],
    'references-empty': [0], // Allow commit messages without issue references
    // 'footer-max-line-length': [2, 'always', 100], // Max footer length
    // 'footer-leading-blank': [2, 'always'], // Enforce a blank line before footer
    // 'footer-full-stop': [0], // Allow optional full-stop in footer
    'body-leading-blank': [1, 'always'], // Ensure a blank line before the body (if body exists)
  },
};
