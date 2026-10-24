#!/bin/sh
# Builds the whole site into one file: public/index.html
#
# Usage:  sh build.sh [output-file]
#
# The Supabase settings are never written into the code. They come from
# environment variables:
#   SUPABASE_URL              https://your-project.supabase.co
#   SUPABASE_PUBLISHABLE_KEY  sb_publishable_...  (an older "anon" key also works,
#                             and so does the old name SUPABASE_ANON_KEY)
# On Vercel you set them in Project Settings > Environment Variables.
# On your own computer, put them in a file called .env (see .env.example).
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="${1:-$HERE/public/index.html}"
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT" ;; esac   # make a relative path absolute before moving into src/

# Local builds: read .env if there is one. Vercel provides the variables itself.
if [ -f "$HERE/.env" ]; then set -a; . "$HERE/.env"; set +a; fi
URL="${SUPABASE_URL:-}"
KEY="${SUPABASE_PUBLISHABLE_KEY:-${SUPABASE_ANON_KEY:-}}"

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  if [ -n "$VERCEL" ]; then
    echo "Build stopped: set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in Vercel (Project Settings > Environment Variables), then redeploy." >&2
    exit 1
  fi
  echo "Note: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is not set, so this build will say it is not connected to a database." >&2
fi
# Refuse secret keys: they skip all security, so they must never go into a website.
# New secret keys start with sb_secret_. Old ones are JWTs whose middle part says "service_role".
P=$(printf '%s' "$KEY" | cut -s -d. -f2 | tr '_-' '/+')
while [ $(( ${#P} % 4 )) -ne 0 ]; do P="$P="; done
ROLE=$(printf '%s' "$P" | base64 -d 2>/dev/null || true)
case "$KEY $ROLE" in sb_secret_*|*service_role*)
  echo "Build stopped: that is a SECRET key. Use the publishable key (or the anon key); a secret key must never go into a website." >&2
  exit 1 ;;
esac

mkdir -p "$(dirname "$OUT")"
cd "$HERE/src"
cat p1_head.html p2a_shell.html p2b_data.js p2f_partners.js p2c_i18n.js p2d_hi.js p2e_kn.js p3_state.js p3b_db.js p4_components.js p5_views.js p5b_fx.js p5c_play.js p5d_scroll.js p5e_pages.js p5f_tools.js p5g_vault.js p5h_ads.js p5i_polish.js p6_router.js \
  | sed -e "s|%%SUPABASE_URL%%|${URL:-%%SUPABASE_URL%%}|g" -e "s|%%SUPABASE_KEY%%|${KEY:-%%SUPABASE_KEY%%}|g" > "$OUT"
echo "Built $OUT ($(wc -l < "$OUT" | tr -d ' ') lines)"
