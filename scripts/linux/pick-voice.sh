#!/usr/bin/env bash
# pick-voice.sh — SessionStart hook (Linux)

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

speak() {
  local rate
  rate=$(python3 -c "print(int(175 * $SPEED))" 2>/dev/null || echo "175")
  if command -v espeak-ng &>/dev/null; then
    espeak-ng ${VOICE:+-v "$VOICE"} -s "$rate" "$1" 2>/dev/null
  elif command -v espeak &>/dev/null; then
    espeak ${VOICE:+-v "$VOICE"} -s "$rate" "$1" 2>/dev/null
  elif command -v festival &>/dev/null; then
    echo "$1" | festival --tts 2>/dev/null
  fi
}

# If voice already configured, greet and exit
if [ -n "$VOICE" ]; then
  speak "Ready." &
  exit 0
fi

# First run: build voice list
echo ""
echo "claude-notify-me — Choose your TTS voice:"
echo ""

voices=()
if command -v espeak-ng &>/dev/null; then
  while IFS= read -r line; do
    name=$(echo "$line" | awk '{print $4}')
    [ -z "$name" ] || [ "$name" = "VoiceName" ] && continue
    voices+=("$name")
  done < <(espeak-ng --voices 2>/dev/null | tail -n +2)
elif command -v espeak &>/dev/null; then
  while IFS= read -r line; do
    name=$(echo "$line" | awk '{print $4}')
    [ -z "$name" ] || [ "$name" = "VoiceName" ] && continue
    voices+=("$name")
  done < <(espeak --voices 2>/dev/null | tail -n +2)
fi

# Append custom voices not already in the system list
CUSTOM_VOICES=$(CNM_CONFIG="$CONFIG" python3 - <<'PYEOF'
import json, os
try:
    d = json.load(open(os.environ['CNM_CONFIG']))
    print('\n'.join(d.get('customVoices', [])))
except:
    pass
PYEOF
)

if [ -n "$CUSTOM_VOICES" ]; then
  while IFS= read -r cv; do
    [ -z "$cv" ] && continue
    already=false
    for sv in "${voices[@]}"; do [ "$sv" = "$cv" ] && already=true && break; done
    if [ "$already" = "false" ]; then
      voices+=("$cv")
    fi
  done <<< "$CUSTOM_VOICES"
fi

if [ ${#voices[@]} -eq 0 ]; then
  echo "  (no espeak-ng voices found — install espeak-ng for voice selection)"
  echo "  Using system default."
  SELECTED="en"
else
  i=1
  for v in "${voices[@]}"; do
    echo "  $i. $v"
    ((i++))
  done
  echo ""
  read -r -p "Enter number (default: 1): " CHOICE

  SELECTED="${voices[0]}"
  if [[ "$CHOICE" =~ ^[0-9]+$ ]] && [ "$CHOICE" -ge 1 ] && [ "$CHOICE" -le "${#voices[@]}" ]; then
    SELECTED="${voices[$((CHOICE-1))]}"
  fi
fi

# Save config — pass values via env vars to avoid heredoc injection
SELECTED_VOICE="$SELECTED" CNM_CONFIG="$CONFIG" python3 - <<'PYEOF'
import json, os
path = os.environ['CNM_CONFIG']
selected = os.environ['SELECTED_VOICE']
cfg = {}
if os.path.exists(path):
    try:
        with open(path) as f:
            cfg = json.load(f)
    except:
        pass
cfg['voice'] = selected
cfg.setdefault('speed', 1.0)
cfg.setdefault('volume', 100)
cfg.setdefault('muted', False)
cfg.setdefault('customVoices', [])
with open(path, 'w') as f:
    json.dump(cfg, f, indent=2)
PYEOF

VOICE="$SELECTED"
speak "Hi, I'm ready to assist you."
echo "Voice set to: $SELECTED"
