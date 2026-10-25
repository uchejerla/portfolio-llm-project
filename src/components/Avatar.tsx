import { useEffect, useState } from "react";
import type { AccountUser } from "../lib/account";

function initials(user: AccountUser | null, fallback: string): string {
  const source = user?.name || user?.email || "";
  if (!source) return fallback;
  if (source.includes("@")) return source.slice(0, 1).toUpperCase();
  const parts = source.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? fallback) + (parts.length > 1 ? parts[parts.length - 1][0] : "");
}

export function Avatar({
  user,
  className = "",
  fallback = "G",
}: {
  user: AccountUser | null;
  className?: string;
  fallback?: string;
}) {
  const [failed, setFailed] = useState(false);
  const source = user?.avatarUrl ?? "";

  useEffect(() => {
    setFailed(false);
  }, [source]);

  if (source && !failed) {
    return (
      <img
        className={`avatar ${className}`.trim()}
        src={source}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`avatar ${className}`.trim()} aria-hidden="true">
      {initials(user, fallback).toUpperCase().slice(0, 2)}
    </span>
  );
}
