# claude-notify-me

Voice notifications for [Claude Code](https://claude.ai/code). Hear when tasks complete — hands-free awareness while you context switch.

Works on **Windows, macOS, and Linux** using each platform's built-in TTS engine. No API keys. No external services.

## Install

```bash
npx claude-notify-me install
```

Start a new Claude Code session and pick your voice.

## Features

- Speaks task summaries aloud when Claude finishes a session
- Announces notifications as they arrive
- Picks your voice on first launch, remembers it forever
- All system TTS voices supported — not just the defaults
- Add custom voices by name
- Control speed, volume, and mute — from the terminal
- Optional: announce when Claude is asking a question

## Commands

```
claude-notify-me install                  Install and configure hooks
claude-notify-me uninstall                Remove plugin and hooks

claude-notify-me list-voices              List all available TTS voices
claude-notify-me set-voice <name>         Set the active voice
claude-notify-me add-voice <name>         Add a custom voice by system name
claude-notify-me remove-voice <name>      Remove a custom voice

claude-notify-me set-speed <0.5–3.0>      Speech speed  (1.0 = normal)
claude-notify-me set-volume <0–100>       Volume level
claude-notify-me mute                     Mute all notifications
claude-notify-me unmute                   Unmute notifications
claude-notify-me enable-questions         Also announce when Claude asks a question
claude-notify-me disable-questions        Only announce completed work  (default)

claude-notify-me status                   Show current settings
claude-notify-me test                     Play a test phrase
```

## How it works

Three Claude Code hooks are registered in `~/.claude/settings.json`:

| Hook | Script | Action |
|------|--------|--------|
| `SessionStart` | `pick-voice` | Greets you; prompts for voice on first run |
| `Notification` | `notify` | Speaks incoming notification messages |
| `Stop` | `announce-stop` | Reads `~/.claude/last-activity.txt` aloud |

Claude writes a short summary to `last-activity.txt` after substantial tasks. The Stop hook speaks it when the session ends.

## Platform requirements

| Platform | TTS engine |
|----------|-----------|
| Windows 10/11 | `System.Speech` (built-in, no install needed) |
| macOS | `say` (built-in, no install needed) |
| Linux | `espeak-ng` — install with `sudo apt install espeak-ng` |

## Adding custom voices

Any voice installed on your system can be used:

```bash
# See what's available
claude-notify-me list-voices

# Add a voice not shown by default
claude-notify-me add-voice "Microsoft Hazel Desktop"

# Switch to it
claude-notify-me set-voice "Microsoft Hazel Desktop"
```

**Windows:** Install additional voices via Settings → Time & Language → Speech → Add voices.

**macOS:** Add voices via System Settings → Accessibility → Spoken Content → System Voice → Manage Voices.

**Linux:** Install additional espeak-ng voice packs via your package manager.

## Voice commands

Tell Claude directly during a session:

- *"quiet"* — mutes voice
- *"unmute"* — restores voice
- *"change voice"* — lists voices and switches
- *"set speed 1.5"* — changes speech rate
- *"set volume 80"* — changes volume
- *"notify questions"* — also announce when Claude needs input
- *"done only"* — back to announcing completed work only

## License

MIT © [mhersky](https://github.com/mhersky)
