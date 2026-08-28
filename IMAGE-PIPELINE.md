# IMAGE-PIPELINE — Rättstavning illustrationer

Pipeline för att generera illustrationer till rättstavning-appen (Zacharias, 10 år, språkstörning). Baserad på lärdomar från v. 35 (2026-08-28).

## Verktyg

- **`mmx-cli` v1.0.22** — `mmx image generate`
- **Provider:** MiniMax (default)
- **Auth:** `MMX_CONFIG_DIR=/tmp/.mmx` (root:root workaround för `/home/node/.mmx/`)

## Kommando

```bash
export MMX_CONFIG_DIR=/tmp/.mmx
/home/node/.local-lib/node_modules/.bin/mmx image generate \
  --prompt "$PROMPT" \
  --aspect-ratio 1:1 \
  --out images/<id>.png \
  --quiet
```

- `--aspect-ratio 1:1` → 1024×1024 PNG
- Bildgenerering är **icke-deterministisk** — samma prompt ger INTE byte-identisk bild. För "good"-versioner: spara undan innan regenerering.

## AAC-stil-prefix (Johanna, 2026-08-28)

ALLTID inkludera detta i varje prompt:

```
En pedagogisk bildstöds-illustration med tydliga svarta konturer och
vit bakgrund. [ORD-SPECIFIK SCENE]. En varm orange-gul accentfärg.
Tydliga distinkta linjer, inte barnslig eller gullig stil.
Bildstöds-kvalitet som i en AAC-app.
```

**Inte barnslig** = realistiska proportioner för 10-åring (inte småbarns-huvuden)
**Tydliga distinkta linjer** = pedagogisk barnboks-illustration, inte skrafferad

## Per-ord-prompter (v. 35, slutleverans)

| ID | Ord | Prompt (efter prefix) | Symbol |
|----|-----|----------------------|--------|
| 01 | komplimang | Två barn, den ena ger tydlig tumme-upp och ler varmt mot den andra. Pratbubbla med **♥**. Mottagaren ler + rodnar lätt på kinderna. | pratbubbla + hjärta + rodnad |
| 02 | ångra | Ett barn som ser ledsen ut och tänker tillbaka. Tankebubbla med **✕**. | tankebubbla + kryss |
| 03 | språng | Ett barn som gör ett stort språng framåt genom luften. **↑ pil** som visar rörelseriktningen. | rörelsepil |
| 04 | hälsning | Två barn som står mittemot varandra, tittar på varandra och vinkar glatt med händerna. **Ingen bubbla.** | gest (ingen UI) |
| 05 | blänka | Stor tydlig sol i övre vänstra hörnet. Horisontell vattenlinje. Tydliga strålar lodrätt ner till vattnet med bred ljusreflektion. Sol och reflektion omisskänligt sammankopplade. | orsak→verkan-kedja |
| 06 | stänka | Ett barn som står bredvid en vattenhink och plaskar med händerna. Vattendroppar i luften och ovanför hinken. **Undvik "badar"**. | rörelseindikator |
| 07 | stinka | En tydlig metallgrå soptunna med lock och handtag. Tydliga vågiga spiraler ovanför som visar dålig lukt. | doftvågor |
| 08 | sänka | Vertikal flaggstång (topp med knopp → mitten med bas). Flagga vid exakt 50% av stångens höjd (INTE vid toppen). Pil som pekar rakt nedåt till höger. | rörelsepil + position |

## Symbol-filosofi

| Ordtyp | Symbol-strategi |
|--------|-----------------|
| Kommunikativ handling (komplimang, ångra) | **Pratbubbla/tankebubbla + symbol** (♥, ✕) |
| Interaktion mellan personer (hälsning) | **Bara gest** (vinkning räcker — ingen bubbla) |
| Handling med rörelse (språng, sänka) | **Pil som visar riktning** |
| Visuellt fenomen (blänka) | **Orsak→verkan-kedja explicit** |
| Olfaktorisk (stinka) | **Källa + vågiga spiraler** |
| Aktivitet (stänka) | **Rörelseindikator** (droppar i luften) |

