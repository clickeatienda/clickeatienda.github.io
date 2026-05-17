/* ============================================
   INTELLIGENT IMPORT WORKER (Option B)
   Processes the research queue, generates GIFs,
   and publishes to Shopify.
   
   Usage: node scripts/process-import-queue.js
   ============================================ */

import { createClient } from '@supabase/supabase-js';
import { calculatePrice, DEFAULT_PRICING_CONFIG } from '../app/lib/pricing-engine.js';
import { researchProduct, generateSmartLanding } from '../app/lib/product-researcher.js';
import { uploadAllImages } from '../app/lib/shopify-image-uploader.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function updateProgress(id, progress, message, status = 'researching') {
  console.log(`   [${progress}%] ${message}`);
  await supabase
    .from('products')
    .update({ 
      progress, 
      status_message: message,
      import_status: status 
    })
    .eq('id', id);
}

const API_VERSION = '2024-04';

// Use REST API - more stable than GraphQL for product creation
async function createShopifyProduct(product, pricing, images, description, shopifyId = null) {
  const method = shopifyId ? 'PUT' : 'POST';
  const url = shopifyId 
    ? `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/products/${shopifyId}.json`
    : `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/products.json`;

  const body = {
    product: {
      ...(shopifyId ? { id: shopifyId } : {}),
      title: product.name,
      body_html: description,
      vendor: "Clickea Tienda",
      product_type: product.category || "General",
      status: "active",
      tags: ["importacion-inteligente", product.category || ""].join(", "),
      variants: [{
        price: String(pricing.sellingPrice),
        compare_at_price: pricing.beforePrice ? String(pricing.beforePrice) : null,
        inventory_management: "shopify",
        sku: product.id ? product.id.slice(0, 8) : undefined
      }],
      images: images ? images.map(src => ({ src })) : [],
    }
  };

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': SHOPIFY_TOKEN,
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();
  
  if (!response.ok) {
    throw new Error(`Shopify REST Error ${response.status}: ${JSON.stringify(result.errors || result)}`);
  }

  if (!result.product) {
    throw new Error(`Unexpected Shopify Response: ${JSON.stringify(result)}`);
  }

  return {
    id: String(result.product.id),
    handle: result.product.handle,
    onlineStoreUrl: `https://${SHOPIFY_STORE}/products/${result.product.handle}`
  };
}

async function processProduct(p) {
  console.log(`\n🚀 Processing: ${p.name}...`);
  const id = p.id;

  try {
    // STEP 1: Process manual image links and generate AI copy/features
    await updateProgress(id, 15, "🔍 Generando copy y características mediante IA...");
    const manualReviewImages = p.research_data?.manualReviewImages || [];
    const manualFeaturesImage = p.research_data?.manualFeaturesImage || null;
    const research = await researchProduct(p.name, p.images || [], manualReviewImages, manualFeaturesImage);

    // STEP 2: Upload all images to Shopify CDN securely
    await updateProgress(id, 40, `Subiendo ${research.images.length} imágenes al CDN de Shopify...`);
    // Create a safe slug from product name for image filenames
    const productSlug = p.name.replace(/[^a-z0-9]/gi, '-').toLowerCase().replace(/-+/g, '-');
    const cdnUrls = await uploadAllImages(research.images, productSlug);
    
    // Replace original images with CDN URLs if upload was successful
    if (cdnUrls.length > 0) {
      research.images = cdnUrls;
    }

    // STEP 3: Generate premium landing HTML with CSS carousel using CDN URLs
    await updateProgress(id, 55, `Generando landing premium con imágenes CDN...`);
    const smartDescription = generateSmartLanding(research);

    // STEP 4: Calculate Final Price
    const pricing = calculatePrice(p.supplier_cost, DEFAULT_PRICING_CONFIG);
    await updateProgress(id, 75, `Precio: $${pricing.sellingPrice.toLocaleString()} | Margen: ${pricing.actualMargin}%`);

    // STEP 5: Create or Update in Shopify with all images + landing HTML
    await updateProgress(id, 90, p.shopify_id ? "Actualizando en Shopify..." : "Publicando en Shopify...");
    const shopifyProduct = await createShopifyProduct(p, pricing, research.images, smartDescription, p.shopify_id);

    // STEP 6: Finalize
    await supabase
      .from('products')
      .update({
        import_status: 'ready',
        progress: 100,
        status_message: '¡Producto importado con éxito!',
        selling_price: pricing.sellingPrice,
        before_price: pricing.beforePrice,
        discount_percent: pricing.discountPercent,
        margin_percent: pricing.actualMargin,
        profit_per_sale: pricing.profitPerSale,
        shopify_id: shopifyProduct.id.split('/').pop(),
        shopify_url: `https://${SHOPIFY_STORE}/products/${shopifyProduct.handle}`,
        is_active: true
      })
      .eq('id', id);

    console.log(`   ✅ Success: ${shopifyProduct.onlineStoreUrl}`);

  } catch (err) {
    console.error(`   ❌ Failed: ${err.message}`);
    await supabase
      .from('products')
      .update({
        import_status: 'failed',
        status_message: `Error: ${err.message}`
      })
      .eq('id', id);
  }
}

async function worker() {
  console.log('🤖 Intelligent Import Worker started...');
  console.log('   Listening for pending research requests...');

  while (true) {
    const { data: pending } = await supabase
      .from('products')
      .select('*')
      .eq('import_status', 'pending_research')
      .order('created_at', { ascending: true })
      .limit(1);

    if (pending && pending.length > 0) {
      await processProduct(pending[0]);
    }

    // Wait 5 seconds before checking again
    await new Promise(r => setTimeout(r, 5000));
  }
}

worker().catch(console.error);
