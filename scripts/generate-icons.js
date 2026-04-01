import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Ottieni __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputIcon = path.join(__dirname, '../public/altour-logo.png');

async function generateIcons() {
  console.log('🚀 Generazione icone in corso...');
  
  for (const size of sizes) {
    await sharp(inputIcon)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `../public/icon-${size}.png`));
    console.log(`✅ Generata icon-${size}.png`);
  }
  
  // Genera versione maskable
  await sharp(inputIcon)
    .resize(512, 512)
    .extend({
      top: 40,
      bottom: 40,
      left: 40,
      right: 40,
      background: { r: 245, g: 242, b: 237, alpha: 1 }
    })
    .png()
    .toFile(path.join(__dirname, '../public/icon-maskable.png'));
  console.log(`✅ Generata icon-maskable.png`);
  
  console.log('🎉 Tutte le icone sono state generate!');
}

generateIcons().catch(console.error);