import { JSX } from "react";

import * as entity from "@/app/lib/markdown/token";

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

export function Token({ token }: { token: entity.Token }): JSX.Element {
  if (token instanceof entity.Text) {
    return <span>{token.textContent}</span>;
  } else if (token instanceof entity.Heading) {
    return <Heading token={token} />;
  } else if (token instanceof entity.ListStart) {
    return <></>;
  } else if (token instanceof entity.Image) {
    return <ImageComponent token={token} />;
  } else if (token instanceof entity.PageRef) {
    return <PageRef pageref={token} />;
  } else if (token instanceof entity.Link) {
    return <Link token={token} />;
  } else if (token instanceof entity.Quote) {
    return <Quote token={token} />;
  } else if (token instanceof entity.InlineCode) {
    return <InlineCode token={token} />;
  } else if (token instanceof entity.CodeBlock) {
    return <CodeBlock code={token.textContent} language={token.lang} />;
  } else if (token instanceof entity.PropertyPair) {
    return <PropertyPair token={token} />;
  } else if (token instanceof entity.BlockRef) {
    return <BlockRef token={token} />;
  } else if (token instanceof entity.Command) {
    return <Command token={token} />;
  } else if (token instanceof entity.CommandQuery) {
    return <CommandQuery token={token} />;
  } else if (token instanceof entity.Marker) {
    return <Marker status={token.status} />;
  } else if (token instanceof entity.Newline) {
    return <br />;
  }
  return <span> !!! unknown token !!! </span>;
}
