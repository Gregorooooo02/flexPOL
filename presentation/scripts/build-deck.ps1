$ErrorActionPreference = 'Stop'

$Root     = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Assets   = Join-Path $Root 'assets'
$Teammate = Join-Path $Assets 'teammate'
$Preview  = Join-Path $Root 'preview'
$OutPptx  = Join-Path $Root 'HedgeFlex-Pitch-Deck-v4.pptx'

New-Item -ItemType Directory -Force -Path $Preview | Out-Null

$GlbPath  = Join-Path $Assets 'hedgie.glb'
$HaloPath = Join-Path $Assets 'hedgie-halo.png'
$QrPath   = Join-Path $Assets 'qr-live.png'
$MemePath = Join-Path $Assets 'hedgie-meme.jpg'

$IconLearner  = Join-Path $Teammate 'icon-learner.png'
$IconCloud    = Join-Path $Teammate 'icon-cloud.png'
$IconLessons  = Join-Path $Teammate 'icon-lessons.png'
$IconSim      = Join-Path $Teammate 'icon-sim.png'
$IconCoach    = Join-Path $Teammate 'icon-coach.png'
$IconSupabase = Join-Path $Teammate 'icon-supabase.png'
$IconOpenAI   = Join-Path $Teammate 'icon-openai.png'
$IconShip     = Join-Path $Teammate 'icon-ship.png'
$IconArrow    = Join-Path $Teammate 'icon-arrow.png'

foreach ($req in @($GlbPath, $HaloPath, $QrPath, $MemePath, $IconLearner, $IconCloud, $IconLessons, $IconSim, $IconCoach, $IconSupabase, $IconOpenAI, $IconShip, $IconArrow)) {
  if (-not (Test-Path $req)) {
    throw "Required asset missing: $req"
  }
}

Add-Type -AssemblyName System.Drawing

# Color tokens (Crisp Editorial Light — HedgeFlex Brand)
$C_BG_LIGHT     = '#F7F8F8'
$C_BG_CREAM     = '#FFFDF5'
$C_CARD         = '#FFFFFF'
$C_BORDER       = '#DDE1E2'
$C_BORDER_SOFT  = '#E4E8E9'
$C_INK          = '#0D1112'
$C_MUTED        = '#525C5E'
$C_GOLD         = '#EFB100'
$C_GOLD_BRIGHT  = '#FFD22E'
$C_GOLD_DARK    = '#7A4F00'
$C_GOLD_WASH    = '#FDF1C7'
$C_AMBER        = '#FE9900'
$C_AMBER_DARK   = '#9A4600'
$C_COPPER       = '#BA4D00'
$C_COPPER_DARK  = '#8A3600'
$C_GAIN         = '#15803D'
$C_LOSS         = '#DC2626'
$C_OBSIDIAN     = '#0D1112'
$C_OBSIDIAN_TXT = '#FAFBFB'
$C_OBSIDIAN_SUB = '#A3ACAD'
$C_TRACK        = '#E4E8E9'

$FONT_DISPLAY = 'Bahnschrift SemiBold'
$FONT_BODY    = 'Segoe UI Variable Text'
$FONT_MONO    = 'JetBrains Mono'

function HexColor([string]$hex) {
  $h = $hex.TrimStart('#')
  $r = [Convert]::ToInt32($h.Substring(0, 2), 16)
  $g = [Convert]::ToInt32($h.Substring(2, 2), 16)
  $b = [Convert]::ToInt32($h.Substring(4, 2), 16)
  return ($r + ($g * 256) + ($b * 65536))
}

function Set-SlideBackground($slide, [string]$hex) {
  $slide.FollowMasterBackground = 0
  $slide.Background.Fill.Solid()
  $slide.Background.Fill.ForeColor.RGB = HexColor $hex
}

function Set-Morph($slide, [double]$duration = 0.90) {
  $slide.SlideShowTransition.EntryEffect = 3954 # ppEffectMorphByObject
  $slide.SlideShowTransition.Duration = $duration
}

function Add-Rect {
  param(
    $Slide,
    [double]$X, [double]$Y, [double]$W, [double]$H,
    [string]$FillHex,
    [string]$BorderHex = '',
    [double]$BorderPt = 1.0,
    [bool]$Rounded = $false,
    [double]$CornerRadius = 0.08,
    [string]$Name = ''
  )
  $shapeType = if ($Rounded) { 5 } else { 1 }
  $shp = $Slide.Shapes.AddShape($shapeType, $X, $Y, $W, $H)
  if ($Rounded) {
    $shp.Adjustments.Item(1) = $CornerRadius
  }
  $shp.Fill.Solid()
  $shp.Fill.ForeColor.RGB = HexColor $FillHex
  if ([string]::IsNullOrEmpty($BorderHex)) {
    $shp.Line.Visible = 0
  } else {
    $shp.Line.Visible = -1
    $shp.Line.ForeColor.RGB = HexColor $BorderHex
    $shp.Line.Weight = $BorderPt
  }
  if (-not [string]::IsNullOrEmpty($Name)) {
    $shp.Name = $Name
  }
  return $shp
}

