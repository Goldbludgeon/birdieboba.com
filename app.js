let sounds = [];

async function loadSounds() {
  const res = await fetch('./audio.json');
  sounds = await res.json();
}

function pickWeightedSound() {
  const total = sounds.reduce((sum, s) => sum + s.weight, 0);
  let random = Math.random() * total;
  for (const s of sounds) {
    if (random < s.weight) return s.src;
    random -= s.weight;
  }
}

function playRandomSound() {
  if (!sounds.length) return;
  const src = pickWeightedSound();
  const audio = new Audio(src);
  audio.play().catch(() => {});
}

const photo = document.getElementById('photo');
const bgPicker = document.getElementById('bgPicker');

photo.addEventListener('click', playRandomSound);

bgPicker.addEventListener('input', (e) => {
  document.body.style.background = e.target.value;
});

loadSounds();