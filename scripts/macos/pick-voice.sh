#!/usr/bin/env bash
# pick-voice.sh — SessionStart hook (macOS)

CONFIG="$HOME/.claude/claude-notify-me.json"

read_cfg() {
  python3 -c "
import json, sys
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
  if [ -n "$VOICE" ]; then
    say -v "$VOICE" -r "$rate" "$1" 2>/dev/null || say "$1"
  else
    say -r "$rate" "$1" 2>/dev/null || say "$1"
  fi
}

# If voice already configured, greet and exit
if [ -n "$VOICE" ]; then
  speak "Ready." &
  exit 0
fi

# First run: list all available voices
echo ""
echo "Claude Voice — Choose your TTS voice:"
echo ""

# Collect voices into indexed array
i=1
voices=()
while IFS= read -r line; do
  name=$(echo "$line" | awk '{print $1}')
  [ -z "$name" ] && continue
  voices+=("$name")
  echo "  $i. $name"
  ((i++))
done < <(say -v ? 2>/dev/null | sort)

# Also show custom voices not in system list
CUSTOM=$(python3 -c "
import json
try:
  d = json.load(open('$CONFIG'))
  print('\n'.join(d.get('customVoices', [])))
except:
  pass
" 2>/dev/null)

if [ -n "$CUSTOM" ]; then
  echo ""
  echo "  Custom voices:"
  while IFS= read -r cv; do
    [ -z "$cv" ] && continue
    # Only show if not already in system list
    found=false
    for sv in "${voices[@]}"; do
      [ "$sv" = "$cv" ] && found=true && break
    done
    if [ "$found" = "false" ]; then
      echo "  $i. $cv (custom)"
      voices+=("$cv")
      ((i++))
    fi
  done <<< "$CUSTOM"
fi

echo ""
read -r -p "Enter number (default: 1): " CHOICE

SELECTED="${voices[0]}"
if [[ "$CHOICE" =~ ^[0-9]+$ ]] && [ "$CHOICE" -ge 1 ] && [ "$CHOICE" -le "${#voices[@]}" ]; then
  SELECTED="${voices[$((CHOICE-1))]}"
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
