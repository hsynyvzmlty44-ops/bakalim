"use client";

import { newTodoId, readLocalTodos, writeLocalTodos } from "@/lib/local-todos";
import { useEffectiveCloudSync } from "@/lib/use-effective-cloud-sync";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { fetchTodosRemote, replaceTodosRemote } from "@/lib/todos-remote";
import { createStarterTodos, isStarterTodoId, STARTER_TODO_VERSION } from "@/lib/starter-todos";
import type { CoupleTodoItem } from "@/lib/todo-types";
import { ChevronLeft, ChevronRight, ListTodo, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const STARTER_VERSION_STORAGE_KEY = "lila-couple-todos-starter-version";

function ensureStarterTodos(existing: CoupleTodoItem[]) {
  let appliedVersion: string | null = null;
  try {
    appliedVersion = window.localStorage.getItem(STARTER_VERSION_STORAGE_KEY);
  } catch {
    /* Local persistence may be disabled; the list still works in memory. */
  }

  const alreadyHasStarter = existing.some((item) => isStarterTodoId(item.id));
  if (appliedVersion !== STARTER_TODO_VERSION && !alreadyHasStarter) {
    existing = [...existing, ...createStarterTodos()];
  }

  try {
    window.localStorage.setItem(STARTER_VERSION_STORAGE_KEY, STARTER_TODO_VERSION);
  } catch {
    /* Local persistence may be disabled; the list still works in memory. */
  }

  return existing;
}

export function CoupleTodoList({
  useCloudSync = false,
}: {
  useCloudSync?: boolean;
} = {}) {
  const { effectiveCloudSync, clientChecked } =
    useEffectiveCloudSync(useCloudSync);
  const [items, setItems] = useState<CoupleTodoItem[]>([]);
  const [draft, setDraft] = useState("");
  const [ready, setReady] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const pageTrackRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const activePageRef = useRef(activePage);
  activePageRef.current = activePage;
  const cloudTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pageCount = Math.max(1, Math.ceil(items.length / 10));

  const pushTodosRemote = useCallback(() => {
    if (!effectiveCloudSync) return;
    if (cloudTimerRef.current) clearTimeout(cloudTimerRef.current);
    cloudTimerRef.current = setTimeout(() => {
      cloudTimerRef.current = null;
      void (async () => {
        try {
          const client = createBrowserSupabaseClient();
          await replaceTodosRemote(client, itemsRef.current);
        } catch {
          /* ignore */
        }
      })();
    }, 1200);
  }, [effectiveCloudSync]);

  useEffect(() => {
    if (!useCloudSync && !clientChecked) return;

    const local = readLocalTodos();

    if (!effectiveCloudSync) {
      const initial = ensureStarterTodos(local);
      setItems(initial);
      if (initial !== local) writeLocalTodos(initial);
      setReady(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const client = createBrowserSupabaseClient();
        const remote = await fetchTodosRemote(client);
        if (cancelled) return;
        if (remote === null) {
          const initial = ensureStarterTodos(local);
          setItems(initial);
          if (initial !== local) writeLocalTodos(initial);
          setReady(true);
          return;
        }
        // Keep local-only entries if this device has items that have not reached
        // the shared list yet, while letting the remote copy win on ID conflicts.
        const remoteIds = new Set(remote.map((item) => item.id));
        const existing = remote.length > 0
          ? [...remote, ...local.filter((item) => !remoteIds.has(item.id))]
          : local;
        const initial = ensureStarterTodos(existing);
        setItems(initial);
        writeLocalTodos(initial);
        const needsRemoteSync = initial.length !== remote.length || initial.some((item, index) => {
          const remoteItem = remote[index];
          return !remoteItem || item.id !== remoteItem.id || item.text !== remoteItem.text || item.done !== remoteItem.done;
        });
        if (needsRemoteSync) await replaceTodosRemote(client, initial);
      } catch {
        /* yerel liste kalır */
      }
      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [effectiveCloudSync, clientChecked, useCloudSync]);

  useEffect(() => {
    const flush = () => {
      writeLocalTodos(itemsRef.current);
      if (effectiveCloudSync) {
        if (cloudTimerRef.current) {
          clearTimeout(cloudTimerRef.current);
          cloudTimerRef.current = null;
        }
        void (async () => {
          try {
            const client = createBrowserSupabaseClient();
            await replaceTodosRemote(client, itemsRef.current);
          } catch {
            /* ignore */
          }
        })();
      }
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [effectiveCloudSync]);

  useEffect(() => {
    setActivePage((page) => Math.min(page, pageCount - 1));
    const track = pageTrackRef.current;
    if (track) track.scrollTo({ left: Math.min(activePageRef.current, pageCount - 1) * track.clientWidth, behavior: "smooth" });
  }, [pageCount]);

  const add = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (itemsRef.current.length > 0 && itemsRef.current.length % 10 === 0) {
      setActivePage(Math.floor(itemsRef.current.length / 10));
    }
    setItems((prev) => {
      const next = [
        ...prev,
        { id: newTodoId(), text, done: false },
      ];
      writeLocalTodos(next);
      return next;
    });
    pushTodosRemote();
  }, [draft, pushTodosRemote]);

  const toggle = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t
      );
      writeLocalTodos(next);
      return next;
    });
    pushTodosRemote();
  }, [pushTodosRemote]);

  const remove = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((t) => t.id !== id);
      writeLocalTodos(next);
      return next;
    });
    pushTodosRemote();
  }, [pushTodosRemote]);

  const goToPage = (page: number) => {
    const nextPage = Math.max(0, Math.min(page, pageCount - 1));
    setActivePage(nextPage);
    const track = pageTrackRef.current;
    if (track) track.scrollTo({ left: nextPage * track.clientWidth, behavior: "smooth" });
  };

  return (
    <section
      className="todo-card w-full rounded-[1.75rem] p-5 text-left shadow-xl sm:rounded-[2rem] sm:p-6 md:p-8 lg:p-10"
      aria-label="Yapılacaklar listesi"
    >
      <div className="todo-heading-row">
        <div className="todo-heading-icon"><ListTodo className="h-5 w-5" aria-hidden /></div>
        <div className="min-w-0 flex-1"><h2 className="todo-heading">Yapılacaklar</h2><p className="todo-count">Birlikte gerçekleştireceklerimiz <span>{items.length}</span>{pageCount > 1 && <em>Kaydırarak devam et</em>}</p></div>
      </div>

      <div className="todo-input-row">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Yeni madde yaz…"
          disabled={!ready}
          className="todo-input"
        />
        <button
          type="button"
          onClick={add}
          disabled={!ready || !draft.trim()}
          className="todo-add"
        >
          Ekle
        </button>
      </div>

      <div className="todo-pager" ref={pageTrackRef} role="region" aria-label="Yapılacaklar sayfaları" onScroll={(event) => {
        const track = event.currentTarget;
        const page = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        setActivePage((current) => page === current ? current : page);
      }}>
        {Array.from({ length: pageCount }, (_, page) => {
          const pageItems = items.slice(page * 10, page * 10 + 10);
          return <ul className="todo-page" key={page} aria-label={items.length === 0 ? "Henüz yapılacak yok" : `${page * 10 + 1}–${Math.min((page + 1) * 10, items.length)} arası yapılacaklar`}>
            {pageItems.map((t) => (
              <li key={t.id} className="todo-item">
                <label className="todo-check-row">
                  <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="todo-check" />
                  <span className={t.done ? "todo-text is-done" : "todo-text"}>{t.text}</span>
                </label>
                <button type="button" onClick={() => remove(t.id)} className="todo-delete" aria-label={`“${t.text}” maddesini sil`}><Trash2 className="h-4 w-4" /></button>
              </li>
            ))}
            {items.length === 0 && page === 0 && ready && <li className="todo-empty">Henüz bir plan eklemedik.<br /><span>Birlikte yapmak istediğin küçük bir şeyle başlayalım.</span></li>}
          </ul>;
        })}
      </div>

      {pageCount > 1 && <nav className="todo-pagination" aria-label="Yapılacaklar sayfaları arasında gezin">
        <button type="button" onClick={() => goToPage(activePage - 1)} disabled={activePage === 0} aria-label="Önceki 10 madde" className="todo-page-arrow"><ChevronLeft size={18} /></button>
        <span aria-live="polite">{activePage * 10 + 1}–{Math.min((activePage + 1) * 10, items.length)} <i>/ {items.length}</i></span>
        <div className="todo-progress" role="progressbar" aria-label="Liste sayfası" aria-valuemin={1} aria-valuemax={pageCount} aria-valuenow={activePage + 1}><span style={{ width: `${((activePage + 1) / pageCount) * 100}%` }} /></div>
        <button type="button" onClick={() => goToPage(activePage + 1)} disabled={activePage >= pageCount - 1} aria-label="Sonraki 10 madde" className="todo-page-arrow"><ChevronRight size={18} /></button>
      </nav>}
    </section>
  );
}
