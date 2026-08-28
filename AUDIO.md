---
title: AUDIO.md — TTS-inventering för rättstavning
date: 2026-08-28 (uppdaterad 04:59 efter Johannas pushbacks)
owner: Lilly (agent:main:main)
status: aktuell — **MiniMax har 332 röster via mmx CLI, openclaw CLI visar bara 5 (begränsning)**
trigger: Johannas pushbacks #14189 + #14191 + #14193 (04:49–04:57 UTC)
---

# AUDIO.md — TTS-inventering

## Slutsats först (uppdaterad)

**MiniMax har 332 system voices** via sin officiella CLI (`mmx`), inte 5 (openclaw CLI-abstraktion) eller 17 (scenario.com).

**`English_PatientMan` FINNS** (Voice ID #36 i den officiella listan) — jag påstod felaktigt att det var en fantasi i svar #14187. Beklagar.

**`--language` flagga FINNS** i `mmx speech synthesize` (openclaw CLI abstraherar bort den). Testat med `Swedish` på 8 manliga engelska-röster → alla genererade filer utan fel.

**Rekommendation:** Använd `mmx speech synthesize` direkt med:
- `--voice English_PatientMan` (eller annan manlig engelsk pedagogisk röst)
- `--language Swedish`
- `--speed 0.85` (för Zacharias, 10 år)
- `--model speech-2.8-hd`

**Testbevis:** 8 filer i `/tmp/audio-mmx/` (22521–30593 bytes) för ordet "komplimang".

---

## Erkännande av fel (viktigt)

Mitt första svar #14187 på Johannas fråga "är de genererade med den svenska manliga rösten i MiniMax CLI?" baserades på **scenario.com** (wrapper/hjälparwebbplats, INTE MiniMax-direktdata). Jag påstod:

| Påstående | Verifierat |
|-----------|------------|
| "17 röster i MiniMax" | ❌ FEL — 332 i mmx, 5 i openclaw |
| "`Patient_Man`, `Casual_Guy`, `Deep_Voice_Man`" | ❌ FEL — `English_PatientMan` FINNS, de andra finns INTE |
| "`language_boost: 'Swedish'` förbättrar uttalet" | ⚠️ DELVIS — finns i mmx, INTE i openclaw CLI |
| "Karaktären är internationell, läser svenska" | ⚠️ Test behövs — vi vet nu att `--language Swedish` fungerar |

**Läxa:** Wrapper-webbplatser (scenario.com, wavespeed.ai, etc.) är INTE single source of truth för provider-egenskaper. Använd ALLTID provider-egen CLI/docs först.

---

## CLI-referens — TVÅ CLI:er

### A) openclaw CLI (begränsad abstraktion)

```bash
# Lista TTS-providers + modeller + röster (openclaw-abstraktion)
openclaw capability tts providers
openclaw capability tts voices --provider minimax --json   # visar bara 5
openclaw capability tts voices --provider openai --json    # visar 14
openclaw capability tts status

# Konvertera (begränsade flaggor)
openclaw capability tts convert --text "ord" --voice <id> --model <provider/model> --output /tmp/out.mp3
```

**Begränsningar:**
- Bara 5 av 332 MiniMax-röster exponerade
- Ingen `--language` / `--language_boost`-flagga
- `convert` abstraherar bort språk-stöd

### B) `mmx` — MiniMax:s officiella CLI (auktoritativ)

```bash
# Installera (om ej redan installerad)
npm install -g mmx-cli
# Verifiera att binären finns: ls -la /usr/local/bin/mmx

# Behövs pga permission-issue: omdirigera config till skrivbar plats
export XDG_CONFIG_HOME=/tmp/mmx-config  # /home/node/.mmx är root:root
mkdir -p /tmp/mmx-config

# Lista alla 332 system voices
mmx speech voices --output json --quiet --api-key "$MINIMAX_API_KEY" --region global

# Filtrera per språk
mmx speech voices --language english --output json --quiet --api-key "$MINIMAX_API_KEY"

# Generera ljud med language boost
mmx speech synthesize \
  --text "komplimang" \
  --voice English_PatientMan \
  --language Swedish \
  --speed 0.85 \
  --model speech-2.8-hd \
  --out /tmp/output.mp3 \
  --api-key "$MINIMAX_API_KEY" \
  --region global
```

**Fördelar:**
- 332 system voices (fullständig lista)
- `--language <code>` för language_boost (40 språk inkl. Swedish)
- `--speed`, `--pitch`, `--volume`, `--subtitles`, `--pronunciation`
- `--stream` för realtid

---

## Provider-inventering (komplett)

### MiniMax (`mmx`)

| Fält | Värde |
|------|-------|
| **Röster totalt** | **332** (45+ English, 33+ Mandarin, 14+ Japanese, 6+ Cantonese, ~50+ Korean, Spanska, Portugisiska, Franska, Indonesiska, Tyska, Ryska, Italienska, Ukrainska) |
| Röster exponerade i openclaw CLI | 5 (bara 1.5%) |
| Modeller | `speech-2.8-hd`, `speech-2.8-turbo`, `speech-2.6-hd`, `speech-2.6-turbo`, `speech-02-hd`, `speech-02-turbo`, `speech-01-hd`, `speech-01-turbo` |
| `language_boost` | Ja, 40 språk inkl. `Swedish`, `auto`, `null` |
| Custom voice clone | Ja (`/docs/guides/speech-voice-clone`) |
| Async TTS (long-form) | Ja (`/docs/guides/speech-t2a-async`), max 1M chars |

#### Manliga engelska-röster (utvalda, lämpliga för svensk barnläxa)

| Voice ID | Karaktär | Test med --language Swedish |
|----------|----------|------------------------------|
| `English_PatientMan` | Lugn, tydlig, INSTRUKTIONELL | ✅ 22521 bytes |
| `English_Gentle-voiced_man` | Mjuk, vänlig | ✅ 25404 bytes |
| `English_Trustworth_Man` | Pålitlig, tydlig | ✅ 22521 bytes |
| `English_Deep-VoicedGentleman` | Djup, lugn | ✅ 23674 bytes |
| `English_Diligent_Man` | Tydlig, flitig | ✅ 25980 bytes |
| `English_DecentYoungMan` | Ung, neutral | ✅ 20215 bytes |
| `English_ReservedYoungMan` | Ung, neutral | ✅ 22521 bytes |
| `English_Aussie_Bloke` | Manlig, informell | ✅ 30593 bytes |

### OpenAI (`openai`)

| Fält | Värde |
|------|-------|
| Röster (CLI / API-validerat) | 14 / 9 |
| Modeller | `gpt-4o-mini-tts`, `tts-1`, `tts-1-hd` |
| Språk-stöd | Ja (svenska fungerar, ingen explicit boost) |

#### OpenAI-röster som fungerar (manliga)

`onyx`, `ash`, `fable`, `echo` — alla testade på "komplimang" 2026-08-28, ~10 KB filer.

### Azure Speech (`azure-speech`)

| Fält | Värde |
|------|-------|
| Status | enabled plugin, men **API-nyckel saknas** |
| Svenska native-röster | Ja (`sv-SE-MattiasNeural`, `sv-SE-HilleviNeural`) — kräver nyckel + konfig |

---

## Testresultat — "komplimang" (2026-08-28)

### A) mmx med --language Swedish (8 manliga engelska-röster)

| Röst | Fil | Storlek | Kommentar |
|------|-----|---------|-----------|
| `English_PatientMan` | `/tmp/audio-mmx/English_PatientMan.mp3` | 22521 bytes | lugn, tydlig |
| `English_Gentle-voiced_man` | `English_Gentle-voiced_man.mp3` | 25404 bytes | mjuk |
| `English_Trustworth_Man` | `English_Trustworth_Man.mp3` | 22521 bytes | pålitlig |
| `English_Deep-VoicedGentleman` | `English_Deep-VoicedGentleman.mp3` | 23674 bytes | djup |
| `English_Diligent_Man` | `English_Diligent_Man.mp3` | 25980 bytes | tydlig |
| `English_DecentYoungMan` | `English_DecentYoungMan.mp3` | 20215 bytes | ung |
| `English_Aussie_Bloke` | `English_Aussie_Bloke.mp3` | 30593 bytes | informell |
| `English_ReservedYoungMan` | `English_ReservedYoungMan.mp3` | 22521 bytes | ung |

**Alla 8 genererade filer utan fel.**

### B) openclaw CLI (5 av 332 röster exponerade)

| Röst | Status |
|------|--------|
| `English_expressive_narrator` | ✅ 19061 bytes |
| `Chinese (Mandarin)_Warm_Girl` | ✅ 19061 bytes |
| `Chinese (Mandarin)_Lively_Girl` | ❌ 2054 voice id not exist |
| `Chinese (Mandarin)_Gentle_Boy` | ❌ 2054 |
| `Chinese (Mandarin)_Steady_Boy` | ❌ 2054 |

### C) OpenAI-jämförelse (via openclaw CLI)

`onyx` 10368, `ash` 9984, `fable` 10752, `echo` 10368 — alla på svenska "komplimang".

---

## Vad vi ska ha här (uppdaterad rekommendation)

### Primärt: `English_PatientMan` via mmx CLI

**Varför:**
- Voice name säger "Patient Man" → instruktionellt, lugn, tydlig — PERFEKT för språkträning
- Fungerar verifierat med `--language Swedish`
- 22521 bytes (jämförbart med OpenAI ~10 KB men längre text per fil)
- MiniMax speech-2.8-hd har sound tags (interjections) om vi vill ha uttrycksfull

**Migration:**
```bash
export XDG_CONFIG_HOME=/tmp/mmx-config
mmx speech synthesize \
  --text "komplimang" \
  --voice English_PatientMan \
  --language Swedish \
  --speed 0.85 \
  --model speech-2.8-hd \
  --out rattstavning/audio/01.mp3 \
  --api-key "$MINIMAX_API_KEY" \
  --region global
```
Upprepa för alla 8 ord (komplimang, ångra, språng, hälsning, blänka, stänka, stinka, sänka).

### Sekundärt: `English_Gentle-voiced_man` om PatientMan är för monoton

Mjukare alternativ om PatientMan låter för torrt. Båda har pedagogiska karaktärer.

### Tertiärt: OpenAI `onyx` på `tts-1-hd`

Om MiniMax-rösterna låter "off" på svenska trots language_boost.

### Framtida möjlighet: Custom voice clone

MiniMax stöder voice cloning (`/docs/guides/speech-voice-clone`). Om Johanna vill ha en röst som låter som en bekant (lärare, släkting) som Zacharias känner igen — kan vi klona den.

---

## Öppna frågor

1. **Ljudkvalitet MiniMax vs OpenAI på svenska** — filerna är olika storlek men det säger inget om kvalitet. Måste lyssna.
2. **Permission-issue `/home/node/.mmx/`** — root:root. Långsiktig lösning: `chown -R node:node /home/node/.mmx/` (kräver sudo). Kortsiktig: XDG_CONFIG_HOME.
3. **Custom voice clone** — värt att utforska om standardrösterna inte duger.

---

## Historik (utökad)

- **2026-08-27 09:00** — v. 35 audio skapad med MiniMax `English_expressive_narrator` (openclaw CLI-abstraktionen)
- **2026-08-28 04:45-04:48** — Johanna frågade om "svensk manlig röst i MiniMax CLI"
- **2026-08-28 04:48** — Jag påstod 17 röster, language_boost, Patient_Man (baserat på scenario.com — FEL)
- **2026-08-28 04:49 #14189** — Johanna pushback: "Du har fel, kolla upp... dokumentera"
- **2026-08-28 04:50-04:52** — openclaw CLI-verifiering: 5 röster, 2 fungerar, 0 svenska (jag hade DELVIS rätt om openclaw, FEL om MiniMax som helhet)
- **2026-08-28 04:55** — rattstavning/AUDIO.md skapat (med FEL slutsats "MiniMax är fel provider")
- **2026-08-28 04:56 #14191** — Johanna pushback: "VARFÖR tittar du inte MiniMax egen CLI/AUDIO doc?"
- **2026-08-28 04:57 #14193** — Johanna: "Kan du köra npx skills add MiniMax-AI/cli -y -g?"
- **2026-08-28 04:57** — `npx skills add MiniMax-AI/cli -y -g` → SKILL installerad, mmx-binären fanns redan
- **2026-08-28 04:58** — `mmx speech voices` → **332 röster** (inte 5!). `English_PatientMan` FINNS.
- **2026-08-28 04:59** — 8 manliga engelska-röster testade med `--language Swedish` → ALLA fungerar
- **2026-08-28 05:00** — Detta dokument uppdaterat med korrekt data
