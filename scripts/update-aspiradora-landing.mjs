/**
 * Re-generates the aspiradora landing page with the updated template
 * and pushes the new body_html to Shopify.
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { generateLanding } from '../app/lib/landing-generator.js';

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = '2024-04';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log('🔄 Re-generating aspiradora landing page...\n');

  // 1. Find the aspiradora product in Supabase
  const { data: product, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', '%aspiradora%')
    .single();

  if (error || !product) {
    console.error('❌ Product not found in Supabase:', error?.message);
    return;
  }

  console.log(`📦 Found: ${product.name} (Shopify ID: ${product.shopify_id})`);

  // 2. Build research object from product data
  const research = {
    name: product.name,
    images: product.images || [],
    reviewImages: product.research_data?.manualReviewImages || [],
    featuresImage: product.research_data?.manualFeaturesImage || null,
    reviewComments: [],
    features: [],
    description: '',
    sourceUrl: '',
    category: product.category || '',
  };

  // 3. Generate new landing HTML
  console.log('🎨 Generating updated landing HTML...');
  const newBodyHtml = generateLanding(research);
  console.log(`   ✅ Generated ${newBodyHtml.length} chars of HTML`);

  // 4. Update the product on Shopify
  console.log('📤 Pushing updated HTML to Shopify...');
  const url = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/products/${product.shopify_id}.json`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify({
      product: {
        id: product.shopify_id,
        body_html: newBodyHtml,
      }
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Shopify API error: ${res.status} - ${errText}`);
    return;
  }

  const result = await res.json();
  console.log(`   ✅ Updated on Shopify: https://${SHOPIFY_STORE}/products/${result.product.handle}`);

  // 5. Upload updated theme template
  console.log('\n📤 Uploading updated theme template...');
  const { default: fs } = await import('fs');
  // Read the updated section content from the upload script
  const uploadScript = fs.readFileSync('scripts/upload_product_landing_section.js', 'utf8');
  const match = uploadScript.match(/const sectionContent = `([\s\S]*?)`;/);
  
  if (match) {
    const sectionContent = match[1];
    const themeRes = await fetch(`https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/themes/${process.env.SHOPIFY_THEME_ID}/assets.json`, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        asset: {
          key: 'sections/main-product-landing.liquid',
          value: sectionContent,
        }
      }),
    });

    if (themeRes.ok) {
      console.log('   ✅ Theme template updated successfully');
    } else {
      console.warn('   ⚠️ Theme template update failed:', await themeRes.text());
    }
  }

  console.log('\n✨ Done! Refresh the product page to see the changes.');
}

main().catch(console.error);
