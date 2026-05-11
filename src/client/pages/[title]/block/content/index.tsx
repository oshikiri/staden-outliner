import {
  JSX,
  useCallback,
  useEffect,
  useState,
  MouseEventHandler,
} from "react";

import {
  applyContentMarkdown,
  Block as BlockEntity,
  getContentMarkdown,
} from "@/shared/markdown/block";
import { pageRpc } from "@/client/rpc/page";
import { Token } from "../../token";
import { useStore } from "../../state";
import { RpcErrorMessage } from "../../page-components/RpcErrorMessage";

import { Suggestion } from "./suggestion";
import { getNearestCursorOffset } from "./dom";
import { logDebug, logError } from "@/shared/logger";
import { getErrorMessage } from "@/client/error";
import { MarkdownEditView } from "./MarkdownEditView";

type SaveContentMarkdownOptions = {
  page: BlockEntity;
  blockId: string | undefined;
  nextContentMarkdown: string;
  updatePage?: typeof pageRpc.update;
  setPage: (page: BlockEntity | null) => void;
  setSaveErrorMessage: (message: string | null) => void;
};

type UpdatePageOptions = {
  setPage: (page: BlockEntity | null) => void;
  setSaveErrorMessage: (message: string | null) => void;
  updatePage?: typeof pageRpc.update;
};

type PersistPageOptions = Required<UpdatePageOptions>;

interface EnterEditModeFromClickOptions {
  editable: boolean;
  blockId: string | undefined;
  clientX: number;
  clientY: number;
  setSaveErrorMessage: (message: string | null) => void;
  setEditingBlockId: (blockId: string | null) => void;
  setOffset: (offset: number | null) => void;
  stopPropagation: () => void;
  getCursorOffset?: (x: number, y: number) => number;
}

export function enterEditModeFromClick({
  editable,
  blockId,
  clientX,
  clientY,
  setSaveErrorMessage,
  setEditingBlockId,
  setOffset,
  stopPropagation,
  getCursorOffset = getNearestCursorOffset,
}: EnterEditModeFromClickOptions): void {
  if (!editable) {
    return;
  }
  if (!blockId) {
    logError("Cannot enter edit mode because block id is missing");
    return;
  }

  setSaveErrorMessage(null);
  setEditingBlockId(blockId);
  const startOffset = getCursorOffset(clientX, clientY);
  setOffset(startOffset);
  stopPropagation();
}

export async function saveBlockContentMarkdown({
  page,
  blockId,
  nextContentMarkdown,
  updatePage = pageRpc.update,
  setPage,
  setSaveErrorMessage,
}: SaveContentMarkdownOptions): Promise<void> {
  const blockOnPage = page.getBlockById(blockId || "");
  if (!blockOnPage) {
    logError(`Block not found: id=${blockId || ""}`);
    return;
  }

  applyContentMarkdown(blockOnPage, nextContentMarkdown);
  await persistPage(page, { updatePage, setPage, setSaveErrorMessage });
}

export async function indentBlockAfterMarkdownUpdate(
  page: BlockEntity,
  blockId: string | undefined,
  currentMarkdown: string,
  shift: boolean,
  {
    setPage,
    setSaveErrorMessage,
    updatePage = pageRpc.update,
  }: UpdatePageOptions,
): Promise<void> {
  const blockOnPage = page.getBlockById(blockId || "");
  if (!blockOnPage) {
    logError(`Block not found: id=${blockId || ""}`);
    return;
  }

  applyContentMarkdown(blockOnPage, currentMarkdown);
  if (shift) {
    blockOnPage.decreaseLevel();
  } else {
    blockOnPage.increaseLevel();
  }
  await persistPage(page, { updatePage, setPage, setSaveErrorMessage });
}

export async function splitBlockByMarkdown(
  page: BlockEntity,
  blockId: string | undefined,
  textBefore: string,
  textAfter: string,
  {
    setPage,
    setSaveErrorMessage,
    updatePage = pageRpc.update,
  }: UpdatePageOptions,
): Promise<BlockEntity | undefined> {
  const blockBefore = page.getBlockById(blockId || "");
  if (!blockBefore) {
    logError(`Block not found: id=${blockId || ""}`);
    return undefined;
  }

  applyContentMarkdown(blockBefore, textBefore);

  const blockAfter = new BlockEntity([], blockBefore.depth, []).withId(
    self.crypto.randomUUID(),
  );
  applyContentMarkdown(blockAfter, textAfter);

  const [parent, idx] = blockBefore.getParentAndIdx();
  if (!parent) {
    logError("Block has no parent");
    return undefined;
  }

  if (blockBefore.hasChildren()) {
    blockAfter.parent = blockBefore;
    blockBefore.children.splice(0, 0, blockAfter);
  } else {
    blockAfter.parent = parent;
    parent.children.splice(idx + 1, 0, blockAfter);
  }

  await persistPage(page, { updatePage, setPage, setSaveErrorMessage });
  return blockAfter;
}

async function persistPage(
  page: BlockEntity,
  { updatePage, setPage, setSaveErrorMessage }: PersistPageOptions,
): Promise<void> {
  const nextPage = await updatePage(page);
  setSaveErrorMessage(null);
  setPage(nextPage);
}