function Add-Text {
  param(
    $Slide,
    [double]$X, [double]$Y, [double]$W, [double]$H,
    [string]$Text,
    [string]$FontName = $FONT_BODY,
    [double]$Size = 12,
    [string]$ColorHex = $C_INK,
    [bool]$Bold = $false,
    [int]$Align = 1,       # 1=Left, 2=Center, 3=Right
    [double]$LineSpacing = 1.15,
    [int]$Valign = 1,      # 1=Top, 3=Middle, 4=Bottom
    [double]$PadX = 0,
    [double]$PadY = 0,
    [string]$Name = ''
  )
  $tb = $Slide.Shapes.AddTextbox(1, $X, $Y, $W, $H)
  $tb.Fill.Visible = 0
  $tb.Line.Visible = 0
  $tf = $tb.TextFrame2
  $tf.WordWrap = -1
  $tf.AutoSize = 0
  $tf.VerticalAnchor = $Valign
  $tf.MarginLeft = $PadX
  $tf.MarginRight = $PadX
  $tf.MarginTop = $PadY
  $tf.MarginBottom = $PadY

  $tr = $tf.TextRange
  $tr.Text = $Text
  $tr.ParagraphFormat.Alignment = $Align
  $tr.ParagraphFormat.SpaceBefore = 0
  $tr.ParagraphFormat.SpaceAfter = 0
  $tr.ParagraphFormat.LineRuleWithin = -1
  $tr.ParagraphFormat.SpaceWithin = if ($Valign -eq 3) { 1.0 } else { $LineSpacing }
  $tr.Font.Name = $FontName
  $tr.Font.Size = $Size
  $tr.Font.Bold = if ($Bold) { -1 } else { 0 }
  $tr.Font.Fill.Solid()
  $tr.Font.Fill.ForeColor.RGB = HexColor $ColorHex

  if (-not [string]::IsNullOrEmpty($Name)) {
    $tb.Name = $Name
  }
  return $tb
}

function Add-Pill {
  param(
    $Slide,
    [double]$X, [double]$Y, [double]$W, [double]$H,
    [string]$Text,
    [string]$BgHex,
    [string]$FgHex,
    [string]$BorderHex = '',
    [string]$FontName = $FONT_MONO,
    [double]$Size = 9.0,
    [bool]$Bold = $true,
    [int]$Align = 2,
    [bool]$Rounded = $false,
    [string]$Name = ''
  )
  $bg = Add-Rect -Slide $Slide -X $X -Y $Y -W $W -H $H -FillHex $BgHex -BorderHex $BorderHex -BorderPt 1.0 -Rounded $Rounded -CornerRadius 0.25 -Name $Name
  Add-Text -Slide $Slide -X $X -Y $Y -W $W -H $H -Text $Text -FontName $FontName -Size $Size -ColorHex $FgHex -Bold $Bold -Align $Align -Valign 3 -PadX 6 -PadY 0 | Out-Null
  return $bg
}

function Add-Icon {
  param(
    $Slide,
    [string]$Path,
    [double]$X, [double]$Y, [double]$W, [double]$H
  )
  $pic = $Slide.Shapes.AddPicture($Path, 0, -1, $X, $Y, $W, $H)
  $pic.LockAspectRatio = -1
  return $pic
}

function Fit-Picture {
  param(
    $Slide,
    [string]$Path,
    [double]$X, [double]$Y, [double]$MaxW, [double]$MaxH,
    [string]$Name = ''
  )
  $img = [System.Drawing.Image]::FromFile($Path)
  try {
    $aspect = $img.Width / [double]$img.Height
  } finally {
    $img.Dispose()
  }
  $w = $MaxW
  $h = $w / $aspect
  if ($h -gt $MaxH) {
    $h = $MaxH
    $w = $h * $aspect
  }
  $px = $X + ($MaxW - $w) / 2.0
  $py = $Y + ($MaxH - $h) / 2.0
  $pic = $Slide.Shapes.AddPicture($Path, 0, -1, $px, $py, $w, $h)
  $pic.LockAspectRatio = -1
  if (-not [string]::IsNullOrEmpty($Name)) {
    $pic.Name = $Name
  }
  return $pic
}

function Place-Hedgie {
  param(
    $Slide,
    $TemplateHedgie,
    [double]$X, [double]$Y, [double]$W,
    [double]$RotX, [double]$RotY, [double]$RotZ,
    [double]$HaloScale = 1.30
  )
  $hedgie = $null
  if ($null -eq $TemplateHedgie) {
    $hedgie = $Slide.Shapes.Add3DModel($GlbPath, 0, -1, $X, $Y, $W, $W * 1.09)
    $hedgie.LockAspectRatio = -1
  } else {
    for ($attempt = 1; $attempt -le 4; $attempt++) {
      try {
        $TemplateHedgie.Copy()
        Start-Sleep -Milliseconds (120 * $attempt)
        $pasted = $Slide.Shapes.Paste()
        $hedgie = $pasted.Item(1)
        break
      } catch {
        if ($attempt -eq 4) { throw }
        Start-Sleep -Milliseconds 250
      }
    }
    $hedgie.LockAspectRatio = -1
    $hedgie.Width = $W
    $hedgie.Left = $X
    $hedgie.Top = $Y
  }

  $hedgie.Name = '!!hedgie'
  $hedgie.Model3D.RotationX = $RotX
  $hedgie.Model3D.RotationY = $RotY
  $hedgie.Model3D.RotationZ = $RotZ

  $actualW = $hedgie.Width
  $actualH = $hedgie.Height
  $haloSize = [Math]::Max($actualW, $actualH) * $HaloScale
  $haloX = $X + ($actualW - $haloSize) / 2.0
  $haloY = $Y + ($actualH - $haloSize) / 2.0
  $halo = $Slide.Shapes.AddPicture($HaloPath, 0, -1, $haloX, $haloY, $haloSize, $haloSize)
  $halo.LockAspectRatio = -1
  $halo.Name = '!!hedgie-halo'

  $halo.ZOrder(1) | Out-Null
  $hedgie.ZOrder(0) | Out-Null
  return $hedgie
}

