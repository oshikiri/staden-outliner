# `src/` の切り分け

`src/` は実行環境ごとの責務を分けて置く。

- `src/client/`
  - ブラウザ専用の helper と RPC client を置く。
  - `fetch`、`localStorage`、abort 対応の処理を含む。
- `src/server/`
  - server 専用の実装を置く。
  - SQLite、file I/O、起動処理、exporter、importer を含む。
- `src/shared/`
  - client と server の両方で使う pure な型と関数を置く。
  - Markdown parser、DTO、共通 utility を含む。

判断に迷ったら、次の順で考える。

1. ブラウザ専用なら `src/client/`
2. server 専用なら `src/server/`
3. 両側で使うなら `src/shared/`

## `tsconfig` の追従手順

新しいファイルを追加したら、最初に置き場所の責務を決める。

- `src/client/` の新規入口は `tsconfig.client.json` の対象に入れる。
- `src/server/` と `src/server/api/` の新規入口は `tsconfig.server.json` の対象に入れる。
- `eslint.config.ts`、`playwright.config.ts`、`test/**/*.ts`、`e2e/**/*.ts` のような root-level ファイルは `tsconfig.root.json` の対象に入れる。
- 迷ったら `bun run typecheck` を先に通して、追加したファイルがどの `tsconfig` に入っていないかを確認する。
