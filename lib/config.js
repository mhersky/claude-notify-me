const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_PATH = path.join(os.homedir(), '.claude', 'claude-notify-me.json');

const DEFAULTS = {
  voice: '',
  speed: 1.0,
  volume: 100,
  muted: false,
  notifyOnQuestion: false,
  customVoices: []
};

function readConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) };
    }
  } catch (e) {
    console.warn(`Warning: Could not read config (${e.message}). Using defaults.`);
  }
  return { ...DEFAULTS };
}

function writeConfig(cfg) {
  fs.mkdirSync(path.dirname(CONFIG_PATH), { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), 'utf8');
}

module.exports = { readConfig, writeConfig, CONFIG_PATH };
