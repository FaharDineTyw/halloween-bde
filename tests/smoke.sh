#!/usr/bin/env bash
# Smoke test: needs site on $URL and headless Brave. Usage: tests/smoke.sh
URL=${URL:-http://localhost:8731}
BRAVE=$(command -v brave-browser brave brave-browser-stable | head -1)
fail=0
chk() { if [ "$2" = "$3" ]; then echo "PASS $1 ($2)"; else echo "FAIL $1: got '$2', want '$3'"; fail=1; fi; }
DOM=$("$BRAVE" --headless=new --disable-gpu --dump-dom "$URL/" 2>/dev/null)
cnt() { printf '%s' "$DOM" | grep -o "$1" | wc -l; }

chk "1 fiches" "$(cnt 'class="fiche" data-style="[a-z]')" 23
chk "2a wa links in fiches" "$(cnt 'class="wa" href="https://wa.me/2290169062340?text=')" 23
chk "2b wa-general href" "$(printf '%s' "$DOM" | grep -c 'id="wa-general"[^>]*href="https://wa.me/\|href="https://wa.me/[^"]*"[^>]*id="wa-general"')" 1
chk "3a filter buttons" "$(cnt 'data-filtre=')" 6
chk "3b jason fiches" "$(cnt 'data-style="jason"')" 6
chk "3c jason price" "$(cnt '"prix">1 650 FCFA')" 6
chk "3d other price" "$(cnt '"prix">3 750 FCFA')" 17

bad=0
for f in assets/affiche.jpeg assets/affiche.webp assets/logo-bde.svg $(seq -f 'assets/masques/masque-%02g.webp' 1 23); do
  c=$(curl -s -o /dev/null -w '%{http_code}' "$URL/$f"); [ "$c" = 200 ] || { echo "  $f -> $c"; bad=1; }
done
chk "4 assets 200" $bad 0

txt=$(printf '%s' "$DOM" | grep -o 'wa.me/[^"]*' | grep -m1 'N%C2%B007\|N°07' | python3 -c 'import sys,urllib.parse;print(urllib.parse.unquote(sys.stdin.read()))')
case "$txt" in *"N°07"*) echo "PASS 5 mask 07 text";; *) echo "FAIL 5 mask 07 text: '$txt'"; fail=1;; esac
exit $fail
