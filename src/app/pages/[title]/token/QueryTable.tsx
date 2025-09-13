import { JSX } from "react";

import { Block } from "@/app/lib/markdown/block";
import { Token } from ".";
import {
  PageRef as PageRefEntity,
  Token as TokenEntity,
  createToken,
} from "@/app/lib/markdown/token";
import { PageRef as PageRefComponent } from ".";

export function QueryTable({ data }: { data: Block[] }): JSX.Element {
  if (data.length === 0) {
    return <></>;
  }

  const columns: string[] = Object.keys(data[0]);
  return (
    <table
      className="text-sm text-left m-1"
      onClick={(e) => e.stopPropagation()}
    >
      {/* RV: Tailwind の `border-b-3` はデフォルトでは存在しません。`border-b-[3px]` の任意値か、テーマに 3px を追加してください。 */}
      <thead className="border-b-3 border-line">
        <tr>
          {columns.map((col) => (
            <th className="px-2 py-1" key={col}>
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((rowData, i) => {
          return <TableRow key={i} columns={columns} rowData={rowData} />;
        })}
      </tbody>
    </table>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TableRow({ columns, rowData }: { columns: string[]; rowData: any }) {
  return (
    // RV: 行ハイライト色（`--color-datatable-row-odd`）は背景とのコントラストを確認してください。`odd:` バリアントの適用は適切です。
    <tr className="odd:bg-datatable-row-odd">
      {columns.map((col) => (
        <td className="px-2 py-1" key={col}>
          {convert(col, rowData[col])}
        </td>
      ))}
    </tr>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convert(key: string, value: any): JSX.Element {
  if (key.endsWith("_as_tokens")) {
    // RV: `JSON.parse` may throw on invalid input; wrap in try/catch and fallback gracefully.
    const tokens = JSON.parse(value);
    return tokens.map((p: TokenEntity, i: number) => (
      <Token key={i} token={createToken(p)} />
    ));
  } else if (key.endsWith("_as_pageref")) {
    return <PageRefComponent pageref={new PageRefEntity(value)} />;
  }
  return <span>{value}</span>;
}
