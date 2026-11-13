import { useCallback, useEffect, useRef, useState } from "react";
import type { NuggetId } from "@/data/demo-nuggets";
import type { DemoPlayerControls } from "@/components/demo-nuggets/demo-player";
import { useNarration } from "@/components/demo-nuggets/narration-provider";
import { playlistUrl, readPlaylist, validatePlaylist } from "@/lib/nugget-playlist";

export function useNuggetPlaylist(activeId: NuggetId | null) {
  const narration = useNarration();
  const [initial] = useState(() => readPlaylist(window.location.search));
  const [ids, setIds] = useState<NuggetId[]>(initial.ids);
  const [currentId, setCurrentId] = useState<NuggetId | null>(initial.ids[0] ?? null);
  const [notice, setNotice] = useState(initial.notice);
  const [pendingId, setPendingId] = useState<NuggetId | null>(null);
  const players = useRef(new Map<NuggetId, DemoPlayerControls>());
  const currentSearch = useRef(window.location.search);
  const stop = narration.stopPlayback;
  const current = currentId && ids.includes(currentId) ? currentId : ids[0] ?? null;
  const index = current ? ids.indexOf(current) : -1;
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });

  useEffect(() => {
    const restore = () => {
      stop();
      if (currentSearch.current === window.location.search) return;
      currentSearch.current = window.location.search;
      const next = readPlaylist(window.location.search);
      setIds(next.ids); setCurrentId(next.ids[0] ?? null); setNotice(next.notice);
    };
    // Fragment navigation must stop audio, including voice auditions.
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", stop);
    return () => { window.removeEventListener("popstate", restore); window.removeEventListener("hashchange", stop); };
  }, [stop]);

  const onChange = (values: NuggetId[]) => {
    stop();
    const next = validatePlaylist(values);
    setIds(next);
    setCurrentId(id => id && next.includes(id) ? id : next[0] ?? null);
    setNotice("");
    const url = new URL(window.location.href);
    url.searchParams.set("playlist", next.join(","));
    window.history.replaceState(window.history.state, "", url);
    currentSearch.current = url.search;
  };
  const onSelect = (id: NuggetId) => {
    if (!ids.includes(id)) return;
    stop(); setCurrentId(id); scrollTo(id);
  };
  const onToggle = () => {
    if (!current) return;
    if (activeId === current || pendingId === current) { stop(); return; }
    const player = players.current.get(current);
    if (!player) { setNotice("The selected demo is not ready. Reload the page and try again."); return; }
    stop();
    player.play();
    scrollTo(current);
  };
  const onPendingChange = useCallback((id: NuggetId, pending: boolean) => {
    setPendingId(previous => pending ? id : previous === id ? null : previous);
  }, []);
  const registerPlayer = useCallback((id: NuggetId, controls: DemoPlayerControls | null) => {
    if (controls) players.current.set(id, controls);
    else players.current.delete(id);
  }, []);

  return {
    ids, currentId: current, index, notice, registerPlayer, onPendingChange,
    playing: activeId === current && current !== null,
    pending: pendingId === current && current !== null,
    shareUrl: playlistUrl(window.location.href, ids),
    onChange, onSelect, onToggle,
    onPrevious: () => { if (index > 0) onSelect(ids[index - 1]); },
    onNext: () => { if (index >= 0 && index < ids.length - 1) onSelect(ids[index + 1]); },
    onStop: stop,
  };
}
