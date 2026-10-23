// USER view: balance, buy diamonds with M-Pesa, and payment history.
// Calls GET /api/diamonds/me (unless `initial` is given) and POST /api/diamonds/purchase.
import { useCallback, useEffect, useId, useState } from "react";
import {
  api, diamondsFor, shortDate, cx,
  MIN_KES, RATE, UNLOCK_AT, PAYBILL, ACCOUNT, CODE_RE,
  mute, green, amber, blue, red, tint, card,
  btn, labelCls, inputCls, hintCls, h2Cls,
  Shell, CopyButton, Chip,
} from "./diamondShared.jsx";

const STATUS = {
  pending: { tone: amber, label: (p) => `+${p.diamonds} pending` },
  approved: { tone: green, label: (p) => `+${p.diamonds} active` },
  rejected: { tone: red, label: () => "Rejected" },
};

const toWallet = (w) => ({ active: w.active ?? 0, pending: w.pending ?? 0, purchases: w.purchases ?? [] });

const timeOf = (d) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function RefreshIcon({ spinning }) {
  return (
    <svg
      viewBox="0 0 24 24" aria-hidden="true"
      className={cx("h-4 w-4 shrink-0", spinning && "motion-safe:animate-spin")}
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

// The gem fills from the bottom: solid for active diamonds, hatched for pending.
function GemMeter({ active, pending }) {
  const uid = useId().replace(/:/g, "");
  const H = 24;
  const a = Math.min(1, active / UNLOCK_AT) * H;
  const p = Math.min(1 - Math.min(1, active / UNLOCK_AT), pending / UNLOCK_AT) * H;
  const outline = "M6 3h12l4 6-10 12L2 9z";
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("h-24 w-24 shrink-0 sm:h-28 sm:w-28", blue)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={UNLOCK_AT}
      aria-valuenow={Math.min(active, UNLOCK_AT)}
      aria-label="Progress toward unlocking papers outside your bracket"
    >
      <defs>
        <clipPath id={`${uid}c`}><path d={outline} /></clipPath>
        <pattern id={`${uid}h`} width="2" height="2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="1" height="2" fill="currentColor" className={amber} />
        </pattern>
      </defs>
      <path d={outline} fill="currentColor" opacity=".1" />
      <g clipPath={`url(#${uid}c)`}>
        <rect x="0" width="24" y={H - a} height={a} fill="currentColor" opacity=".85" className="motion-safe:transition-all motion-safe:duration-500" />
        <rect x="0" width="24" y={H - a - p} height={p} fill={`url(#${uid}h)`} className="motion-safe:transition-all motion-safe:duration-500" />
      </g>
      <path
        d={`${outline}M2 9h20M9 3l3 6 3-6M12 9v12`}
        fill="none" stroke="currentColor" strokeWidth=".8" strokeLinejoin="round"
      />
    </svg>
  );
}

function PayDetail({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className={cx("text-[.8rem]", mute)}>{label}</div>
        <div className={cx("break-all text-[1.4rem] font-bold leading-tight tracking-wide tabular-nums sm:text-[1.6rem]", green)}>{value}</div>
      </div>
      <CopyButton text={value} label={label.toLowerCase()} />
    </div>
  );
}

// `initial` is the /me response when the parent has already fetched it, so the
// wallet renders immediately instead of calling /me a second time.
export default function DiamondWallet({ tight = false, initial = null }) {
  const [wallet, setWallet] = useState(initial ? toWallet(initial) : null); // null = still loading
  const [loadError, setLoadError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(initial ? new Date() : null);
  const [kes, setKes] = useState("100");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // { ok, text }
  const [showBuy, setShowBuy] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const w = await api("/me");
      setWallet(toWallet(w));
      setUpdatedAt(new Date());
      setLoadError(null);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { if (!initial) load(); }, [initial, load]);

  const kesNum = Number(kes);
  const getting = diamondsFor(kesNum);
  const codeOk = CODE_RE.test(code.trim());
  const valid = getting > 0 && codeOk;

  async function submit(e) {
    e.preventDefault();
    if (!valid || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await api("/purchase", {
        method: "POST",
        body: JSON.stringify({ kes: kesNum, mpesaCode: code.trim(), phone: phone.trim() }),
      });
      setCode("");
      setMsg({
        ok: true,
        text: `Payment submitted. Your ${res.diamonds ?? getting} diamonds are pending until a sysadmin approves them.`,
      });
      load();
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (!wallet) {
    return (
      <Shell tight={tight}>
        <div className={cx(card, "p-6")}>
          {loadError ? (
            <>
              <p className={red} role="alert">{loadError}</p>
              <button type="button" className={btn("ghost", true) + " mt-4"} onClick={() => load()}>Try again</button>
            </>
          ) : (
            <p className={hintCls} role="status">Loading your diamonds…</p>
          )}
        </div>
      </Shell>
    );
  }

  const need = Math.max(0, UNLOCK_AT - wallet.active);
  const pendingWouldUnlock = need > 0 && wallet.active + wallet.pending >= UNLOCK_AT;

  const historyPanel = (
    <aside aria-label="Payment history" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={h2Cls}>Your payments</h2>
        {wallet.purchases.length > 0 && (
          <span className={cx("text-[.8rem] tabular-nums", mute)}>{wallet.purchases.length} total</span>
        )}
      </div>
      {wallet.purchases.length === 0 ? (
        <p className={cx(card, hintCls, "p-5")}>
          No payments yet. Tap Buy diamonds, pay with M-Pesa, then submit the code.
        </p>
      ) : (
        <ul className={cx(card, "m-0 list-none divide-y overflow-hidden p-0", "divide-[#d3dee1] dark:divide-[#2b4147]")}>
          {wallet.purchases.map((p) => {
            const s = STATUS[p.status] ?? STATUS.pending;
            return (
              <li key={p.id} className="px-4 py-3.5 text-[.92rem] sm:px-5 sm:py-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 flex-col">
                    <b className="tabular-nums">{p.kes_amount} KES</b>
                    <small className={cx("truncate text-[.82rem] tracking-wide", mute)}>
                      {p.mpesa_code}, {shortDate(p.created_at)}
                    </small>
                  </span>
                  <Chip tone={s.tone}>{s.label(p)}</Chip>
                </div>
                {p.status === "rejected" && p.reject_reason && (
                  <p className={cx("mt-2 text-[.85rem]", mute)}>Reason: {p.reject_reason}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );

  return (
    <Shell wide={showHistory} tight={tight}>
      <div className={cx("grid items-start gap-6", showHistory && "md:grid-cols-2")}>
        <div className="min-w-0">
          {/* Balance */}
          <div className={cx(card, "p-5 sm:p-6")}>
            <div className="flex items-center justify-between gap-3">
              <span className={cx("text-[.8rem] font-semibold uppercase tracking-wider", mute)}>My diamonds</span>
              <button
                type="button"
                className={cx(
                  btn("ghost", true),
                  "inline-flex items-center gap-1.5 whitespace-nowrap",
                )}
                onClick={() => load(true)}
                disabled={refreshing}
                aria-busy={refreshing}
                aria-label="Refresh balance and payments"
              >
                <RefreshIcon spinning={refreshing} />
                <span>{refreshing ? "Refreshing…" : "Refresh"}</span>
              </button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-4 text-center min-[420px]:flex-row min-[420px]:gap-5 min-[420px]:text-left">
              <GemMeter active={wallet.active} pending={wallet.pending} />
              <div className="min-w-0">
                <div className={cx("text-[3rem] font-bold leading-none tabular-nums sm:text-[3.4rem]", blue)}>{wallet.active}</div>
                <div className={cx("mt-1 text-[.9rem]", mute)}>active diamonds</div>
                {wallet.pending > 0 && (
                  <div className={cx("mt-2 text-[.9rem] font-semibold", amber)}>
                    +{wallet.pending} waiting for approval
                  </div>
                )}
              </div>
            </div>

            <div className={cx("mt-4 flex flex-wrap items-center justify-center gap-x-2 text-[.78rem] min-[420px]:justify-start", mute)} aria-live="polite">
              {updatedAt && <span>Updated {timeOf(updatedAt)}</span>}
              {loadError && <span className={cx("font-semibold", red)} role="alert">Could not refresh: {loadError}</span>}
            </div>
          </div>

          <p className={cx(hintCls, "mt-3 px-1")}>
            {need === 0
              ? "You can unlock papers outside your bracket."
              : pendingWouldUnlock
                ? "Your pending diamonds will unlock papers outside your bracket once they are approved."
                : `You need ${need} more active diamond${need === 1 ? "" : "s"} to unlock papers outside your bracket.`}
          </p>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <button
              type="button" className={btn("primary", false, true)}
              aria-expanded={showBuy} aria-controls="dw-buy"
              onClick={() => setShowBuy((v) => !v)}
            >
              {showBuy ? "Hide steps" : "Buy diamonds"}
            </button>
            <button
              type="button" className={btn("ghost", false, true)}
              aria-expanded={showHistory} aria-controls="dw-history"
              onClick={() => setShowHistory((v) => !v)}
            >
              {showHistory ? "Hide history" : "Show history"}
            </button>
          </div>

          {/* Payment procedure: only after Buy diamonds is clicked */}
          {showBuy && (
            <div id="dw-buy" className={cx(card, "mt-6 p-4 sm:p-6")}>
              <h2 className={cx(h2Cls, "mb-2")}>How to pay</h2>
              <p className={hintCls}>
                In M-Pesa, choose <b>Lipa na M-Pesa</b>, then <b>Pay Bill</b>, and enter:
              </p>
              <div className={cx("mt-3 divide-y rounded-xl px-4", tint, "divide-[#d3dee1] dark:divide-[#2b4147]")}>
                <PayDetail label="Business number" value={PAYBILL} />
                <PayDetail label="Account number" value={ACCOUNT} />
              </div>
              <p className={cx(hintCls, "mt-3")}>
                Pay at least {MIN_KES} KES. You get {RATE} diamonds for every 1 KES. Then enter the amount and the code
                from your confirmation SMS.
              </p>

              <form onSubmit={submit} noValidate className="mt-5">
                <label className={labelCls(true)}>
                  Amount paid (KES)
                  <input
                    type="number" inputMode="numeric" min={MIN_KES} step="1"
                    value={kes} onChange={(e) => setKes(e.target.value)}
                    aria-describedby="dw-preview"
                    className={inputCls}
                  />
                </label>
                <div id="dw-preview" className={cx("mt-2 text-[.95rem] font-bold", blue)} aria-live="polite">
                  {getting > 0 ? `You get ${getting} diamonds` : `Minimum ${MIN_KES} KES, whole amounts only`}
                </div>

                <label className={labelCls()}>
                  M-Pesa code
                  <input
                    value={code} maxLength={10} placeholder="SJK4X9ABCD"
                    autoCapitalize="characters" autoComplete="off" spellCheck={false}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    aria-invalid={code.length > 0 && !codeOk}
                    className={cx(inputCls, "tracking-widest")}
                  />
                </label>
                {code.length > 0 && !codeOk && (
                  <p className={cx("mt-1.5 text-[.85rem]", red)}>
                    The code has 10 letters and numbers. You have entered {code.trim().length}.
                  </p>
                )}

                <label className={labelCls()}>
                  Phone you paid from (optional)
                  <input
                    value={phone} inputMode="tel" placeholder="07XX XXX XXX" maxLength={20}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                  />
                </label>

                <button type="submit" className={cx(btn("primary"), "w-full sm:w-auto")} disabled={!valid || busy}>
                  {busy ? "Submitting…" : "Submit payment"}
                </button>
              </form>
            </div>
          )}

          {msg && (
            <p className={cx("mt-4 text-[.92rem] font-semibold", msg.ok ? green : red)} role="status">{msg.text}</p>
          )}
        </div>

        {/* History: opens on the left on wider screens, below the balance on phones */}
        {showHistory && <div id="dw-history" className="min-w-0 md:order-first">{historyPanel}</div>}
      </div>
    </Shell>
  );
}