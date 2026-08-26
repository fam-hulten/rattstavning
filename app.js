// Stavningsträning — PWA
// Loads saol-data.json, presents words with audio + image, lets user type and compare.

let words = [];
let meta = {};
let currentIndex = 0;
let revealed = false;
let deferredInstallPrompt = null;

const audio = new Audio();
audio.preload = 'auto';

const imageArea = document.getElementById('imageArea');
const audioIndicator = document.getElementById('audioIndicator');
const currentSpan = document.getElementById('current');
const totalSpan = document.getElementById('total');
const progressBar = document.getElementById('progressBar');
const titleEl = document.getElementById('title');
const subtitleEl = document.querySelector('.subtitle');
const hintEl = document.getElementById('hint');
const guessInput = document.getElementById('guessInput');
const feedbackEl = document.getElementById('feedback');

const listenBtn = document.getElementById('listenBtn');
const repeatBtn = document.getElementById('repeatBtn');
const checkBtn = document.getElementById('checkBtn');
const revealBtn = document.getElementById('revealBtn');
const shareBtn = document.getElementById('shareBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

const installHint = document.getElementById('installHint');
const installBtn = document.getElementById('installBtn');
const dismissInstallBtn = document.getElementById('dismissInstall');
const shuffleBtn = document.getElementById('shuffleBtn');
const practiceAgainBtn = document.getElementById('practiceAgainBtn');
const streakCounter = document.getElementById('streakCounter');
const streakNum = document.getElementById('streakNum');
const progressText = document.getElementById('progressText');
const mode3sBtn = document.getElementById('mode3sBtn');
const modeToggle = document.getElementById('modeToggle');
const inputRow = document.querySelector('.input-row');
const confettiCanvas = document.getElementById('confettiCanvas');

let streak = 0;
let wordStats = {}; // { [wordText]: { attempts: 0, correctCount: 0, lastResult: null } }
let appMode = 'paper'; // 'paper' or 'app'
let threeSecondTimer = null;
let needsResort = false; // true when a wrong answer requires re-sorting

const allButtons = () => [listenBtn, repeatBtn, checkBtn, revealBtn, shareBtn, prevBtn, nextBtn];

async function loadData() {
  try {
    const res = await fetch('saol-data.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    words = data.words || [];
    meta = data.meta || {};
    if (meta.title) titleEl.textContent = meta.title;
    if (meta.subtitle) subtitleEl.textContent = meta.subtitle;
    if (!words.length) throw new Error('Inga ord i datafilen');
    init();
  } catch (err) {
    console.error('Kunde inte ladda saol-data.json:', err);
    showError('Kunde inte ladda data. Kontrollera att saol-data.json finns.');
  }
}

function showError(msg) {
  imageArea.alt = msg;
  imageArea.removeAttribute('src');
  imageArea.classList.add('placeholder');
  hintEl.textContent = msg;
  hintEl.classList.add('error-state');
  allButtons().forEach(b => b.disabled = true);
  guessInput.disabled = true;
}

function init() {
  // Slumpa ordning en gång per session (Level 1 — Fisher-Yates)
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  totalSpan.textContent = words.length;
  renderProgress();
  updateUI();
}

function shuffleWords() {
  // Fisher-Yates — ny slumpad ordning från början
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  currentIndex = 0;
  updateUI();
  playAudio();
  sortByDifficulty(); // B30: prioritize difficult words on shuffle
  shuffleBtn.textContent = '✅';
  setTimeout(() => { shuffleBtn.textContent = '🔀 Blanda om'; }, 800);
}

// Nivå 3+: "Öva igen" — samma som shuffleWords men separat knapp
// (alltid synlig längst ner, extra prominent på sista bilden)
function practiceAgain() {
  for (let i = words.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [words[i], words[j]] = [words[j], words[i]];
  }
  currentIndex = 0;
  updateUI();
  sortByDifficulty(); // B30: prioritize difficult words on restart
  playAudio();
  practiceAgainBtn.textContent = '✅ Startar om…';
  setTimeout(() => { practiceAgainBtn.textContent = '🔄 Öva igen'; }, 800);
}

function renderProgress() {
  progressBar.innerHTML = '';
  words.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'progress-dot';
    if (i < currentIndex) dot.classList.add('completed');
    if (i === currentIndex) dot.classList.add('active');
    progressBar.appendChild(dot);
  });
  // Nivå 3: Progress percentage (räknar "nådd position", så 8/8 = 100%)
  const pct = words.length ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;
  progressText.textContent = pct + '%';
}



