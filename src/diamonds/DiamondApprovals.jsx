// SYSADMIN view: review pending M-Pesa payments and approve or reject them.
// Calls GET /api/admin/diamond-purchases and POST .../:id/approve|reject.
import { useCallback, useEffect, useState } from "react";
import {
  api, fullDate, cx, ADMIN_BASE, PAYBILL,
  mute, green, red, tint, card,
  btn, labelCls, inputCls, hintCls, h2Cls,
  Shell, CopyButton,
} from "./diamondShared.jsx";

// `tight` is used when the sysadmin tab bar already sits above the content.
export default function DiamondApprovals({ tight = false }) {
  const [rows, setRows] = useState(null); // null = loading
  const [working, setWorking] = useState(null);
  const [rejecting, setRejecting] = useState(null); // { id, reason }
  const [notice, setNotice] = useState(null); // { ok, text }

  const load = useCallback(async () => {
    try {
      setRows(await api("", {}, ADMIN_BASE));
    } catch (e) {
      setRows((r) => r ?? []);
      setNotice({ ok: false, text: e.message });
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const drop = (id) => setRows((r) => r.filter((x) => x.id !== id));

  async function act(p, action, reason) {
    setWorking(p.id);
    setNotice(null);
    try {
      await api(
        `/${p.id}/${action}`,
        {
          method: "POST",
          body: JSON.stringify(action === "reject" ? { reason: reason?.trim() || null } : {}),
        },
        ADMIN_BASE
      );
      drop(p.id);
      setRejecting(null);
      setNotice({
        ok: true,
        text:
          action === "approve"
            ? `Approved ${p.diamonds} diamonds for ${p.user_name}.`
            : `Rejected the payment from ${p.user_name}.`,
      });
    } catch (e) {
      // Someone else already reviewed it: the row is stale, so remove it
      if (e.code === "PURCHASE_ALREADY_REVIEWED" || e.code === "PURCHASE_NOT_FOUND") {
        drop(p.id);
        setRejecting(null);
      }
      setNotice({ ok: false, text: e.message });
    } finally {
      setWorking(null);
    }
  }

  return (
    <Shell wide tight={tight}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={h2Cls}>
          Pending payments{rows && rows.length > 0 ? ` (${rows.length})` : ""}
        </h2>
        <button type="button" className={btn("ghost", true)} onClick={load}>Refresh</button>
      </div>
      <p className={cx(hintCls, "mb-4 mt-2")}>
        Match each M-Pesa code and amount to the Paybill {PAYBILL} statement before approving.
      </p>

      {notice && (
        <p className={cx("mb-4 text-[.92rem] font-semibold", notice.ok ? green : red)} role="status">{notice.text}</p>
      )}

      {rows === null ? (
        <p className={hintCls} role="status">Loading payments…</p>
      ) : rows.length === 0 ? (
        <p className={cx(card, hintCls, "p-5")}>No payments are waiting for review.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {rows.map((p) => {
            const open = rejecting?.id === p.id;
            const disabled = working === p.id;
            return (
              <li key={p.id} className={cx(card, "p-4 text-[.92rem] sm:p-5")}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <b className={cx("text-[1.15rem] tracking-widest tabular-nums", green)}>{p.mpesa_code}</b>
                      <CopyButton text={p.mpesa_code} label="M-Pesa code" />
                    </div>
                    <div className="mt-1.5 font-semibold">
                      {p.kes_amount} KES <span className={mute}>for</span> {p.diamonds} diamonds
                    </div>
                    <div className={cx("mt-0.5 text-[.82rem]", mute)}>
                      {p.user_name}{p.phone ? `, ${p.phone}` : ""}, {fullDate(p.created_at)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button" className={btn("primary", true)} disabled={disabled}
                      onClick={() => act(p, "approve")}
                    >
                      {disabled && !open ? "Approving…" : "Approve"}
                    </button>
                    <button
                      type="button" className={btn("ghost", true)} disabled={disabled}
                      onClick={() => setRejecting(open ? null : { id: p.id, reason: "" })}
                      aria-expanded={open}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {open && (
                  <form
                    className={cx("mt-4 rounded-xl p-4", tint)}
                    onSubmit={(e) => { e.preventDefault(); act(p, "reject", rejecting.reason); }}
                  >
                    <label className={labelCls(true)}>
                      Reason (the user will see this)
                      <input
                        autoFocus maxLength={300} value={rejecting.reason}
                        placeholder="Code not found on the statement"
                        onChange={(e) => setRejecting({ id: p.id, reason: e.target.value })}
                        className={inputCls}
                      />
                    </label>
                    <div className="mt-3 flex gap-2">
                      <button type="submit" className={btn("danger", true)} disabled={disabled}>
                        {disabled ? "Rejecting…" : "Reject payment"}
                      </button>
                      <button
                        type="button" className={btn("ghost", true)}
                        onClick={() => setRejecting(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Shell>
  );
}