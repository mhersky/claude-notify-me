#!/usr/bin/env bash
# notify.sh — Notification hook (Linux)

CONFIG="$HOME/.claude/claude-notify-me.json"

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

VOICE=$(read_cfg voice "")
SPEED=$(read_cfg speed 1.0)
NOTIFY_ON_QUESTION=$(read_cfg notifyOnQuestion false)

# Read stdin JSON
INPUT=$(cat)

# Parse message via env var — avoids shell injection through $INPUT
RESULT=$(NOTIFY_INPUT="$INPUT" NOTIFY_ON_Q="$NOTIFY_ON_QUESTION" python3 - <<'PYEOF'
import json, sys, os

raw = os.environ.get('NOTIFY_INPUT', '')
notify_on_question = os.environ.get('NOTIFY_ON_Q', 'false').lower() in ('true',)

try:
    d = json.loads(raw)
    msg = d.get('message') or d.get('title') or ''
except Exception:
    sys.exit(0)

if not msg:
    sys.exit(0)

question_patterns = [
    'waiting for', 'idle', 'ready for input', 'need your input',
    'please confirm', 'should i ', 'would you', 'can you',
    'do you want', 'need clarification'
]
is_question = msg.endswith('?') or any(p in msg.lower() for p in question_patterns)

if is_question and not notify_on_question:
    sys.exit(0)

prefix = 'ASK' if is_question else 'DONE'
print(prefix + ':' + msg)
PYEOF
)

[ -z "$RESULT" ] && exit 0

TYPE="${RESULT%%:*}"
MESSAGE="${RESULT#*:}"

if [ "$TYPE" = "ASK" ]; then
  TEXT="Claude is asking: $MESSAGE"
else
  TEXT="$MESSAGE. Done."
fi

RATE=$(python3 -c "print(int(175 * $SPEED))" 2>/dev/null || echo "175")

if command -v espeak-ng &>/dev/null; then
  espeak-ng ${VOICE:+-v "$VOICE"} -s "$RATE" "$TEXT" 2>/dev/null
elif command -v espeak &>/dev/null; then
  espeak ${VOICE:+-v "$VOICE"} -s "$RATE" "$TEXT" 2>/dev/null
elif command -v festival &>/dev/null; then
  echo "$TEXT" | festival --tts 2>/dev/null
fi