function playAudio() {
  const word = words[currentIndex];
  if (!word || !word.audio) {
    audioIndicator.textContent = '⚠️ Inget ljud för detta ord';
    audioIndicator.classList.add('error');
    return;
  }
  audio.src = word.audio;
  audio.currentTime = 0;
  audioIndicator.textContent = '🔊 Spelar…';
  audioIndicator.classList.remove('error');
  audioIndicator.classList.add('playing');
  const p = audio.play();
  if (p && p.catch) p.catch(err => console.error('Audio playback failed:', err));
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[m]);
}

function normalize(str) {
  return str.toLowerCase().trim();
}

function checkGuess() {
  const word = words[currentIndex];
  const guess = normalize(guessInput.value);
  if (!guess) {
    feedbackEl.textContent = 'Skriv ditt svar först';
    feedbackEl.className = 'feedback feedback-hint';
    return;
  }
  const correct = normalize(word.text);
  if (guess === correct) {
    feedbackEl.innerHTML = `✓ Rätt stavat! <strong>${escapeHtml(word.text)}</strong>`;
    feedbackEl.className = 'feedback feedback-correct';
    revealBtn.textContent = '👁 Visa rätt svar';
    revealed = false;
    // Nivå 3: Streak
    streak++;
    streakNum.textContent = streak;
    streakCounter.classList.add('visible');
    streakCounter.classList.remove('pulse');
    void streakCounter.offsetWidth; // reflow
    streakCounter.classList.add('pulse');
    setTimeout(() => streakCounter.classList.remove('pulse'), 500);

    // B30: Track correct answer per word
    const wKey = word.text;
    if (!wordStats[wKey]) wordStats[wKey] = { attempts: 0, correctCount: 0, lastResult: null };
    wordStats[wKey].attempts++;
    wordStats[wKey].correctCount++;
    wordStats[wKey].lastResult = 'correct';

    // Nivå 3: Konfetti när sista ordet är rätt
    if (streak === words.length) {
      setTimeout(launchConfetti, 300);
    }
  } else {
    // P1-förbättring: visa rätt svar med markering vid fel
    const guessText = guessInput.value.trim();
    const correctText = word.text;
    let highlightedGuess = '';
    let i = 0;
    // Markera felaktiga bokstäver
    while (i < guessText.length && i < correctText.length) {
      if (guessText[i].toLowerCase() === correctText[i].toLowerCase()) {
        highlightedGuess += escapeHtml(guessText[i]);
      } else {
        highlightedGuess += `<span class="wrong-letter">${escapeHtml(guessText[i])}</span>`;
      }
      i++;
    }
    // Lägg till extra/mindre bokstäver
    if (guessText.length > correctText.length) {
      highlightedGuess += `<span class="wrong-letter">${escapeHtml(guessText.slice(i))}</span>`;
    } else if (guessText.length < correctText.length) {
      highlightedGuess += `<span class="missing-letter">${escapeHtml(correctText.slice(i))}</span>`;
    }
    feedbackEl.innerHTML = `✗ Inte rätt.<br>Du skrev: <strong>${highlightedGuess}</strong><br>Rätt: <strong>${escapeHtml(correctText)}</strong>`;
    feedbackEl.className = 'feedback feedback-wrong';
    streak = 0;
    streakCounter.classList.remove('visible');
  }
}

function reveal() {
  const word = words[currentIndex];
  const guess = guessInput.value.trim();
  if (revealed) {
    feedbackEl.textContent = '';
    feedbackEl.className = 'feedback';
    revealed = false;
    revealBtn.textContent = '👁 Visa rätt svar';
    return;
  }
  const userPart = guess ? `Du skrev: <strong>${escapeHtml(guess)}</strong><br>` : '';
  feedbackEl.innerHTML = `${userPart}Rätt svar: <strong>${escapeHtml(word.text)}</strong>`;
  feedbackEl.className = 'feedback feedback-reveal';
  revealed = true;
  revealBtn.textContent = '🙈 Dölj';
}

