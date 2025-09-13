# AGENTS.md

- Please respond in Japanese.

## Coding styles
- Adhere to the best practices and conventions of:
  - JavaScript
  - TypeScript
  - React
  - Next.js
  - Tailwind CSS
  - Web security standards
- Do not remove tests. Do not commit focused or skipped tests (e.g., `test.only`, `test.skip`) unless explicitly instructed.

## Commit
- Use clear and conventional commit message prefixes:
  - `feat:` for new features or changes in functionality
  - `fix:` for bug fixes
  - `test:` for adding or updating tests
  - `chore:` for maintenance tasks
  - `BREAKING:` or `BREAKING CHANGE:` for changes that break backward compatibility
  - `refactor:` for internal code changes that do not affect behavior
    - Do not use `refactor:` if the behavior changes; use `feat:`, `fix:`, or `BREAKING:` as appropriate.

## Reviewing
- When asked to review code:
  - Carefully read the source code first.
  - If you find an issue, add a comment prefixed with `RV:` above the relevant line.
- You must write review comments in English
