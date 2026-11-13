import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";

export type DepotMode = "customer" | "presenter";
export const MODE_KEY = "zcc-depot:mode";
const PREFS_KEY = "zcc-depot:prefs";

type Prefs = { favorites: string[]; recents: string[]; sidebarCollapsed: boolean };
const DEFAULT_PREFS: Prefs = { favorites: [], recents: [], sidebarCollapsed: false };

function readMode(): DepotMode {
  try { return sessionStorage.getItem(MODE_KEY) === "presenter" ? "presenter" : "customer"; } catch { return "customer"; }
}
function writeMode(mode: DepotMode) {
  try {
    if (mode === "presenter") sessionStorage.setItem(MODE_KEY, "presenter");
    else sessionStorage.removeItem(MODE_KEY);
  } catch { /* storage unavailable */ }
}
function readPrefs(): Prefs {
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") as Partial<Prefs>;
    return {
      favorites: Array.isArray(raw.favorites) ? raw.favorites.filter((x) => typeof x === "string").slice(0, 24) : [],
      recents: Array.isArray(raw.recents) ? raw.recents.filter((x) => typeof x === "string").slice(0, 8) : [],
      sidebarCollapsed: raw.sidebarCollapsed === true,
    };
  } catch { return DEFAULT_PREFS; }
}

type DepotCtx = {
  mode: DepotMode;
  isPresenter: boolean;
  setMode: (m: DepotMode) => void;
  auth: ReturnType<typeof useAuth>;
  signOut: () => void;
  favorites: string[];
  toggleFavorite: (href: string) => void;
  isFavorite: (href: string) => boolean;
  recents: string[];
  pushRecent: (href: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
};

const Ctx = createContext<DepotCtx | null>(null);

export function DepotProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const qc = useQueryClient();
  const [mode, setModeState] = useState<DepotMode>(readMode);
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);

  const purgeInternal = useCallback(() => {
    // Old guides, research and document queries also contain private data.
    // Clearing only the presenter endpoint would leave those responses cached.
    qc.clear();
  }, [qc]);

  const setMode = useCallback((m: DepotMode) => {
    writeMode(m);
    setModeState(m);
    purgeInternal();
  }, [purgeInternal]);

  // When the signed-in identity changes (sign-out or a different account), drop presenter state and cached internal data.
  const lastUser = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (auth.isLoading) return;
    const id = auth.user?.id ?? null;
    if (lastUser.current !== undefined && lastUser.current !== id) {
      writeMode("customer");
      setModeState("customer");
      purgeInternal();
    }
    lastUser.current = id;
  }, [auth.isLoading, auth.user?.id, purgeInternal]);

  useEffect(() => {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
  }, [prefs]);

  useEffect(() => {
    document.documentElement.dataset.depotMode = mode;
  }, [mode]);

  const authLogout = auth.logout;
  const signOut = useCallback(() => {
    writeMode("customer");
    setModeState("customer");
    purgeInternal();
    authLogout();
  }, [authLogout, purgeInternal]);

  const value = useMemo<DepotCtx>(() => ({
    mode,
    isPresenter: mode === "presenter",
    setMode,
    auth,
    signOut,
    favorites: prefs.favorites,
    toggleFavorite: (href) => setPrefs((p) => ({ ...p, favorites: p.favorites.includes(href) ? p.favorites.filter((x) => x !== href) : [href, ...p.favorites].slice(0, 24) })),
    isFavorite: (href) => prefs.favorites.includes(href),
    recents: prefs.recents,
    pushRecent: (href) => setPrefs((p) => (p.recents[0] === href ? p : { ...p, recents: [href, ...p.recents.filter((x) => x !== href)].slice(0, 8) })),
    sidebarCollapsed: prefs.sidebarCollapsed,
    setSidebarCollapsed: (v) => setPrefs((p) => ({ ...p, sidebarCollapsed: v })),
  }), [mode, setMode, auth, signOut, prefs]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDepot() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDepot must be used inside DepotProvider");
  return c;
}
