<!-- claude-notify-me -->
## claude-notify-me Plugin

Voice notifications are active. After completing a **substantial task** (code changes, file operations, builds, research), write a brief description to `~/.claude/last-activity.txt` using the **Write tool** (not Bash):

1. First **Read** `~/.claude/last-activity.txt` (required before Write; file always exists with a default value)
2. Then **Write** with:
   - file_path: full expanded path to `~/.claude/last-activity.txt`
   - content: `short description of what was done` (no trailing newline needed)

The Stop hook will read it and speak it aloud. Keep descriptions under 200 characters. Do **not** write for simple text replies, questions, or short answers.

### Voice commands (handle immediately):
- **"quiet"** or **"mute"** → Run: `claude-notify-me mute`
- **"unmute"** or **"voice on"** → Run: `claude-notify-me unmute`
- **"change voice"** → Run: `claude-notify-me list-voices`, then suggest: `claude-notify-me set-voice <name>`
- **"set speed X"** → Run: `claude-notify-me set-speed <0.5-3.0>`
- **"set volume X"** → Run: `claude-notify-me set-volume <0-100>`
- **"notify questions"** or **"announce questions"** → Run: `claude-notify-me enable-questions`
- **"done only"** or **"disable questions"** → Run: `claude-notify-me disable-questions`
<!-- /claude-notify-me -->
