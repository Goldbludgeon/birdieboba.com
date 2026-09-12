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