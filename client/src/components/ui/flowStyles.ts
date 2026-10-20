// Shared look for the screens around the menu (language, name entry, loading):
// heavy italic Inter display type, the Colombian flag stripe, and the skewed
// sun-yellow call to action used on the main menu.
export const FLOW_CSS = `
.dnr-flow { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 16px; font-family: Inter, system-ui, sans-serif; color: #fff; background: radial-gradient(120% 90% at 50% 100%, rgba(14,27,36,.55), rgba(8,16,22,.86)); backdrop-filter: blur(6px); animation: dnr-flow-fade .35s ease both; }
.dnr-flow-card { width: min(460px, 100%); padding: 28px 26px 24px; border-radius: 14px; background: linear-gradient(160deg, rgba(20,48,63,.92), rgba(14,27,36,.94)); border: 1px solid rgba(36,160,206,.45); box-shadow: 0 24px 60px rgba(0,0,0,.45); animation: dnr-flow-rise .45s cubic-bezier(.2,.8,.2,1) both; }
.dnr-flow-kicker { font-weight: 800; font-size: 12px; letter-spacing: .3em; color: #24a0ce; text-transform: uppercase; }
.dnr-flow-title { position: relative; margin: 6px 0 22px; font-size: clamp(30px, 7vw, 40px); line-height: 1; font-weight: 900; font-style: italic; letter-spacing: -.01em; }
.dnr-flow-title::after { content: ""; position: absolute; left: 2px; bottom: -10px; width: 120px; height: 6px; transform: skewX(-24deg); background: linear-gradient(90deg, #fcd116 0 50%, #003893 50% 75%, #ce1126 75%); }
.dnr-flow-sub { margin: -6px 0 18px; color: #b9d3dd; font-size: 14px; line-height: 1.5; }
.dnr-flow-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.dnr-flow-choice { padding: 16px 14px; border-radius: 10px; border: 1px solid rgba(36,160,206,.5); background: rgba(36,160,206,.12); color: #fff; font: 900 italic 20px Inter, sans-serif; cursor: pointer; text-align: left; transition: transform .12s ease, background .12s ease, border-color .12s ease; }
.dnr-flow-choice small { display: block; margin-top: 4px; font: 700 11px Inter, sans-serif; letter-spacing: .14em; text-transform: uppercase; color: #9fc6d4; font-style: normal; }
.dnr-flow-choice:hover { transform: translateY(-2px); background: rgba(36,160,206,.24); border-color: #5dd6ff; }
.dnr-flow-input { width: 100%; box-sizing: border-box; padding: 16px 16px; border-radius: 10px; border: 2px solid rgba(36,160,206,.6); background: rgba(8,18,26,.7); color: #fff; font: 800 22px Inter, sans-serif; letter-spacing: .02em; outline: none; }
.dnr-flow-input::placeholder { color: rgba(255,255,255,.35); }
.dnr-flow-input:focus { border-color: #fcd116; box-shadow: 0 0 0 4px rgba(252,209,22,.18); }
.dnr-flow-hint { margin-top: 8px; display: flex; justify-content: space-between; font-size: 12px; color: #8fb2bf; font-variant-numeric: tabular-nums; }
.dnr-flow-cta { margin-top: 18px; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 14px; padding: 16px 20px; border: 0; cursor: pointer; transform: skewX(-10deg); background: linear-gradient(100deg, #fcd116, #ffb347 55%, #ff7a45); color: #1b1206; box-shadow: 0 10px 28px rgba(255,140,60,.4), inset 0 -4px 0 rgba(0,0,0,.18); font: 900 italic 22px Inter, sans-serif; letter-spacing: .02em; transition: transform .12s ease, opacity .12s ease; }
.dnr-flow-cta > span { transform: skewX(10deg); }
.dnr-flow-cta:hover:not(:disabled) { transform: skewX(-10deg) translateY(-2px); }
.dnr-flow-cta:disabled { opacity: .4; cursor: not-allowed; box-shadow: none; }
.dnr-flow-choice:focus-visible, .dnr-flow-cta:focus-visible { outline: 3px solid #24a0ce; outline-offset: 3px; }
.dnr-flow-foot { margin-top: 12px; text-align: center; font-size: 12px; color: #8fb2bf; }
@keyframes dnr-flow-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dnr-flow-rise { from { opacity: 0; transform: translateY(16px) scale(.98); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .dnr-flow, .dnr-flow-card { animation: none; } }
`;
