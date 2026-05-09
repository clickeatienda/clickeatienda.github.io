/* ============================================
   UPDATE METRICS — Daily snapshot
   Collects all metrics and saves snapshot
   ============================================ */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  console.log('📊 Collecting metrics snapshot...');
  const today = new Date().toISOString().split('T')[0];

  // Count orders by status
  const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const { count: deliveredOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered');
  const { count: returnedOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'returned');
  const { count: cancelledOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'cancelled');

  // Revenue & profit
  const { data: financials } = await supabase.from('orders').select('selling_price, supplier_cost, shipping_cost, profit').eq('status', 'delivered');
  const totalRevenue = (financials || []).reduce((s, o) => s + (o.selling_price || 0), 0);
  const totalCost = (financials || []).reduce((s, o) => s + (o.supplier_cost || 0) + (o.shipping_cost || 0), 0);
  const totalProfit = (financials || []).reduce((s, o) => s + (o.profit || 0), 0);

  // Products
  const { count: activeProducts } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
  const { count: publishedToday } = await supabase.from('products').select('*', { count: 'exact', head: true }).gte('published_at', today);

  // Content
  const { count: contentPublished } = await supabase.from('social_content').select('*', { count: 'exact', head: true }).eq('status', 'published').gte('published_at', today);

  // Return rate
  const returnRate = (totalOrders || 0) > 0 ? ((returnedOrders || 0) / (totalOrders || 1)) * 100 : 0;

  // Average margin
  const { data: margins } = await supabase.from('products').select('margin_percent').eq('is_active', true).not('margin_percent', 'is', null);
  const avgMargin = margins?.length ? margins.reduce((s, p) => s + (p.margin_percent || 0), 0) / margins.length : 0;

  // Save snapshot
  const { error } = await supabase.from('metrics_snapshots').upsert({
    snapshot_date: today,
    total_orders: totalOrders || 0,
    total_revenue: totalRevenue,
    total_cost: totalCost,
    total_profit: totalProfit,
    total_returns: returnedOrders || 0,
    return_rate: Math.round(returnRate * 100) / 100,
    total_cancellations: cancelledOrders || 0,
    avg_margin: Math.round(avgMargin * 100) / 100,
    products_active: activeProducts || 0,
    products_published_today: publishedToday || 0,
    content_published: contentPublished || 0,
  }, { onConflict: 'snapshot_date' });

  if (error) {
    console.error('❌ Error saving snapshot:', error.message);
  } else {
    console.log(`✅ Metrics snapshot saved for ${today}`);
    console.log(`   Orders: ${totalOrders} | Revenue: $${totalRevenue.toLocaleString()} | Returns: ${returnRate.toFixed(1)}%`);
    console.log(`   Products: ${activeProducts} | Content: ${contentPublished} | Margin: ${avgMargin.toFixed(1)}%`);
  }
}

main();
