const { execSync, execFileSync } = require('child_process');
const os = require('os');
const { readConfig, writeConfig } = require('./config');

function getSystemVoices() {
  const p = os.platform();
  try {
    if (p === 'win32') {
      const out = execSync(
        'powershell -NonInteractive -Command "Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.GetInstalledVoices() | Where-Object { $_.Enabled } | ForEach-Object { $_.VoiceInfo.Name }"',
        { encoding: 'utf8', timeout: 10000 }
      );
      return out.trim().split(/\r?\n/).filter(Boolean);
    }

    if (p === 'darwin') {
      const out = execFileSync('say', ['-v', '?'], { encoding: 'utf8', timeout: 10000 });
      return [...new Set(
        out.trim().split(/\r?\n/).map(l => l.split(/\s+/)[0]).filter(Boolean)
      )];
    }

    // Linux — no user input, shell:true needed for ||
    const out = execSync(
      'espeak-ng --voices 2>/dev/null || espeak --voices 2>/dev/null',
      { encoding: 'utf8', timeout: 10000, shell: true }
    );
    return out.trim().split(/\r?\n/).slice(1)
      .map(l => l.trim().split(/\s+/)[3])
      .filter(Boolean);
  } catch {
    return [];
  }
}

function listVoices() {
  const cfg = readConfig();
  const systemVoices = getSystemVoices();
  const customVoices = (cfg.customVoices || []).filter(v => !systemVoices.includes(v));

  console.log('\nSystem voices:');
  if (systemVoices.length === 0) {
    console.log('  (none detected)');
  } else {
    systemVoices.forEach((v, i) => {
      const tag = v === cfg.voice ? ' <- current' : '';
      console.log(`  ${i + 1}. ${v}${tag}`);
    });
  }

  if (customVoices.length > 0) {
    console.log('\nCustom voices:');
    customVoices.forEach((v, i) => {
      const tag = v === cfg.voice ? ' <- current' : '';
      console.log(`  ${i + 1}. ${v}${tag}`);
    });
  }

  console.log();
}

function addVoice(name) {
  const cfg = readConfig();
  if (!cfg.customVoices) cfg.customVoices = [];
  if (cfg.customVoices.includes(name)) {
    console.log(`"${name}" is already in your custom voice list.`);
    return;
  }
  cfg.customVoices.push(name);
  writeConfig(cfg);
  console.log(`Added custom voice: "${name}"`);
  console.log(`Run "claude-notify-me set-voice ${name}" to use it.`);
}

function removeVoice(name) {
  const cfg = readConfig();
  if (!cfg.customVoices) cfg.customVoices = [];
  const idx = cfg.customVoices.indexOf(name);
  if (idx === -1) {
    console.log(`"${name}" not found in custom voice list.`);
    return;
  }
  cfg.customVoices.splice(idx, 1);
  writeConfig(cfg);
  console.log(`Removed custom voice: "${name}"`);
}

function testVoice() {
  const cfg = readConfig();
  const p = os.platform();
  const phrase = 'claude-notify-me is working correctly.';

  if (!cfg.voice) {
    console.error('No voice configured. Run: claude-notify-me install');
    process.exit(1);
  }

  console.log(`Testing voice: "${cfg.voice}"...`);

  try {
    if (p === 'win32') {
      const rate = Math.round((cfg.speed - 1.0) * 10);
      // Pass voice and phrase via env vars to avoid PowerShell injection
      // try/catch with explicit exit codes so Node sees failures
      execSync(
        `powershell -NonInteractive -Command "try { Add-Type -AssemblyName System.Speech; $s = New-Object System.Speech.Synthesis.SpeechSynthesizer; $s.SelectVoice($env:CNM_VOICE); $s.Volume = ${cfg.volume}; $s.Rate = ${rate}; $s.Speak($env:CNM_PHRASE); exit 0 } catch { Write-Error $_; exit 1 }"`,
        {
          stdio: 'inherit',
          timeout: 15000,
          env: { ...process.env, CNM_VOICE: cfg.voice, CNM_PHRASE: phrase }
        }
      );
    } else if (p === 'darwin') {
      const rate = Math.round(175 * cfg.speed);
      // execFileSync avoids shell entirely — no injection possible
      execFileSync('say', ['-v', cfg.voice, '-r', String(rate), phrase], { stdio: 'inherit', timeout: 15000 });
    } else {
      const speed = Math.round(175 * cfg.speed);
      // execFileSync avoids shell entirely — no injection possible
      try {
        execFileSync('espeak-ng', ['-v', cfg.voice, '-s', String(speed), phrase], { stdio: 'inherit', timeout: 15000 });
      } catch {
        try {
          execFileSync('espeak', ['-v', cfg.voice, '-s', String(speed), phrase], { stdio: 'inherit', timeout: 15000 });
        } catch {
          execFileSync('festival', ['--tts'], {
            input: phrase,
            stdio: ['pipe', 'inherit', 'inherit'],
            timeout: 15000
          });
        }
      }
    }
  } catch (e) {
    console.error(`TTS failed: ${e.message}`);
    process.exit(1);
  }
}

module.exports = { listVoices, addVoice, removeVoice, testVoice, getSystemVoices };
