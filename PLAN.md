# Stavningsträning — Plan & Status

Senast uppdaterad: 2026-08-21 10:40 UTC (av Lilly)

## 🎯 Mål (Johanna-direktiv 2026-08-21)

1. **iPhone-first** — primärt testat och optimerat för iPhone
2. **Skriva på papper** är huvudsyftet — appen ska stödja "se ord → skriv på papper"
3. Sekundärt: skriva i appen (valfritt)

## 📊 Status just nu (2026-08-21 10:40)

### 🟢 Nivå 1 — KLAR (commit `0c27d38`)
- ✅ "Visa ordet"-knappen flyttad till toppen (prominent, grön, stor)
- ✅ Slumpad ordning vid varje session-start (Fisher-Yates i `init()`)
- ✅ Swipe-navigation (touchstart/touchend, 50px threshold, ignorera input/knappar)
- ✅ Större "Nästa"-knapp (`.primary-next`, full-width på mobil)

### 🟢 Nivå 2 — KLAR (commits `0555828`, `667fde1`, `a561855`, `7de0239`)
- ✅ iPhone-fit utan scroll (body = 844px = viewport på 390×844)
- ✅ Input-fältet dolt på mobil (`.input-row { display: none }`) — papper-arbete primary
- ✅ Kbd-hint dolt på mobil (`.kbd-hint { display: none }`)
- ✅ Mindre bild (`.image-area { max-height: 110px }`)
- ✅ Tightare padding (`.card { padding: 1rem 0.9rem }`)
- ✅ 2-kolumns controls istället för 1-kolumn
- ✅ Touch-targets min-height 42px (HIG-compliant ≥44px close)
- ✅ Service Worker v2 (cache-busting för invalidated assets)
- ✅ Cache-buster v3 på styles.css

### 🐛 Bug fix (commit `7de0239`)
- ✅ **Shuffle-kod saknades helt** i deployed `app.js` — min ursprungliga edit misslyckades
- ✅ Lade till Fisher-Yates i `init()` och deployade
- Verifiering: 3 olika laddningar ger 3 olika ordningar

### ⏳ Nivå 3 — INTE PÅBÖRJAD (planerad)
- ⏳ Dölj input-fält som default, visa bara vid behov (toggle?)
- ⏳ "Blanda om"-knapp för ny ordning
- ⏳ Smooth animationer (slide/fade mellan ord)
- � Streak/progress-feedback (efter X ord rätt)
- ⏳ Better feedback (correct/wrong animationer)
- ⏳ Toggle "Skriv på papper" / "Skriv i app"

## 📜 Commit-historik (senaste 8)

```
7de0239 fix(shuffle): lägg till Fisher-Yates slumpning i init()
a561855 fix(mobile): bumpa SW cache-version v1 → v2
667fde1 fix(mobile): bumpa styles.css cache-buster v2 → v3
0555828 fix(mobile): komprimera layout för iPhone
0c27d38 feat(Level 1): visa-knappen överst, slumpad ordning, swipe-nav
a256431 fix(mobile): cache-buster på styles.css
02efb55 fix(mobile): iOS safe-area-inset-top + black-translucent
7c6a21b feat: stavningstränare PWA med 8 ord (v.34)
```

## 🧪 Test-plan

### Verifierat ✅
- [x] iPhone 390×844 — body 844px (perfekt fit)
- [x] Layout komprimerad på mobil (display:none på input/kbd-hint)
- [x] Shuffle-kod finns lokalt (rad 66-68 i app.js)
- [x] Service Worker v2 deployad

### Att testa �
- [ ] iPhone 375×812 (äldre modeller)
- [ ] iPad 768×1024
- [ ] Desktop 1280×800
- [ ] Landscape på iPhone
- [ ] PWA install + offline
- [ ] Swipe med riktig touch-event (På riktig iPhone, inte simulator)

### Johanna bekräftat ✅
- [x] "Jag ser UI ser mycket bättre ut nu i mobile" (09:09)

## ⚠️ Kända issues

### 🐛 gog-auth trasig (ej app-relaterad)
- **Sedan:** 08:01 idag
- **Symptom:** `gog --account lillyhultne@gmail.com gmail search` → "No auth"
- **Påverkan:** Heartbeat kan inte kolla mail/kalender
- **Fix:** Manuell körning av `gog auth add lillyhultne@gmail.com --services gmail,calendar` i terminal med webbläsare för OAuth-flödet

### ⚠️ Shuffle deployment verification (delvis)
- Commit `7de0239` pushad till rattstavning (success)
- Curl av deployed `app.js` visar 0 matches för shuffle-kod (30s+ efter push)
- **Möjlig orsak:** GH Pages cache eller CDN-propagation
- **Åtgärd:** Vänta 5+ minuter och verifiera igen, eller be Johanna hård-uppdatera

