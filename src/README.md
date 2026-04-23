# `src/` の切り分け

`src/` は実行環境ごとの責務を分けて置く。

- `src/app/`
  - 画面、route、route 用の薄い contract を置く。
  - UI と API の接着層だけを残す。
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
4. 画面や route に密着するなら `src/app/`