export function Content({
  block,
  editable,
}: {
  block: BlockEntity;
  editable: boolean;
}): JSX.Element {
  const page = useStore((state) => state.page) || new BlockEntity([], 0, []);
  const setPage = useStore((state) => state.setPage);
  const editingBlockId = useStore((state) => state.editingBlockId);
  const setEditingBlockId = useStore((state) => state.setEditingBlockId);
  const offset = useStore((state) => state.offset);
  const setOffset = useStore((state) => state.setOffset);

  const [suggestionQuery, setSuggestionQuery] = useState<string | undefined>(
    undefined,
  );
  const [contentMarkdown, setContentMarkdown] = useState<string>(
    getContentMarkdown(block),
  );
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  const isEditing = editingBlockId === block.id;
  useEffect(() => {
    if (isEditing) {
      // render mode -> edit mode
      setContentMarkdown(getContentMarkdown(block));
    }
  }, [block, isEditing]);

  const onClickContent: MouseEventHandler = async (event) => {
    setContentMarkdown(getContentMarkdown(block));
    enterEditModeFromClick({
      editable,
      blockId: block.id,
      clientX: event.clientX,
      clientY: event.clientY,
      setSaveErrorMessage,
      setEditingBlockId,
      setOffset,
      stopPropagation: () => event.stopPropagation(),
    });
  };

  const saveContentMarkdown = useCallback(
    (nextContentMarkdown: string) => {
      window.requestAnimationFrame(() => {
        if (useStore.getState().editingBlockId !== block.id) {
          return;
        }

        logDebug("saveContentMarkdown", {
          length: nextContentMarkdown.length,
        });

        setContentMarkdown(nextContentMarkdown);
        void saveBlockContentMarkdown({
          page,
          blockId: block.id,
          nextContentMarkdown,
          setPage,
          setSaveErrorMessage,
        }).catch((error) => {
          logError("Failed to save content", error);
          setSaveErrorMessage(getErrorMessage(error, "Failed to save content"));
        });
        setEditingBlockId?.(null);
      });
    },
    [block.id, page, setEditingBlockId, setPage, setSaveErrorMessage],
  );

  const indentBlock = useCallback(
    (currentMarkdown: string, shift: boolean) => {
      window.requestAnimationFrame(() => {
        setContentMarkdown(currentMarkdown);
        void indentBlockAfterMarkdownUpdate(
          page,
          block.id,
          currentMarkdown,
          shift,
          { setPage, setSaveErrorMessage },
        )
          .then(() => {
            setEditingBlockId?.(block.id || null);
            setOffset?.(null);
          })
          .catch((error) => {
            logError("Failed to save page after Tab", error);
            setSaveErrorMessage(
              getErrorMessage(error, "Failed to save page after Tab"),
            );
          });
      });
    },
    [
      block.id,
      page,
      setEditingBlockId,
      setOffset,
      setPage,
      setSaveErrorMessage,
    ],
  );

  const splitBlock = useCallback(
    (textBefore: string, textAfter: string) => {
      window.requestAnimationFrame(() => {
        setEditingBlockId?.(null);
        setOffset?.(null);
        void splitBlockByMarkdown(page, block.id, textBefore, textAfter, {
          setPage,
          setSaveErrorMessage,
        })
          .then((blockAfter) => {
            setEditingBlockId?.(blockAfter?.id || null);
          })
          .catch((error) => {
            logError("Failed to save page after Enter", error);
            setSaveErrorMessage(
              getErrorMessage(error, "Failed to save page after Enter"),
            );
          });
      });
    },
    [
      block.id,
      page,
      setEditingBlockId,
      setOffset,
      setPage,
      setSaveErrorMessage,
    ],
  );

  return (
    <div>
      {isEditing ? (
        <MarkdownEditView
          blockId={block.id}
          initialMarkdown={contentMarkdown}
          initialOffset={offset}
          onBlur={saveContentMarkdown}
          onBlockIndent={indentBlock}
          onBlockSplit={splitBlock}
        />
      ) : (
        <div
          key={`content-${block.id}-rendered`}
          className="w-full min-h-[1em] inline-block whitespace-pre-wrap break-all px-1"
          data-block-id={block.id}
          onClick={onClickContent}
        >
          <RenderedContent block={block} />
        </div>
      )}
      {saveErrorMessage ? (
        <RpcErrorMessage
          title="Failed to save content"
          message={saveErrorMessage}
        />
      ) : null}
      <Suggestion
        suggestionQuery={suggestionQuery}
        setSuggestionQuery={setSuggestionQuery}
        contentMarkdown={contentMarkdown}
        setup={() => {
          setEditingBlockId(null);
          logDebug("Suggestion setup", { offset });
        }}
        teardown={(contentMarkdown: string) => {
          logDebug("teardown", { length: contentMarkdown.length });
          setContentMarkdown(contentMarkdown);
          setOffset(contentMarkdown.length - 1 || 0);
          setEditingBlockId(block.id || null);
        }}
      />
    </div>
  );
}

function RenderedContent({ block }: { block: BlockEntity }): JSX.Element {
  return (
    <>
      {block.content.map((t, i) => (
        <Token key={`content-${block.id}/${i}`} token={t} />
      ))}
    </>
  );
}
