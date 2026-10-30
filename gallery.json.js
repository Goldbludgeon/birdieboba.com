export async function onRequestGet() {
  const bucket = env.GALLERY_BUCKET;

  const listed = await bucket.list();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];

  const images = listed.objects
    .filter(obj => imageExts.some(ext => obj.key.toLowerCase().endsWith(ext)))
    .map(obj => ({
      url: `${env.PUBLIC_URL}/${obj.key}`
    }));

  return new Response(JSON.stringify(images, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
