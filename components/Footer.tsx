export default function Footer() {
  return (
    <footer className="wrap flex min-h-[90svh] flex-col bg-bg pt-10 pb-8 text-ink">
      <h2 className="sr-only">Pied de page</h2>
      <div className="flex flex-col gap-2 text-[15px] sm:flex-row sm:items-start sm:gap-10">
        <p>BDE Epitech Bénin</p>
        <p>Soirée Halloween, 31 octobre 2026</p>
        <a href="#haut" className="underline-offset-4 hover:underline sm:ml-auto">Retour en haut</a>
      </div>

      {/* Le logo du BDE, sur toute la largeur. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/assets/logo-bde.svg"
        alt="Bureau des Étudiants Epitech Bénin"
        width={260}
        height={164}
        loading="lazy"
        className="mt-auto max-h-[62svh] w-full object-contain object-left"
      />

      <div className="mt-10 grid gap-2 text-[14px] sm:grid-cols-3">
        <p className="flex gap-5">
          <a href="#masques" className="underline-offset-4 hover:underline">Les masques</a>
          <a href="#soiree" className="underline-offset-4 hover:underline">La soirée</a>
        </p>
        <p className="sm:text-center">Photos des masques : BDE</p>
        <p className="sm:text-right">Halloween 2026</p>
      </div>
    </footer>
  );
}
