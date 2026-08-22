# Stavningsträning

En enkel PWA för stavningsträning. Eleven lyssnar på ordet, ser en bild, skriver sitt svar och jämför med facit.

## Funktioner

- 🔊 **Lyssna** — spelar upp ordet
- ↻ **Repetera** — spelar upp igen
- ✏️ **Skriv** — eleven skriver sitt svar i ett fält
- ✓ **Rätta** — direkt feedback (rätt / fel)
- 👁 **Visa rätt svar** — jämför elevens svar med rätt stavning
- ↗ **Dela** — Web Share API med fallback till urklipp
- 📱 **PWA** — installeras på hemskärmen, fungerar offline
- 🌗 **Mörkt läge** — följer systeminställning
- ⌨️ **Tangentbord** — `←/→` navigera, `R` repetera, `Enter` rätta, `V` visa

## Innehåll

| Fil | Funktion |
|-----|----------|
| `index.html` | App-skal |
| `styles.css` | Styling (inkl. dark mode) |
| `app.js` | Logik |
| `manifest.json` | PWA-manifest |
| `sw.js` | Service worker (offline cache) |
| `saol-data.json` | Ord-data + metadata |
| `audio/01-08.mp3` | Uttal per ord |
| `images/01-08.png` | Bild per ord |
| `icons/icon-192/512.png` | PWA-ikoner |

## Lägga till/ändra ord

Redigera `saol-data.json`:

```json
{
  "meta": {
    "title": "Läxa för v. xx — Klass 4 Lejonskolan",
    "subtitle": "Lyssna, se bilden, skriv ordet och jämför med facit"
  },
  "words": [
    {
      "id": "01",
      "text": "boka",
      "audio": "audio/01.mp3",
      "image": "images/01.png",
      "definition": "att reservera (en biljett, ett bord)",
      "synonyms": ["reservera", "beställa"],
      "pronunciation": "boo-ka"
    }
  ]
}
```

För varje nytt ord behövs:
- `text` — det rätta ordet (det eleven ska stava)
- `audio` — sökväg till mp3/wav
- `image` — sökväg till PNG/JPG, eller emoji som fallback

## Generera nya ljudfiler

Ljudfilerna genereras med **MiniMax TTS API**, röst `Swedish_male_1_v1` (samma röst genom hela appen — Lyssna/Repetera-knapparna spelar MP3-filen direkt, ingen webbläsar-TTS, för att undvika röst-blandning).

- **Röst:** `Swedish_male_1_v1` (manlig, tydlig svenska)
- **Tempo:** normal
- **Format:** mp3, 64–128 kbps
- **Filnamn:** `audio/<id>.mp3` där `<id>` matchar word.id (t.ex. `audio/01.mp3`)

**Viktigt:** Om du byter röst måste alla 8 filer bytas — annars blir det röst-blandning mellan orden. Verifiera att alla låter identiskt innan deploy.

## Generera nya bilder

Bilderna är AI-genererade (Doman/pedagogisk stil) — tydligt enskilt motiv, vit bakgrund, barnvänlig. Generera gärna med samma stil för alla 8 för konsistens.

För förväxlingspar (t.ex. boka/bocka) är det viktigt att bilderna gör ÅTSKILDNADEN tydlig:
- **boka** → bokning/biljett
- **bocka** → person som bockar sig

## Deploy

Appen är statisk (HTML/CSS/JS). Deploya via:

- **GitHub Pages:** Settings → Pages → `main` branch, root
- **EgenSajt / FTP:** Ladda upp allt i repot till webbroot
- **Netlify / Vercel:** drag-and-drop mappen

Service worker kräver HTTPS (eller `localhost`).

## Testa lokalt

```bash
python3 -m http.server 8000
# Öppna http://localhost:8000
```

Service worker fungerar inte från `file://` — använd HTTP.

## Licens

MIT — se `LICENSE`.