## Vanliga misstag (UNDVIK dessa)

### 1. Spatiala negativer ("INTE vid toppen", "inte lutande")
**Fungerar INTE med MiniMax.** Modellen ignorerar negationen och fokuserar på substantiella ord.

**Lösning:** Använd POSITIVA specifikationer:
- ❌ "Flaggan INTE vid toppen"
- ✅ "Flaggan vid exakt 50% av stångens höjd"

### 2. "Badar" (bathing) → content-filter
**MiniMax blockerar "någon som badar".**

**Lösning:** Visa istället:
- "Barn som plaskar med händerna i en vattenhink"
- "Barn som står bredvid vatten och skvätter"

### 3. Tomma bubblor (pratbubbla/tankebubbla utan text)
**Tvetydigt — kan tolkas som vilken kommunikation som helst.**

**Lösning:** ALLTID tydlig symbol i bubblan (♥, ✕, etc.).

### 4. "Konceptet bra, bilden dålig"
**Modellen ritade rätt sak men dåligt.**

**Lösning:**
- Förstärk prompten med mer specifika detaljer (färg, proportioner, antal)
- Om fortfarande dåligt efter 2 försök: **spara "good"-versionen och regenerera INTE**

### 5. Bildgenerering är icke-deterministisk
**Samma prompt ger INTE byte-identisk bild.**

**Lösning:** Innan regenerering, spara undan nuvarande version:
```bash
cp images/XX.png images/XX.backup.png
```

## Workflow

1. **Börja med AAC-stil-prefix** (alltid samma)
2. **Lägg till ord-specifik scen** (från saol-data.json)
3. **Lägg till symbol/visualisering** (pratbubbla, pil, kedja, etc.)
4. **Generera** med `mmx image generate`
5. **Kopiera till** `rattstavning/images/<id>.png`
6. **Kopiera till** `/home/node/.openclaw/media/outbound/` (för Telegram)
7. **Skicka till Johanna via Telegram** med caption
8. **Vänta på OK** — regenerera INTE om bilden är OK
9. **Om bild är OK** → commita + pusha
10. **Om bild är dålig** → spara backup, regenerera med starkare prompt

## Nästa vecka (v. 36)

1. Hämta ny ord-lista från saol-data.json
2. Skriv 8 nya prompts med samma AAC-stil-prefix + nya symboler
3. Generera alla 8 med `mmx image generate`
4. Skicka till Johanna via Telegram
5. Vänta på OK per ord
6. Commita + pusha hela sviten

## Lärdomar från v. 35

- **MiniMax ignorerar negativer** — beskriv vad som ska vara där, inte vad som INTE ska vara där
- **Spatial precision** ("flagga vid 50% av stången") fungerar bättre än "INTE vid toppen"
- **Symboler i bubblor** behövs — tom bubbla = tvetydig
- **Orsak→verkan-kedjor** måste uttryckas explicit ("sol → vatten → reflektion")
- **Bildgenerering är icke-deterministisk** — spara "good"-versioner som backup
- **Johannas feedback-mönster:** "konceptet bra, bilden dålig" = mer specifika detaljer behövs
- **När Johanna ger upp** ("jag vet inte om jag orkar fixa mer") = tid att fråga om alternativ (hon laddar upp egen bild, eller vi accepterar nuvarande)

## Pipeline-status (2026-08-28)

| Ord | Status | Commit |
|-----|--------|--------|
| 01 komplimang | ✓ godkänd | dcbcc36 |
| 02 ångra | ✓ godkänd | dcbcc36 |
| 03 språng | ✓ godkänd | dcbcc36 |
| 04 hälsning | ✓ godkänd | dcbcc36 |
| 05 blänka | ✓ godkänd | dcbcc36 |
| 06 stänka | ✓ godkänd | dcbcc36 |
| 07 stinka | ✓ godkänd | dcbcc36 |
| 08 sänka | ✓ godkänd (Johanna forwardade exakt rätt version) | dcbcc36 |

**v. 35 illustrationer: KOMPLETT**
