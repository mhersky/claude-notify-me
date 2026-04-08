Add-Type -AssemblyName System.Speech

$configFile    = "$env:USERPROFILE\.claude\claude-notify-me.json"
$activityFile  = "$env:USERPROFILE\.claude\last-activity.txt"

$cfg = @{ voice = ""; speed = 1.0; volume = 100; muted = $false }

if (Test-Path $configFile) {
    try {
        $json = Get-Content $configFile -Raw | ConvertFrom-Json
        if ($json.voice)           { $cfg.voice  = $json.voice }
        if ($null -ne $json.speed) { $cfg.speed  = [double]$json.speed }
        if ($null -ne $json.volume){ $cfg.volume = [int]$json.volume }
        if ($null -ne $json.muted) { $cfg.muted  = [bool]$json.muted }
    } catch {}
}

if ($cfg.muted) { exit 0 }

# Consume stdin (required by Stop hook)
try { $null = [Console]::In.ReadToEnd() } catch {}

if (-not (Test-Path $activityFile)) { exit 0 }

$activity = (Get-Content $activityFile -Raw).Trim()
if ($activity.Length -eq 0) { exit 0 }

# Clear file to prevent repeats
Set-Content -Path $activityFile -Value "" -NoNewline

$text  = if ($activity.Length -le 200) { "$activity. Done." } else { "Task complete." }
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    if ($cfg.voice) { $synth.SelectVoice($cfg.voice) }
    $synth.Volume = $cfg.volume
    $synth.Rate   = [int](($cfg.speed - 1.0) * 10)
    $synth.Speak($text)
} catch {}
