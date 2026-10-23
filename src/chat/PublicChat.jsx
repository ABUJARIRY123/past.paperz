import React, { useState, useEffect, useCallback, useMemo, useRef, createContext, useContext } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getAccessToken } from '../utils/api'; 
import {
  MessagesSquare, Search, RefreshCw, Loader, X, AlertTriangle, Send,
  Headset, User, Mail, Phone, Clock, Globe, XCircle, CheckCircle2, Info,
} from 'lucide-react';


/**
 * PublicChat: superadmin view for conversations started from the public
 * website's ChatWidget.
 *
 * AUTH REVISION: pcFetch no longer reads `superadmin_token` from
 * localStorage (that key no longer exists, so requests went out as
 * "Bearer null"). It now asks Supabase for the current session access
 * token on every call, which also refreshes the token when it has expired.
 *
 * REALTIME REVISION 5: unread badge and ping sound live in
 * `usePublicChatUnread`, exported below. Call it once in
 * SuperAdminDashboard (always mounted) so the sidebar badge and ping work
 * no matter which tab is open. This component receives
 * conversations/loading/error/refresh as props, so there is a single
 * source of truth and one realtime subscription for the whole dashboard.
 * Everything about an open thread (messages, typing, sending, closing)
 * lives here.
 *
 * AGENT ATTRIBUTION: agent replies are tagged with the agent's name. The
 * backend derives it from the verified user (`req.user.full_name`) and
 * stores it as `agent_name`; it is also surfaced on list updates as
 * `lastSenderName`. The optimistic local echo uses `currentAgentName`
 * (prop, falling back to localStorage) for instant feedback only. The
 * name shown after the round trip always comes from the server.
 *
 * TOASTS: `<ToastProvider>` / `useToast()` below replace react-hot-toast.
 * Same `toast.success(msg)` / `toast.error(msg)` call shape, no dependency.
 *
 * DARK MODE: Tailwind `dark:` classes driven by an external toggle on
 * `<html>`.
 *
 * SETUP: npm install @supabase/supabase-js; env vars VITE_SUPABASE_URL /
 * VITE_SUPABASE_ANON_KEY (same as the public widget).
 *
 * Backend endpoints (public_chat_routes.js):
 *   GET  /superadmin/public-chats
 *   GET  /superadmin/public-chats/:id/messages
 *   POST /superadmin/public-chats/:id/messages   { text, id? }
 *   POST /superadmin/public-chats/:id/close      { reason }
 *   POST /superadmin/public-chats/:id/read
 */

// ═════════════════════════════════════════════════════════════════════════
// Toast system. A context holds the live list of toasts, `useToast()`
// returns `{ success, error, info }` callbacks, and <ToastViewport />
// renders them. Mount <ToastProvider> once near the root of the app.
// ═════════════════════════════════════════════════════════════════════════
const ToastContext = createContext(null);

const TOAST_DURATION_MS = 4000;
let toastSeq = 0;

