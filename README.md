# Halloween du BDE Epitech Bénin

Site vitrine de la soirée Halloween du BDE Epitech Bénin : samedi 31 octobre, dès 19h, EYA Centre.
23 masques à réserver sur WhatsApp.

En ligne : https://halloween-bde.vercel.app (déployé automatiquement à chaque push sur `main`).

- Next.js 16 (export statique) + Tailwind v4 + GSAP
- Sang en WebGL (metaballs), fond interactif en canvas, catalogue filtrable

## Lancer en local

```bash
npm install
npm run build          # génère out/
cd out && python3 -m http.server 8731
```

## Tests

```bash
tests/smoke.sh          # contenu, liens WhatsApp, images
node tests/filtres.mjs  # filtres du catalogue
```
