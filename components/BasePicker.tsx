"use client";
import { useState } from "react";
import { PRESET_BASES, saveBase, clearBase, type BaseLocation } from "@/lib/base";
import { useT } from "@/lib/i18n";

export default function BasePicker({
  base,
  onChange,
}: {
  base: BaseLocation | null;
  onChange: (b: BaseLocation | null) => void;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const [err, setErr] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const pick = (b: BaseLocation) => {
    saveBase(b);
    onChange(b);
    setOpen(false);
    setErr("");
  };

  const useCurrent = () => {
    if (!navigator.geolocation) {
      setErr(t("err.noGeolocation"));
      return;
    }
    setLocating(true);
    setErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        pick({
          name: t("base.currentName"),
          lat: Number(pos.coords.latitude.toFixed(4)),
          lng: Number(pos.coords.longitude.toFixed(4)),
        });
      },
      () => {
        setLocating(false);
        setErr(t("err.geolocationFailed"));
      },
      { timeout: 10000 },
    );
  };

  const useManual = () => {
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln) || la < -90 || la > 90 || ln < -180 || ln > 180) {
      setErr(t("err.badCoords"));
      return;
    }
    pick({ name: t("base.customName", { lat: la.toFixed(3), lng: ln.toFixed(3) }), lat: la, lng: ln });
  };

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm">
          <span className="text-slate-400">{t("base.label")}</span>
          {base ? (
            <span className="font-medium text-slate-100">{base.name}</span>
          ) : (
            <span className="text-slate-500">{t("base.unset")}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200 hover:bg-slate-700"
          >
            {base ? t("base.change") : t("base.set")}
          </button>
          {base && (
            <button
              onClick={() => {
                clearBase();
                onChange(null);
              }}
              className="rounded-full px-2 py-1 text-xs text-slate-500 hover:text-slate-300"
            >
              {t("base.clear")}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
          <div>
            <button
              onClick={useCurrent}
              disabled={locating}
              className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {locating ? t("base.locating") : t("base.useCurrent")}
            </button>
          </div>

          <div>
            <div className="mb-1.5 text-xs text-slate-400">{t("base.presets")}</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_BASES.map((b) => (
                <button
                  key={b.name}
                  onClick={() => pick(b)}
                  className="rounded-full border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-white"
                >
                  {b.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs text-slate-400">{t("base.manual")}</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder={t("base.lat")}
                inputMode="decimal"
                className="w-28 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-600"
              />
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder={t("base.lng")}
                inputMode="decimal"
                className="w-28 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 placeholder:text-slate-600"
              />
              <button
                onClick={useManual}
                className="rounded bg-slate-700 px-2.5 py-1 text-xs text-slate-100 hover:bg-slate-600"
              >
                {t("base.apply")}
              </button>
            </div>
          </div>

          {err && <p className="text-xs text-rose-400">{err}</p>}
          <p className="text-xs text-slate-600">{t("base.privacy")}</p>
        </div>
      )}
    </section>
  );
}