function Add-SlideChrome {
  param(
    $Slide,
    [int]$SlideNum,
    [int]$TotalSlides = 7,
    [string]$RailHex = $C_GOLD,
    [double]$RailX = 64, [double]$RailY = 58, [double]$RailW = 5, [double]$RailH = 52
  )
  Add-Text -Slide $Slide -X 64 -Y 20 -W 320 -H 18 -Text 'HEDGEFLEX  //  TEAM FLEXPOL' -FontName $FONT_MONO -Size 8.5 -ColorHex $C_MUTED -Bold $true -Name '!!brand-mark' | Out-Null
  $idxStr = ('{0:D2} / {1:D2}' -f $SlideNum, $TotalSlides)
  Add-Text -Slide $Slide -X 816 -Y 506 -W 80 -H 18 -Text $idxStr -FontName $FONT_MONO -Size 8.5 -ColorHex $C_MUTED -Bold $true -Align 3 | Out-Null

  Add-Rect -Slide $Slide -X $RailX -Y $RailY -W $RailW -H $RailH -FillHex $RailHex -Name '!!accent-rail' | Out-Null
  Add-Rect -Slide $Slide -X 0 -Y 535 -W 960 -H 5 -FillHex $C_TRACK -Name '!!progress-track' | Out-Null
  $fillW = [Math]::Round(960.0 * $SlideNum / $TotalSlides, 2)
  Add-Rect -Slide $Slide -X 0 -Y 535 -W $fillW -H 5 -FillHex $C_GOLD -Name '!!progress-fill' | Out-Null
}

function Set-SpeakerNotes($slide, [string]$notes) {
  $slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text = $notes
}

