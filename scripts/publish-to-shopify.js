/* ============================================
   PUBLISH TO SHOPIFY
   Creates products in Shopify via GraphQL Admin API
   Generates SEO-optimized landing page descriptions
   ============================================ */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2026-01';

/**
 * Generate a high-converting product description (landing page style)
 */
function generateProductDescription(product) {
  const benefits = [
    "✅ Envío GRATIS a toda Colombia",
    "✅ Pagas solo cuando recibes tu pedido",
    "✅ Garantía de satisfacción",
    "✅ Entrega en 2-5 días hábiles",
  ];

  return `
<div class="product-landing">
  <h2>🔥 ¡${product.name} a precio increíble!</h2>
  
  <p><strong>💵 Pago Contra Entrega</strong> — No necesitas tarjeta. Pagas cuando llega a tu puerta.</p>
  <p><strong>🚚 Envío 100% GRATIS</strong> a toda Colombia 🇨🇴</p>
  
  <hr>
  
  <h3>¿Por qué elegir Clickea Tienda?</h3>
  <ul>
    ${benefits.map(b => `<li>${b}</li>`).join('\n    ')}
  </ul>
  
  <hr>
  
  <p>${product.description || ''}</p>
  
  <p><strong>⚡ ¡Últimas unidades disponibles!</strong> No te quedes sin el tuyo.</p>
  
  <p style="text-align:center; font-size:18px;">
    <strong>👇 Haz clic en "COMPRAR AHORA" y recíbelo en tu casa 👇</strong>
  </p>
</div>
  `.trim();
}

/**
 * Create product in Shopify via GraphQL
 */
async function createShopifyProduct(product) {
  const description = generateProductDescription(product);

  const mutation = `
    mutation productCreate($input: ProductInput!) {
      productCreate(input: $input) {
        product {
          id
          handle
          onlineStoreUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: product.name,
      bodyHtml: description,
      vendor: "Clickea Tienda",
      productType: product.category || "General",
      tags: [
        product.category,
        "envio-gratis",
        "pago-contraentrega",
        "clickea-tienda",
        `descuento-${product.discount_percent}`,
      ].filter(Boolean),
      variants: [{
        price: String(product.selling_price),
        compareAtPrice: String(product.before_price),
        inventoryManagement: null,
        requiresShipping: true,
      }],
      images: (product.images || []).map(url => ({ src: url })),
      metafields: [{
        namespace: "clickea",
        key: "dropi_id",
        value: product.dropi_id || "",
        type: "single_line_text_field",
      }, {
        namespace: "clickea",
        key: "supplier_cost",
        value: String(product.supplier_cost),
        type: "number_integer",
      }],
    },
  };

  const response = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      },
      body: JSON.stringify({ query: mutation, variables }),
    }
  );

  const result = await response.json();
  
  if (result.data?.productCreate?.userErrors?.length > 0) {
    throw new Error(result.data.productCreate.userErrors.map(e => e.message).join(', '));
  }

  return result.data?.productCreate?.product;
}

async function main() {
  console.log('📤 Publishing products to Shopify...');

  // Get products with prices but not yet published
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .not('selling_price', 'is', null)
    .is('shopify_id', null)
    .eq('is_active', true)
    .limit(20);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`   Found ${products?.length || 0} products to publish`);

  let published = 0;
  for (const product of (products || [])) {
    try {
      const shopifyProduct = await createShopifyProduct(product);
      
      // Update database with Shopify data
      await supabase.from('products').update({
        shopify_id: shopifyProduct.id,
        shopify_url: shopifyProduct.onlineStoreUrl,
        published_at: new Date().toISOString(),
      }).eq('id', product.id);

      published++;
      console.log(`   ✅ Published: ${product.name} → ${shopifyProduct.handle}`);
      
      // Rate limit: wait 500ms between API calls
      await new Promise(r => setTimeout(r, 500));
    } catch (err) {
      console.error(`   ❌ Failed: ${product.name} — ${err.message}`);
    }
  }

  // Log activity
  await supabase.from('activity_log').insert({
    action: `${published} productos publicados en Shopify`,
    details: `De ${products?.length || 0} pendientes`,
    category: 'product',
  });

  console.log(`✅ Published ${published}/${products?.length || 0} products`);
}

main();
