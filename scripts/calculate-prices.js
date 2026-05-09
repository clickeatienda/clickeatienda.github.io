/* ============================================
   CALCULATE PRICES
   Applies the pricing engine to all unpricied products
   ============================================ */

import { createClient } from '@supabase/supabase-js';
import { calculatePrice, DEFAULT_PRICING_CONFIG } from '../app/lib/pricing-engine.js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log('💰 Starting price calculation...');

  // Get real metrics for auto-adjustment
  const { data: lastMetric } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  const metrics = {
    actualReturnRate: lastMetric?.return_rate ? lastMetric.return_rate / 100 : undefined,
    monthlyOrders: lastMetric?.total_orders || 0,
  };

  console.log(`   Metrics: Return rate=${metrics.actualReturnRate || 'default'}, Monthly orders=${metrics.monthlyOrders}`);

  // Get products without prices
  const { data: products, error } = await supabase
    .from('products')
    .select('*')
    .is('selling_price', null)
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching products:', error.message);
    process.exit(1);
  }

  console.log(`   Found ${products?.length || 0} products needing prices`);

  // Calculate prices for each product
  for (const product of (products || [])) {
    const pricing = calculatePrice(product.supplier_cost, DEFAULT_PRICING_CONFIG, metrics);

    const { error: updateError } = await supabase
      .from('products')
      .update({
        selling_price: pricing.sellingPrice,
        before_price: pricing.beforePrice,
        discount_percent: pricing.discountPercent,
        margin_percent: pricing.actualMargin,
        profit_per_sale: pricing.profitPerSale,
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`   ❌ Error updating ${product.name}:`, updateError.message);
    } else {
      console.log(`   ✅ ${product.name}: $${product.supplier_cost.toLocaleString()} → $${pricing.sellingPrice.toLocaleString()} (margin: ${pricing.actualMargin}%)`);
    }
  }

  console.log('✅ Price calculation complete!');
}

main();
