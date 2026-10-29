#!/usr/bin/env bash
# Smoke test du site exporté. Prérequis : `npx next build` puis out/ servi sur $URL
# (cd out && python3 -m http.server 8731). Usage : tests/smoke.sh
URL=${URL:-http://localhost:8731}
BRAVE=$(command -v brave-browser brave brave-browser-stable | head -1)
fail=0
chk() { if [ "$2" = "$3" ]; then echo "PASS $1 ($2)"; else echo "FAIL $1: got '$2', want '$3'"; fail=1; fi; }
ge() { if [ "$2" -ge "$3" ]; then echo "PASS $1 ($2)"; else echo "FAIL $1: got '$2', want >= $3"; fail=1; fi; }

# HTML servi tel quel (avant JS) : les liens doivent déjà y être. Puis le DOM après JS.
HTML=$(curl -s "$URL/")
DOM=$("$BRAVE" --headless=new --disable-gpu --virtual-time-budget=4000 --dump-dom "$URL/" 2>/dev/null)

for src in HTML DOM; do
  d=${!src}
  cnt() { printf '%s' "$d" | grep -o "$1" | wc -l; }
  chk "$src 1 lignes masques" "$(cnt '<li[^>]*data-num="[0-9][0-9]"')" 23
  chk "$src 2 jason" "$(cnt '<li[^>]*data-style="jason"')" 6
  ge  "$src 3 liens WhatsApp" "$(cnt 'href="https://wa.me/2290169062340')" 25
  ge  "$src 4 prix jason" "$(cnt '1 650 FCFA')" 6
  ge  "$src 5 prix autres" "$(cnt '3 750 FCFA')" 17
  chk "$src 6 un seul h1" "$(cnt '<h1')" 1
done

bad=0
for f in assets/affiche.jpeg assets/affiche.webp assets/logo-bde.svg $(seq -f 'assets/masques/masque-%02g.webp' 1 23); do
  c=$(curl -s -o /dev/null -w '%{http_code}' "$URL/$f"); [ "$c" = 200 ] || { echo "  $f -> $c"; bad=1; }
done
chk "7 images 200" $bad 0

txt=$(printf '%s' "$HTML" | grep -o 'wa.me/[^"]*' | grep -m1 'N%C2%B007' | python3 -c 'import sys,urllib.parse;print(urllib.parse.unquote(sys.stdin.read()))')
case "$txt" in *"N°07"*) echo "PASS 8 texte WhatsApp masque 07";; *) echo "FAIL 8 texte masque 07: '$txt'"; fail=1;; esac
exit $fail
