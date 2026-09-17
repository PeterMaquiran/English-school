"use client";

import { useEffect, useState } from "react";
import type { AuthUser } from "../data/dtos";
import { getSession } from "../use-case/get-session";

type SessionState =
  | { status: "loading"; user: null }
  | { status: "authenticated"; user: AuthUser }
  | { status: "unauthenticated"; user: null };

export function useSession() {
  const [state, setState] = useState<SessionState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let cancelled = false;

    void getSession().then((result) => {
      if (cancelled) {
        return;
      }

      if (result.isErr()) {
        setState({ status: "unauthenticated", user: null });
        return;
      }

      setState({ status: "authenticated", user: result.value.data });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
