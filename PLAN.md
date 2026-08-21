# Stavningstränare — iPhone + papper-optimering

## Mål (Johanna-direktiv 2026-08-21)

1. **iPhone-first** — primärt testat och optimerat för iPhone
2. **Skriva på papper** är huvudsyftet — appen ska stödja "se ord → skriv på papper"
3. Sekundärt: skriva i appen (valfritt)

## Nuläges-analys (2026-08-21)

### Vad fungerar
- 8 ord med svensk uttal (MiniMax Swedish_male_1_v1)
- 8 illustrationer (Doman-stil, vit bakgrund)
- Lyssna/Repetera/Rätta/Visa rätt svar/Dela-knappar
- Progress dots (8 st)
- Tangentbord: ←/→ navigation, R repetera, Enter rätta, V visa
- PWA: installeras på hemskärm, fungerar offline
- GitHub Pages deployad på `main`
- iOS safe-area-inset hanterad
- Title synlig på mobil (efter senaste fixar)

### Problem
- **"Visa rätt svar"-knappen sitter i mitten** — ska vara överst för papper-arbete
- **Ord-ordningen är alltid 1→8** — barn memorerar position istället för ordet
- **Ingen swipe-navigation** — krävs klick på pil-knappar (svårt för små fingrar)
- **Input-fältet är obligatoriskt** — inte nödvändigt om man skriver på papper
- **Touch-targets är 48px** — borde vara ≥48px enligt HIG
- **Inga smooth transitions** — abrupt byte mellan ord
- **Landscape-stöd saknas** — bara portrait

## Tre optimeringsnivåer

### 🟢 Nivå 1 — Snabba vinster (~30 min)
**Mål:** Fungerar på iPhone för papper-arbete.

| # | Förändring | Uppskattad tid |
|---|-----------|----------------|
| 1 | Flytta "Visa rätt svar"-knappen till toppen (header/above image) | 5 min |
| 2 | Slumpa ordning på load (`words.sort(() => Math.random() - 0.5)`) | 5 min |
| 3 | Swipe-navigation (touchstart/move/end, threshold 50px) | 15 min |
| 4 | Större "Nästa"-knapp (full-width, 56px height) | 5 min |

### 🟡 Nivå 2 — Mobil polish (~1-2 h)
**Mål:** Solid iPhone-upplevelse, ingen frustration.

| # | Förändring | Uppskattad tid |
|---|-----------|----------------|
| 1 | Större typsnitt (h1: 2rem, image: 240x200) | 15 min |
| 2 | Touch-targets ≥48px (kontrollera alla knappar) | 15 min |
| 3 | Smooth transitions mellan ord (fade/slide) | 30 min |
| 4 | Landscape-stöd (anpassa layout för liggande) | 30 min |
| 5 | Bättre safe-area-hantering (landscape + Dynamic Island) | 15 min |

### 🔴 Nivå 3 — Total omdesign (~3-4 h)
**Mål:** Helt dedikerat papper-arbete.

| # | Förändring | Uppskattad tid |
|---|-----------|----------------|
| 1 | Dölj input-fält som default, visa bara vid behov | 30 min |
| 2 | Nytt flow: "se ord kort (3s) → skriv på papper → nästa" | 60 min |
| 3 | "Blanda om"-knapp för ny ordning | 15 min |
| 4 | Smooth animationer (slide mellan ord) | 45 min |
| 5 | Bättre feedback (correct/wrong animationer) | 30 min |
| 6 | "Skriv på papper"-läge vs "Skriv i app"-läge toggle | 30 min |
| 7 | Streak/progress-feedback (efter X ord rätt) | 30 min |

## Tidsplan

| Nivå | Status | Deadline |
|-------|--------|----------|
| Nivå 1 | 🟡 Påbörjas nu | Idag (efter lunch) |
| Nivå 2 | ⏳ Väntar på godkännande | Idag |
| Nivå 3 | 📅 Planerad till natten | 2026-08-22 morgon |

## Implementation notes

### Nivå 1 implementation details

**Visa-knappen till toppen:**
```html
<!-- Före: -->
<div class="controls">
  <button>Lyssna</button>
  <button>Repetera</button>
  <button>Rätta</button>
  <button id="revealBtn">Visa rätt svar</button>
  <button>Dela</button>
</div>

<!-- Efter: -->
<button id="revealBtn" class="primary large">👁 Visa ordet</button>
<main class="card">...</main>
```

**Slumpa ordning:**
```javascript
function init() {
  // Slumpa ordning EN gång per session
  words.sort(() => Math.random() - 0.5);
  // ... rest of init
}
```

**Swipe:**
```javascript
let touchStartX = 0;
let touchStartY = 0;
document.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
    if (dx < 0) nextWord();
    else prevWord();
  }
});
```

## Test-plan
- [ ] iPhone 390x844 (iPhone 14 Pro)
- [ ] iPhone 375x812 (iPhone X)
- [ ] iPad 768x1024
- [ ] Desktop 1280x800
- [ ] Landscape på iPhone
- [ ] PWA install + offline
- [ ] Swipe med riktig touch-event

## Framgångskriterier
- ✅ Barn kan se ordet → skriva på papper → gå vidare på <10s
- ✅ Inga klick behövs förutom "Visa" och "Nästa"
- ✅ Fungerar på iPhone i vanlig hand (inte bara i simulator)
- ✅ Progress sparas mellan ordbyten (så barn vet var de är)

---

*Senast uppdaterad: 2026-08-21 av Lilly*
*Nivå 1 påbörjad: 2026-08-21 08:32 UTC*