function nextWord() {
  if (currentIndex < words.length - 1) {
    const card = document.querySelector('.card');
    card.classList.add('slide-out-left');
    setTimeout(() => {
      currentIndex++;
      updateUI();
      playAudio();
      card.classList.remove('slide-out-left');
      card.classList.add('slide-in');
      setTimeout(() => card.classList.remove('slide-in'), 300);
    }, 250);
  }
}

function prevWord() {
  if (currentIndex > 0) {
    const card = document.querySelector('.card');
    card.classList.add('slide-out-right');
    setTimeout(() => {
      currentIndex--;
      updateUI();
      card.classList.remove('slide-out-right');
      card.classList.add('slide-in');
      setTimeout(() => card.classList.remove('slide-in'), 300);
    }, 250);
  }
}

async function shareApp() {
  const shareData = {
    title: meta.title || 'Stavningsträning',
    text: 'Öva stavning med auditivt och visuellt stöd',
    url: window.location.href
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.error('Share failed:', err);
    }
  }
  // Fallback: copy URL
  try {
    await navigator.clipboard.writeText(window.location.href);
    const orig = shareBtn.textContent;
    shareBtn.textContent = '✓ Länk kopierad';
    setTimeout(() => { shareBtn.textContent = orig; }, 2000);
  } catch (err) {
    console.error('Clipboard failed:', err);
    shareBtn.textContent = '⚠️ Kunde inte dela';
  }
}

// Events
// Lyssna/Repetera spelar vår egen ljudfil (MiniMax Swedish_male_1_v1)
// — INTE webbläsar-TTS, för att hålla samma röst som på bilden.
listenBtn.addEventListener('click', playAudio);
repeatBtn.addEventListener('click', playAudio);
checkBtn.addEventListener('click', checkGuess);
revealBtn.addEventListener('click', reveal);
shareBtn.addEventListener('click', shareApp);
nextBtn.addEventListener('click', nextWord);
prevBtn.addEventListener('click', prevWord);

guessInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (e.shiftKey) reveal();
    else checkGuess();
  }
});

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); nextWord(); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); prevWord(); }
  else if (e.key === 'r' || e.key === 'R') { e.preventDefault(); playAudio(); }
  else if (e.key === 'v' || e.key === 'V') { e.preventDefault(); reveal(); }
});

audio.addEventListener('ended', () => {
  audioIndicator.classList.remove('playing');
});

audio.addEventListener('error', () => {
  audioIndicator.classList.remove('playing');
  audioIndicator.classList.add('error');
  audioIndicator.textContent = '⚠️ Kunde inte spela ljud';
});

// PWA: beforeinstallprompt
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installHint.hidden = false;
  installBtn.hidden = false;
});

installBtn?.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  installHint.hidden = true;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  if (outcome === 'accepted') console.log('PWA install accepted');
});

dismissInstallBtn?.addEventListener('click', () => {
  installHint.hidden = true;
});

shuffleBtn?.addEventListener('click', shuffleWords);
practiceAgainBtn?.addEventListener('click', practiceAgain);

// Nivå 3: 3-sekunder visningsläge
mode3sBtn?.addEventListener('click', () => {
  if (threeSecondTimer) return; // redan igång
  const word = words[currentIndex];
  const orig = feedbackEl.innerHTML;
  const origClass = feedbackEl.className;
  feedbackEl.innerHTML = `<strong style="font-size:1.4rem">${escapeHtml(word.text)}</strong>`;
  feedbackEl.className = 'feedback feedback-reveal';
  mode3sBtn.disabled = true;
  threeSecondTimer = setTimeout(() => {
    feedbackEl.innerHTML = orig || '';
    feedbackEl.className = origClass || 'feedback';
    threeSecondTimer = null;
    mode3sBtn.disabled = false;
  }, 3000);
});

