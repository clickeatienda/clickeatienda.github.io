/* ============================================
   PRODUCT RESEARCHER — Multi-Source Intelligence
   
   Researches a product across the entire web,
   not just MercadoLibre. Uses reverse image search
   to find the EXACT same product and extract:
   - HD images from multiple angles
   - Real features & specifications
   - Accurate description
   - Reference pricing
   
   Sources searched (in priority order):
   1. Google Lens (reverse image search by Dropi image)
   2. Google Shopping / Images (text search fallback)
   3. Best matching product pages (scrape details)
   ============================================ */

import { searchGoogleLens } from './lens-searcher.js';
import { generateLanding } from './landing-generator.js';

const MIN_DIMENSION = 300; // px — discard anything smaller than this
const VALIDATE_TIMEOUT_MS = 5000; // max wait per image check

/**
 * Check a single image URL:
 *  1. Sends a HEAD request → discards if status === 404 (broken link)
 *  2. Reads first bytes → parses width/height from binary header
 * Returns true if the image is alive AND meets the minimum dimension (if checkable).
 */
async function isImageValid(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), VALIDATE_TIMEOUT_MS);

    // Step 1 – Check if URL is alive
    // Some CDNs block HEAD, so if it fails with 403/405/etc, we continue to Step 2
    const head = await fetch(url, { method: 'HEAD', signal: controller.signal }).catch(() => null);
    if (head && head.status === 404) {
      clearTimeout(timer);
      return false;
    }

    // Step 2 – Partial GET to read image dimensions
    const partial = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1024' }, // increased range for safety
      signal: controller.signal,
    }).catch(() => null);
    clearTimeout(timer);

    // If we can't even connect or get a status, it's likely a dead link
    if (!partial) return false;
    
    // If we got a 404, it's dead
    if (partial.status === 404) return false;

    // If we got a 403 or other error but it's not a 404, 
    // it might just be blocking partial requests. 
    // In this case, we'll assume it's OK to avoid empty galleries.
    if (!partial.ok && partial.status !== 206) return true;

    const buf = await partial.arrayBuffer();
    const bytes = new Uint8Array(buf);

    // PNG: bytes 16-19 = width, 20-23 = height
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      if (bytes.length < 24) return true;
      const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return Math.max(w, h) >= MIN_DIMENSION; // Use max dimension for threshold
    }

    // JPEG: scan for SOF marker
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      for (let i = 2; i < bytes.length - 8; i++) {
        if (bytes[i] === 0xFF && (bytes[i + 1] === 0xC0 || bytes[i + 1] === 0xC2)) {
          const h = (bytes[i + 5] << 8) | bytes[i + 6];
          const w = (bytes[i + 7] << 8) | bytes[i + 8];
          return Math.max(w, h) >= MIN_DIMENSION;
        }
      }
      return true;
    }

    // WEBP: VP8/VP8L/VP8X
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      // Very simple WEBP size check for common formats
      if (bytes.length > 30) {
        // VP8 (lossy)
        if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x20) {
          const w = bytes[26] | (bytes[27] << 8);
          const h = bytes[28] | (bytes[29] << 8);
          return Math.max(w, h) >= MIN_DIMENSION;
        }
      }
      return true;
    }

    return true; // Unknown format or too short to parse → accept
  } catch {
    return true; // Error during check → fail safe and accept
  }
}

/**
 * Run isImageValid() on all URLs concurrently and return only the passing ones.
 * Logs each result so you can see what gets filtered.
 */
async function validateImages(images) {
  console.log(`   🔎 Validating ${images.length} images (HTTP + dimensions ≥${MIN_DIMENSION}px)...`);
  const checks = await Promise.all(
    images.map(async (url) => {
      const ok = await isImageValid(url);
      if (!ok) console.log(`   ✂️  Filtered (broken/small): ${url.substring(0, 80)}`);
      return ok ? url : null;
    })
  );
  const valid = checks.filter(Boolean);
  console.log(`   ✅ ${valid.length}/${images.length} images passed validation`);
  return valid;
}

/**
 * Validate and filter images for quality
 * @param {string[]} images - Array of image URLs
 * @param {string} dropiImage - Original Dropi image (always keep)
 * @returns {string[]} Filtered, quality images
 */
