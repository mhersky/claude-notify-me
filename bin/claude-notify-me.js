#!/usr/bin/env node

const { install } = require('../lib/installer');
const { uninstall } = require('../lib/uninstaller');
const { listVoices, addVoice, removeVoice, testVoice } = require('../lib/voices');
const { readConfig, writeConfig } = require('../lib/config');

const [,, cmd, ...args] = process.argv;

function main() {
  switch (cmd) {
    case 'install':
      install();
      break;

    case 'uninstall':
      uninstall();
      break;

    case 'list-voices':
      listVoices();
      break;

    case 'add-voice': {
      const name = args.join(' ').trim();
      if (!name) { console.error('Usage: claude-notify-me add-voice <voice-name>'); process.exit(1); }
      addVoice(name);
      break;
    }

    case 'remove-voice': {
      const name = args.join(' ').trim();
      if (!name) { console.error('Usage: claude-notify-me remove-voice <voice-name>'); process.exit(1); }
      removeVoice(name);
      break;
    }

    case 'set-voice': {
      const name = args.join(' ').trim();
      if (!name) { console.error('Usage: claude-notify-me set-voice <voice-name>'); process.exit(1); }
      const cfg = readConfig();
      cfg.voice = name;
      writeConfig(cfg);
      console.log(`Voice set to: "${name}"`);
      break;
    }

    case 'set-speed': {
      const speed = parseFloat(args[0]);
      if (isNaN(speed) || speed < 0.5 || speed > 3.0) {
        console.error('Usage: claude-notify-me set-speed <0.5–3.0>  (1.0 = normal)');
        process.exit(1);
      }
      const cfg = readConfig();
      cfg.speed = speed;
      writeConfig(cfg);
      console.log(`Speed set to: ${speed}`);
      break;
    }

    case 'set-volume': {
      const vol = parseInt(args[0], 10);
      if (isNaN(vol) || vol < 0 || vol > 100) {
        console.error('Usage: claude-notify-me set-volume <0–100>');
        process.exit(1);
      }
      const cfg = readConfig();
      cfg.volume = vol;
      writeConfig(cfg);
      console.log(`Volume set to: ${vol}`);
      break;
    }

    case 'mute': {
      const cfg = readConfig();
      cfg.muted = true;
      writeConfig(cfg);
      console.log('Voice muted.');
      break;
    }

    case 'unmute': {
      const cfg = readConfig();
      cfg.muted = false;
      writeConfig(cfg);
      console.log('Voice unmuted.');
      break;
    }

    case 'enable-questions': {
      const cfg = readConfig();
      cfg.notifyOnQuestion = true;
      writeConfig(cfg);
      console.log('Question notifications enabled. Claude will announce when it needs your input.');
      break;
    }

    case 'disable-questions': {
      const cfg = readConfig();
      cfg.notifyOnQuestion = false;
      writeConfig(cfg);
      console.log('Question notifications disabled. Only completed work will be announced.');
      break;
    }

    case 'test':
      testVoice();
      break;

    case 'status': {
      const cfg = readConfig();
      console.log('\nclaude-notify-me status:');
      console.log(`  Voice:     ${cfg.voice || '(not set)'}`);
      console.log(`  Speed:     ${cfg.speed}`);
      console.log(`  Volume:    ${cfg.volume}`);
      console.log(`  Muted:     ${cfg.muted}`);
      console.log(`  Questions: ${cfg.notifyOnQuestion ? 'enabled' : 'disabled'}`);
      if (cfg.customVoices?.length) {
        console.log(`  Custom:    ${cfg.customVoices.join(', ')}`);
      }
      console.log();
      break;
    }

    default:
      printHelp();
  }
}

function printHelp() {
  console.log(`
claude-notify-me — Voice notifications for Claude Code

Usage: claude-notify-me <command> [args]

Setup:
  install                   Install plugin and configure hooks
  uninstall                 Remove plugin and hooks

Voice selection:
  list-voices               List all available TTS voices
  set-voice <name>          Set the active voice by name
  add-voice <name>          Add a custom voice to your list
  remove-voice <name>       Remove a custom voice from your list

Settings:
  set-speed <0.5–3.0>       Speech speed  (1.0 = normal)
  set-volume <0–100>        Volume level
  mute                      Mute all voice notifications
  unmute                    Unmute voice notifications
  enable-questions          Also announce when Claude asks a question
  disable-questions         Only announce completed work  (default)

Utilities:
  status                    Show current configuration
  test                      Speak a test phrase with current settings
`);
}

main();
