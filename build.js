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
console.log(`Found ${audio.length} audio files:`, audio);

// --- Gallery build ---
const imagesDir = './images';
const galleryConfigFile = './gallery.config.json';
const galleryOutFile = './gallery.json';
const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const imageFiles = fs.readdirSync(imagesDir)
  .filter(f => imageExts.includes(path.extname(f).toLowerCase()));

let galleryConfig = {};
if (fs.existsSync(galleryConfigFile)) {
  galleryConfig = JSON.parse(fs.readFileSync(galleryConfigFile, 'utf8'));
}

const gallery = imageFiles.map(f => {
  const name = path.parse(f).name;
  const meta = galleryConfig[name] || {};
  return {
    url: `./images/${f}`,
    author: meta.author || 'Unknown',
    authorUrl: meta.authorUrl || '#',
    caption: meta.caption || '',
    nsfw: !!meta.nsfw
  };
});

fs.writeFileSync(galleryOutFile, JSON.stringify(gallery));
console.log(`Found ${gallery.length} images:`, gallery);
