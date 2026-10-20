import { useProgress } from "@react-three/drei";
import { useTranslation } from "@/lib/i18n/useTranslation";

/**
 * Loading bar shown while the race scene finishes loading (usually a moment, since
 * the menu already loaded the car and the start line).
 */
export function LoadingScreen() {
  const { progress, active } = useProgress();
  const { t } = useTranslation();
  const pct = Math.round(active ? progress : 100);

  return (
    <div className="dnr-loading-backdrop">
    <div className="dnr-loading" role="status" aria-live="polite">
      <style>{LOADING_CSS}</style>
      <div className="dnr-loading-label">
        <span>{active ? t.menu.warmingUp : t.menu.ready}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="dnr-loading-track">
        <div className="dnr-loading-fill" style={{ width: `${pct}%` }} />
        <div className="dnr-loading-car" style={{ left: `${pct}%` }} aria-hidden="true">🏁</div>
      </div>
    </div>
    </div>
  );
}

const LOADING_CSS = `
.dnr-loading-backdrop { position: fixed; inset: 0; z-index: 9997; background: radial-gradient(120% 90% at 50% 110%, #163a4c, #0e1b24 70%); }
.dnr-loading { position: fixed; left: 50%; bottom: max(32px, env(safe-area-inset-bottom)); transform: translateX(-50%); z-index: 9998; width: min(420px, calc(100% - 32px)); padding: 14px 18px 16px; border-radius: 12px; background: rgba(14,27,36,.82); border: 1px solid rgba(36,160,206,.45); box-shadow: 0 16px 40px rgba(0,0,0,.35); font-family: Inter, system-ui, sans-serif; color: #fff; backdrop-filter: blur(6px); }
.dnr-loading-label { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; font-weight: 900; font-style: italic; font-size: 18px; }
.dnr-loading-label strong { font-style: normal; font-size: 14px; color: #fcd116; font-variant-numeric: tabular-nums; }
.dnr-loading-track { position: relative; height: 8px; border-radius: 4px; background: repeating-linear-gradient(90deg, #1d3340 0 14px, #26404e 14px 28px); }
.dnr-loading-fill { height: 100%; border-radius: 4px; background: linear-gradient(90deg, #fcd116 0 50%, #003893 50% 75%, #ce1126 75%); background-size: 100% 100%; transition: width .3s ease; }
.dnr-loading-car { position: absolute; top: -16px; transform: translateX(-50%); font-size: 18px; transition: left .3s ease; }
`;
