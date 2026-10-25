// Shared config, API helper, design tokens and small UI pieces.
// Imported by DiamondWallet, DiamondApprovals and DiamondsPage. Renders no page of its own.
import { useState } from "react";
// Same token helper that paperShared.jsx uses. Adjust the path if this file
// lives at a different depth from paperShared.jsx.
import { getAccessToken } from "../utils/api";

// ── Config ───────────────────────────────────────────────────────────────────
const ROOT = import.meta.env.VITE_API_BASE_URL;
export const API_BASE = `${ROOT}/api/diamonds`;                  // user routes
export const ADMIN_BASE = `${ROOT}/api/admin/diamond-purchases`;  // sysadmin routes

export const MIN_KES = 50;
export const RATE = 1.2;           // shown to the user; the maths below use integers
export const UNLOCK_AT = 49;
export const PAYBILL = "522522";
export const ACCOUNT = "1268183342";
export const CODE_RE = /^[A-Za-z0-9]{10}$/;

// ── API ──────────────────────────────────────────────────────────────────────
// Sends the bearer token that verifyToken expects on the backend.
// If there is no session the header is left out and the server answers 401.
const authHeaders = async () => {
  let token = null;
  try {
    token = await getAccessToken();
  } catch {
    token = null;
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Friendly wording for the codes the server sends back
const ERRORS = {
  BELOW_MINIMUM_PURCHASE: `The minimum purchase is ${MIN_KES} KES.`,
  INVALID_MPESA_CODE: "That M-Pesa code looks wrong. It is 10 letters and numbers, like SJK4X9ABCD.",
  MPESA_CODE_ALREADY_USED: "That M-Pesa code has already been submitted.",
  INVALID_AMOUNT: "Enter the amount as a whole number of KES.",
};

export class ApiError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function api(path, options = {}, base = API_BASE) {
  const auth = await authHeaders();
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...auth, ...options.headers },
    });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", "NETWORK");
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      ERRORS[body.error] ||
        (res.status === 401 ? "Sign in to continue." : body.message) ||
        "Something went wrong. Try again.",
      body.error,
      res.status
    );
  }
  return body;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
// Whole-number maths so 1.2 never causes a rounding surprise (matches floor(kes * 1.2) in SQL)
export const diamondsFor = (kes) =>
  Number.isInteger(kes) && kes >= MIN_KES ? Math.floor((kes * 12) / 10) : 0;

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
export const fullDate = (iso) =>
  new Date(iso).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

// ── Design tokens (Tailwind) ─────────────────────────────────────────────────
// Light first, dark: variants follow the OS setting. Every class is written in
// full so Tailwind's scanner can find it.
export const cx = (...parts) => parts.filter(Boolean).join(" ");

export const ink = "text-[#10242a] dark:text-[#e8f0f2]";
export const mute = "text-[#51666c] dark:text-[#9fb3b8]";
export const green = "text-[#12713d] dark:text-[#5fd08d]";
export const amber = "text-[#8f5206] dark:text-[#f0b04a]";
export const blue = "text-[#1b5a99] dark:text-[#7dbaf2]";
export const red = "text-[#b3261e] dark:text-[#ff8a80]";

export const line = "border-[#d3dee1] dark:border-[#2b4147]";
export const tint = "bg-[#eef4f5] dark:bg-[#15292e]";
export const card = cx("rounded-2xl border bg-white dark:bg-[#0e1c20]", line);

const focusRing =
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#1b5a99] dark:focus-visible:outline-[#7dbaf2]";

const BTN = {
  primary: "border-[#12713d] bg-[#12713d] text-white dark:border-[#5fd08d] dark:bg-[#5fd08d] dark:text-[#052a16]",
  ghost: cx("bg-transparent", ink, line),
  danger: "border-[#b3261e] bg-[#b3261e] text-white dark:border-[#ff8a80] dark:bg-[#ff8a80] dark:text-[#2b0a07]",
};

export const btn = (variant = "primary", small = false, row = false) =>
  cx(
    "cursor-pointer rounded-xl border-[1.5px] font-bold",
    "disabled:cursor-not-allowed disabled:opacity-45 motion-safe:transition-opacity motion-safe:duration-150",
    focusRing,
    BTN[variant],
    row
      ? "flex-1 px-4 py-3 text-base"
      : small
        ? "w-auto px-3.5 py-2 text-[.85rem]"
        : "mt-5 w-full px-4 py-3.5 text-base"
  );

export const labelCls = (first = false) => cx("block text-[.88rem] font-semibold", first ? "mt-0" : "mt-4");

export const inputCls = cx(
  "mt-1.5 block w-full rounded-xl border-[1.5px] bg-white px-3.5 py-3 text-base dark:bg-[#0a1518]",
  line,
  ink,
  focusRing,
  "aria-invalid:border-[#b3261e] dark:aria-invalid:border-[#ff8a80]"
);

export const hintCls = cx("text-[.92rem] leading-relaxed", mute);
export const h2Cls = "text-[1.15rem] font-bold leading-tight";

// ── Shared pieces ────────────────────────────────────────────────────────────
// mt-20 lives here so every state (loading, error, loaded) clears the header.
// `tight` is used when the sysadmin tab bar already sits above the content.
export function Shell({ wide = false, tight = false, children }) {
  return (
    <section
      className={cx(
        "mx-auto w-full px-4 pb-16 pt-2 font-sans leading-normal sm:px-6",
        tight ? "mt-4" : "mt-20",
        wide ? "max-w-3xl" : "max-w-xl",
        ink
      )}
    >
      {children}
    </section>
  );
}

export function CopyButton({ text, label }) {
  const [done, setDone] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* clipboard blocked: the number is still on screen */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className={cx("cursor-pointer rounded-lg border bg-transparent px-2.5 py-1 text-[.8rem] font-semibold", ink, line, focusRing)}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

export function Chip({ tone, children }) {
  return (
    <span className={cx("whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[.8rem] font-bold", tone, line)}>
      {children}
    </span>
  );
}