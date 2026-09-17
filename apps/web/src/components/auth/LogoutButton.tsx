"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/module/auth";
import { getApiErrorMessage } from "@/utils/api-error-message";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    const result = await logout();
    setPending(false);

    if (result.isErr()) {
      setError(getApiErrorMessage(result.error));
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={pending}
        className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium disabled:opacity-60 dark:border-zinc-700"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
