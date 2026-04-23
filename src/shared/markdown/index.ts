export { Lexer } from "./lexer";
export { Parser } from "./parser";
export { Token } from "./token";
export { Block } from "./block";

import { Block } from "./block";
import { Lexer } from "./lexer";
import { Parser } from "./parser";

export function parse(markdown: string): Block {
  const lexer = new Lexer(markdown);
  const tokens = lexer.exec();
  const parser = new Parser(tokens);
  return parser.parse();
}
