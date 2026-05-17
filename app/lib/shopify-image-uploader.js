import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const STORE = process.env.SHOPIFY_STORE;
const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = process.env.SHOPIFY_THEME_ID || '187968389484';
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-04';

/**
 * Download an image from an external URL and convert it to Base64
 */
export async function downloadImageAsBase64(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10 seconds timeout
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    
    if (arrayBuffer.byteLength < 1000) {
      throw new Error(`Downloaded image is too small or invalid (${arrayBuffer.byteLength} bytes)`);
    }

    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (err) {
    console.error(`Error downloading image ${url}:`, err.message);
    return null;
  }
}

/**
 * Upload a Base64 image to Shopify Theme Assets and return the CDN URL
 */
export async function uploadToShopifyAssets(filename, base64Data) {
  try {
    // Sanitize filename
    const safeFilename = filename.replace(/[^a-z0-9.]/gi, '-').toLowerCase();
    const assetKey = `assets/${safeFilename}`;

    const body = JSON.stringify({
      asset: {
        key: assetKey,
        attachment: base64Data
      }
    });

    const res = await fetch(`https://${STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': TOKEN,
        'Content-Type': 'application/json'
      },
      body: body
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Shopify API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    return data.asset.public_url;
  } catch (err) {
    console.error(`Error uploading image to Shopify:`, err.message);
    return null;
  }
}

/**
 * Process an array of image URLs: download each and upload to Shopify CDN
 */
export async function uploadAllImages(imageUrls, productSlug) {
  const cdnUrls = [];
  
  if (!imageUrls || imageUrls.length === 0) return cdnUrls;

  console.log(`\n🖼️  Processing ${imageUrls.length} images for ${productSlug}...`);

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    if (!url) continue;

    console.log(`   [${i+1}/${imageUrls.length}] Downloading: ${url.substring(0, 50)}...`);
    const base64Data = await downloadImageAsBase64(url);
    
    if (base64Data) {
      // Create a unique filename based on the product slug and index
      const filename = `${productSlug}-img-${i+1}-${Date.now().toString().slice(-4)}.jpg`;
      console.log(`   [${i+1}/${imageUrls.length}] Uploading to Shopify as ${filename}...`);
      
      const cdnUrl = await uploadToShopifyAssets(filename, base64Data);
      if (cdnUrl) {
        console.log(`   ✅ CDN URL: ${cdnUrl}`);
        cdnUrls.push(cdnUrl);
      } else {
         console.log(`   ❌ Upload failed for image ${i+1}`);
      }
    } else {
      console.log(`   ❌ Download failed for image ${i+1}`);
    }
  }

  return cdnUrls;
}
