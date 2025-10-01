# AGENTS.md

## Communication
- Please respond in Japanese in chat UI.

## Coding styles
- Adhere to the best practices and conventions of:
  - JavaScript
  - TypeScript
  - React
  - Next.js
    - For Next.js App Router API routes, always use `NextRequest` / `NextResponse` (avoid bare `Request`/`Response`) and prefer helpers like `NextResponse.json()`.
  - Tailwind CSS
  - Web security standards
- Do not remove tests. Do not commit focused or skipped tests (e.g., `test.only`, `test.skip`) unless explicitly instructed.
- Please ignore the following issues for now. We will address them later:
  - Accessibility issues (e.g., aria-label, WCAG contrast, role)
  - Responsive issues
  - Logging issues

## Commit
- Use clear and conventional commit message prefixes:
  - `feat:` for new features or changes in functionality
  - `fix:` for bug fixes
  - `test:` for adding or updating tests
  - `chore:` for maintenance tasks
  - `refactor:` for internal code changes that do not affect behavior
    - Do not use `refactor:` if the behavior changes; use `feat:` or `fix:` as appropriate.

## Reviewing
- You must write review comments in English
