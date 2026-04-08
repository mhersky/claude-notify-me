const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const CLAUDE_MD_PATH = path.join(CLAUDE_DIR, 'CLAUDE.md');

function isClaudeVoiceHook(cmd = '') {
  return (
    cmd.includes('pick-voice') ||
    cmd.includes('notify.ps1') ||
    cmd.includes('notify.sh') ||
    cmd.includes('announce-stop')
  );
}

function uninstall() {
  const p = os.platform();
  const ext = p === 'win32' ? '.ps1' : '.sh';

  // Remove hook scripts
  for (const name of ['pick-voice', 'notify', 'announce-stop']) {
    const f = path.join(CLAUDE_DIR, `${name}${ext}`);
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`  Removed ${name}${ext}`);
    }
  }

  // Remove config
  const cfg = path.join(CLAUDE_DIR, 'claude-notify-me.json');
  if (fs.existsSync(cfg)) {
    fs.unlinkSync(cfg);
    console.log('  Removed claude-notify-me.json');
  }

  // Remove last-activity.txt
  const activity = path.join(CLAUDE_DIR, 'last-activity.txt');
  if (fs.existsSync(activity)) {
    fs.unlinkSync(activity);
    console.log('  Removed last-activity.txt');
  }

  // Clean settings.json
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      let settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
      if (settings.hooks) {
        for (const event of ['SessionStart', 'Notification', 'Stop']) {
          if (settings.hooks[event]) {
            settings.hooks[event] = settings.hooks[event].filter(
              group => !group.hooks?.some(h => isClaudeVoiceHook(h.command))
            );
            if (settings.hooks[event].length === 0) delete settings.hooks[event];
          }
        }
        if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
      }
      fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
      console.log('  Cleaned settings.json');
    }
  } catch (e) {
    console.warn('  Warning: Could not clean settings.json:', e.message);
  }

  // Remove claude-notify-me block from CLAUDE.md
  try {
    if (fs.existsSync(CLAUDE_MD_PATH)) {
      let md = fs.readFileSync(CLAUDE_MD_PATH, 'utf8');
      md = md.replace(/\n?<!-- claude-notify-me -->[\s\S]*?<!-- \/claude-notify-me -->\n?/g, '');
      // Collapse any triple+ blank lines left behind, preserving the rest of the user's file
      md = md.replace(/\n{3,}/g, '\n\n');
      if (md.trim().length > 0) {
        fs.writeFileSync(CLAUDE_MD_PATH, md.trimEnd() + '\n', 'utf8');
      } else {
        // File only contained the plugin block — leave it empty rather than deleting
        fs.writeFileSync(CLAUDE_MD_PATH, '', 'utf8');
      }
      console.log('  Cleaned CLAUDE.md');
    }
  } catch {}

  console.log('\nclaude-notify-me uninstalled.\n');
}

module.exports = { uninstall };
