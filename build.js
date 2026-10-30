const fs = require('fs');
const path = require('path');
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a', '.webm'];

// --- Audio build ---
function buildAudio() {
  const audioDir = './audio';
  const configFile = './audio.config.json';
  const outFile = './audio.json';

  const files = fs.readdirSync(audioDir)
    .filter(f => AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()));

  let config = {};
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
  }

  const audio = files.map(f => ({
    src: `./audio/${f}`,
    weight: config[f] || 1
  }));

  fs.writeFileSync(outFile, JSON.stringify(audio));
  console.log(`Found ${audio.length} audio files.`);
}

// --- Gallery build from R2 ---
async function buildGallery() {
  const {
    R2_ACCOUNT_ID,
    R2_BUCKET_NAME,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL
  } = process.env;

  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    console.warn('R2 environment variables are missing. Skipping gallery.json generation.');
    return;
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY
    }
  });

  const objects = [];
  let ContinuationToken;

  do {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET_NAME,
      ContinuationToken
    });
    const response = await s3.send(command);
    objects.push(...(response.Contents || []));
    ContinuationToken = response.NextContinuationToken;
  } while (ContinuationToken);

  const images = objects
    .map(obj => obj.Key)
    .filter(key => IMAGE_EXTENSIONS.some(ext => key.toLowerCase().endsWith(ext)))
    .map(key => ({
      url: `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
    }));

  fs.writeFileSync('./gallery.json', JSON.stringify(images, null, 2));
  console.log(`Found ${images.length} gallery images from R2.`);
}

// --- Run ---
(async () => {
  buildAudio();
  await buildGallery();
})();
