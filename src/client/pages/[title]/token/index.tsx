import { JSX } from "react";

import * as entity from "@/shared/markdown/token";
import { logWarn } from "@/shared/logger";

import { BlockRef } from "./BlockRef";
import { CodeBlock } from "./CodeBlock";
import { Command } from "./Command";
import { CommandQuery } from "./CommandQuery";
import { Heading } from "./Heading";
import { Image, Image as ImageComponent } from "./Image";
import { InlineCode } from "./InlineCode";
import { Link } from "./Link";
import { PageRef } from "./PageRef";
import { PropertyPair } from "./PropertyPair";
import { Quote } from "./Quote";
import { Marker } from "./Marker";

type TokenRenderer = (token: entity.Token) => JSX.Element | null;

export {
  BlockRef,
  CodeBlock,
  Command,
  CommandQuery,
  Heading,
  Image,
  InlineCode,
  Link,
  PageRef,
  PropertyPair,
  Quote,
  Marker,
};

export function Token({ token }: { token: entity.Token }): JSX.Element | null {
  const renderer = tokenRenderers[token.type];
  return renderer ? renderer(token) : renderUnknownToken(token);
}

const tokenRenderers = {
  [entity.TokenType.Base]: renderUnknownToken,
  [entity.TokenType.NewLine]: () => <br />,
  [entity.TokenType.Image]: (token) => (
    <ImageComponent token={token as entity.Image} />
  ),
  [entity.TokenType.ListStart]: () => <></>,
  [entity.TokenType.Text]: (token) => (
    <span>{(token as entity.Text).textContent}</span>
  ),
  [entity.TokenType.PageRef]: (token) => (
    <PageRef pageref={token as entity.PageRef} />
  ),
  [entity.TokenType.Link]: (token) => <Link token={token as entity.Link} />,
  [entity.TokenType.PropertyPair]: (token) => (
    <PropertyPair token={token as entity.PropertyPair} />
  ),
  [entity.TokenType.Heading]: (token) => (
    <Heading token={token as entity.Heading} />
  ),
  [entity.TokenType.Quote]: (token) => <Quote token={token as entity.Quote} />,
  [entity.TokenType.InlineCode]: (token) => (
    <InlineCode token={token as entity.InlineCode} />
  ),
  [entity.TokenType.CodeBlock]: (token) => (
    <CodeBlock
      code={(token as entity.CodeBlock).textContent}
      language={(token as entity.CodeBlock).lang}
    />
  ),
  [entity.TokenType.PropertyPairSeparator]: () => null,
  [entity.TokenType.BlockRef]: (token) => (
    <BlockRef token={token as entity.BlockRef} />
  ),
  [entity.TokenType.Command]: (token) => (
    <Command token={token as entity.Command} />
  ),
  [entity.TokenType.CommandQuery]: (token) => (
    <CommandQuery token={token as entity.CommandQuery} />
  ),
  [entity.TokenType.Marker]: (token) => (
    <Marker status={(token as entity.Marker).status} />
  ),
} satisfies Record<entity.TokenType, TokenRenderer>;

function renderUnknownToken(token: entity.Token): JSX.Element | null {
  logWarn("Unknown token type:", token?.constructor?.name ?? typeof token);
  return null;
}
