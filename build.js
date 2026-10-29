const fs = require('fs');
const path = require('path');

// --- Audio build ---
const audioDir = './audio';
const audioConfigFile = './audio.config.json';
const audioOutFile = './audio.json';
const audioExts = ['.mp3', '.ogg', '.wav', '.m4a', '.webm'];

const audioFiles = fs.readdirSync(audioDir)
  .filter(f => audioExts.includes(path.extname(f).toLowerCase()));

let audioConfig = {};
if (fs.existsSync(audioConfigFile)) {
  audioConfig = JSON.parse(fs.readFileSync(audioConfigFile, 'utf8'));
}

const audio = audioFiles.map(f => ({
  src: `./audio/${f}`,
  weight: audioConfig[f] || 1
}));

fs.writeFileSync(audioOutFile, JSON.stringify(audio));
console.log(`Found ${audio.length} audio files.`);

// --- Gallery build ---
const imagesDir = './img/gallery';
const galleryOutFile = './gallery.json';
const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const imageFiles = fs.readdirSync(imagesDir)
  .filter(f => imageExts.includes(path.extname(f).toLowerCase()));

const gallery = imageFiles.map(f => ({
  url: `./img/gallery/${f}`
}));

fs.writeFileSync(galleryOutFile, JSON.stringify(gallery));
console.log(`Found ${gallery.length} images.`);
