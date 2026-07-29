import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function compress() {
  const input = path.join(process.cwd(), 'Public', 'favicon.png');
  
  // Output for favicon
  const publicDir = path.join(process.cwd(), 'public');
  await fs.mkdir(publicDir, { recursive: true });
  const faviconOut = path.join(publicDir, 'favicon.webp');
  
  // Output for logo
  const assetsDir = path.join(process.cwd(), 'src', 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  const logoOut = path.join(assetsDir, 'logo.webp');

  console.log('Compressing and converting favicon.png to WebP...');

  await sharp(input)
    .resize(64, 64)
    .webp({ quality: 80 })
    .toFile(faviconOut);

  console.log('Created public/favicon.webp');

  await sharp(input)
    .resize(128, 128)
    .webp({ quality: 90 })
    .toFile(logoOut);

  console.log('Created src/assets/logo.webp');
}

compress().catch(console.error);