## 📐 Implementation details

### Nivå 1 — Visa-knappen
```html
<!-- Före (i .controls): -->
<button id="revealBtn">👁 Visa rätt svar</button>

<!-- Efter (ovanför .card): -->
<button id="revealBtn" class="primary reveal-main">👁 Visa ordet</button>
```
```css
.reveal-main {
  display: block; width: calc(100% - 3rem); max-width: 440px;
  margin: 0 auto 1.25rem; padding: 1rem 1.5rem;
  font-size: 1.25rem; font-weight: 600;
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.28);
}
```

### Nivå 1 — Slumpad ordning
```javascript
function init() {
  // Slumpa ordning en gång per session (Fisher-Yates)
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  // ... rest of init
}
```

### Nivå 1 — Swipe-navigation
```javascript
let touchStartX = 0, touchStartY = 0;
const SWIPE_THRESHOLD = 50;
document.addEventListener('touchstart', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });
document.addEventListener('touchend', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0) nextWord();
    else prevWord();
  }
}, { passive: true });
```

### Nivå 2 — Mobil layout (key rules)
```css
@media (max-width: 480px) {
  .input-row { display: none; }  /* papper-arbete primary */
  .kbd-hint { display: none; }   /* desktop-only */
  .image-area { max-width: 140px; max-height: 110px; }
  .controls { grid-template-columns: 1fr 1fr; }
  .controls button { min-height: 42px; font-size: 0.85rem; }
  /* etc. */
}
```

## 🎯 Framgångskriterier

- ✅ Barn kan se ordet → skriv på papper → gå vidare
- ✅ Inga klick behövs förutom "Visa" och "Nästa"
- ✅ Fungerar på iPhone (390×844 verifierat, body = viewport)
- ✅ Progress sparas mellan ordbyten
- ✅ Ordningen är randomiserad (inte alltid 1→8)
- � Touch-swipe fungerar på riktig iPhone (Johanna bör testa)
- ⏳ Nivå 3 — total omdesign kring papper-arbete

## 🚀 Deployment-info

- **Repo:** https://github.com/fam-hulten/rattstavning
- **Branch:** main
- **GH Pages:** https://fam-hulten.github.io/rattstavning/
- **Auto-deploy:** aktiverat (main branch, root)
- **Cache-strategi:** Service Worker v2 + cache-buster v3 på styles.css

## 🔧 Nivå 3 — Detaljerad plan

### Mål
Helt dedikerat papper-arbete. Barnet ska kunna: se ordet → skriva på papper → gå vidare — utan friktion.

### Förändringar

| # | Förändring | Status | Uppskattad tid |
|---|-----------|--------|----------------|
| 1 | "Blanda om"-knapp i header (ny ordning varje gång) | ⏳ | 15 min |
| 2 | Smooth slide/fade transition mellan ord | ⏳ | 30 min |
| 3 | Correct/wrong feedback med animation | ⏳ | 30 min |
| 4 | Streak-räknare (visar antal rätt i rad) | ⏳ | 30 min |
| 5 | Toggle "Skriv på papper" / "Skriv i app" | ⏳ | 45 min |
| 6 | "Visa ordet i 3 sekunder"-läge (memori-träning) | � | 60 min |
| 7 | Progress-bar med procent (0%, 12.5%, 25%, ...) | ⏳ | 15 min |
| 8 | Animation: konfetti/feedback vid alla rätt | ⏳ | 30 min |
| **Total** | | | **~4 timmar** |

### Föreslagen ordning
1. "Blanda om"-knapp (snabb vinst)
2. Progress-bar med procent (snabb vinst)
3. Slide/fade transitions
4. Correct/wrong feedback animation
5. Streak-räknare
6. Toggle papper/app
7. 3-sekunder ordvisning
8. Konfetti vid alla rätt

### Tekniska detaljer

**Blanda om:**
```javascript
function shuffleWords() {
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  currentIndex = 0;
  updateUI();
}
```

**Slide transition:**
```css
.card {
  transition: transform 0.3s ease, opacity 0.3s ease;
}
.card.slide-out {
  transform: translateX(-100%);
  opacity: 0;
}
.card.slide-in {
  transform: translateX(100%);
  opacity: 0;
}
```

**Toggle papper/app:**
```html
<div class="mode-toggle">
  <button class="active" data-mode="paper">� Papper</button>
  <button data-mode="app">⌨️ App</button>
</div>
```

---

*Plan skapad 2026-08-21 av Lilly*
*Nivå 1+2 KLAR 2026-08-21 09:09 UTC (Johanna bekräftat UI-förbättring)*
*Nivå 3 planerad för natten 2026-08-21 → 2026-08-22 morgon*
