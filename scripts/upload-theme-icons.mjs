import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const THEME_ID = process.env.SHOPIFY_THEME_ID;
const API_VERSION = '2024-04';

// Exact absolute paths of the generated images from your conversation app data
const icons = [
  {
    key: 'assets/flash_sale_icon.png',
    localPath: 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\7e7663f5-08a1-4939-8f03-9e46e2947312\\flash_sale_icon_1779033519637.png'
  },
  {
    key: 'assets/cod_icon.png',
    localPath: 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\7e7663f5-08a1-4939-8f03-9e46e2947312\\cod_icon_1779033792656.png'
  },
  {
    key: 'assets/shipping_icon.png',
    localPath: 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\7e7663f5-08a1-4939-8f03-9e46e2947312\\shipping_icon_1779034056805.png'
  },
  {
    key: 'assets/warranty_icon.png',
    localPath: 'C:\\Users\\Usuario\\.gemini\\antigravity\\brain\\7e7663f5-08a1-4939-8f03-9e46e2947312\\warranty_icon_1779034227790.png'
  }
];

async function uploadIcon(icon) {
  if (!fs.existsSync(icon.localPath)) {
    console.error(`❌ Local file not found: ${icon.localPath}`);
    return null;
  }

  console.log(`📡 Reading and converting ${icon.key}...`);
  const imageBuffer = fs.readFileSync(icon.localPath);
  const base64Image = imageBuffer.toString('base64');

  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/themes/${THEME_ID}/assets.json`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      asset: {
        key: icon.key,
        attachment: base64Image
      }
    })
  });

  const data = await response.json();
  if (response.ok) {
    console.log(`   ✅ Successfully uploaded to Shopify: ${icon.key}`);
    console.log(`      Public URL: ${data.asset.public_url}`);
    return data.asset.public_url;
  } else {
    console.error(`   ❌ Failed to upload ${icon.key}:`, JSON.stringify(data.errors || data));
    return null;
  }
}

async function main() {
  console.log('🚀 Starting Shopify Theme Icons upload...\n');
  if (!SHOPIFY_STORE || !SHOPIFY_TOKEN || !THEME_ID) {
    console.error('❌ Shopify configuration variables missing in .env.local');
    return;
  }

  for (const icon of icons) {
    await uploadIcon(icon);
  }
  console.log('\n✨ Theme assets uploaded successfully!');
}

main().catch(console.error);
