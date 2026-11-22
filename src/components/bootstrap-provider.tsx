"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/session";
import {
  setGuesthouseName,
  setPendingReservations,
  setUser,
  useAppDispatch,
} from "@/store";

type BootstrapResponse = {
  user: SessionUser | null;
  guesthouseName: string;
  pendingReservations: number;
};

export default function BootstrapProvider({
  children,
}: {
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/unauthorized";

  useEffect(() => {
    if (isAuthPage) return;

    let cancelled = false;

    async function loadBootstrap() {
      try {
        const response = await fetch("/api/bootstrap", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = (await response.json()) as BootstrapResponse;
        if (cancelled) return;

        if (result.user) {
          dispatch(setUser(result.user));
        }
        if (result.guesthouseName) {
          dispatch(setGuesthouseName(result.guesthouseName));
        }
        if (typeof result.pendingReservations === "number") {
          dispatch(setPendingReservations(result.pendingReservations));
        }
      } catch {
        return;
      }
    }

    void loadBootstrap();

    return () => {
      cancelled = true;
    };
  }, [dispatch, isAuthPage, pathname]);

  return <>{children}</>;
}