const TOAST_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-500 dark:text-emerald-400',
    barClass: 'bg-emerald-500',
  },
  error: {
    icon: AlertTriangle,
    iconClass: 'text-red-500 dark:text-red-400',
    barClass: 'bg-red-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-500 dark:text-blue-400',
    barClass: 'bg-blue-500',
  },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const push = useCallback((type, message, duration = TOAST_DURATION_MS) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, type, message }]);
    const timer = setTimeout(() => dismiss(id), duration);
    timersRef.current.set(id, timer);
    return id;
  }, [dismiss]);

  useEffect(() => () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current.clear();
  }, []);

  const api = useMemo(() => ({
    success: (msg, duration) => push('success', msg, duration),
    error: (msg, duration) => push('error', msg, duration),
    info: (msg, duration) => push('info', msg, duration),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

const ToastViewport = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((t) => {
        const style = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        const Icon = style.icon;
        return (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 pl-4 pr-9 py-3 flex items-start gap-2.5 animate-[toast-in_0.18s_ease-out]"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${style.barClass}`} />
            <Icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${style.iconClass}`} />
            <p className="text-sm text-gray-800 dark:text-gray-100 leading-snug">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="cursor-pointer absolute top-2.5 right-2.5 p-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

/** `const toast = useToast(); toast.success('Saved'); toast.error('Nope');` */
export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fail soft rather than crash the dashboard if a consumer forgot the
    // provider. Log once to the console instead of throwing.
    if (typeof window !== 'undefined' && !window.__publicChatToastWarned) {
      window.__publicChatToastWarned = true;
      // eslint-disable-next-line no-console
      console.warn('useToast() called outside <ToastProvider>: toasts will be silently dropped.');
    }
    return { success: () => {}, error: () => {}, info: () => {}, dismiss: () => {} };
  }
  return ctx;
};

// ─── API base + superadmin-scoped fetch ──────────────────────────────────────
const _base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001').replace(/\/$/, '');
const BASE_API = _base.endsWith('/api/publicchat') ? _base : `${_base}/api/publicchat`;

// Always sends the current Supabase session access token. getAccessToken
// refreshes it when expired, so nothing stale is ever sent.
const pcFetch = async (url, options = {}) => {
  const token = await getAccessToken();
  if (!token) {
    window.location.href = '/superadmin/login';
    throw new Error('You are signed out. Please sign in again.');
  }

  const res = await fetch(`${BASE_API}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    window.location.href = '/superadmin/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Supabase Realtime client ─────────────────────────────────────────────
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const ADMIN_LIST_CHANNEL = 'chat:admin:list';
const LIST_SAFETY_NET_MS = 120000; // background refresh, not the primary path
const TYPING_BROADCAST_MS = 2000;
const TYPING_STALE_MS = 5000;

/** Client-side message id, shared between the direct broadcast and the
 *  REST persist call so both paths agree on "this is the same message." */
const genId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/**
 * Best-effort display name for the agent driving this browser tab, used
 * only for the optimistic local echo of a reply (see handleSendReply).
 * The name that actually persists comes back from the server.
 */
const getStoredAgentName = () =>
  (typeof window !== 'undefined' && localStorage.getItem('superadmin_name')) || 'Agent';

// ═════════════════════════════════════════════════════════════════════════
// Date formatting (replaces date-fns). Only the calls this file uses:
// `formatDate(date, pattern)` for 'MMM d, yyyy HH:mm' and 'MMM d, HH:mm',
// and `formatRelativeToNow(date)` for "3 hours ago" style previews.
// ═════════════════════════════════════════════════════════════════════════
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad2 = (n) => String(n).padStart(2, '0');

const formatDate = (date, pattern) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '-';
  const tokens = {
    yyyy: String(d.getFullYear()),
    MMM: MONTHS_SHORT[d.getMonth()],
    HH: pad2(d.getHours()),
    mm: pad2(d.getMinutes()),
    d: String(d.getDate()),
  };
  return pattern.replace(/yyyy|MMM|HH|mm|d/g, (match) => tokens[match]);
};

const formatRelativeToNow = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '-';

  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  const abs = Math.abs(seconds);
  const future = seconds < 0;

  const wrap = (n, unit) => {
    const plural = n === 1 ? unit : `${unit}s`;
    return future ? `in ${n} ${plural}` : `${n} ${plural}`;
  };

  if (abs < 5) return 'a few seconds';
  if (abs < 60) return wrap(abs, 'second');

  const minutes = Math.round(abs / 60);
  if (minutes < 60) return wrap(minutes, 'minute');

  const hours = Math.round(minutes / 60);
  if (hours < 24) return wrap(hours, 'hour');

  const days = Math.round(hours / 24);
  if (days < 30) return wrap(days, 'day');

  const months = Math.round(days / 30);
  if (months < 12) return wrap(months, 'month');

  const years = Math.round(months / 12);
  return wrap(years, 'year');
};

// ─── Notification sound: a single shared AudioContext for the whole app ──
// Not tied to any one component instance: the sidebar badge/hook can be
// alive on every tab, so the ding needs to be too.
let _audioCtx = null;
const playPing = async () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!_audioCtx || _audioCtx.state === 'closed') {
      _audioCtx = new AudioCtx();
    }
    const ctx = _audioCtx;
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { /* still locked */ }
    }
    if (ctx.state !== 'running') return; // needs one prior user gesture
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now); // A5, distinct from the widget's tone
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);
  } catch { /* audio must never break the dashboard */ }
};

