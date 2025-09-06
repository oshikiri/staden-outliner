import { Token } from ".";
import { PageRef, PropertyPair } from "./token";

// RV: Function name is misspelled and optional chaining below is unnecessary; consider renaming to flipCollapsed.
export function flipCollpased(contentMarkdown: string): string {
  const matched = contentMarkdown.match(/^collapsed::\s*(\S+)/m);
  if (!matched) {
    if (contentMarkdown === "") {
      return "collapsed:: true";
    }
    return contentMarkdown + "\ncollapsed:: true";
  }

  const value = matched[1];
  const valueFlipped = value?.includes("true") ? "false" : "true";
  return contentMarkdown.replace(
    /^collapsed::\s*(\S+)/m,
    `collapsed:: ${valueFlipped}`,
  );
}

export function getPageRefTitles(tokens: Token[]): string[] {
  const titles: string[] = [];
  for (const token of tokens) {
    if (token instanceof PageRef) {
      titles.push(token.title);
    } else if (token instanceof PropertyPair) {
      for (const value of token.value) {
        if (value instanceof PageRef) {
          titles.push(value.title);
        }
      }
    }
  }
  return titles;
}
