/* ============================================
   RENDER VIDEOS — FFmpeg
   Combines product images + TTS audio + text overlays
   into professional 9:16 vertical videos
   ============================================ */

import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import https from 'https';
import fs from 'fs';

const VO_DIR = '/tmp/voiceovers';
const RENDER_DIR = '/tmp/rendered';
const ASSETS_DIR = '/tmp/assets';

// Brand colors
const BRAND_BLUE = '#4A9EFF';
const BRAND_NAVY = '#1B2A4A';
const WHITE = '#FFFFFF';

/**
 * Download an image from URL to local path
 */
function downloadImage(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) return resolve(dest);
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(dest); });
    }).on('error', (err) => { fs.unlinkSync(dest); reject(err); });
  });
}

/**
 * Get audio duration using ffprobe
 */
function getAudioDuration(audioPath) {
  try {
    const result = execSync(
      `ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${audioPath}"`,
      { encoding: 'utf-8' }
    );
    return parseFloat(result.trim()) || 15;
  } catch {
    return 15;
  }
}

/**
 * Format price for display
 */
function displayPrice(price) {
  if (!price) return '';
  return `$${price.toLocaleString('es-CO')}`;
}

/**
 * Render a single video using FFmpeg
 */
function renderVideo(config) {
  const { imagePath, audioPath, outputPath, texts, duration } = config;

  // Complex filter for professional-looking video:
  // 1. Scale image to 1080x1920 (9:16)
  // 2. Add gradient overlay at bottom for text readability
  // 3. Add hook text at top
  // 4. Add product name
  // 5. Add price with discount
  // 6. Add CTA
  // 7. Add brand watermark
  const filters = [
    // Scale and pad image
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[base]`,
    // Dark gradient overlay at bottom
    `color=c=black@0.6:s=1080x600[grad]`,
    `[base][grad]overlay=0:1320[bg]`,
    // Hook text (top, animated fade-in)
    `[bg]drawtext=text='${escapeFFmpegText(texts.hook || '')}':fontcolor=${WHITE}:fontsize=52:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=(w-text_w)/2:y=120:enable='between(t,0.3,${duration})':shadowcolor=black@0.8:shadowx=2:shadowy=2[t1]`,
    // Product name
    `[t1]drawtext=text='${escapeFFmpegText(texts.name || '')}':fontcolor=${WHITE}:fontsize=44:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=(w-text_w)/2:y=1400:enable='between(t,1,${duration})':shadowcolor=black@0.8:shadowx=2:shadowy=2[t2]`,
    // Before price (strikethrough effect)
    `[t2]drawtext=text='Antes ${escapeFFmpegText(texts.beforePrice || '')}':fontcolor=#FF6B6B:fontsize=36:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=(w-text_w)/2:y=1520:enable='between(t,2,${duration})':shadowcolor=black@0.6:shadowx=1:shadowy=1[t3]`,
    // Selling price (big, blue)
    `[t3]drawtext=text='HOY ${escapeFFmpegText(texts.price || '')}':fontcolor=${BRAND_BLUE}:fontsize=72:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=(w-text_w)/2:y=1580:enable='between(t,2.5,${duration})':shadowcolor=black@0.8:shadowx=2:shadowy=2[t4]`,
    // CTA
    `[t4]drawtext=text='${escapeFFmpegText(texts.cta || 'Envio GRATIS - Pago al recibir')}':fontcolor=#22C55E:fontsize=34:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=(w-text_w)/2:y=1700:enable='between(t,3,${duration})':shadowcolor=black@0.6:shadowx=1:shadowy=1[t5]`,
    // Brand watermark
    `[t5]drawtext=text='@clickeatienda':fontcolor=white@0.5:fontsize=24:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf:x=w-text_w-20:y=50[vout]`,
  ];

  const cmd = [
    'ffmpeg', '-y',
    '-loop', '1', '-i', `"${imagePath}"`,
    '-i', `"${audioPath}"`,
    '-filter_complex', `"${filters.join(';')}"`,
    '-map', '"[vout]"', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'ultrafast',
    '-tune', 'stillimage',
    '-c:a', 'aac', '-b:a', '128k',
    '-shortest',
    '-t', String(Math.min(duration + 1, 60)),
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    `"${outputPath}"`,
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe', timeout: 120000 });
    return true;
  } catch (err) {
    console.error(`   ❌ FFmpeg error: ${err.stderr?.toString().slice(-200) || err.message}`);
    return false;
  }
}

function escapeFFmpegText(text) {
  return text
    .replace(/'/g, "'\\''")
    .replace(/:/g, '\\:')
    .replace(/%/g, '%%')
    .replace(/\\/g, '\\\\')
    .slice(0, 80); // Limit length for display
}

async function main() {
  console.log('🎥 Rendering videos with FFmpeg...');

  // Create directories
  [RENDER_DIR, ASSETS_DIR].forEach(d => {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
  });

  // Read manifest from voiceover step
  const manifestPath = path.join(VO_DIR, 'manifest.json');
  if (!existsSync(manifestPath)) {
    console.error('❌ No manifest.json found. Run generate-voiceovers.js first.');
    process.exit(1);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  console.log(`   ${manifest.length} videos to render`);

  const rendered = [];

  for (const item of manifest) {
    const { index, type, product, audioPath, script } = item;
    console.log(`   🎬 [${index + 1}/${manifest.length}] Rendering ${type}...`);

    // Download first product image
    const imageUrl = product.images?.[0];
    if (!imageUrl) {
      console.log(`   ⚠️ No image for ${product.name}, skipping`);
      continue;
    }

    const imagePath = path.join(ASSETS_DIR, `img_${index}.jpg`);
    try {
      await downloadImage(imageUrl, imagePath);
    } catch {
      console.log(`   ⚠️ Failed to download image, skipping`);
      continue;
    }

    // Get audio duration
    const duration = getAudioDuration(audioPath);
    const outputPath = path.join(RENDER_DIR, `video_${index}.mp4`);

    const texts = {
      hook: type === 'flashDeal' ? 'OFERTA FLASH' : 'Mira esto',
      name: product.name || '',
      price: displayPrice(product.selling_price),
      beforePrice: displayPrice(product.before_price),
      cta: 'Envio GRATIS - Pago al recibir',
    };

    const success = renderVideo({ imagePath, audioPath, outputPath, texts, duration });

    if (success) {
      rendered.push({
        ...item,
        videoPath: outputPath,
        duration,
      });
      console.log(`   ✅ Rendered: ${outputPath} (${duration.toFixed(1)}s)`);
    }
  }

  // Save rendered manifest
  const renderedManifest = path.join(RENDER_DIR, 'rendered.json');
  fs.writeFileSync(renderedManifest, JSON.stringify(rendered, null, 2));

  console.log(`✅ Rendered ${rendered.length}/${manifest.length} videos`);
}

main();
