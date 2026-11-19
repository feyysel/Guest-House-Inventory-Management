"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { DEFAULT_GUESTHOUSE_NAME } from "@/lib/branding";
import type { SessionUser } from "@/lib/session";
import { readTheme } from "@/lib/theme";
import { initialUiState, makeStore, setTheme } from "@/store";

export default function StoreProvider({
  children,
  user = null,
  guesthouseName = DEFAULT_GUESTHOUSE_NAME,
}: {
  children: ReactNode;
  user?: SessionUser | null;
  guesthouseName?: string;
}) {
  const [store] = useState(() =>
    makeStore({
      auth: {
        user,
      },
      ui: {
        ...initialUiState,
        guesthouseName,
      },
    })
  );

  useEffect(() => {
    store.dispatch(setTheme(readTheme()));
  }, [store]);

  return <Provider store={store}>{children}</Provider>;
}
