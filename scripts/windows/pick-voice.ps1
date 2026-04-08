Add-Type -AssemblyName System.Speech

$configFile = "$env:USERPROFILE\.claude\claude-notify-me.json"

# Load config
$cfg = @{ voice = ""; speed = 1.0; volume = 100; muted = $false; customVoices = @() }
if (Test-Path $configFile) {
    try {
        $json = Get-Content $configFile -Raw | ConvertFrom-Json
        if ($json.voice)                  { $cfg.voice  = $json.voice }
        if ($null -ne $json.speed)        { $cfg.speed  = [double]$json.speed }
        if ($null -ne $json.volume)       { $cfg.volume = [int]$json.volume }
        if ($null -ne $json.muted)        { $cfg.muted  = [bool]$json.muted }
        if ($json.customVoices)           { $cfg.customVoices = @($json.customVoices) }
    } catch {}
}

if ($cfg.muted) { exit 0 }

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

function Invoke-Speak($text) {
    try {
        $synth.SelectVoice($cfg.voice)
        $synth.Volume = $cfg.volume
        $synth.Rate   = [int](($cfg.speed - 1.0) * 10)
        $synth.Speak($text)
    } catch {}
}

# If voice already configured: greet and exit
if ($cfg.voice -ne "") {
    Invoke-Speak "Ready."
    exit 0
}

# First run: build voice list (system + custom)
$systemVoices = @($synth.GetInstalledVoices() |
    Where-Object { $_.Enabled } |
    ForEach-Object { $_.VoiceInfo.Name })

$customOnly = @($cfg.customVoices | Where-Object { $_ -and ($_ -notin $systemVoices) })
$allVoices  = $systemVoices + $customOnly

Write-Host ""
Write-Host "Claude Voice — Choose your TTS voice:" -ForegroundColor Cyan
Write-Host ""

$i = 1
foreach ($v in $allVoices) {
    Write-Host "  $i. $v"
    $i++
}
Write-Host ""

$choice = Read-Host "Enter number (default: 1)"

$selected = if ($allVoices.Count -gt 0) { $allVoices[0] } else { "" }
if ($choice -match '^\d+$') {
    $idx = [int]$choice - 1
    if ($idx -ge 0 -and $idx -lt $allVoices.Count) {
        $selected = $allVoices[$idx]
    }
}

$cfg.voice = $selected

# Save
[PSCustomObject]@{
    voice        = $cfg.voice
    speed        = $cfg.speed
    volume       = $cfg.volume
    muted        = $cfg.muted
    customVoices = $cfg.customVoices
} | ConvertTo-Json | Set-Content -Path $configFile -Encoding UTF8

Invoke-Speak "Hi, I'm ready to assist you."
Write-Host "Voice set to: $selected" -ForegroundColor Green
