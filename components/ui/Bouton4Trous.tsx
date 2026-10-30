// Le bouton à 4 trous de l'affiche (clé, « O » de HALLOWEEN) : marque visuelle du site.
export default function Bouton4Trous({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" width={size} height={size} className={`shrink-0 ${className}`}>
      <circle cx="16" cy="16" r="15" fill="#f3530d" />
      <circle cx="16" cy="16" r="11.5" fill="none" stroke="#131212" strokeOpacity=".35" strokeWidth="1.2" />
      <g fill="#131212">
        <circle cx="12.4" cy="12.4" r="2.1" /><circle cx="19.6" cy="12.4" r="2.1" />
        <circle cx="12.4" cy="19.6" r="2.1" /><circle cx="19.6" cy="19.6" r="2.1" />
      </g>
    </svg>
  );
}
