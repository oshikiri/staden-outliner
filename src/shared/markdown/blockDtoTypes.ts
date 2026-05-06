export type BlockPropertyDto = [string, unknown];

export type BlockDto = {
  id?: string;
  parentId?: string;
  pageId?: string;
  properties?: BlockPropertyDto[];
  depth: number;
  content: Record<string, unknown>[];
  children: BlockDto[];
};
