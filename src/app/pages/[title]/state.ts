import { create } from "zustand";

import { Block as BlockEntity } from "@/shared/markdown/block";

interface PageState {
  page: BlockEntity | null;
  setPage: (page: BlockEntity | null) => void;

  editingBlockId: string | null;
  setEditingBlockId: (id: string | null) => void;
  offset: number | null;
  setOffset: (offset: number | null) => void;
}

export const useStore = create<PageState>((set) => ({
  page: null,
  setPage: (page) => {
    if (!page) {
      return;
    }
    set({ page });
  },

  editingBlockId: null,
  setEditingBlockId: (id: string | null) => {
    set({ editingBlockId: id });
  },
  offset: null,
  setOffset: (offset: number | null) => set({ offset }),
}));
