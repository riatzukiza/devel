# OpenUTAU Headless Renderer

Automated UTAU vocal synthesis pipeline for Knoxx.

## Installed Voicebanks

| ID | Name | Language | Description |
|----|------|----------|-------------|
| teto | 重音テト OU用日本語統合ライブラリー | Japanese | Kasane Teto - Complete Japanese voicebank with multiple styles |
| ritsu | 波音リツ連続音Ver1.5.1 | Japanese | Namine Ritsu - Connected voicebank (perfect for your Fork Tales character!) |
| teto-en | 重音テト音声ライブラリー | English | Kasane Teto - English CVVC voicebank |

## Usage

### Generate USTX Project
```
voice.openutau_project
- project_name: "My Song"
- singer_id: "ritsu"  (or "teto", "teto-en")
- notes: [...]
```

### Render to WAV
```
voice.openutau_render
- ustx_path: "path/to/project.ustx"
- output_path: "path/to/output.wav"
```

## Pipeline

USTX → Xvfb + OpenUTAU + WORLDLINE-R → WAV (16-bit mono 44100Hz PCM)