// ═════════════════════════════════════════════════════════════════════════
// usePublicChatUnread: the list, its realtime feed, the unread total for
// the sidebar badge, and the ping sound. Mount this once, high up
// (SuperAdminDashboard), so it keeps running no matter which tab is active.
//
// `activeTab` / `openConversationId` are only used to decide whether to
// suppress the ping for a thread the agent already has open.
// ═════════════════════════════════════════════════════════════════════════
export const usePublicChatUnread = ({ activeTab, openConversationId, PublicChatId = 'publicchat' } = {}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeTabRef = useRef(activeTab);
  const openConversationIdRef = useRef(openConversationId);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { openConversationIdRef.current = openConversationId; }, [openConversationId]);

  // Dedupes the notification sound only. The badge number comes straight
  // from each conversation's server-backed unreadCount.
  const pingedMsgIdsRef = useRef(new Set());

  const maybePing = useCallback((conversationId, messageId) => {
    if (!messageId) return;
    if (pingedMsgIdsRef.current.has(messageId)) return;
    pingedMsgIdsRef.current.add(messageId);
    // Already looking at this exact thread, so no need to ding.
    if (activeTabRef.current === PublicChatId && openConversationIdRef.current === conversationId) return;
    playPing();
  }, [PublicChatId]);

  const fetchConversations = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await pcFetch('/superadmin/public-chats');
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : []);
      setConversations(list);
      setError(null);
    } catch (e) {
      if (!silent) setError(e.message || 'Failed to load public chats');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  // Long-interval safety net only. Realtime below is the primary path.
  useEffect(() => {
    const id = setInterval(() => fetchConversations(true), LIST_SAFETY_NET_MS);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // Live updates: one shared channel for the whole dashboard, patched in
  // place per event, regardless of which tab is currently showing.
  useEffect(() => {
    const channel = supabase
      .channel(ADMIN_LIST_CHANNEL)
      .on('broadcast', { event: 'conversation_created' }, ({ payload }) => {
        setConversations((prev) => [payload, ...prev.filter((c) => c.id !== payload.id)]);
      })
      .on('broadcast', { event: 'visitor_message' }, ({ payload }) => {
        // Direct signal from the visitor's widget: instant, independent of
        // the backend. Optimistically bumps the preview and unread count;
        // the matching 'conversation_updated' event below arrives shortly
        // after with the authoritative DB unread_count and corrects drift.
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === payload.id);
          if (idx === -1) return prev; // unknown conversation: the backend event will create the card
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            lastMessage: payload.text,
            lastSender: 'visitor',
            lastSenderName: null,
            lastActivity: payload.createdAt,
            messageCount: (next[idx].messageCount || 0) + 1,
            unreadCount: (next[idx].unreadCount || 0) + 1,
            escalated: true,
          };
          return next;
        });
        maybePing(payload.id, payload.messageId);
      })
      .on('broadcast', { event: 'conversation_updated' }, ({ payload }) => {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === payload.id);
          if (idx === -1) return [payload, ...prev];
          const next = [...prev];
          next[idx] = payload; // authoritative: includes the real unreadCount + lastSenderName from the DB
          return next;
        });
        if (payload.lastSender === 'visitor') maybePing(payload.id, payload.lastMessageId);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchConversations(true); // resync after reconnect
      });

    return () => supabase.removeChannel(channel);
  }, [fetchConversations, maybePing]);

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  );

  return { conversations, setConversations, loading, error, refresh: fetchConversations, unreadTotal };
};

