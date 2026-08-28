---
title: AUDIO-PIPELINE.md — Rättstavning-ljudfiler (app-specifik info)
date: 2026-08-28 (skapad efter Johannas direktiv #14345 — dokumentera i DITT WORKSPACE och i repot för appen)
owner: Lilly (agent:main:main)
status: aktuell
---

# AUDIO Pipeline — App-specifik info

## Vad vi har

8 MP3-filer i `rattstavning/audio/`:
- `01.mp3` (komplimang)
- `02.mp3` (ångra)
- `03.mp3` (språng)
- `04.mp3` (hälsning)
- `05.mp3` (blänka)
- `06.mp3` (stänka)
- `07.mp3` (stinka)
- `08.mp3` (sänka)

## Hur `app.js` läser dem

I `app.js`, ljudfilerna läses som:

```js
const audio = new Audio(`audio/${word.id}.mp3`);
audio.play();
```

eller liknande. Pathen är relativ till `index.html` (roten av repot).

## Configuration (auktoritativ)

Voice: `Swedish_male_1_v1`
Model: `speech-2.8-hd`
Speed: `0.85`
Prompt: `Säg ordet #"<ord>"` (med `#` framför citationstecknet)

## Hur regenerera (kort version)

Se workspace-repo för fullständiga instruktioner:

**https://github.com/fam-hulten/lilly-ops/blob/main/MMX-AUDIO-PIPELINE.md**

Kort version:
```bash
export MMX_CONFIG_DIR=/tmp/.mmx
mmx auth login --api-key "***" --region global
for entry in "01 komplimang" "02 ångra" "03 språng" "04 hälsning" "05 blänka" "06 stänka" "07 stinkta" "08 sänka"; do
  id=$(echo "$entry" | cut -d" " -f1)
  word=$(echo "$entry" | cut -d" " -f2-)
  mmx speech synthesize --text "Säg ordet #\"${word}\"" --voice Swedish_male_1_v1 --model speech-2.8-hd --out "audio/${id}.mp3"
done
git add audio/ && git commit -m "feat(audio): Regenerera" && git push origin main
```

## Git-historik för audio/

| Commit | Datum | Innehåll |
|--------|-------|----------|
| `fbd2b0d` | 2026-08-22 | "Läxa v.35: 8 nya ord" |
| `6f841e4` | 2026-08-28 | "Regenerera v. 35 med Swedish_male_1_v1 + speech-2.8-hd" |

## Saol-data.json (vad orden betyder)

Se `saol-data.json` i repot. Ordet "stinkta" på rad 7 är stavfel — ska vara "stinka".

## Nästa gång du regenererar

1. Logga in på MiniMax (se MMX-AUTH.md för details)
2. Kör scriptet ovan
3. Committa + pusha

## Vanliga misstag

- � Använd `--voice English_PatientMan` eller `--voice English_expressive_narrator` → rätt är `Swedish_male_1_v1`
- ❌ Använd `--region cn` → rätt är `--region global`
- ❌ Använd `--language Swedish` → utelämna, auto-detect
- ❌ Glöm `#` i prompt → blir ingen paus

## Referenser

- Workspace-repo (lilly-ops): https://github.com/fam-hulten/lilly-ops/blob/main/MMX-AUDIO-PIPELINE.md
- Workspace-repo (lilly-ops): https://github.com/fam-hulten/lilly-ops/blob/main/MMX-AUTH.md
- App-repo (rattstavning): https://github.com/fam-hulten/rattstavning/blob/main/PLAN.md
- App-repo (rattstavning): https://github.com/fam-hulten/rattstavning/blob/main/app.js
- App-repo (rattstavning): https://github.com/fam-hulten/rattstavning/blob/main/saol-data.json
