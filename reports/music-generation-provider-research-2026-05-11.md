# Music Generation Provider Research Report

## Date: 2026-05-11

## Current Issue: MiniMax "terminated" Errors via Blaze

### Root Cause Analysis

The MiniMax API returns `status: "terminated"` with HTTP 200 when generation fails internally. Our previous fix to `media-generations.ts` now correctly treats this as a logical failure (returns 502 to Knoxx), but the underlying issue remains: **MiniMax is rejecting or failing to process the request**.

### MiniMax API Requirements (from official docs)

**Endpoint**: `POST /v1/music_generation`
**Base URL**: `https://api.minimax.io`

#### Request Format
```json
{
  "model": "music-2.6",
  "prompt": "Indie folk, melancholic, perfect for a rainy night",
  "lyrics": "[verse]\\nStreetlights flicker...",
  "audio_setting": {
    "sample_rate": 44100,
    "bitrate": 256000,
    "format": "mp3"
  },
  "lyrics_optimizer": false,
  "is_instrumental": false,
  "output_format": "hex"
}
```

#### Critical Field Requirements

**Prompt Field**:
- For `music-2.6` / `music-2.6-free` with `is_instrumental: true`: **REQUIRED**, Length: 1-2000 characters
- For `music-2.6` / `music-2.6-free` (non-instrumental): Optional, Length: 0-2000 characters
- For `music-cover` / `music-cover-free`: Required, Length: 10-300 characters

**Lyrics Field**:
- For instrumental: Not required
- For non-instrumental: **REQUIRED**, Length: 1-3500 characters
- When `lyrics_optimizer: true` and `lyrics` is empty: system auto-generates lyrics from prompt

#### Response Status Codes (in `base_resp` object)
- `0`: Success
- `1002`: Rate limit triggered
- `1004`: Authentication failed
- `1008`: Insufficient balance
- `1026`: Content flagged for sensitive material
- `2013`: Invalid parameters
- `2049`: Invalid API key

### Current Knoxx → Blaze Request Format Issues

Our current `blaze.cljs` `build-body` function sends:
```clojure
{:model model
 :prompt music-prompt
 :lyrics_optimizer lyrics-optimizer?
 :is_instrumental instrumental?
 :sample_rate 44100
 :bitrate 256000
 :audio_format music-format
 :lyrics music-lyrics}
```

**Differences from MiniMax expected format**:
1. **Knoxx sends `audio_format`, `sample_rate`, `bitrate` at top level** — MiniMax expects them nested inside `audio_setting` object
2. **Knoxx doesn't send `output_format`** — MiniMax defaults to `hex` (fine)
3. **Knoxx doesn't include `stream` field** — MiniMax defaults to `false` (fine)

**This format mismatch could be causing MiniMax to reject requests with error 2013 (Invalid parameters)**.

### Prompt Size Analysis

From error logs: `prompt_chars: 631` — well within the 2000 character limit.
However, we should verify:
1. When `is_instrumental: true` (default when no lyrics provided), prompt is REQUIRED — we always send one
2. When lyrics are provided, lyrics are REQUIRED — we send them if present
3. The `lyrics_optimizer: true` without lyrics might cause issues if MiniMax expects explicit lyrics for non-instrumental

### Free Tier Models Available

MiniMax offers free tier models:
- `music-2.6-free`: Free-tier version of music-2.6
- `music-cover-free`: Free-tier version of music-cover

These have lower RPM but could be used for testing.

## Alternative Providers Research

### LocalAI (Best Match)
- **OpenAI API Compatible**: Yes (drop-in replacement)
- **Free**: Yes (MIT license, self-hosted)
- **Music Generation**: Yes (via MusicGen, Stable Audio, ACE-Step backends)
- **Hardware**: Runs on CPU or GPU (NVIDIA, AMD, Intel, Apple Silicon)
- **GitHub**: 46k+ stars, actively maintained
- **Limitation**: Requires local hardware, music quality varies by model

### Other Options
| Service | OpenAI Compatible | Free Tier | Notes |
|---------|------------------|-----------|-------|
| MusicAPI.ai | No | Trial only | $8/mo, Sonic/Producer models |
| AIMusicAPI.org | No | Yes | Unified REST, not OpenAI format |
| Google Lyria 3 | No | No | Via Gemini API, paid |
| Meta AudioCraft | No | Open source | Framework, not hosted API |

## Recommendations

### Immediate Actions
1. **Fix MiniMax request format**: Update `blaze.cljs` `build-body` to nest audio settings inside `audio_setting` object when sending to MiniMax
2. **Add `output_format: "hex"` explicitly**: Ensure MiniMax returns hex-encoded audio
3. **Add better error logging**: Log the `base_resp.status_code` and `base_resp.status_msg` from MiniMax responses

### Medium-term
1. **Add MiniMax directly to Proxx**: Bypass Blaze to eliminate potential transformation issues
2. **Support MiniMax free tier models**: Add `music-2.6-free` as fallback
3. **Implement request format transformation**: In `media-generations.ts`, transform OpenAI-compatible requests to MiniMax format

### Long-term
1. **Evaluate LocalAI**: Set up LocalAI with MusicGen for free local music generation
2. **Add as Proxx provider**: Integrate LocalAI into the provider strategy system

## Policy Changes Needed for Direct MiniMax Integration

To add MiniMax directly to Proxx (bypassing Blaze), the following policy files need updates:

1. **`05-provider-seed.edn`**: Add MiniMax provider seed with base URL and API key env var
2. **`10-model-families.edn`**: Add MiniMax music model patterns
3. **`20-provider-capabilities.edn`**: Add MiniMax music capability
4. **`30-model-routing.edn`**: Add routing clause for MiniMax music models

Additionally, `media-generations.ts` would need:
- Request format transformation (OpenAI → MiniMax)
- Response format handling (MiniMax → OpenAI)
- Provider selection logic (choose between Blaze and MiniMax)

## Next Steps

1. Verify MiniMax API key and balance status
2. Test direct MiniMax API calls with correct format
3. Implement request format fix in Knoxx
4. Monitor for `base_resp.status_code` values to identify specific failure modes
