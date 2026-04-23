import { JSX } from "react";

import { Block } from "@/shared/markdown/block";
import { Token } from ".";
import {
  PageRef as PageRefEntity,
  Token as TokenEntity,
  createToken,
} from "@/shared/markdown/token";
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
      <thead className="border-b-2 border-line">
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

function TableRow({ columns, rowData }: { columns: string[]; rowData: any }) {
  return (
    <tr className="odd:bg-datatable-row-odd">
      {columns.map((col) => (
        <td className="px-2 py-1" key={col}>
          {convert(col, rowData[col])}
        </td>
      ))}
    </tr>
  );
}

function convert(key: string, value: any): JSX.Element {
  if (key.endsWith("_as_tokens")) {
    const tokens = JSON.parse(value);
    return tokens.map((p: TokenEntity, i: number) => (
      <Token key={i} token={createToken(p)} />
    ));
  } else if (key.endsWith("_as_pageref")) {
    return <PageRefComponent pageref={new PageRefEntity(value)} />;
  }
  return <span>{value}</span>;
}
