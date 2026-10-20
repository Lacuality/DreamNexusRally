// Browser storage can be missing or throw (private mode, embedded/sandboxed
// pages, blocked site data). These helpers never throw.
type Kind = "local" | "session";

function store(kind: Kind): Storage | null {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function storageGet(key: string, kind: Kind = "local"): string | null {
  try {
    return store(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string, kind: Kind = "local") {
  try {
    store(kind)?.setItem(key, value);
  } catch {
    /* ignore */
  }
}
