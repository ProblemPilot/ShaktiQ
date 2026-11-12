// scripts/optimize_images.js
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT_DIR = path.join(__dirname, '..');

async function processImages() {
  const images = [
    { file: 'hero-museum.png', quality: 80 },
    { file: 'logo.png', quality: 85 },
    { file: 'yt-logo.png', quality: 85 },
    { file: 'logo-white.png', quality: 85 },
    { file: 'bodhi-tree.png', quality: 85 }
  ];

  for (const img of images) {
    const srcPath = path.join(ROOT_DIR, img.file);
    if (!fs.existsSync(srcPath)) continue;
    const origStat = fs.statSync(srcPath);
    const meta = await sharp(srcPath).metadata();
    console.log(`Processing ${img.file}: original size ${origStat.size} bytes (${meta.width}x${meta.height})`);

    // 1. Generate optimized WebP
    const webpName = img.file.replace(/\.png$/, '.webp');
    const webpPath = path.join(ROOT_DIR, webpName);
    await sharp(srcPath)
      .webp({ quality: img.quality })
      .toFile(webpPath);
    const webpStat = fs.statSync(webpPath);
    const savings = Math.round((1 - webpStat.size / origStat.size) * 100);
    console.log(`  -> Generated ${webpName}: ${webpStat.size} bytes (${savings}% reduction)`);

    // 2. Compress the original PNG in place if possible
    try {
      const optPngBuf = await sharp(srcPath).png({ compressionLevel: 9, quality: 85 }).toBuffer();
      if (optPngBuf.length < origStat.size) {
        fs.writeFileSync(srcPath, optPngBuf);
        console.log(`  -> Optimized fallback PNG ${img.file}: ${optPngBuf.length} bytes`);
      }
    } catch (e) {
      console.warn(`  -> Could not recompress PNG ${img.file}: ${e.message}`);
    }
  }
}

processImages().catch(err => {
  console.error('Error optimizing images:', err);
  process.exit(1);
});
