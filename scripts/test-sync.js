const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04';

async function verify() {
  console.log('🧪 Testing Shopify catalog sync logic...\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase not configured in .env.local');
    return;
  }
  if (!store || !token) {
    console.error('❌ Shopify not configured in .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Fetch active products from Shopify
  const shopifyUrl = `https://${store}/admin/api/${apiVersion}/products.json?limit=250`;
  console.log(`📡 Fetching products from Shopify: ${shopifyUrl}...`);
  const shopifyRes = await fetch(shopifyUrl, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!shopifyRes.ok) {
    console.error(`❌ Shopify error: ${shopifyRes.status} ${shopifyRes.statusText}`);
    return;
  }

  const shopifyData = await shopifyRes.json();
  const shopifyProducts = shopifyData.products || [];
  const shopifyActiveIds = new Set(shopifyProducts.map(p => String(p.id)));
  console.log(`✅ Found ${shopifyActiveIds.size} product(s) on Shopify:`, shopifyProducts.map(p => p.title));

  // Fetch all products from Supabase
  console.log('\n📡 Fetching products from Supabase...');
  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('id, shopify_id, name, import_status');

  if (dbError) {
    console.error('❌ Supabase error:', dbError.message);
    return;
  }

  console.log(`✅ Found ${dbProducts.length} product(s) in Supabase.`);

  const toDeleteIds = [];
  const deletedNames = [];

  for (const p of dbProducts || []) {
    if (p.shopify_id) {
      if (!shopifyActiveIds.has(String(p.shopify_id))) {
        toDeleteIds.push(p.id);
        deletedNames.push(p.name);
      }
    } else {
      const isCurrentlyImporting = ['pending_research', 'researching', 'generating_landing', 'publishing'].includes(p.import_status);
      if (!isCurrentlyImporting) {
        toDeleteIds.push(p.id);
        deletedNames.push(p.name || `ID: ${p.id}`);
      }
    }
  }

  console.log(`\n🔍 Summary of sync actions:`);
  console.log(`   - Products to delete (deleted from Shopify): ${toDeleteIds.length}`);
  if (deletedNames.length > 0) {
    console.log(`     Details: ${deletedNames.join(', ')}`);
  } else {
    console.log(`     Details: None`);
  }

  console.log(`\n🚀 Safe-run: Checking cascade deletions...`);
  if (toDeleteIds.length > 0) {
    const { count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .in('product_id', toDeleteIds);
      
    const { count: socialCount } = await supabase
      .from('social_content')
      .select('*', { count: 'exact', head: true })
      .in('product_id', toDeleteIds);

    console.log(`   - Associated orders to remove: ${ordersCount || 0}`);
    console.log(`   - Associated social media items to remove: ${socialCount || 0}`);
  }
  
  console.log('\n✨ Verification script ran successfully.');
}

verify().catch(console.error);
