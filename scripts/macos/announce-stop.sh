#!/usr/bin/env bash
# announce-stop.sh — Stop hook (macOS)

CONFIG="$HOME/.claude/claude-notify-me.json"
ACTIVITY="$HOME/.claude/last-activity.txt"

read_cfg() {
  python3 -c "
import json
try:
  d = json.load(open('$CONFIG'))
  print(d.get('$1', '$2'))
except:
  print('$2')
" 2>/dev/null || echo "$2"
}

MUTED=$(read_cfg muted false)
[ "$MUTED" = "True" ] || [ "$MUTED" = "true" ] && exit 0

# Consume stdin (required by Stop hook)
cat > /dev/null

[ ! -f "$ACTIVITY" ] && exit 0
TEXT=$(cat "$ACTIVITY" | tr -d '\n' | xargs)
[ -z "$TEXT" ] && exit 0

# Clear file to prevent repeats
: > "$ACTIVITY"

# Truncate long messages
if [ "${#TEXT}" -gt 200 ]; then
  TEXT="Task complete."
else
  TEXT="$TEXT. Done."
fi

VOICE=$(read_cfg voice "")
SPEED=$(read_cfg speed 1.0)
RATE=$(python3 -c "print(int(175 * $SPEED))" 2>/dev/null || echo "175")

if [ -n "$VOICE" ]; then
  say -v "$VOICE" -r "$RATE" "$TEXT" 2>/dev/null || say "$TEXT"
else
  say -r "$RATE" "$TEXT"
fi
