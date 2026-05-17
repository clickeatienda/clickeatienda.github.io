import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const store = process.env.SHOPIFY_STORE;
  const token = process.env.SHOPIFY_ACCESS_TOKEN;
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-04';

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Base de datos no configurada en env variables.' }, { status: 500 });
  }
  if (!store || !token) {
    return NextResponse.json({ error: 'Shopify no está configurado en las variables de entorno.' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log(`🔄 Sincronizando catálogo con Shopify store: ${store}...`);

    // 1. Fetch active products from Shopify
    const shopifyUrl = `https://${store}/admin/api/${apiVersion}/products.json?limit=250`;
    const shopifyRes = await fetch(shopifyUrl, {
      method: 'GET',
      headers: {
        'X-Shopify-Access-Token': token,
        'Content-Type': 'application/json',
      },
    });

    if (!shopifyRes.ok) {
      const errText = await shopifyRes.text();
      console.error(`❌ Error consultando Shopify API: ${shopifyRes.status} - ${errText}`);
      return NextResponse.json({ error: `Shopify API Error: ${shopifyRes.status} - ${errText}` }, { status: 500 });
    }

    const shopifyData = await shopifyRes.json();
    const shopifyProducts = shopifyData.products || [];
    
    // Create a Set of active Shopify product IDs (as strings)
    const shopifyActiveIds = new Set(shopifyProducts.map(p => String(p.id)));
    console.log(`   🔎 Encontrados ${shopifyActiveIds.size} producto(s) activos en Shopify.`);

    // 2. Fetch all products from our local Supabase database
    const { data: dbProducts, error: dbError } = await supabase
      .from('products')
      .select('id, shopify_id, name, dropi_id, import_status');

    if (dbError) {
      console.error('❌ Error consultando Supabase:', dbError.message);
      return NextResponse.json({ error: `Supabase Error: ${dbError.message}` }, { status: 500 });
    }

    // 3. Identify products to delete
    const toDeleteIds = [];
    const deletedNames = [];

    for (const p of dbProducts || []) {
      // If a product has a Shopify ID, check if it's still present on Shopify
      if (p.shopify_id) {
        if (!shopifyActiveIds.has(String(p.shopify_id))) {
          toDeleteIds.push(p.id);
          deletedNames.push(p.name);
        }
      } else {
        // If it's a completed or failed import that doesn't have a Shopify ID (ghost product), clean it up.
        // But do not delete products currently undergoing import process
        const isCurrentlyImporting = ['pending_research', 'researching', 'generating_landing', 'publishing'].includes(p.import_status);
        if (!isCurrentlyImporting) {
          toDeleteIds.push(p.id);
          deletedNames.push(p.name || `ID: ${p.id}`);
        }
      }
    }

    console.log(`   🗑️ Productos obsoletos identificados para borrar: ${toDeleteIds.length}`);

    // 4. Safely delete products to prevent Foreign Key constraints violations
    if (toDeleteIds.length > 0) {
      // Step A: Delete referencing orders
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .in('product_id', toDeleteIds);
      if (orderError) console.warn('      ⚠️ Advertencia borrando pedidos:', orderError.message);

      // Step B: Delete referencing social media content
      const { error: socialError } = await supabase
        .from('social_content')
        .delete()
        .in('product_id', toDeleteIds);
      if (socialError) console.warn('      ⚠️ Advertencia borrando contenido social:', socialError.message);

      // Step C: Delete products from the products table
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .in('id', toDeleteIds);

      if (deleteError) {
        console.error('❌ Error eliminando productos obsoletos:', deleteError.message);
        return NextResponse.json({ error: `Error eliminando productos: ${deleteError.message}` }, { status: 500 });
      }

      // Log in system activity timeline
      await supabase.from('activity_log').insert({
        action: `Catálogo sincronizado: ${toDeleteIds.length} producto(s) obsoleto(s) removido(s)`,
        details: `Eliminados: ${deletedNames.join(', ')} (ya no existían en Shopify)`,
        category: 'product',
      });

      console.log(`   ✅ Sincronización exitosa. Borrados: ${toDeleteIds.length} producto(s).`);
    } else {
      // Log that sync was completed but nothing was deleted
      await supabase.from('activity_log').insert({
        action: 'Sincronización: Catálogo de productos al día',
        details: `Se verificaron ${shopifyActiveIds.size} productos en Shopify. Todo en orden.`,
        category: 'product',
      });
      console.log('   ✅ Catálogo al día. No se requirió eliminar ningún producto.');
    }

    return NextResponse.json({
      success: true,
      deletedCount: toDeleteIds.length,
      deletedProducts: deletedNames,
      remainingCount: (dbProducts?.length || 0) - toDeleteIds.length,
    });

  } catch (err) {
    console.error('❌ Error catastrófico en la sincronización:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor.' }, { status: 500 });
  }
}

// Support GET requests as well for easy triggering or button actions
export async function GET(request) {
  return POST(request);
}
