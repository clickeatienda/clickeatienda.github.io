const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04';

async function executeSync() {
  console.log('🔄 Iniciando sincronización real del catálogo con Shopify...\n');
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase no está configurado en .env.local');
    return;
  }
  if (!store || !token) {
    console.error('❌ Shopify no está configurado en .env.local');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch active products from Shopify
  const shopifyUrl = `https://${store}/admin/api/${apiVersion}/products.json?limit=250`;
  console.log(`📡 Consultando productos en Shopify...`);
  const shopifyRes = await fetch(shopifyUrl, {
    method: 'GET',
    headers: {
      'X-Shopify-Access-Token': token,
      'Content-Type': 'application/json'
    }
  });

  if (!shopifyRes.ok) {
    console.error(`❌ Error en Shopify API: ${shopifyRes.status} ${shopifyRes.statusText}`);
    return;
  }

  const shopifyData = await shopifyRes.json();
  const shopifyProducts = shopifyData.products || [];
  const shopifyActiveIds = new Set(shopifyProducts.map(p => String(p.id)));
  console.log(`✅ Se encontraron ${shopifyActiveIds.size} producto(s) activos en Shopify.`);

  // 2. Fetch all products from Supabase
  console.log('\n📡 Consultando productos en la base de datos de Supabase...');
  const { data: dbProducts, error: dbError } = await supabase
    .from('products')
    .select('id, shopify_id, name, import_status');

  if (dbError) {
    console.error('❌ Error en Supabase:', dbError.message);
    return;
  }

  console.log(`✅ Se encontraron ${dbProducts.length} producto(s) en Supabase.`);

  // 3. Identify products to delete
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

  console.log(`\n🔍 Resumen de acciones de sincronización:`);
  console.log(`   - Productos obsoletos a eliminar: ${toDeleteIds.length}`);
  
  if (toDeleteIds.length === 0) {
    console.log('✨ El catálogo ya está perfectamente sincronizado. No hay nada que hacer.');
    return;
  }

  console.log(`     Detalles: ${deletedNames.join(', ')}`);

  // 4. Safely delete referencing rows and products in Supabase
  console.log('\n🚀 Iniciando eliminación en cascada en la base de datos...');

  // Step A: Delete referencing orders
  const { error: orderError } = await supabase
    .from('orders')
    .delete()
    .in('product_id', toDeleteIds);
  if (orderError) {
    console.warn('   ⚠️ Advertencia al eliminar pedidos:', orderError.message);
  } else {
    console.log('   ✅ Registros de pedidos asociados eliminados.');
  }

  // Step B: Delete referencing social media content
  const { error: socialError } = await supabase
    .from('social_content')
    .delete()
    .in('product_id', toDeleteIds);
  if (socialError) {
    console.warn('   ⚠️ Advertencia al eliminar contenido social:', socialError.message);
  } else {
    console.log('   ✅ Registros de contenido de redes sociales eliminados.');
  }

  // Step C: Delete products from the products table
  console.log('   🗑️ Eliminando productos de la tabla principal...');
  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .in('id', toDeleteIds);

  if (deleteError) {
    console.error('❌ Error al eliminar los productos obsoletos:', deleteError.message);
    return;
  }
  console.log('   ✅ Productos eliminados exitosamente.');

  // Step D: Insert log in system activity timeline
  console.log('   📝 Registrando actividad en la línea de tiempo...');
  const { error: logError } = await supabase
    .from('activity_log')
    .insert({
      action: `Catálogo sincronizado: ${toDeleteIds.length} producto(s) obsoleto(s) removido(s)`,
      details: `Eliminados: ${deletedNames.join(', ')} (ya no existían en Shopify)`,
      category: 'product',
    });

  if (logError) {
    console.warn('   ⚠️ Advertencia al insertar registro de actividad:', logError.message);
  } else {
    console.log('   ✅ Actividad registrada en Supabase.');
  }

  console.log('\n✨ ¡Sincronización completada con éxito! El catálogo en la base de datos está limpio.');
}

executeSync().catch(console.error);