$ppt = $null
$pres = $null
$hadExisting = $false
try {
  $ppt = New-Object -ComObject PowerPoint.Application
  $hadExisting = ($ppt.Presentations.Count -gt 0)
  $pres = $ppt.Presentations.Add(0) # msoFalse
  $pres.PageSetup.SlideWidth = 960
  $pres.PageSetup.SlideHeight = 540

  # =========================================================================
  # SLIDE 1: COVER — Name, Team Name, 3D Hedgie (0:00 - 0:15)
  # =========================================================================
  $s1 = $pres.Slides.Add(1, 12)
  Set-SlideBackground $s1 $C_BG_CREAM
  Add-SlideChrome -Slide $s1 -SlideNum 1 -RailHex $C_GOLD -RailX 64 -RailY 150 -RailW 5 -RailH 150

  Add-Pill -Slide $s1 -X 64 -Y 92 -W 198 -H 26 -Text 'FINANCE QUEST FINAL' -BgHex $C_GOLD_WASH -FgHex $C_GOLD_DARK -BorderHex $C_GOLD -Size 9.0 | Out-Null
  Add-Text -Slide $s1 -X 86 -Y 138 -W 460 -H 94 -Text 'HedgeFlex' -FontName $FONT_DISPLAY -Size 74 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Text -Slide $s1 -X 86 -Y 236 -W 440 -H 34 -Text 'by Team flexPOL' -FontName $FONT_DISPLAY -Size 22 -ColorHex $C_MUTED -Bold $false | Out-Null
  Add-Text -Slide $s1 -X 86 -Y 278 -W 440 -H 26 -Text 'Learn investing. Practice safely. Build confidence.' -FontName $FONT_BODY -Size 13.5 -ColorHex $C_MUTED | Out-Null

  $s1Hedgie = Place-Hedgie -Slide $s1 -TemplateHedgie $null -X 556 -Y 82 -W 342 -RotX 4 -RotY -18 -RotZ 2

  Set-SpeakerNotes $s1 @"
[0:00 - 0:15 | 15s] INTRO
"Hi everyone — we are Team flexPOL, and this is HedgeFlex, our entry for the Finance Quest Challenge."
"@

  # =========================================================================
  # SLIDE 2: CATCHY HOOK — €25,000 Question (0:15 - 0:40)
  # =========================================================================
  $s2 = $pres.Slides.Add(2, 12)
  Set-SlideBackground $s2 $C_BG_LIGHT
  Set-Morph $s2
  Add-SlideChrome -Slide $s2 -SlideNum 2 -RailHex $C_COPPER -RailX 64 -RailY 108 -RailW 6 -RailH 194

  Add-Text -Slide $s2 -X 88 -Y 96 -W 300 -H 20 -Text 'IMAGINE THIS' -FontName $FONT_MONO -Size 10.0 -ColorHex $C_COPPER_DARK -Bold $true | Out-Null
  Add-Text -Slide $s2 -X 84 -Y 112 -W 560 -H 106 -Text '€25,000' -FontName $FONT_DISPLAY -Size 86 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Rect -Slide $s2 -X 88 -Y 214 -W 310 -H 8 -FillHex $C_GOLD_BRIGHT | Out-Null

  Add-Text -Slide $s2 -X 88 -Y 238 -W 570 -H 90 -Text "You have it today.`nWhat do you do?" -FontName $FONT_DISPLAY -Size 34 -ColorHex $C_INK -Bold $true -LineSpacing 1.12 | Out-Null

  $traps = @(
    @{ X = 64;  W = 186; Bar = $C_MUTED;  Txt = 'Leave it in cash?' },
    @{ X = 264; W = 186; Bar = $C_LOSS;   Txt = 'Random stock?' },
    @{ X = 464; W = 186; Bar = $C_COPPER; Txt = 'Crypto?' }
  )
  foreach ($tp in $traps) {
    Add-Rect -Slide $s2 -X $tp.X -Y 366 -W $tp.W -H 48 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
    Add-Rect -Slide $s2 -X $tp.X -Y 366 -W $tp.W -H 3  -FillHex $tp.Bar | Out-Null
    Add-Text -Slide $s2 -X $tp.X -Y 369 -W $tp.W -H 45 -Text $tp.Txt -FontName $FONT_BODY -Size 13.0 -ColorHex $C_INK -Bold $true -Align 2 -Valign 3 | Out-Null
  }

  Place-Hedgie -Slide $s2 -TemplateHedgie $s1Hedgie -X 686 -Y 258 -W 216 -RotX -10 -RotY -38 -RotZ -3 | Out-Null

  Set-SpeakerNotes $s2 @"
[0:15 - 0:40 | 25s] CATCHY HOOK
"Imagine someone hands you €25,000 today. What do you actually do?
Leave it in cash and watch inflation eat it? Bet on a random stock? Chase crypto hype?
Beginners don't fail because they lack definitions — they fail because they have nowhere safe to practice real decisions before risking real money."
"@

  # =========================================================================
  # SLIDE 3: THE JOURNEY — Basics -> Scenarios -> Profile/Account (0:40 - 1:20)
  # =========================================================================
  $s3 = $pres.Slides.Add(3, 12)
  Set-SlideBackground $s3 $C_BG_CREAM
  Set-Morph $s3
  Add-SlideChrome -Slide $s3 -SlideNum 3 -RailHex $C_GOLD -RailX 64 -RailY 54 -RailW 5 -RailH 54

  Add-Text -Slide $s3 -X 82 -Y 50 -W 360 -H 18 -Text 'THE JOURNEY' -FontName $FONT_MONO -Size 9.5 -ColorHex $C_GOLD_DARK -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 82 -Y 69 -W 600 -H 44 -Text 'From zero to your first real plan.' -FontName $FONT_DISPLAY -Size 32 -ColorHex $C_INK -Bold $true | Out-Null

  # Top-right Hedgie clearly above Step 3
  Place-Hedgie -Slide $s3 -TemplateHedgie $s1Hedgie -X 724 -Y 18 -W 176 -RotX 12 -RotY -36 -RotZ -3 | Out-Null

  Add-Rect -Slide $s3 -X 64 -Y 316 -W 248 -H 164 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s3 -X 64 -Y 316 -W 248 -H 5   -FillHex $C_GOLD | Out-Null
  Add-Text -Slide $s3 -X 84 -Y 334 -W 208 -H 38 -Text '01' -FontName $FONT_DISPLAY -Size 30 -ColorHex $C_GOLD_DARK -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 84 -Y 376 -W 208 -H 28 -Text 'Learn the Basics' -FontName $FONT_DISPLAY -Size 18 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 84 -Y 408 -W 208 -H 54 -Text 'Short lessons, interactive charts & hands-on slider labs.' -FontName $FONT_BODY -Size 12.0 -ColorHex $C_MUTED -LineSpacing 1.25 | Out-Null

  Add-Text -Slide $s3 -X 312 -Y 356 -W 36 -H 40 -Text '→' -FontName $FONT_DISPLAY -Size 24 -ColorHex $C_GOLD -Bold $true -Align 2 -Valign 3 | Out-Null

  Add-Rect -Slide $s3 -X 348 -Y 276 -W 248 -H 164 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s3 -X 348 -Y 276 -W 248 -H 5   -FillHex $C_AMBER | Out-Null
  Add-Text -Slide $s3 -X 368 -Y 294 -W 208 -H 38 -Text '02' -FontName $FONT_DISPLAY -Size 30 -ColorHex $C_AMBER_DARK -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 368 -Y 336 -W 208 -H 28 -Text 'Practice Scenarios' -FontName $FONT_DISPLAY -Size 18 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 368 -Y 368 -W 208 -H 54 -Text 'Real-life goals, €10k Playground & 10s market replays.' -FontName $FONT_BODY -Size 12.0 -ColorHex $C_MUTED -LineSpacing 1.25 | Out-Null

  Add-Text -Slide $s3 -X 596 -Y 316 -W 36 -H 40 -Text '→' -FontName $FONT_DISPLAY -Size 24 -ColorHex $C_AMBER -Bold $true -Align 2 -Valign 3 | Out-Null

  Add-Rect -Slide $s3 -X 632 -Y 238 -W 268 -H 172 -FillHex $C_OBSIDIAN -BorderHex $C_OBSIDIAN | Out-Null
  Add-Rect -Slide $s3 -X 632 -Y 238 -W 268 -H 5   -FillHex $C_GOLD_BRIGHT | Out-Null
  Add-Text -Slide $s3 -X 652 -Y 256 -W 228 -H 38 -Text '03' -FontName $FONT_DISPLAY -Size 30 -ColorHex $C_GOLD_BRIGHT -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 652 -Y 298 -W 228 -H 28 -Text 'Start Your Journey' -FontName $FONT_DISPLAY -Size 18 -ColorHex $C_OBSIDIAN_TXT -Bold $true | Out-Null
  Add-Text -Slide $s3 -X 652 -Y 330 -W 228 -H 62 -Text 'Build your investor profile & launch your first account with confidence.' -FontName $FONT_BODY -Size 12.0 -ColorHex $C_OBSIDIAN_SUB -LineSpacing 1.25 | Out-Null

  Set-SpeakerNotes $s3 @"
[0:40 - 1:20 | 40s] WHAT HEDGEFLEX DOES — THE 3-STEP JOURNEY
"That's what HedgeFlex is: a safe investing sandbox that walks beginners from zero to their first real plan.
1. Learn the Basics — short interactive lessons and slider labs.
2. Practice Scenarios — realistic goals across life stages with virtual euros, 10-second market replays, and a 5-star rubric.
3. Start Your Journey — build your investor profile and launch your first real-world account with confidence."
"@

  # =========================================================================
  # SLIDE 4: MEET HEDGIE — Friendly AI Support (1:20 - 1:45)
  # =========================================================================
  $s4 = $pres.Slides.Add(4, 12)
  Set-SlideBackground $s4 $C_BG_LIGHT
  Set-Morph $s4
  Add-SlideChrome -Slide $s4 -SlideNum 4 -RailHex $C_GOLD -RailX 422 -RailY 142 -RailW 6 -RailH 172

  Place-Hedgie -Slide $s4 -TemplateHedgie $s1Hedgie -X 46 -Y 92 -W 334 -RotX 3 -RotY 28 -RotZ 3 | Out-Null

  Add-Text -Slide $s4 -X 442 -Y 130 -W 380 -H 20 -Text 'YOUR AI SUPPORT' -FontName $FONT_MONO -Size 10.0 -ColorHex $C_GOLD_DARK -Bold $true | Out-Null
  Add-Text -Slide $s4 -X 440 -Y 154 -W 460 -H 86 -Text 'Meet Hedgie.' -FontName $FONT_DISPLAY -Size 68 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Text -Slide $s4 -X 442 -Y 248 -W 452 -H 64 -Text 'Your friendly AI investing teacher inside HedgeFlex.' -FontName $FONT_DISPLAY -Size 23 -ColorHex $C_MUTED -Bold $false -LineSpacing 1.18 | Out-Null

  $traits = @(
    @{ X = 442; W = 138; Txt = 'Sees your screen' },
    @{ X = 590; W = 140; Txt = 'Gives smart hints' },
    @{ X = 740; W = 148; Txt = 'Explains tradeoffs' }
  )
  foreach ($tr in $traits) {
    Add-Rect -Slide $s4 -X $tr.X -Y 348 -W $tr.W -H 38 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
    Add-Rect -Slide $s4 -X $tr.X -Y 348 -W 3     -H 38 -FillHex $C_GOLD | Out-Null
    Add-Text -Slide $s4 -X ($tr.X + 4) -Y 348 -W ($tr.W - 6) -H 38 -Text $tr.Txt -FontName $FONT_BODY -Size 11.0 -ColorHex $C_INK -Bold $true -Align 2 -Valign 3 | Out-Null
  }

  Set-SpeakerNotes $s4 @"
[1:20 - 1:45 | 25s] MEET HEDGIE — AI SUPPORT
"And at every step, you have AI support from Hedgie — your friendly investing teacher right inside HedgeFlex.
Hedgie sees the exact lesson, slider, or portfolio run on your screen, nudges you with smart hints, and explains the tradeoffs behind your results."
"@

  # =========================================================================
  # SLIDE 5: LIVE DEMO (1:45 - 4:15)
  # =========================================================================
  $s5 = $pres.Slides.Add(5, 12)
  Set-SlideBackground $s5 $C_BG_CREAM
  Set-Morph $s5
  Add-SlideChrome -Slide $s5 -SlideNum 5 -RailHex $C_GOLD -RailX 110 -RailY 248 -RailW 740 -RailH 5

  Place-Hedgie -Slide $s5 -TemplateHedgie $s1Hedgie -X 380 -Y 24 -W 200 -RotX 12 -RotY 0 -RotZ 0 | Out-Null

  Add-Rect -Slide $s5 -X 110 -Y 253 -W 740 -H 220 -FillHex $C_OBSIDIAN -BorderHex $C_OBSIDIAN | Out-Null
  $s5.Shapes.Item('!!accent-rail').ZOrder(0) | Out-Null

  Add-Text -Slide $s5 -X 140 -Y 282 -W 680 -H 22 -Text 'TIME TO SEE IT IN ACTION' -FontName $FONT_MONO -Size 10.5 -ColorHex $C_GOLD_BRIGHT -Bold $true -Align 2 | Out-Null
  Add-Text -Slide $s5 -X 140 -Y 308 -W 680 -H 78 -Text 'Live Demo' -FontName $FONT_DISPLAY -Size 64 -ColorHex $C_OBSIDIAN_TXT -Bold $true -Align 2 | Out-Null
  Add-Text -Slide $s5 -X 140 -Y 402 -W 680 -H 32 -Text 'Learn   ·   Simulate   ·   Ask Hedgie' -FontName $FONT_MONO -Size 15.0 -ColorHex $C_GOLD_BRIGHT -Bold $true -Align 2 | Out-Null

  Set-SpeakerNotes $s5 @"
[1:45 - 4:15 | 2m 30s] LIVE DEMO — ALT+TAB TO BROWSER
• [1:45 - 2:25] Learning Path: Open Chapter 1, try an interactive slider lab (Time Machine / Crash Test).
• [2:25 - 3:35] Sandbox Scenario: Open Marek 2.3 (€25k!) or Henryk 3.5 — allocate across broad ETFs + cash, run the 10-second animated market replay, reveal the 5-star rubric!
• [3:35 - 4:05] AI Support: Click 'Ask Hedgie for feedback' to show screen-grounded coaching.
• [4:05 - 4:15] Quick glance at /playground (€10k Free Play).
ALT+TAB back to Slide 6!
"@

  # =========================================================================
  # SLIDE 6: UNDER THE HOOD — Architecture (4:15 - 4:45)
  # =========================================================================
  $s6 = $pres.Slides.Add(6, 12)
  Set-SlideBackground $s6 $C_BG_LIGHT
  Set-Morph $s6
  Add-SlideChrome -Slide $s6 -SlideNum 6 -RailHex $C_GOLD -RailX 56 -RailY 46 -RailW 5 -RailH 48

  Add-Text -Slide $s6 -X 74 -Y 42 -W 360 -H 18 -Text 'UNDER THE HOOD' -FontName $FONT_MONO -Size 9.5 -ColorHex $C_GOLD_DARK -Bold $true | Out-Null
  Add-Text -Slide $s6 -X 74 -Y 60 -W 740 -H 40 -Text 'Live on Google Cloud, end to end.' -FontName $FONT_DISPLAY -Size 28 -ColorHex $C_INK -Bold $true | Out-Null

  # Left Column: Learner Card
  Add-Rect -Slide $s6 -X 56 -Y 122 -W 170 -H 116 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s6 -X 56 -Y 122 -W 170 -H 4   -FillHex $C_COPPER | Out-Null
  Add-Icon -Slide $s6 -Path $IconLearner -X 68 -Y 136 -W 22 -H 22 | Out-Null
  Add-Text -Slide $s6 -X 96 -Y 135 -W 120 -H 24 -Text 'Learner' -FontName $FONT_DISPLAY -Size 14.5 -ColorHex $C_INK -Bold $true -Valign 3 | Out-Null
  Add-Text -Slide $s6 -X 68 -Y 166 -W 146 -H 18 -Text 'Phone or laptop' -FontName $FONT_BODY -Size 10.0 -ColorHex $C_COPPER_DARK -Bold $true | Out-Null
  Add-Text -Slide $s6 -X 68 -Y 188 -W 146 -H 38 -Text 'Learns, plans, asks Hedgie' -FontName $FONT_BODY -Size 9.5 -ColorHex $C_MUTED -LineSpacing 1.2 | Out-Null

  # Hedgie below Learner card looking up-right into Cloud Run
  Place-Hedgie -Slide $s6 -TemplateHedgie $s1Hedgie -X 50 -Y 254 -W 182 -RotX -6 -RotY 38 -RotZ 3 | Out-Null

  # Connector 1: Learner -> Cloud Run
  Add-Text -Slide $s6 -X 228 -Y 142 -W 64 -H 28 -Text "HTTPS`nJSON API" -FontName $FONT_MONO -Size 7.5 -ColorHex $C_MUTED -Bold $true -Align 2 -LineSpacing 1.15 | Out-Null
  Add-Text -Slide $s6 -X 228 -Y 169 -W 64 -H 26 -Text '→' -FontName $FONT_DISPLAY -Size 22 -ColorHex $C_GOLD -Bold $true -Align 2 -Valign 3 | Out-Null

  # Center Hub: Google Cloud Run
  Add-Rect -Slide $s6 -X 294 -Y 118 -W 328 -H 292 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s6 -X 294 -Y 118 -W 328 -H 4   -FillHex $C_GOLD | Out-Null
  Add-Icon -Slide $s6 -Path $IconCloud -X 312 -Y 134 -W 26 -H 26 | Out-Null
  Add-Text -Slide $s6 -X 346 -Y 129 -W 260 -H 22 -Text 'Google Cloud Run' -FontName $FONT_DISPLAY -Size 15.5 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Text -Slide $s6 -X 346 -Y 151 -W 260 -H 16 -Text 'One image: Spring Boot 4 + React 19' -FontName $FONT_BODY -Size 9.5 -ColorHex $C_MUTED | Out-Null

  $hubRows = @(
    @{ Y = 184; Icon = $IconLessons; Title = 'Lessons & quizzes';    Sub = 'Answers checked on the server' },
    @{ Y = 256; Icon = $IconSim;     Title = 'Simulation & stars';   Sub = 'Seeded paths: one market for all' },
    @{ Y = 328; Icon = $IconCoach;   Title = 'Hedgie, the AI coach'; Sub = 'Sees your screen + real result' }
  )
  foreach ($hr in $hubRows) {
    Add-Rect -Slide $s6 -X 310 -Y $hr.Y -W 296 -H 64 -FillHex $C_BG_CREAM -BorderHex $C_BORDER_SOFT | Out-Null
    Add-Rect -Slide $s6 -X 310 -Y $hr.Y -W 3   -H 64 -FillHex $C_GOLD | Out-Null
    Add-Icon -Slide $s6 -Path $hr.Icon -X 324 -Y ($hr.Y + 21) -W 22 -H 22 | Out-Null
    Add-Text -Slide $s6 -X 358 -Y ($hr.Y + 12) -W 236 -H 20 -Text $hr.Title -FontName $FONT_DISPLAY -Size 12.5 -ColorHex $C_INK -Bold $true | Out-Null
    Add-Text -Slide $s6 -X 358 -Y ($hr.Y + 34) -W 236 -H 18 -Text $hr.Sub -FontName $FONT_BODY -Size 9.5 -ColorHex $C_MUTED | Out-Null
  }

  # Connector 2: Cloud Run -> Supabase
  Add-Text -Slide $s6 -X 624 -Y 156 -W 88 -H 28 -Text "SQL · Flyway`nvia pooler" -FontName $FONT_MONO -Size 7.5 -ColorHex $C_GAIN -Bold $true -Align 2 -LineSpacing 1.15 | Out-Null
  Add-Text -Slide $s6 -X 624 -Y 183 -W 88 -H 26 -Text '→' -FontName $FONT_DISPLAY -Size 22 -ColorHex $C_GAIN -Bold $true -Align 2 -Valign 3 | Out-Null

  # Connector 3: Cloud Run -> OpenAI
  Add-Text -Slide $s6 -X 624 -Y 312 -W 88 -H 28 -Text "context +`nreal result" -FontName $FONT_MONO -Size 7.5 -ColorHex $C_INK -Bold $true -Align 2 -LineSpacing 1.15 | Out-Null
  Add-Text -Slide $s6 -X 624 -Y 339 -W 88 -H 26 -Text '→' -FontName $FONT_DISPLAY -Size 22 -ColorHex $C_INK -Bold $true -Align 2 -Valign 3 | Out-Null

  # Right Column: Supabase
  Add-Rect -Slide $s6 -X 714 -Y 124 -W 190 -H 126 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s6 -X 714 -Y 124 -W 190 -H 4   -FillHex $C_GAIN | Out-Null
  Add-Icon -Slide $s6 -Path $IconSupabase -X 728 -Y 138 -W 22 -H 22 | Out-Null
  Add-Text -Slide $s6 -X 756 -Y 137 -W 134 -H 24 -Text 'Supabase' -FontName $FONT_DISPLAY -Size 14.5 -ColorHex $C_INK -Bold $true -Valign 3 | Out-Null
  Add-Text -Slide $s6 -X 728 -Y 168 -W 162 -H 18 -Text 'Postgres database' -FontName $FONT_BODY -Size 10.0 -ColorHex $C_GAIN -Bold $true | Out-Null
  Add-Text -Slide $s6 -X 728 -Y 190 -W 162 -H 40 -Text 'Content, learners, coach memory' -FontName $FONT_BODY -Size 9.5 -ColorHex $C_MUTED -LineSpacing 1.2 | Out-Null

  # Right Column: OpenAI
  Add-Rect -Slide $s6 -X 714 -Y 276 -W 190 -H 126 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s6 -X 714 -Y 276 -W 190 -H 4   -FillHex $C_OBSIDIAN | Out-Null
  Add-Icon -Slide $s6 -Path $IconOpenAI -X 728 -Y 290 -W 22 -H 22 | Out-Null
  Add-Text -Slide $s6 -X 756 -Y 289 -W 134 -H 24 -Text 'OpenAI' -FontName $FONT_DISPLAY -Size 14.5 -ColorHex $C_INK -Bold $true -Valign 3 | Out-Null
  Add-Text -Slide $s6 -X 728 -Y 320 -W 162 -H 18 -Text 'LLM via Spring AI' -FontName $FONT_BODY -Size 10.0 -ColorHex $C_INK -Bold $true | Out-Null
  Add-Text -Slide $s6 -X 728 -Y 342 -W 162 -H 40 -Text "Writes Hedgie's replies" -FontName $FONT_BODY -Size 9.5 -ColorHex $C_MUTED -LineSpacing 1.2 | Out-Null

  # Bottom CI/CD Strip: SHIP IT
  Add-Rect -Slide $s6 -X 294 -Y 428 -W 610 -H 56 -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  Add-Rect -Slide $s6 -X 294 -Y 428 -W 4   -H 56 -FillHex $C_COPPER | Out-Null
  Add-Icon -Slide $s6 -Path $IconShip -X 308 -Y 447 -W 18 -H 18 | Out-Null
  Add-Text -Slide $s6 -X 332 -Y 446 -W 56 -H 20 -Text 'SHIP IT' -FontName $FONT_MONO -Size 8.5 -ColorHex $C_COPPER_DARK -Bold $true -Valign 3 | Out-Null

  Add-Pill -Slide $s6 -X 392 -Y 442 -W 106 -H 28 -Text 'GitHub Actions' -BgHex $C_BG_LIGHT -FgHex $C_INK -BorderHex $C_BORDER -Size 8.0 | Out-Null
  Add-Icon -Slide $s6 -Path $IconArrow -X 501 -Y 452 -W 16 -H 6.4 | Out-Null
  Add-Pill -Slide $s6 -X 520 -Y 442 -W 116 -H 28 -Text 'Artifact Registry' -BgHex $C_BG_LIGHT -FgHex $C_INK -BorderHex $C_BORDER -Size 8.0 | Out-Null
  Add-Icon -Slide $s6 -Path $IconArrow -X 639 -Y 452 -W 16 -H 6.4 | Out-Null
  Add-Pill -Slide $s6 -X 658 -Y 442 -W 80  -H 28 -Text 'Cloud Run' -BgHex $C_GOLD_WASH -FgHex $C_GOLD_DARK -BorderHex $C_GOLD -Size 8.0 | Out-Null

  Add-Rect -Slide $s6 -X 748 -Y 440 -W 1 -H 32 -FillHex $C_BORDER | Out-Null
  Add-Text -Slide $s6 -X 758 -Y 440 -W 138 -H 32 -Text "Terraform`nSecret Manager" -FontName $FONT_MONO -Size 8.0 -ColorHex $C_MUTED -Bold $true -Align 2 -Valign 3 -LineSpacing 1.15 | Out-Null

  Set-SpeakerNotes $s6 @"
[4:15 - 4:45 | 30s] UNDER THE HOOD
"And it's live on Google Cloud end to end:
Your phone or laptop talks over HTTPS JSON to a single Docker image on Google Cloud Run running Spring Boot 4 and React 19 — where answers, seeded market simulations, and star scoring all run on the server.
Postgres on Supabase stores content, learners, and coach memory via Flyway; OpenAI through Spring AI writes Hedgie's replies with real screen context; and everything deploys cleanly via GitHub Actions, Artifact Registry, Cloud Run, Terraform, and Secret Manager."
"@

  # =========================================================================
  # SLIDE 7: CLOSING — "Your turn." + QR Code (left) + Cyberpunk Meme (right)
  # NO 3D Hedgie, NO URL text! (4:45 - 5:00 + JURY Q&A)
  # =========================================================================
  $s7 = $pres.Slides.Add(7, 12)
  Set-SlideBackground $s7 $C_BG_CREAM
  Set-Morph $s7
  Add-SlideChrome -Slide $s7 -SlideNum 7 -RailHex $C_GOLD -RailX 64 -RailY 72 -RailW 5 -RailH 66

  # Left column: "Your turn." + real scannable QR code
  Add-Text -Slide $s7 -X 82 -Y 66 -W 270 -H 76 -Text 'Your turn.' -FontName $FONT_DISPLAY -Size 54 -ColorHex $C_INK -Bold $true | Out-Null

  $qrX = 64; $qrY = 164; $qrS = 264
  Add-Rect -Slide $s7 -X $qrX -Y $qrY -W $qrS -H $qrS -FillHex $C_CARD -BorderHex $C_BORDER | Out-Null
  $qrPad = 16
  Add-Icon -Slide $s7 -Path $QrPath -X ($qrX + $qrPad) -Y ($qrY + $qrPad) -W ($qrS - 2 * $qrPad) -H ($qrS - 2 * $qrPad) | Out-Null

  $bLen = 28; $bThk = 4
  Add-Rect -Slide $s7 -X $qrX -Y $qrY -W $bLen -H $bThk -FillHex $C_GOLD | Out-Null
  Add-Rect -Slide $s7 -X $qrX -Y $qrY -W $bThk -H $bLen -FillHex $C_GOLD | Out-Null

  Add-Rect -Slide $s7 -X ($qrX + $qrS - $bLen) -Y $qrY -W $bLen -H $bThk -FillHex $C_GOLD | Out-Null
  Add-Rect -Slide $s7 -X ($qrX + $qrS - $bThk) -Y $qrY -W $bThk -H $bLen -FillHex $C_GOLD | Out-Null

  Add-Rect -Slide $s7 -X $qrX -Y ($qrY + $qrS - $bThk) -W $bLen -H $bThk -FillHex $C_GOLD | Out-Null
  Add-Rect -Slide $s7 -X $qrX -Y ($qrY + $qrS - $bLen) -W $bThk -H $bLen -FillHex $C_GOLD | Out-Null

  Add-Rect -Slide $s7 -X ($qrX + $qrS - $bLen) -Y ($qrY + $qrS - $bThk) -W $bLen -H $bThk -FillHex $C_GOLD | Out-Null
  Add-Rect -Slide $s7 -X ($qrX + $qrS - $bThk) -Y ($qrY + $qrS - $bLen) -W $bThk -H $bLen -FillHex $C_GOLD | Out-Null

  Add-Text -Slide $s7 -X $qrX -Y ($qrY + $qrS + 14) -W $qrS -H 20 -Text 'SCAN TO PLAY' -FontName $FONT_MONO -Size 9.5 -ColorHex $C_GOLD_DARK -Bold $true -Align 2 | Out-Null

  # Right showcase: Sleek obsidian frame holding the Cyberpunk Hedgie meme
  Add-Rect -Slide $s7 -X 364 -Y 108 -W 542 -H 324 -FillHex $C_OBSIDIAN -BorderHex $C_OBSIDIAN | Out-Null
  Add-Rect -Slide $s7 -X 364 -Y 108 -W 542 -H 4   -FillHex $C_GOLD | Out-Null
  Fit-Picture -Slide $s7 -Path $MemePath -X 374 -Y 120 -MaxW 522 -MaxH 300 | Out-Null

  Set-SpeakerNotes $s7 @"
[4:45 - 5:00 | 15s] CLOSING & QR CODE
"Now it's your turn — scan the QR code to try HedgeFlex live on your phone.
Wake up investor, we have finances to rescue. Thank you, and we'd love your questions!"
"@

  # Clean stale preview PNGs before exporting 1..7
  Get-ChildItem -Path $Preview -Filter 'slide-*.png' -ErrorAction SilentlyContinue | Remove-Item -Force

  $pres.SaveAs($OutPptx)
  for ($i = 1; $i -le $pres.Slides.Count; $i++) {
    $pngPath = Join-Path $Preview ('slide-{0:D2}.png' -f $i)
    $pres.Slides.Item($i).Export($pngPath, 'PNG', 1920, 1080)
  }

  Write-Host "Built deck: $OutPptx ($($pres.Slides.Count) slides)"
} finally {
  if ($pres) {
    try { $pres.Close() } catch {}
  }
  if ($ppt) {
    if (-not $hadExisting -and $ppt.Presentations.Count -eq 0) {
      try { $ppt.Quit() } catch {}
    }
    try { [System.Runtime.Interopservices.Marshal]::ReleaseComObject($ppt) | Out-Null } catch {}
  }
}
