// Test des filtres du catalogue (bug réel : un filtre faisait planter la page).
// Prérequis : site servi sur $URL (défaut http://localhost:8731) et le skill design-taste-frontend installé.
// Usage : node tests/filtres.mjs
import { Browser } from `${process.env.HOME}/.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs`;
const URL = process.env.URL || "http://localhost:8731/";
const b = await Browser.launch();
const p = await b.newPage({ width: 1440, height: 900, dsf: 1 });
let erreurs = 0; b.on(p.sessionId, "Runtime.exceptionThrown", () => erreurs++);
await p.goto(URL, { settleMs: 2000 });
await p.eval(() => document.getElementById("masques").scrollIntoView());
await new Promise((r) => setTimeout(r, 1200));
const clic = (t) => p.eval((t) => [...document.querySelectorAll("#masques button")].find((x) => x.textContent.trim() === t).click(), t);
const compte = () => p.eval(() => { const l = [...document.querySelectorAll("li[data-num]")]; return { affiches: l.filter((x) => !x.hidden).length, opaques: l.filter((x) => getComputedStyle(x).opacity === "1").length }; });
await clic("Jason"); await new Promise((r) => setTimeout(r, 1000));
const jason = await compte();
await clic("Tous"); await new Promise((r) => setTimeout(r, 1000));
for (let i = 0; i < 6; i++) { await p.eval(() => window.scrollBy(0, 500)); await new Promise((r) => setTimeout(r, 400)); }
const tous = await compte();
await b.close();
const ok = erreurs === 0 && jason.affiches === 6 && tous.affiches === 23 && tous.opaques === 23;
console.log(ok ? "PASS" : "FAIL", JSON.stringify({ erreurs, jason, tous }));
process.exit(ok ? 0 : 1);