// Nivå 3: TTS med hel mening via Web Speech API (P1-förbättring)
function playSentenceAudio() {
  const word = words[currentIndex];
  if (!word || !word.text) return;
  if (!('speechSynthesis' in window)) {
    audioIndicator.textContent = '⚠️ TTS stöds inte i denna webbläsare';
    audioIndicator.classList.add('error');
    return;
  }
  // Avbryt ev. pågående uppläsning
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance('skriv ordet ' + word.text);
  utterance.lang = 'sv-SE';
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  // Försök hitta en svensk röst
  const voices = speechSynthesis.getVoices();
  const svVoice = voices.find(v => v.lang.startsWith('sv')) || voices.find(v => v.lang.startsWith('en'));
  if (svVoice) utterance.voice = svVoice;
  audioIndicator.textContent = '🔊 Spelar mening…';
  audioIndicator.classList.remove('error');
  audioIndicator.classList.add('playing');
  utterance.onend = () => {
    audioIndicator.classList.remove('playing');
    audioIndicator.textContent = '';
  };
  utterance.onerror = () => {
    audioIndicator.classList.remove('playing');
    audioIndicator.textContent = '⚠️ TTS misslyckades';
    audioIndicator.classList.add('error');
  };
  speechSynthesis.speak(utterance);
}

// Nivå 3: Toggle papper/app
modeToggle?.addEventListener('click', e => {
  const opt = e.target.closest('.mode-opt');
  if (!opt) return;
  appMode = opt.dataset.mode;
  modeToggle.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('active'));
  opt.classList.add('active');
  if (appMode === 'paper') {
    inputRow.style.display = 'none';
  } else {
    inputRow.style.display = '';
    guessInput.focus();
  }
});

// Nivå 3: Initiera papper-läget
inputRow.style.display = 'none';

// Nivå 3: Konfetti vid alla rätt
function launchConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const colors = ['#4f46e5','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];
  const pieces = Array.from({length: 120}, () => ({
    x: Math.random() * confettiCanvas.width,
    y: -20,
    w: Math.random() * 10 + 5,
    h: Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 3 + 2,
    rot: Math.random() * 360,
    rotV: (Math.random() - 0.5) * 8,
  }));
  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08;
      p.rot += p.rotV;
    });
    frame++;
    if (frame < 180) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }
  draw();
}

// Trigger confetti when last word is answered correctly
function checkGuess() {
  const word = words[currentIndex];
  const guess = normalize(guessInput.value);
  if (!guess) {
    feedbackEl.textContent = 'Skriv ditt svar först';
    feedbackEl.className = 'feedback feedback-hint';
    return;
  }
  const correct = normalize(word.text);
  if (guess === correct) {
    feedbackEl.innerHTML = `✓ Rätt stavat! <strong>${escapeHtml(word.text)}</strong>`;
    feedbackEl.className = 'feedback feedback-correct';
    revealBtn.textContent = '👁 Visa rätt svar';
    revealed = false;
    streak++;
    streakNum.textContent = streak;
    streakCounter.classList.add('visible');
    streakCounter.classList.remove('pulse');
    void streakCounter.offsetWidth;
    streakCounter.classList.add('pulse');
    setTimeout(() => streakCounter.classList.remove('pulse'), 500);
    // Nivå 3: Konfetti när sista ordet är rätt
    if (streak === words.length) {
      setTimeout(launchConfetti, 300);
    }
  } else {
    // B29: Time-delay feedback — ge Zach chans att själv rätta innan facit
    const guessText = guessInput.value.trim();
    const correctText = word.text;
    let highlightedGuess = '';
    let i = 0;
    // Markera felaktiga bokstäver
    while (i < guessText.length && i < correctText.length) {
      if (guessText[i].toLowerCase() === correctText[i].toLowerCase()) {
        highlightedGuess += escapeHtml(guessText[i]);
      } else {
        highlightedGuess += `<span class="wrong-letter">${escapeHtml(guessText[i])}</span>`;
      }
      i++;
    }
    // Lägg till extra/mindre bokstäver
    if (guessText.length > correctText.length) {
      highlightedGuess += `<span class="wrong-letter">${escapeHtml(guessText.slice(i))}</span>`;
    } else if (guessText.length < correctText.length) {
      highlightedGuess += `<span class="missing-letter">${escapeHtml(correctText.slice(i))}</span>`;
    }
    // Visa "Svara gärna igen..." i 3 sek, sen fel + facit
    feedbackEl.innerHTML = 'Svara gärna igen…';
    feedbackEl.className = 'feedback feedback-hint';
    streak = 0;
    streakCounter.classList.remove('visible');

    // B30: Track wrong answer per word
    const wKey = correctText;
    if (!wordStats[wKey]) wordStats[wKey] = { attempts: 0, correctCount: 0, lastResult: null };
    wordStats[wKey].attempts++;
    wordStats[wKey].lastResult = 'wrong';
    needsResort = true;

    setTimeout(() => {
      feedbackEl.innerHTML = `✗ Inte rätt.<br>Du skrev: <strong>${highlightedGuess}</strong><br>Rätt: <strong>${escapeHtml(correctText)}</strong>`;
      feedbackEl.className = 'feedback feedback-wrong';
    }, 3000);
  }
}

// B30: Adaptiv sortering — svåra ord först inom omgången
function sortByDifficulty() {
  // Sortera om words-array baserat på svårighet: högst (fel-försök) först
  // Ord som aldrig försökt hamnar sist
  words.sort((a, b) => {
    const aStats = wordStats[a.text] || { score: -1 };
    const bStats = wordStats[b.text] || { score: -1 };
    // score = attempts - correctCount (högre = svårare)
    const aScore = aStats.attempts > 0 ? aStats.attempts - aStats.correctCount : -1;
    const bScore = bStats.attempts > 0 ? bStats.attempts - bStats.correctCount : -1;
    // Aldra försökta sist (-1), sedan fallande svårighet
    if (aScore === -1 && bScore === -1) return 0;
    if (aScore === -1) return 1;
    if (bScore === -1) return -1;
    return bScore - aScore;
  });
  // Nollställ currentIndex till början efter sortering
  currentIndex = 0;
  renderProgress();
}

// Reset streak on navigate away from current word
function updateUI() {
  const word = words[currentIndex];
  currentSpan.textContent = currentIndex + 1;
  revealed = false;
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  guessInput.value = '';
  guessInput.disabled = false;
  revealBtn.textContent = '👁 Visa rätt svar';

  // Reset streak on word navigation
  streak = 0;
  streakCounter.classList.remove('visible');

  // Image: support either file path (preferred) or emoji fallback
  if (word.image && /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(word.image)) {
    imageArea.src = word.image;
    imageArea.alt = word.text;
    imageArea.classList.remove('placeholder');
  } else {
    imageArea.removeAttribute('src');
    imageArea.alt = word.image || '📖';
    imageArea.classList.add('placeholder');
  }

  audioIndicator.classList.remove('playing', 'error');
  audioIndicator.textContent = '';
  prevBtn.disabled = currentIndex === 0;
  nextBtn.disabled = currentIndex === words.length - 1;
  // Nivå 3+: gör "Öva igen" extra prominent på sista bilden
  if (practiceAgainBtn) {
    if (currentIndex === words.length - 1) {
      practiceAgainBtn.classList.add('prominent');
    } else {
      practiceAgainBtn.classList.remove('prominent');
    }
  }
  renderProgress();
  guessInput.focus();

  // B30: Visa svårt-badge om ordet haft fel
  const wKey = word.text;
  const stats = wordStats[wKey];
  const svartBadge = document.getElementById('svartBadge');
  if (stats && stats.attempts > 0 && stats.lastResult === 'wrong') {
    if (svartBadge) {
      svartBadge.textContent = `⚠️ Svårt (${stats.attempts - stats.correctCount} fel av ${stats.attempts})`;
      svartBadge.hidden = false;
    }
  } else if (svartBadge) {
    svartBadge.hidden = true;
  }
}

// Service worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.error('SW registration failed:', err));
  });
}

loadData();