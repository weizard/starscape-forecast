"use client";
import { useState } from "react";
import { addCustomSpot } from "@/lib/customSpots";
import type { Spot } from "@/lib/types";
import { useT } from "@/lib/i18n";

export default function CustomSpotForm({ onAdded }: { onAdded: (s: Spot) => void }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [alt, setAlt] = useState("");
  const [bortle, setBortle] = useState("4");
  const [notes, setNotes] = useState("");
  const [err, setErr] = useState("");
  const [locating, setLocating] = useState(false);

  const reset = () => {
    setName(""); setLat(""); setLng(""); setAlt(""); setBortle("4"); setNotes(""); setErr("");
  };

  const useCurrent = () => {
    if (!navigator.geolocation) {
      setErr(t("err.noGeolocation"));
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLat(pos.coords.latitude.toFixed(4));
        setLng(pos.coords.longitude.toFixed(4));
        if (pos.coords.altitude != null) setAlt(Math.round(pos.coords.altitude).toString());
        setErr("");
      },
      () => {
        setLocating(false);
        setErr(t("err.geolocationFailed"));
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const submit = () => {
    const la = Number(lat);
    const ln = Number(lng);
    if (!name.trim()) return setErr(t("custom.err.name"));
    if (!Number.isFinite(la) || Math.abs(la) > 90) return setErr(t("custom.err.lat"));
    if (!Number.isFinite(ln) || Math.abs(ln) > 180) return setErr(t("custom.err.lng"));
    const a = alt.trim() === "" ? 0 : Number(alt);
    if (!Number.isFinite(a) || a < -500 || a > 4000) return setErr(t("custom.err.alt"));
    const b = Number(bortle);
    const spot = addCustomSpot({
      name,
      lat: la,
      lng: ln,
      altitude_m: Math.round(a),
      bortle: Number.isFinite(b) ? Math.min(9, Math.max(1, Math.round(b))) : 4,
      access_notes: notes,
    });
    onAdded(spot);
    reset();
    setOpen(false);
  };

  const field = "rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-600";

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
      >
        {t("custom.add")}
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">{t("custom.formTitle")}</h3>
        <button onClick={() => { reset(); setOpen(false); }} className="text-xs text-slate-500 hover:text-slate-300">
          {t("custom.cancel")}
        </button>
      </div>

      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("custom.name")}
          className={`w-full ${field}`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <input value={lat} onChange={(e) => setLat(e.target.value)} placeholder={t("custom.lat")} inputMode="decimal" className={`w-24 ${field}`} />
          <input value={lng} onChange={(e) => setLng(e.target.value)} placeholder={t("custom.lng")} inputMode="decimal" className={`w-24 ${field}`} />
          <button
            onClick={useCurrent}
            disabled={locating}
            className="rounded bg-sky-600 px-2.5 py-1 text-xs text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {locating ? t("base.locating") : t("custom.useCurrent")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <label className="flex items-center gap-1">
            {t("custom.altitude")}
            <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="0" inputMode="numeric" className={`w-20 ${field}`} />
            m
          </label>
          <label className="flex items-center gap-1">
            {t("custom.bortle")}
            <select value={bortle} onChange={(e) => setBortle(e.target.value)} className={field}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((b) => (
                <option key={b} value={b}>{b} — {b <= 2 ? t("custom.bortle.dark") : b <= 4 ? t("custom.bortle.rural") : b <= 6 ? t("custom.bortle.suburb") : t("custom.bortle.city")}</option>
              ))}
            </select>
          </label>
        </div>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("custom.notes")}
          className={`w-full ${field}`}
        />
        {err && <p className="text-xs text-rose-400">{err}</p>}
        <div className="flex items-center gap-2 pt-1">
          <button onClick={submit} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-900 hover:bg-white">
            {t("custom.submit")}
          </button>
          <span className="text-xs text-slate-500">{t("custom.altHint")}</span>
        </div>
        <p className="border-t border-slate-800 pt-2 text-xs leading-relaxed text-amber-200/70">{t("custom.storage")}</p>
      </div>
    </section>
  );
}
