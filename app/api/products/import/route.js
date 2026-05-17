import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { productName, dropiId, productImageUrls, reviewImageUrls, featuresImageUrl, gifUrls, supplierCost, category } = await request.json();

  if (!productName || !supplierCost) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Upsert the product record (update if dropi_id exists, otherwise insert)
  let query = supabase.from('products');
  
  const productData = {
    name: productName,
    dropi_id: dropiId || null,
    supplier_cost: supplierCost,
    category,
    images: productImageUrls || [],
    research_data: { 
      manualReviewImages: reviewImageUrls || [],
      manualFeaturesImage: featuresImageUrl || null,
      manualGifs: gifUrls || []
    },
    import_status: 'pending_research',
    status_message: 'Esperando al investigador local...',
    progress: 5,
    is_active: false,
  };

  const { data, error } = await query
    .upsert(productData, { 
      onConflict: dropiId ? 'dropi_id' : 'id',
      ignoreDuplicates: false 
    })
    .select('id')
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log activity
  await supabase.from('activity_log').insert({
    action: `Solicitud de importación: ${productName}`,
    details: `Categoría: ${category} | Costo: $${supplierCost.toLocaleString()}`,
    category: 'product',
  });

  return NextResponse.json({ id: data.id, status: 'pending_research' });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    status: data.import_status,
    status_message: data.status_message,
    progress: data.progress,
    product: data.import_status === 'ready' ? data : null,
    error: data.import_status === 'failed' ? data.status_message : null
  });
}
