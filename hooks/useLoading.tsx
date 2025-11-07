import React, { createContext, useContext, useState, useCallback } from "react";

type Ctx = {
  isLoading: boolean;
  label?: string;
  show: (label?: string) => void;
  hide: () => void;
};

const LoadingCtx = createContext<Ctx | null>(null);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, set] = useState(false);
  const [label, setLabel] = useState<string | undefined>();

  const show = useCallback((l?: string) => { set(true); setLabel(l); }, []);
  const hide = useCallback(() => { set(false); setLabel(undefined); }, []);

  return (
    <LoadingCtx.Provider value={{ isLoading, label, show, hide }}>
      {children}
    </LoadingCtx.Provider>
  );
};

export const useLoading = () => {
  const ctx = useContext(LoadingCtx);
  if (!ctx) throw new Error("useLoading must be used inside LoadingProvider");
  return ctx;
};
