"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Trash2 } from "lucide-react";
import Link from "next/link";

interface Notif {
  id:        string;
  type:      string;
  title:     string;
  message:   string | null;
  link:      string | null;
  readAt:    string | null;
  createdAt: string;
}

const TYPE_ICON: Record<string, string> = {
  topic_approved:   "✅",
  topic_rejected:   "❌",
  topic_deleted:    "🗑",
  topic_reply:      "💬",
  mention:          "📣",
  topic_locked:     "🔒",
  reply_deleted:    "🗑",
  reaction_received:"⚡",
};

function timeAgo(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1)  return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
}

export default function NotificationBell() {
  const [notifs, setNotifs]       = useState<Notif[]>([]);
  const [unread, setUnread]       = useState(0);
  const [open,   setOpen]         = useState(false);
  const [loaded, setLoaded]       = useState(false);
  const ref      = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/notifications");
      const data = await res.json() as { notifications: Notif[]; unreadCount: number };
      setNotifs(data.notifications);
      setUnread(data.unreadCount);
    } catch {}
    if (!loadedRef.current) { loadedRef.current = true; setLoaded(true); }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 20_000);
    function onVisible() { if (document.visibilityState === "visible") refresh(); }
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleOpen() {
    setOpen(v => !v);
    if (!open && unread > 0) {
      fetch("/api/notifications", { method: "POST" }).catch(() => {});
      setNotifs(prev => prev.map(n => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnread(0);
    }
  }

  if (!loaded) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative p-2 rounded text-faint hover:text-[#c8a32e] hover:bg-[#c8a32e]/10 transition-colors"
        title="Notifications"
      >
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-surface border border-border-site shadow-xl rounded-xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-border-site flex items-center justify-between">
            <span className="text-xs font-bold text-foreground tracking-wider uppercase">Notifications</span>
            {notifs.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  fetch("/api/notifications", { method: "DELETE" }).catch(() => {});
                  setNotifs([]);
                  setUnread(0);
                }}
                className="text-[10px] text-faint hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 size={10} /> Tout effacer
              </button>
            )}
          </div>

          {notifs.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell size={20} className="mx-auto mb-2 text-faint" />
              <p className="text-sm text-faint">Aucune notification</p>
            </div>
          ) : (
            <ul className="max-h-80 overflow-y-auto divide-y divide-border-site">
              {notifs.map(n => {
                const icon = TYPE_ICON[n.type] ?? "🔔";
                const inner = (
                  <div className={`px-4 py-3 transition-colors ${n.readAt ? "opacity-60" : ""} hover:bg-surface-2`}>
                    <div className="flex items-start gap-3">
                      <span className="text-base shrink-0 mt-0.5">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-snug ${n.readAt ? "text-muted" : "text-foreground font-semibold"}`}>
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-faint mt-0.5 line-clamp-2">{n.message}</p>
                        )}
                        <p className="text-[10px] text-faint mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      {!n.readAt && (
                        <span className="w-2 h-2 rounded-full bg-[#c8a32e] shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link href={n.link} onClick={() => setOpen(false)}>{inner}</Link>
                    ) : inner}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
