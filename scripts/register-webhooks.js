/* ============================================
   REGISTER SHOPIFY WEBHOOKS
   Run this ONCE to tell Shopify to send
   product events to your Dashboard.
   
   Usage: node scripts/register-webhooks.js
   ============================================ */

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const DASHBOARD_URL = 'https://clickeatienda-github-io.vercel.app';
const API_VERSION = '2024-04';

const WEBHOOKS_TO_REGISTER = [
  { topic: 'products/create', address: `${DASHBOARD_URL}/api/webhooks/shopify-product` },
  { topic: 'products/update', address: `${DASHBOARD_URL}/api/webhooks/shopify-product` },
  { topic: 'products/delete', address: `${DASHBOARD_URL}/api/webhooks/shopify-product` },
];

async function listExistingWebhooks() {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/webhooks.json`,
    {
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await res.json();
  return data.webhooks || [];
}

async function deleteWebhook(id) {
  await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/webhooks/${id}.json`,
    {
      method: 'DELETE',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
      },
    }
  );
}

async function createWebhook(topic, address) {
  const res = await fetch(
    `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/webhooks.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': SHOPIFY_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic,
          address,
          format: 'json',
        },
      }),
    }
  );

  const data = await res.json();

  if (data.errors) {
    throw new Error(JSON.stringify(data.errors));
  }

  return data.webhook;
}

async function main() {
  console.log('🔗 Registering Shopify webhooks...');
  console.log(`   Store: ${SHOPIFY_STORE}`);
  console.log(`   Dashboard: ${DASHBOARD_URL}`);
  console.log('');

  // Step 1: List existing webhooks
  console.log('📋 Checking existing webhooks...');
  const existing = await listExistingWebhooks();
  console.log(`   Found ${existing.length} existing webhook(s)`);

  // Step 2: Clean up old product webhooks pointing to our dashboard
  for (const hook of existing) {
    if (hook.address.includes(DASHBOARD_URL) && hook.topic.startsWith('products/')) {
      console.log(`   🗑️  Removing old webhook: ${hook.topic} → ${hook.address}`);
      await deleteWebhook(hook.id);
    }
  }

  // Step 3: Register new webhooks
  console.log('');
  console.log('📤 Registering new webhooks...');

  let success = 0;
  for (const wh of WEBHOOKS_TO_REGISTER) {
    try {
      const created = await createWebhook(wh.topic, wh.address);
      console.log(`   ✅ ${wh.topic} → ${wh.address} (ID: ${created.id})`);
      success++;
    } catch (err) {
      console.error(`   ❌ Failed: ${wh.topic} — ${err.message}`);
    }
  }

  console.log('');
  console.log(`✅ Done! ${success}/${WEBHOOKS_TO_REGISTER.length} webhooks registered.`);
  console.log('');
  console.log('ℹ️  Now when you import a product in Shopify using Dropify,');
  console.log('   it will automatically appear in your Dashboard.');
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