// ─── Component ───────────────────────────────────────────────────────────────
// Receives the list (and its setter) from usePublicChatUnread via props so
// there is exactly one realtime subscription for the whole dashboard.
// `currentAgentName` is optional: pass the logged-in admin's display name
// if the parent has it; otherwise it falls back to
// `localStorage.getItem('superadmin_name')` for the optimistic echo only.
const PublicChat = ({
  conversations, setConversations, loading, error, onRefresh, onOpenConversation,
  currentAgentName,
}) => {
  const toast = useToast();
  const agentDisplayName = currentAgentName || getStoredAgentName();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Thread modal
  const [selected, setSelected] = useState(null); // conversation or null
  const [messages, setMessages] = useState([]);
  const [threadLoading, setThreadLoading] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [showCloseForm, setShowCloseForm] = useState(false);

  const bottomRef = useRef(null);
  const threadChannelRef = useRef(null);
  const threadCountRef = useRef(0);
  const lastTypingBroadcastRef = useRef(0);
  const typingStaleTimerRef = useRef(null);

  const counts = useMemo(() => ({
    open: conversations.filter(c => c.status !== 'closed').length,
    escalated: conversations.filter(c => c.escalated && c.status !== 'closed').length,
    unread: conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
  }), [conversations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter(c => {
      if (filterStatus === 'open' && c.status === 'closed') return false;
      if (filterStatus === 'closed' && c.status !== 'closed') return false;
      if (filterStatus === 'escalated' && !c.escalated) return false;
      if (!q) return true;
      return (
        c.visitorName?.toLowerCase().includes(q) ||
        c.visitorEmail?.toLowerCase().includes(q) ||
        c.visitorPhone?.toLowerCase().includes(q) ||
        c.lastMessage?.toLowerCase().includes(q)
      );
    });
  }, [conversations, search, filterStatus]);

  // ── Open thread ───────────────────────────────────────────────────────────
  const fetchMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId) return;
    if (!silent) setThreadLoading(true);
    try {
      const data = await pcFetch(`/superadmin/public-chats/${conversationId}/messages`);
      const list = Array.isArray(data?.data) ? data.data : (Array.isArray(data?.messages) ? data.messages : []);
      threadCountRef.current = list.length;
      setMessages(list);
      if (data?.status === 'closed') {
        setSelected((s) => (s && s.id === conversationId ? { ...s, status: 'closed' } : s));
        setVisitorTyping(false);
      }
    } catch (e) {
      if (!silent) toast.error(e.message || 'Failed to load messages');
    } finally {
      if (!silent) setThreadLoading(false);
    }
  }, [toast]);

  const openThread = async (conv) => {
    setSelected(conv);
    setMessages([]);
    setVisitorTyping(false);
    setReply('');
    setShowCloseForm(false);
    setCloseReason('');
    threadCountRef.current = 0;
    onOpenConversation?.(conv.id); // tells the dashboard-level hook to suppress the ping for this thread

    // Optimistic local clear for instant feedback...
    setConversations((prev) => prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c)));
    // ...and the real, DB-backed clear, broadcast to every other agent window.
    pcFetch(`/superadmin/public-chats/${conv.id}/read`, { method: 'POST' }).catch(() => {
      /* best-effort: the safety-net refresh will still pick up the true count */
    });

    await fetchMessages(conv.id);
  };

  // Subscribe to the open thread's channel; replaces the 5s thread poll.
  useEffect(() => {
    if (!selected) return undefined;

    const channel = supabase
      .channel(`chat:conversation:${selected.id}`)
      .on('broadcast', { event: 'messages_updated' }, ({ payload }) => {
        threadCountRef.current = payload.messages.length;
        setMessages(payload.messages);
        if (payload.status === 'closed') {
          setSelected((s) => (s ? { ...s, status: 'closed' } : s));
          setVisitorTyping(false);
        }
      })
      .on('broadcast', { event: 'message_sent' }, ({ payload }) => {
        // Direct browser-to-browser delivery, same channel typing uses.
        const msg = payload.message;
        if (!msg) return;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        if (msg.sender === 'visitor') setVisitorTyping(false);
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.sender !== 'visitor') return;
        setVisitorTyping(true);
        if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
        typingStaleTimerRef.current = setTimeout(() => setVisitorTyping(false), TYPING_STALE_MS);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') fetchMessages(selected.id, true); // resync after reconnect
      });

    threadChannelRef.current = channel;

    return () => {
      if (typingStaleTimerRef.current) clearTimeout(typingStaleTimerRef.current);
      supabase.removeChannel(channel);
      threadChannelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, visitorTyping]);

  const closeModal = () => {
    setSelected(null);
    setMessages([]);
    setVisitorTyping(false);
    setReply('');
    setShowCloseForm(false);
    setCloseReason('');
    onOpenConversation?.(null);
  };

  // ── Agent typing: direct broadcast, no backend round trip ─────────────────
  const broadcastTyping = () => {
    if (!threadChannelRef.current || selected?.status === 'closed') return;
    const now = Date.now();
    if (now - lastTypingBroadcastRef.current < TYPING_BROADCAST_MS) return;
    lastTypingBroadcastRef.current = now;
    threadChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { sender: 'agent' } });
  };

  const handleReplyChange = (e) => {
    setReply(e.target.value);
    if (e.target.value.trim()) broadcastTyping();
  };

  // ── Send a reply: direct broadcast first, backend persist second ──────────
  const handleSendReply = async () => {
    const text = reply.trim();
    if (!text || !selected) return;

    const id = genId();
    // `agent_name` here is the optimistic, client-known name shown until
    // the server round trip confirms it. The backend persists the
    // authoritative name.
    const localMsg = { id, sender: 'agent', text, created_at: new Date().toISOString(), agent_name: agentDisplayName };
    setMessages((prev) => [...prev, localMsg]);
    setReply('');

    // Direct delivery on the same channel typing uses. Reaches the
    // visitor's widget the instant it is sent, independent of the backend.
    threadChannelRef.current?.send({ type: 'broadcast', event: 'message_sent', payload: { message: localMsg } });

    setSending(true);
    try {
      const data = await pcFetch(`/superadmin/public-chats/${selected.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ id, text }),
      });
      if (Array.isArray(data?.messages)) {
        threadCountRef.current = data.messages.length;
        setMessages(data.messages);
      } else {
        await fetchMessages(selected.id, true);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to send reply');
      setMessages((prev) => prev.filter((m) => m.id !== id));
      setReply(text);
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    if (!selected || !closeReason.trim()) { toast.error('Please provide a reason'); return; }
    setClosing(true);
    try {
      await pcFetch(`/superadmin/public-chats/${selected.id}/close`, {
        method: 'POST',
        body: JSON.stringify({ reason: closeReason.trim() }),
      });
      toast.success('Conversation closed');
      closeModal();
    } catch (e) {
      toast.error(e.message || 'Failed to close conversation');
    } finally {
      setClosing(false);
    }
  };

  const handleReplyKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="mt-20 space-y-6 px-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Public Chat</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Website visitor conversations · {counts.open} open · {counts.escalated} awaiting a reply
            {counts.unread > 0 && <> · {counts.unread} unread</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search visitors..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="escalated">Needs reply</option>
            <option value="closed">Closed</option>
          </select>
          <button
            onClick={() => onRefresh?.()}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-2 text-sm text-amber-800 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p className="font-medium">Could not load public chats: {error}</p>
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-16 flex items-center justify-center">
          <Loader className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-400" />
        </div>
      ) : (
        /* THREE cards per row on xl screens (1 on mobile, 2 on md) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(conv => {
            const isClosed = conv.status === 'closed';
            const unread = conv.unreadCount || 0;
            return (
              <button
                key={conv.id}
                onClick={() => openThread(conv)}
                className="relative text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 hover:shadow-md dark:hover:border-gray-600 transition-shadow flex flex-col h-full"
              >
                {unread > 0 && (
                  <span className="absolute -top-2 -right-2 h-6 min-w-6 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <MessagesSquare className={`h-4 w-4 flex-shrink-0 ${isClosed ? 'text-gray-400 dark:text-gray-500' : 'text-blue-500 dark:text-blue-400'}`} />
                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{conv.visitorName || 'Visitor'}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${isClosed ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {isClosed ? 'Closed' : 'Open'}
                  </span>
                </div>

                {conv.escalated && !isClosed && (
                  <span className="mt-2 self-start inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800">
                    <AlertTriangle className="h-3 w-3" /> Needs reply
                  </span>
                )}

                {conv.lastMessage && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                    {conv.lastSender === 'agent' ? `${conv.lastSenderName || 'Agent'}: ` : ''}{conv.lastMessage}
                  </p>
                )}

                <div className="mt-auto pt-3 flex flex-col gap-1 text-xs text-gray-400 dark:text-gray-500">
                  {conv.visitorPhone && (
                    <span className="inline-flex items-center gap-1 truncate"><Phone className="h-3 w-3 flex-shrink-0" /> {conv.visitorPhone}</span>
                  )}
                  {conv.visitorEmail && (
                    <span className="inline-flex items-center gap-1 truncate"><Mail className="h-3 w-3 flex-shrink-0" /> {conv.visitorEmail}</span>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span>{conv.messageCount ?? 0} messages</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {conv.lastActivity ? formatRelativeToNow(new Date(conv.lastActivity)) + ' ago' : '-'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          {filtered.length === 0 && !error && (
            <div className="col-span-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-10 text-center">
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {search || filterStatus !== 'all' ? 'No conversations match your filters' : 'No public chat conversations yet'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Thread modal ── */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-full sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">Public Chat Thread</h2>
              <button onClick={closeModal} className="cursor-pointer p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-3">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Visitor</p>
                    <p className="text-base font-semibold text-gray-900 dark:text-gray-100">{selected.visitorName || 'Visitor'}</p>
                    {selected.visitorPhone && <p className="text-sm text-gray-500 dark:text-gray-400">{selected.visitorPhone}</p>}
                    {selected.visitorEmail && <p className="text-sm text-gray-500 dark:text-gray-400">{selected.visitorEmail}</p>}
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${selected.status === 'closed' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}`}>
                    {selected.status === 'closed' ? 'Closed' : 'Open'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>{messages.length || selected.messageCount || 0} messages</span>
                  <span>Started {selected.createdAt ? formatDate(new Date(selected.createdAt), 'MMM d, yyyy HH:mm') : '-'}</span>
                  {selected.pageUrl && (
                    <span className="inline-flex items-center gap-1 truncate max-w-full">
                      <Globe className="h-3 w-3 flex-shrink-0" /> {selected.pageUrl}
                    </span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 space-y-3">
                {threadLoading && (
                  <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">Loading messages...</div>
                )}
                {!threadLoading && messages.length === 0 && (
                  <div className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">No messages found for this conversation.</div>
                )}
                {!threadLoading && messages.map(msg => {
                  if (msg.sender === 'system') {
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-center">{msg.text}</span>
                      </div>
                    );
                  }
                  const isAgent = msg.sender === 'agent';
                  // Real agent name for anything persisted server-side; falls
                  // back to a generic label only for legacy messages that
                  // predate attribution (no agent_name stored).
                  const agentLabel = msg.agent_name || 'Agent';
                  return (
                    <div key={msg.id} className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl p-3 ${isAgent ? 'bg-blue-50 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        <div className="flex items-center gap-2 mb-1 text-xs text-slate-500 dark:text-slate-400">
                          {isAgent ? <Headset className="h-3 w-3" /> : <User className="h-3 w-3" />}
                          <span>{isAgent ? agentLabel : (selected.visitorName || 'Visitor')}</span>
                          <span>· {msg.created_at ? formatDate(new Date(msg.created_at), 'MMM d, HH:mm') : '-'}</span>
                        </div>
                        <p className="text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {/* Visitor is typing... */}
                {!threadLoading && visitorTyping && selected.status !== 'closed' && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl p-3 bg-slate-100 dark:bg-slate-800">
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <User className="h-3 w-3" />
                        <span>{selected.visitorName || 'Visitor'} is typing</span>
                        <span className="flex items-center gap-1">
                          {[0, 1, 2].map(i => (
                            <span
                              key={i}
                              className="h-1 w-1 rounded-full bg-slate-400 dark:bg-slate-500 animate-bounce"
                              style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Composer + close controls */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0 space-y-3">
              {selected.status !== 'closed' && (
                <div className="flex items-end gap-2">
                  <textarea
                    rows={1}
                    value={reply}
                    onChange={handleReplyChange}
                    onKeyDown={handleReplyKeyDown}
                    placeholder="Reply to the visitor as an agent..."
                    className="flex-1 resize-none max-h-28 px-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={sending || !reply.trim()}
                    aria-label="Send reply"
                    className="h-10 w-10 flex-shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-700 dark:disabled:text-gray-500 transition-colors"
                  >
                    {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              )}

              {selected.status !== 'closed' && !showCloseForm && (
                <button
                  onClick={() => setShowCloseForm(true)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                >
                  <XCircle className="h-3.5 w-3.5" /> Close this conversation
                </button>
              )}

              {showCloseForm && (
                <div className="space-y-2">
                  <textarea
                    value={closeReason}
                    onChange={e => setCloseReason(e.target.value)}
                    rows={2}
                    placeholder="Reason for closing this conversation..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowCloseForm(false); setCloseReason(''); }}
                      className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCloseConversation}
                      disabled={closing || !closeReason.trim()}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {closing && <Loader className="h-4 w-4 animate-spin" />} Close Conversation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicChat;