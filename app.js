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
const streakCounter = document.getElementById('streakCounter');
const streakNum = document.getElementById('streakNum');
const progressText = document.getElementById('progressText');

let streak = 0;

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
  // Animate shuffle button briefly
  shuffleBtn.textContent = '✅';
  setTimeout(() => { shuffleBtn.textContent = '🔀 Blanda om'; }, 800);
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
  // Nivå 3: Progress percentage
  const pct = words.length ? Math.round((currentIndex / words.length) * 100) : 0;
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
  } else {
    feedbackEl.innerHTML = `✗ Inte rätt. Du skrev: <strong>${escapeHtml(guessInput.value.trim())}</strong>`;
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
  renderProgress();
  guessInput.focus();
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