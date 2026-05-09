/* ============================================
   GENERATE VOICEOVERS — edge-tts
   Creates TTS audio files for video narration
   Uses Microsoft Edge TTS (FREE, UNLIMITED)
   Colombian Spanish voices
   ============================================ */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const VOICES = {
  female: process.env.EDGE_TTS_VOICE_FEMALE || 'es-CO-SalomeNeural',
  male: process.env.EDGE_TTS_VOICE_MALE || 'es-CO-GonzaloNeural',
};

const OUTPUT_DIR = '/tmp/voiceovers';
const BATCH_SIZE = parseInt(process.env.VIDEOS_PER_BATCH || '8');

/**
 * Script templates for different video types
 */
const SCRIPT_TEMPLATES = {
  productShowcase: (product) => [
    `¡Mira lo que tenemos para ti!`,
    `${product.name}, a un precio increíble.`,
    `Antes costaba ${formatPrice(product.before_price)}, pero hoy lo llevas por solo ${formatPrice(product.selling_price)}.`,
    `Envío gratis a toda Colombia y pagas cuando te llega a tu casa.`,
    `No te lo pierdas, ¡las unidades se agotan rápido!`,
  ],
  flashDeal: (product) => [
    `¡Oferta flash! Solo por hoy.`,
    `${product.name} con ${product.discount_percent} por ciento de descuento.`,
    `De ${formatPrice(product.before_price)} a solo ${formatPrice(product.selling_price)}.`,
    `Envío gratis. Pagas al recibir. ¡Corre!`,
  ],
  problemSolution: (product) => [
    `¿Todavía no tienes esto?`,
    `Conoce: ${product.name}.`,
    `La solución que estabas buscando, por solo ${formatPrice(product.selling_price)}.`,
    `Envío gratis y pago contra entrega en toda Colombia.`,
    `Haz clic en el link de la bio.`,
  ],
  multiProduct: (products) => [
    `¡Top cinco productos de hoy en Clickea Tienda!`,
    ...products.slice(0, 5).map((p, i) => 
      `Número ${i + 1}: ${p.name}, por solo ${formatPrice(p.selling_price)}.`
    ),
    `Todos con envío gratis y pago contra entrega.`,
    `Visita clickea tienda punto com.`,
  ],
  organic: () => [
    `Dato del día que nadie te pidió pero todos necesitan.`,
    `¿Sabías que en Clickea Tienda todos los productos tienen envío gratis?`,
    `Y lo mejor: pagas solo cuando te llega a la puerta de tu casa.`,
    `Síguenos para más ofertas increíbles.`,
  ],
};

function formatPrice(price) {
  if (!price) return 'precio especial';
  return `${Math.round(price / 1000)} mil pesos`;
}

/**
 * Generate a single voiceover using edge-tts CLI
 */
function generateVoiceover(text, outputFile, voice) {
  const escaped = text.replace(/"/g, '\\"').replace(/'/g, "\\'");
  const cmd = `edge-tts --text "${escaped}" --voice ${voice} --rate=+5% --pitch=+0Hz --write-media "${outputFile}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe', timeout: 30000 });
    return true;
  } catch (err) {
    console.error(`   ❌ TTS failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🎤 Generating voiceovers with edge-tts...');
  console.log(`   Voices: Female=${VOICES.female}, Male=${VOICES.male}`);
  console.log(`   Batch size: ${BATCH_SIZE}`);

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

  // Get products that need content
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .not('selling_price', 'is', null)
    .not('shopify_id', 'is', null)
    .order('published_at', { ascending: false })
    .limit(BATCH_SIZE * 2);

  if (!products?.length) {
    console.log('⚠️  No products available for content creation');
    return;
  }

  console.log(`   ${products.length} products available`);

  // Determine which templates to use for this batch
  const templates = [
    { type: 'productShowcase', count: 3 },
    { type: 'flashDeal', count: 2 },
    { type: 'problemSolution', count: 1 },
    { type: 'multiProduct', count: 1 },
    { type: 'organic', count: 1 },
  ];

  let videoIndex = 0;
  const generatedAudios = [];

  for (const template of templates) {
    for (let i = 0; i < template.count; i++) {
      const product = products[videoIndex % products.length];
      let scriptLines;

      if (template.type === 'multiProduct') {
        scriptLines = SCRIPT_TEMPLATES.multiProduct(products);
      } else if (template.type === 'organic') {
        scriptLines = SCRIPT_TEMPLATES.organic();
      } else {
        scriptLines = SCRIPT_TEMPLATES[template.type](product);
      }

      const fullScript = scriptLines.join(' ');
      const outputFile = path.join(OUTPUT_DIR, `vo_${videoIndex}.mp3`);
      const voice = videoIndex % 2 === 0 ? VOICES.female : VOICES.male;

      console.log(`   🎙️ [${videoIndex + 1}/${BATCH_SIZE}] ${template.type} — ${voice.split('-').pop()}`);

      const success = generateVoiceover(fullScript, outputFile, voice);
      if (success) {
        generatedAudios.push({
          index: videoIndex,
          type: template.type,
          product: product,
          audioPath: outputFile,
          script: fullScript,
          voice,
        });
      }

      videoIndex++;
      if (videoIndex >= BATCH_SIZE) break;
    }
    if (videoIndex >= BATCH_SIZE) break;
  }

  // Save manifest for render-videos.js to consume
  const manifestPath = path.join(OUTPUT_DIR, 'manifest.json');
  const { writeFileSync } = await import('fs');
  writeFileSync(manifestPath, JSON.stringify(generatedAudios, null, 2));

  console.log(`✅ Generated ${generatedAudios.length} voiceovers → ${manifestPath}`);
}

main();
