import { waLien } from "@/lib/masques";
import IconeWhatsApp from "@/components/ui/IconeWhatsApp";

export default function Header() {
  return (
    <header className="wrap absolute inset-x-0 top-0 z-40 flex items-center justify-between gap-4 py-4">
      <a href="#haut" aria-label="Retour en haut">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo-bde.svg" alt="Bureau des Étudiants Epitech Bénin" width={101} height={64} className="h-14 w-auto md:h-16" />
      </a>
      <nav aria-label="Navigation principale" className="flex items-center gap-5 text-[length:var(--step-small)] md:gap-8 md:text-[length:var(--step-body)]">
        <a href="#masques" className="whitespace-nowrap underline-offset-4 hover:underline">Les masques</a>
        <a href={waLien()} target="_blank" rel="noopener" aria-label="Réserver un masque sur WhatsApp" className="btn btn-sm"><IconeWhatsApp />Réserver</a>
      </nav>
    </header>
  );
}
