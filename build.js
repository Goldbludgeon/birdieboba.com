const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a', '.webm'];

// --- Audio build ---
function buildAudio() {
  const audioDir = './audio';
  const configFile = './audio.config.json';
  const outFile = './audio.json';

  const files = fs.readdirSync(audioDir)
    .filter(f => AUDIO_EXTENSIONS.includes(f.slice(f.lastIndexOf('.')).toLowerCase()));

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

// --- AWS Signature Version 4 helpers ---
function hmacSha256(key, message) {
  return crypto.createHmac('sha256', key).update(message).digest();
}

function sha256Hex(message) {
  return crypto.createHash('sha256').update(message).digest('hex');
}

function getSignatureKey(secretKey, dateStamp, region, service) {
  const kDate = hmacSha256('AWS4' + secretKey, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

function r2Request(accountId, bucketName, accessKey, secretKey, queryString) {
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const canonicalRequest = [
    'GET',
    `/${bucketName}`,
    queryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');

  const credentialScope = `${dateStamp}/auto/s3/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest)
  ].join('\n');

  const signingKey = getSignatureKey(secretKey, dateStamp, 'auto', 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');
  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: host,
      path: `/${bucketName}?${queryString}`,
      method: 'GET',
      headers: {
        'Host': host,
        'X-Amz-Date': amzDate,
        'X-Amz-Content-Sha256': payloadHash,
        'Authorization': authorization
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) resolve(data);
        else reject(new Error(`R2 request failed: ${res.statusCode} ${data}`));
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// --- Gallery build from R2 ---
async function buildGallery() {
  const {
    R2_ACCOUNT_ID,
    R2_BUCKET_NAME,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_PUBLIC_URL,
    R2_PREFIX
  } = process.env;

  if (!R2_ACCOUNT_ID || !R2_BUCKET_NAME || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_PUBLIC_URL) {
    console.warn('R2 environment variables missing. Skipping gallery.json generation.');
    return;
  }

  const prefix = R2_PREFIX || '';
  const keys = [];
  let continuationToken = null;

  do {
    const params = new URLSearchParams({ 'list-type': '2' });
    if (prefix) params.set('prefix', prefix);
    if (continuationToken) params.set('continuation-token', continuationToken);
    params.sort();

    const xml = await r2Request(R2_ACCOUNT_ID, R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, params.toString());

    const keyRegex = /<Key>([^<]+)<\/Key>/g;
    let match;
    while ((match = keyRegex.exec(xml)) !== null) {
      keys.push(match[1]);
    }

    const truncatedMatch = xml.match(/<IsTruncated>([^<]+)<\/IsTruncated>/);
    continuationToken = truncatedMatch && truncatedMatch[1] === 'true'
      ? (xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/) || [])[1]
      : null;
  } while (continuationToken);

  const images = keys
    .filter(key => IMAGE_EXTENSIONS.some(ext => key.toLowerCase().endsWith(ext)))
    .map(key => ({
      url: `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`
    }));

  fs.writeFileSync('./gallery.json', JSON.stringify(images, null, 2));
  console.log(`Found ${images.length} gallery images from R2.`);
}

(async () => {
  buildAudio();
  await buildGallery();
})();
