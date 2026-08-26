'use client';

import { createContext, use, useState, useCallback, useMemo, ReactNode } from 'react';

interface VisitorViewContextType {
  isVisitorView: boolean;
  toggleVisitorView: () => void;
  enableVisitorView: () => void;
  disableVisitorView: () => void;
}

const VisitorViewContext = createContext<VisitorViewContextType | undefined>(
  undefined,
);

export function VisitorViewProvider({ children }: { children: ReactNode }) {
  const [isVisitorView, setIsVisitorView] = useState(false);

  const toggleVisitorView = useCallback(() => setIsVisitorView(prev => !prev), []);
  const enableVisitorView = useCallback(() => setIsVisitorView(true), []);
  const disableVisitorView = useCallback(() => setIsVisitorView(false), []);

  const value = useMemo(
    () => ({ isVisitorView, toggleVisitorView, enableVisitorView, disableVisitorView }),
    [isVisitorView, toggleVisitorView, enableVisitorView, disableVisitorView]
  );

  return (
    <VisitorViewContext.Provider value={value}>
      {children}
    </VisitorViewContext.Provider>
  );
}

export function useVisitorView() {
  const context = use(VisitorViewContext);
  if (context === undefined) {
    throw new Error('useVisitorView must be used within a VisitorViewProvider');
  }
  return context;
}
