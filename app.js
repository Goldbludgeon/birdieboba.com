let audio = [];

async function loadAudio() {
  const res = await fetch('./audio.json');
  audio = await res.json();
}

function pickWeightedAudio() {
  const total = audio.reduce((sum, a) => sum + a.weight, 0);
  let random = Math.random() * total;
  for (const a of audio) {
    if (random < a.weight) return a.src;
    random -= a.weight;
  }
}

function playRandomAudio() {
  if (!audio.length) return;
  const src = pickWeightedAudio();
  const clip = new Audio(src);
  clip.play().catch(() => {});
}

const photo = document.getElementById('photo');
const bgPicker = document.getElementById('bgPicker');

photo.addEventListener('click', playRandomAudio);

bgPicker.addEventListener('input', (e) => {
  document.body.style.background = e.target.value;
});

loadAudio();

// Countdown timer
const targetDate = new Date('2026-09-26T16:00:00').getTime();
const timerEl = document.getElementById('timer');

function updateTimer() {
  const now = new Date().getTime();
  const distance = targetDate - now;

  if (distance <= 0) {
    timerEl.textContent = "Time's up!";
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  timerEl.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

setInterval(updateTimer, 1000);
updateTimer();