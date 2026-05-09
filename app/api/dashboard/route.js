import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase isn't configured yet, return demo data
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({
      stats: {
        ventasHoy: 0, productsActive: 0, visitasHoy: 0,
        tasaDevolucion: 0, contentPublished: 0, margenPromedio: 8,
      },
      recentProducts: [],
      socialQueue: [],
      timeline: [
        { icon: "🚀", text: "Sistema Clickea Tienda inicializado", time: "Ahora" },
        { icon: "⚙️", text: "Motor de precios configurado — margen 8%", time: "Ahora" },
        { icon: "🤖", text: "Fábrica de contenido activada", time: "Ahora" },
        { icon: "📦", text: "Esperando conexión con Dropi...", time: "Pendiente" },
      ],
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const today = new Date().toISOString().split('T')[0];

  // Fetch latest metrics
  const { data: metrics } = await supabase
    .from('metrics_snapshots')
    .select('*')
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single();

  // Fetch recent products
  const { data: products } = await supabase
    .from('products')
    .select('id, dropi_id, name, category, supplier_cost, selling_price, before_price, discount_percent, images, is_active, stock')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch social queue
  const { data: social } = await supabase
    .from('social_content')
    .select('id, platform, title, status, scheduled_at, published_at')
    .order('created_at', { ascending: false })
    .limit(8);

  // Fetch recent activity
  const { data: activity } = await supabase
    .from('activity_log')
    .select('action, details, category, created_at')
    .order('created_at', { ascending: false })
    .limit(6);

  return NextResponse.json({
    stats: {
      ventasHoy: metrics?.total_orders || 0,
      productsActive: metrics?.products_active || 0,
      visitasHoy: metrics?.visitors || 0,
      tasaDevolucion: metrics?.return_rate || 0,
      contentPublished: metrics?.content_published || 0,
      margenPromedio: metrics?.avg_margin || 8,
    },
    recentProducts: products || [],
    socialQueue: social || [],
    timeline: (activity || []).map(a => ({
      icon: a.category === 'product' ? '📦' : a.category === 'content' ? '📱' : a.category === 'pricing' ? '💰' : '⚡',
      text: a.action,
      time: new Date(a.created_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' }),
    })),
  });
}
