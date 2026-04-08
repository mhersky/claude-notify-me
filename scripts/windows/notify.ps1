Add-Type -AssemblyName System.Speech

$configFile = "$env:USERPROFILE\.claude\claude-notify-me.json"
$cfg = @{ voice = ""; speed = 1.0; volume = 100; muted = $false; notifyOnQuestion = $false }

if (Test-Path $configFile) {
    try {
        $json = Get-Content $configFile -Raw | ConvertFrom-Json
        if ($json.voice)                       { $cfg.voice            = $json.voice }
        if ($null -ne $json.speed)             { $cfg.speed            = [double]$json.speed }
        if ($null -ne $json.volume)            { $cfg.volume           = [int]$json.volume }
        if ($null -ne $json.muted)             { $cfg.muted            = [bool]$json.muted }
        if ($null -ne $json.notifyOnQuestion)  { $cfg.notifyOnQuestion = [bool]$json.notifyOnQuestion }
    } catch {}
}

if ($cfg.muted) { exit 0 }

# Read stdin JSON from Claude Code
$input_json = ""
try { $input_json = [Console]::In.ReadToEnd() } catch {}

$message = ""
if ($input_json) {
    try {
        $data = $input_json | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($data.message)   { $message = $data.message }
        elseif ($data.title) { $message = $data.title }
    } catch {}
}

if ([string]::IsNullOrEmpty($message)) { exit 0 }

# Detect whether this is a question / waiting-for-input notification
$questionPatterns = "waiting for|idle|ready for input|need your input|please confirm|should i |would you|can you|do you want|need clarification|\?"
$isQuestion = $message -match $questionPatterns

if ($isQuestion -and -not $cfg.notifyOnQuestion) { exit 0 }

$text = if ($isQuestion) { "Claude is asking: $message" } else { "$message. Done." }

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    if ($cfg.voice) { $synth.SelectVoice($cfg.voice) }
    $synth.Volume = $cfg.volume
    $synth.Rate   = [int](($cfg.speed - 1.0) * 10)
    $synth.Speak($text)
} catch {}
