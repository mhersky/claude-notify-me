const fs = require('fs');
const path = require('path');
const os = require('os');

const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const SETTINGS_PATH = path.join(CLAUDE_DIR, 'settings.json');
const CLAUDE_MD_PATH = path.join(CLAUDE_DIR, 'CLAUDE.md');

function getScriptsDir() {
  const p = os.platform();
  if (p === 'win32') return path.join(__dirname, '..', 'scripts', 'windows');
  if (p === 'darwin') return path.join(__dirname, '..', 'scripts', 'macos');
  return path.join(__dirname, '..', 'scripts', 'linux');
}

function getHookCommands() {
  const p = os.platform();
  const home = os.homedir();

  if (p === 'win32') {
    const base = path.join(home, '.claude');
    return {
      SessionStart: `powershell -ExecutionPolicy Bypass -NonInteractive -File "${base}\\pick-voice.ps1"`,
      Notification: `powershell -ExecutionPolicy Bypass -NonInteractive -File "${base}\\notify.ps1"`,
      Stop: `powershell -ExecutionPolicy Bypass -NonInteractive -File "${base}\\announce-stop.ps1"`
    };
  }

  const base = path.join(home, '.claude');
  return {
    SessionStart: `bash "${base}/pick-voice.sh"`,
    Notification: `bash "${base}/notify.sh"`,
    Stop: `bash "${base}/announce-stop.sh"`
  };
}

function isClaudeVoiceHook(cmd = '') {
  return (
    cmd.includes('pick-voice') ||
    cmd.includes('notify.ps1') ||
    cmd.includes('notify.sh') ||
    cmd.includes('announce-stop')
  );
}

function install() {
  const p = os.platform();
  const ext = p === 'win32' ? '.ps1' : '.sh';
  const scriptsDir = getScriptsDir();

  fs.mkdirSync(CLAUDE_DIR, { recursive: true });

  // Copy hook scripts
  const UTF8_BOM = Buffer.from([0xEF, 0xBB, 0xBF]);
  for (const name of ['pick-voice', 'notify', 'announce-stop']) {
    const src = path.join(scriptsDir, `${name}${ext}`);
    const dst = path.join(CLAUDE_DIR, `${name}${ext}`);
    if (p === 'win32') {
      // Write PS1 files with UTF-8 BOM so PowerShell 5.1 reads them correctly
      const content = fs.readFileSync(src);
      fs.writeFileSync(dst, Buffer.concat([UTF8_BOM, content]));
    } else {
      fs.copyFileSync(src, dst);
      fs.chmodSync(dst, 0o755);
    }
    console.log(`  Copied ${name}${ext}`);
  }

  // Update settings.json
  let settings = {};
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      settings = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    }
  } catch {}

  if (!settings.hooks) settings.hooks = {};

  const cmds = getHookCommands();
  for (const event of ['SessionStart', 'Notification', 'Stop']) {
    if (!settings.hooks[event]) settings.hooks[event] = [];

    // Remove existing claude-notify-me hooks to avoid duplication
    settings.hooks[event] = settings.hooks[event].filter(
      group => !group.hooks?.some(h => isClaudeVoiceHook(h.command))
    );

    settings.hooks[event].push({
      hooks: [{ type: 'command', command: cmds[event] }]
    });
  }

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
  console.log('  Updated settings.json');

  // Append CLAUDE.md instructions if not already present
  const template = fs.readFileSync(
    path.join(__dirname, '..', 'templates', 'CLAUDE.md'),
    'utf8'
  );
  const marker = '<!-- claude-notify-me -->';
  let existing = '';
  try { existing = fs.readFileSync(CLAUDE_MD_PATH, 'utf8'); } catch {}

  if (!existing.includes(marker)) {
    fs.writeFileSync(CLAUDE_MD_PATH, existing + '\n' + template, 'utf8');
    console.log('  Updated CLAUDE.md');
  }

  console.log('\nclaude-notify-me installed successfully!');
  console.log('Start a new Claude Code session to pick your voice.\n');
}

module.exports = { install };
