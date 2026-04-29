import { Block } from "@/shared/markdown/block";
import { isJournalPageTitle } from "@/shared/date";

function getBacklinkTitle(block: Block): string {
  return (block.getProperty("title") as string) || "";
}

export function compareBacklinksByTitle(left: Block, right: Block): number {
  const leftTitle = getBacklinkTitle(left);
  const rightTitle = getBacklinkTitle(right);
  const leftIsJournal = isJournalPageTitle(leftTitle);
  const rightIsJournal = isJournalPageTitle(rightTitle);

  if (leftIsJournal && !rightIsJournal) {
    return -1;
  }
  if (!leftIsJournal && rightIsJournal) {
    return 1;
  }
  if (leftTitle < rightTitle) {
    return 1;
  }
  if (leftTitle > rightTitle) {
    return -1;
  }
  return 0;
}

export function sortBacklinks(backlinks: Block[]): Block[] {
  return [...backlinks].sort(compareBacklinksByTitle);
}
