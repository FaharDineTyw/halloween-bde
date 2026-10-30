import { waLien } from "@/lib/masques";

export default function Header() {
  return (
    <header className="wrap absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 py-4">
      <a href="#haut" aria-label="BDE Epitech Bénin, retour en haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-bde.svg" alt="Bureau des Étudiants Epitech Bénin" width={101} height={64} className="h-14 w-auto md:h-16" />
      </a>
      <nav aria-label="Navigation principale" className="flex items-center gap-5 text-[length:var(--step-small)] md:gap-8 md:text-[length:var(--step-body)]">
        <a href="#masques" className="hidden underline-offset-4 hover:underline sm:inline">Les masques</a>
        <a href="#soiree" className="hidden underline-offset-4 hover:underline sm:inline">La soirée</a>
        <a href={waLien()} target="_blank" rel="noopener" className="btn">Réserver</a>
      </nav>
    </header>
  );
}
