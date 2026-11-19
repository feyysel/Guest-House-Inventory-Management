"use client";

import { useEffect, type ReactNode } from "react";
import type { SessionUser } from "@/lib/session";
import { setGuesthouseName, setUser, useAppDispatch } from "@/store";

type BootstrapResponse = {
  user: SessionUser | null;
  guesthouseName: string;
};

export default function BootstrapProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let cancelled = false;

    async function loadBootstrap() {
      try {
        const response = await fetch("/api/bootstrap", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = (await response.json()) as BootstrapResponse;

        if (cancelled) return;

        dispatch(setUser(result.user));

        if (result.guesthouseName) {
          dispatch(setGuesthouseName(result.guesthouseName));
        }
      } catch {
        return;
      }
    }

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return <>{children}</>;
}
