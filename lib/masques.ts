// Source unique : les 23 masques, les prix et le lien WhatsApp du BDE.
export const WHATSAPP = "2290169062340";
export const WHATSAPP_AFFICHE = "01 69 06 23 40";

export type Style = "scream" | "nonne" | "crane" | "creature" | "jason";

export const STYLES: { id: Style; nom: string }[] = [
  { id: "scream", nom: "Scream" },
  { id: "nonne", nom: "Nonnes" },
  { id: "crane", nom: "Crânes" },
  { id: "creature", nom: "Créatures" },
  { id: "jason", nom: "Jason" },
];

export const PRIX = { jason: "1 650 FCFA", autre: "3 750 FCFA" } as const;

export type Masque = { num: string; nom: string; style: Style; prix: string; img: string };

const LISTE: [string, Style][] = [
  ["La Nonne aux yeux verts", "nonne"], ["Ghostface langue tirée", "scream"], ["La Nonne", "nonne"],
  ["Démon cornu", "creature"], ["Spectre hurlant", "crane"], ["Grand-mère lippue", "creature"],
  ["Scream ensanglanté", "scream"], ["Nonne squelette", "nonne"], ["Faucheur noir", "crane"],
  ["Scream classique", "scream"], ["Crâne au voile rouge", "crane"], ["Scream zombie", "scream"],
  ["Crâne d'argent", "crane"], ["Masque à gaz", "creature"], ["Crâne fissuré", "crane"],
  ["Vieille sorcière", "creature"], ["La Nonne hurlante", "nonne"], ["Jason rouge sang", "jason"],
  ["Jason doré", "jason"], ["Jason noir", "jason"], ["Jason argent", "jason"],
  ["Jason jaune", "jason"], ["Jason blanc", "jason"],
];

export const MASQUES: Masque[] = LISTE.map(([nom, style], i) => {
  const num = String(i + 1).padStart(2, "0");
  return { num, nom, style, prix: style === "jason" ? PRIX.jason : PRIX.autre, img: `/assets/masques/masque-${num}.webp` };
});

export function waLien(m?: Masque) {
  const texte = m
    ? `Salut ! Je veux réserver le masque N°${m.num} (${m.nom}) pour la soirée Halloween du BDE.`
    : "Salut ! Je veux réserver un masque pour la soirée Halloween du BDE.";
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texte)}`;
}
