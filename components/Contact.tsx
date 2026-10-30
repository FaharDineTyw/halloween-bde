import { WHATSAPP_AFFICHE, waLien } from "@/lib/masques";
import IconeWhatsApp from "@/components/ui/IconeWhatsApp";
import Bouton4Trous from "@/components/ui/Bouton4Trous";

const ETAPES = [
  "Choisis ton masque",
  `Envoie le numéro du masque au ${WHATSAPP_AFFICHE.replace(/ /g, " ")} sur WhatsApp`,
  "Récupère-le auprès du BDE ou à l'EYA Centre le soir même",
];

// Suite claire du catalogue : on choisit au-dessus, on réserve ici.
export default function Contact() {
  return (
    <section id="reserver" aria-labelledby="reserver-titre" className="wrap pb-[var(--section-y)] text-ink">
      <div className="grid gap-8 pt-[var(--section-y)] lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7 lg:self-center">
          <h2 id="reserver-titre" className="font-display uppercase leading-[1] text-accent text-[length:var(--step-head)]">
            Réserve-le<br />avant samedi
          </h2>
          <ol className="mt-8 grid gap-4 md:mt-10">
            {ETAPES.map((e, k) => (
              <li key={e} className="grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-3 text-[length:var(--step-body)]">
                <span aria-hidden="true" className="relative grid h-8 w-8 place-items-center"><Bouton4Trous size={32} className="absolute inset-0" /><span className="relative rounded-full bg-bg px-1 font-display text-[length:var(--step-small)] leading-none text-accent">{k + 1}</span></span>
                <span>{e}</span>
              </li>
            ))}
          </ol>
          <a href={waLien()} target="_blank" rel="noopener" className="btn mt-8"><IconeWhatsApp />Réserver un masque</a>
        </div>
        {/* L'affiche officielle de l'événement, à côté de la réservation. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/affiche.webp" width={864} height={1080} loading="lazy" decoding="async"
          alt="Affiche de la soirée Halloween du BDE : 31 octobre, EYA Centre, à partir de 19h, portez vos déguisements."
          className="mx-auto w-full max-w-[420px] rounded-[4px] lg:col-span-4 lg:col-start-9" />
      </div>
    </section>
  );
}
