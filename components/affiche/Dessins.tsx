// Dessins de l'affiche, en SVG : la clé à bouton (Coraline), le « O » fantôme à quatre trous,
// la petite porte et l'épingle de lieu. Trait orange, remplissage anthracite, comme l'affiche.

const ORANGE = "#f3530d";
const NUIT = "#131212";

export function Cle({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 80 320" className={className}>
      {/* anneau d'accroche */}
      <circle cx="40" cy="10" r="7" fill="none" stroke={ORANGE} strokeWidth="3" />
      {/* tête : un bouton à quatre trous */}
      <circle cx="40" cy="52" r="33" fill={NUIT} stroke={ORANGE} strokeWidth="4" />
      <circle cx="40" cy="52" r="24" fill="none" stroke={ORANGE} strokeWidth="1.6" opacity=".7" />
      {[[32, 44], [48, 44], [32, 60], [48, 60]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="4.2" fill={ORANGE} />
      ))}
      {/* collier et tige */}
      <rect x="31" y="86" width="18" height="8" rx="2" fill={NUIT} stroke={ORANGE} strokeWidth="2.5" />
      <rect x="36" y="94" width="8" height="190" fill={NUIT} stroke={ORANGE} strokeWidth="2.5" />
      <rect x="31" y="120" width="18" height="6" rx="2" fill={NUIT} stroke={ORANGE} strokeWidth="2" />
      {/* panneton à crans */}
      <path d="M44 250h20v10h-8v8h10v12h-10v8h-12z" fill={NUIT} stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M36 284l4 14 4-14" fill={NUIT} stroke={ORANGE} strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
  );
}

// Le « O » de HALLOWEEN : silhouette haute et arrondie, quatre trous de bouton.
export function Fantome({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 60 110" className={className}>
      <path d="M30 2C13 2 4 20 4 44v54c0 6 5 9 9 6l5-4 6 6c3 3 9 3 12 0l6-6 5 4c4 3 9 0 9-6V44C56 20 47 2 30 2Z" fill={ORANGE} />
      <g className="fantome-yeux" style={{ transformOrigin: "30px 52px" }}>
        {[[22, 44], [38, 44], [22, 60], [38, 60]].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="4.6" fill={NUIT} />
        ))}
      </g>
    </svg>
  );
}

// Petite porte voûtée (contour), autour du trou de serrure.
export function Porte({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 190" className={className}>
      <path d="M8 186V60C8 30 31 6 60 6s52 24 52 54v126Z" fill="none" stroke={ORANGE} strokeWidth="3" />
      <path d="M20 186V62c0-23 18-42 40-42s40 19 40 42v124" fill="none" stroke={ORANGE} strokeWidth="1.2" opacity=".55" />
      <circle cx="92" cy="112" r="4" fill={ORANGE} />
    </svg>
  );
}

export function Epingle({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.6A2.6 2.6 0 1 1 12 6.4a2.6 2.6 0 0 1 0 5.2Z" />
    </svg>
  );
}

// Forme de la porte, en masque CSS : l'ouverture qui grandit pour laisser voir « l'autre côté ».
export const MASQUE_PORTE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 190'%3E%3Cpath d='M8 186V60C8 30 31 6 60 6s52 24 52 54v126Z'/%3E%3C/svg%3E\")";
