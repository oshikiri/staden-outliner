# AGENTS.md

## Communication
- Please respond in Japanese in chat UI.
- You must write review comments in English

## Coding
- 作業完了後は以下のコマンドを実行し成功することを確認する:
  - `npm run format:check`
  - `npm run lint`
  - `npm run build`
  - `npm test`

## Coding styles
- Adhere to the best practices and conventions of:
  - JavaScript
  - TypeScript
  - React
  - Next.js
  - Tailwind CSS
  - Web security standards
- Do not remove tests. Do not commit focused or skipped tests (e.g., `test.only`, `test.skip`) unless explicitly instructed.
- Please ignore the following issues for now. We will address them later:
  - Accessibility issues (e.g., aria-label, WCAG contrast, role)
  - Responsive issues
  - Logging issues

## Commit
- Use clear and conventional commit message prefixes
- Include `Co-authored-by` footer when AI contributed to the commit:
  - `Co-authored-by: Codex <codex@users.noreply.github.com>` (Codexの場合)