function filterQualityImages(images, dropiImage) {
  const seen = new Set();
  const result = [];
  
  // Always include the Dropi image first (it's the "reference" image)
  if (dropiImage) {
    result.push(dropiImage);
    seen.add(dropiImage.split('?')[0]);
  }
  
  for (const img of images) {
    if (!img || typeof img !== 'string') continue;
    
    const base = img.split('?')[0];
    if (seen.has(base)) continue;
    seen.add(base);
    
    const lower = img.toLowerCase();
    
    // Skip obviously bad images
    if (lower.includes('logo') || 
        lower.includes('icon') || 
        lower.includes('avatar') ||
        lower.includes('favicon') ||
        lower.includes('placeholder') ||
        lower.includes('loading') ||
        lower.includes('transparent') ||
        lower.includes('spacer') ||
        lower.includes('pixel') ||
        lower.includes('1x1') ||
        lower.includes('.svg') ||
        lower.includes('data:image') ||
        lower.includes('badge') ||
        lower.includes('banner') ||
        lower.includes('captcha')) {
      continue;
    }
    
    // Skip known non-product domains
    if (lower.includes('gstatic.com') ||
        lower.includes('google.com/images') ||
        lower.includes('facebook.com') ||
        lower.includes('twitter.com') ||
        lower.includes('instagram.com') ||
        lower.includes('youtube.com')) {
      continue;
    }
    
    result.push(img);
  }
  
  return result.slice(0, 12); // Max 12 quality images
}

/**
 * Clean and format features list
 */
function cleanFeatures(features) {
  if (!features || features.length === 0) return [];
  
  return features
    .map(f => f.trim())
    .filter(f => {
      if (f.length < 5 || f.length > 200) return false;
      const lower = f.toLowerCase();
      // Skip non-product content
      if (lower.includes('cookie') || 
          lower.includes('privacy') || 
          lower.includes('terms') ||
          lower.includes('copyright') ||
          lower.includes('javascript') ||
          lower.includes('subscribe') ||
          lower.includes('newsletter') ||
          lower.includes('login') ||
          lower.includes('sign in') ||
          lower.includes('add to cart') ||
          lower.includes('buy now')) {
        return false;
      }
      return true;
    })
    .slice(0, 10);
}

/**
 * MAIN: Research a product using multiple sources
 * 
 * @param {string} productName - Product name from Dropi
 * @param {string} dropiImageUrl - Image URL from Dropi catalog
 * @returns {object} Research results with images, features, description
 */
export async function researchProduct(productName, dropiImages = [], manualReviewImages = [], manualFeaturesImage = null) {
  // Normalize to arrays
  const originalImages = Array.isArray(dropiImages) ? dropiImages : (dropiImages ? [dropiImages] : []);
  const reviewImages = Array.isArray(manualReviewImages) ? manualReviewImages : (manualReviewImages ? [manualReviewImages] : []);
  const primaryImage = originalImages[0] || null;

  console.log(`\n🚀 ========================================`);
  console.log(`   PROCESSING: ${productName}`);
  console.log(`   Manual Product Images: ${originalImages.length}`);
  console.log(`   Manual Review Images: ${reviewImages.length}`);
  if (manualFeaturesImage) console.log(`   Manual Features Image: Provided`);
  console.log(`   ========================================\n`);

  const results = {
    name: productName,
    images: [...originalImages],
    reviewImages: [...reviewImages],
    featuresImage: manualFeaturesImage,
    reviewComments: [],
    features: [],
    description: '',
    sourceUrl: '',
    category: '',
  };

  try {
    // We now completely bypass automated web scraping for images
    // The user manually provided all required visual assets
    console.log(`   ✅ Bypassing automated image scraping. Using manual assets.`);
    
    // We don't have scraped features, so the landing generator will fallback
    // to AI/smart text extraction based on the product name for the anatomical diagram.

    // No scraped data to merge anymore.
    // results.features will remain empty, triggering AI fallback in landing-generator.js.
  } catch (err) {
    console.error(`\n❌ Research failed: ${err.message}`);
    console.error(`   Stack: ${err.stack?.split('\n')[1] || 'no stack'}`);
    // Continue with whatever we have (at minimum, the Dropi image)
  }

  // Summary
  console.log(`\n📊 ========================================`);
  console.log(`   RESEARCH RESULTS FOR: ${productName}`);
  console.log(`   📸 Images: ${results.images.length}`);
  console.log(`   📋 Features: ${results.features.length}`);
  console.log(`   📝 Description: ${results.description.length} chars`);
  console.log(`   🌐 Source: ${results.sourceUrl?.substring(0, 50) || 'none'}`);
  console.log(`   ========================================\n`);

  return results;
}

/**
 * Generate the complete landing page HTML
 * This is the function called by process-import-queue.js
 * 
 * @param {object} research - Results from researchProduct()
 * @returns {string} Complete HTML for Shopify product body_html
 */
export function generateSmartLanding(research) {
  return generateLanding(research);
}
