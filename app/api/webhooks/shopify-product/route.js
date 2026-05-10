/* ============================================
   SHOPIFY PRODUCT WEBHOOK
   Receives product create/update/delete events
   from Shopify and syncs them to Supabase
   so the Dashboard stays in sync with the store.
   ============================================ */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { calculatePrice, DEFAULT_PRICING_CONFIG } from '@/app/lib/pricing-engine';

export const dynamic = 'force-dynamic';

/**
 * Verify that the request actually comes from Shopify
 */
function verifyShopifyHmac(body, hmacHeader, secret) {
  if (!secret || !hmacHeader) return !secret; // skip verification if no secret configured
  const digest = createHmac('sha256', secret).update(body, 'utf8').digest('base64');
  return digest === hmacHeader;
}

/**
 * Extract a usable category from Shopify product data
 */
function extractCategory(shopifyProduct) {
  return shopifyProduct.product_type || shopifyProduct.tags?.split(',')[0]?.trim() || 'General';
}

/**
 * Extract supplier cost from product variant.
 * Dropify typically sets the cost in the variant's `cost` field or `price`.
 * We check cost first, then fall back to price.
 */
function extractSupplierCost(shopifyProduct) {
  const variant = shopifyProduct.variants?.[0];
  if (!variant) return 0;

  // Dropify usually sets the cost per item
  if (variant.inventory_item_id && variant.cost) {
    return Math.round(parseFloat(variant.cost));
  }

  // Fall back to price as supplier cost (common with Dropify imports)
  return Math.round(parseFloat(variant.price || 0));
}

/**
 * Extract image URLs from Shopify product
 */
function extractImages(shopifyProduct) {
  if (shopifyProduct.images && shopifyProduct.images.length > 0) {
    return shopifyProduct.images.map(img => img.src);
  }
  if (shopifyProduct.image?.src) {
    return [shopifyProduct.image.src];
  }
  return [];
}

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  // Read the raw body for HMAC verification
  const rawBody = await request.text();
  const hmacHeader = request.headers.get('x-shopify-hmac-sha256');
  const topic = request.headers.get('x-shopify-topic');
  const webhookSecret = process.env.SHOPIFY_WEBHOOK_SECRET;

  // Verify authenticity
  if (!verifyShopifyHmac(rawBody, hmacHeader, webhookSecret)) {
    console.error('❌ Webhook HMAC verification failed');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let shopifyProduct;
  try {
    shopifyProduct = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const shopifyId = String(shopifyProduct.id);
  console.log(`📦 Webhook received: ${topic} — ID: ${shopifyId} — "${shopifyProduct.title}"`);

  // ---- HANDLE DELETE ----
  if (topic === 'products/delete') {
    await supabase
      .from('products')
      .update({ is_active: false })
      .eq('shopify_id', shopifyId);

    await supabase.from('activity_log').insert({
      action: `Producto eliminado de Shopify: ${shopifyProduct.title || shopifyId}`,
      details: `Shopify ID: ${shopifyId}`,
      category: 'product',
    });

    console.log(`   🗑️ Product deactivated: ${shopifyId}`);
    return NextResponse.json({ status: 'deleted', shopify_id: shopifyId });
  }

  // ---- HANDLE CREATE / UPDATE ----
  const supplierCost = extractSupplierCost(shopifyProduct);
  const images = extractImages(shopifyProduct);
  const category = extractCategory(shopifyProduct);
  const variant = shopifyProduct.variants?.[0];

  // Calculate optimized pricing using the existing pricing engine
  let pricing = {};
  if (supplierCost > 0) {
    pricing = calculatePrice(supplierCost, DEFAULT_PRICING_CONFIG);
  }

  const productData = {
    shopify_id: shopifyId,
    name: shopifyProduct.title,
    description: shopifyProduct.body_html || '',
    category,
    supplier_cost: supplierCost,
    selling_price: pricing.sellingPrice || (variant ? Math.round(parseFloat(variant.price || 0)) : 0),
    before_price: pricing.beforePrice || (variant?.compare_at_price ? Math.round(parseFloat(variant.compare_at_price)) : null),
    discount_percent: pricing.discountPercent || null,
    margin_percent: pricing.actualMargin || null,
    profit_per_sale: pricing.profitPerSale || null,
    images,
    is_active: shopifyProduct.status === 'active',
    shopify_url: `https://${process.env.SHOPIFY_STORE}/products/${shopifyProduct.handle}`,
    published_at: shopifyProduct.published_at || new Date().toISOString(),
    stock: variant?.inventory_quantity ?? 0,
  };

  // Upsert: insert if new, update if existing (matched by shopify_id)
  const { data: upserted, error: upsertError } = await supabase
    .from('products')
    .upsert(productData, { 
      onConflict: 'shopify_id',
      ignoreDuplicates: false 
    })
    .select('id')
    .single();

  if (upsertError) {
    console.error(`   ❌ Supabase error: ${upsertError.message}`);
    // If onConflict fails because shopify_id isn't unique in schema, fall back to manual check
    if (upsertError.message.includes('unique constraint')) {
       // already handled by upsert usually, but some supabase versions differ
    }
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const isNew = !upserted; // This might be tricky with upsert, but we'll use activity log based on intent
  const actionVerb = 'sincronizado';

  await supabase.from('activity_log').insert({
    action: `Producto ${actionVerb} desde Shopify: ${shopifyProduct.title}`,
    details: `Costo: $${supplierCost.toLocaleString()} → Venta: $${(pricing.sellingPrice || 0).toLocaleString()} | Margen: ${pricing.actualMargin || 0}%`,
    category: 'product',
  });

  console.log(`   ✅ Product ${actionVerb}: "${shopifyProduct.title}" — $${supplierCost.toLocaleString()} → $${(pricing.sellingPrice || 0).toLocaleString()}`);

  return NextResponse.json({
    status: actionVerb,
    shopify_id: shopifyId,
    name: shopifyProduct.title,
    selling_price: pricing.sellingPrice || 0,
  });
}
