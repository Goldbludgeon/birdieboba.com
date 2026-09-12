const fs = require('fs');
const path = require('path');

const audioDir = './audio';
const configFile = './audio.config.json';
const outFile = './audio.json';
const ext = ['.mp3', '.ogg', '.wav', '.m4a', '.webm'];

const files = fs.readdirSync(audioDir)
  .filter(f => ext.includes(path.extname(f).toLowerCase()));

let config = {};
if (fs.existsSync(configFile)) {
  config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
}

const audio = files.map(f => ({
  src: `./audio/${f}`,
  weight: config[f] || 1
}));

fs.writeFileSync(outFile, JSON.stringify(audio));
console.log(`Found ${audio.length} audio files:`, audio);