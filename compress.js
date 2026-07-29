import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

async function compress() {
  const inputPath = path.join(process.cwd(), 'Public', 'favicon.png');
  const inputBuffer = await fs.readFile(inputPath);
  
  // Output for favicon
  const publicDir = path.join(process.cwd(), 'public');
  await fs.mkdir(publicDir, { recursive: true });
  const faviconOut = path.join(publicDir, 'favicon-optimized.png');
  
  // Output for logo
  const assetsDir = path.join(process.cwd(), 'src', 'assets');
  await fs.mkdir(assetsDir, { recursive: true });
  const logoOut = path.join(assetsDir, 'logo-optimized.png');

  console.log('Compressing and converting favicon to standard PNGs...');

  await sharp(inputBuffer)
    .resize(64, 64)
    .png({ quality: 100 })
    .toFile(faviconOut);

  console.log('Created public/favicon-optimized.png');

  await sharp(inputBuffer)
    .resize(128, 128)
    .png({ quality: 100 })
    .toFile(logoOut);

  console.log('Created src/assets/logo-optimized.png');
}

compress().catch(console.error);
