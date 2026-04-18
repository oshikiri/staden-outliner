"use client";

import { createContext, useContext, type ReactNode } from "react";

type PageNavigation = {
  navigateToPage: (path: string) => void;
};

const PageNavigationContext = createContext<PageNavigation | null>(null);

export function PageNavigationProvider({
  navigateToPage,
  children,
}: {
  navigateToPage: (path: string) => void;
  children: ReactNode;
}) {
  return (
    <PageNavigationContext.Provider value={{ navigateToPage }}>
      {children}
    </PageNavigationContext.Provider>
  );
}

export function usePageNavigation(): PageNavigation {
  const navigation = useContext(PageNavigationContext);
  if (navigation) {
    return navigation;
  }

  return {
    navigateToPage: (path: string) => {
      if (typeof window !== "undefined") {
        window.location.assign(path);
      }
    },
  };
}
