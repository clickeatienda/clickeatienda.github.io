/* ============================================
   CONTENT FACTORY — Clickea Tienda
   Automated video & image creation engine
   
   KEY SOLUTION FOR 48 VIDEOS/DAY AT $0:
   ======================================
   1. edge-tts (Microsoft) → UNLIMITED free TTS
      - Voices: es-CO-SalomeNeural, es-CO-GonzaloNeural
      - No API key, no limits, no watermark
   
   2. FFmpeg → Free video rendering from images + audio + text
      - Product images from Dropi
      - Animated text overlays (price, discount, CTA)
      - Music from Pixabay (royalty-free)
      - Brand watermark
   
   3. Multi-account TikTok strategy:
      - Main: @clickeatienda (brand, products, promos)
      - Alt 1: @clickeaofertas (deals, flash sales) 
      - Alt 2: @clickeatips (tips, trends, memes, organic)
      - Each posts ~16 videos/day = 48 total
      - Staggered every 30 min across accounts
   
   4. GitHub Actions rendering:
      - Split into 6 workflows (4-hour intervals)
      - Each renders 8 videos (~3 min each = 24 min)
      - Total: 48 videos/day within 2,000 min/month
   
   ============================================ */

/**
 * Video templates configuration
 */
export const VIDEO_TEMPLATES = {
  // Template 1: Product Showcase (most common)
  productShowcase: {
    name: "Product Showcase",
    duration: 15, // seconds
    resolution: { w: 1080, h: 1920 }, // 9:16 vertical
    scenes: [
      { type: "intro", duration: 2, text: "¡Mira esto! 👀" },
      { type: "product_image", duration: 5, zoom: true },
      { type: "features", duration: 4, bulletPoints: 3 },
      { type: "price_reveal", duration: 2, animation: "scale_up" },
      { type: "cta", duration: 2, text: "¡Pago al recibir! 💵" },
    ],
  },

  // Template 2: Before/After or Problem/Solution
  problemSolution: {
    name: "Problema → Solución",
    duration: 20,
    resolution: { w: 1080, h: 1920 },
    scenes: [
      { type: "hook", duration: 3, text: "¿Te pasa esto? 😩" },
      { type: "problem_image", duration: 4 },
      { type: "transition", duration: 1, effect: "swipe" },
      { type: "solution_product", duration: 6, zoom: true },
      { type: "price_reveal", duration: 3 },
      { type: "cta", duration: 3, text: "Link en bio 🔗" },
    ],
  },

  // Template 3: Flash Deal / Urgency
  flashDeal: {
    name: "Oferta Flash ⚡",
    duration: 12,
    resolution: { w: 1080, h: 1920 },
    scenes: [
      { type: "urgency_hook", duration: 2, text: "⚡ OFERTA FLASH ⚡" },
      { type: "product_image", duration: 4 },
      { type: "price_comparison", duration: 3, showDiscount: true },
      { type: "cta", duration: 3, text: "¡Solo por hoy! Envío GRATIS 🚚" },
    ],
  },

  // Template 4: Multi-product carousel video
  multiProduct: {
    name: "Top Productos",
    duration: 30,
    resolution: { w: 1080, h: 1920 },
    scenes: [
      { type: "intro", duration: 3, text: "Top 5 productos de hoy 🏆" },
      // 5 products × 4 seconds each
      { type: "product_slide", duration: 4, repeat: 5 },
      { type: "cta", duration: 3, text: "clickeatienda.myshopify.com" },
    ],
  },

  // Template 5: Organic/Viral content (tips, memes)
  organic: {
    name: "Contenido Orgánico",
    duration: 15,
    resolution: { w: 1080, h: 1920 },
    scenes: [
      { type: "hook_text", duration: 3 },
      { type: "content", duration: 9 },
      { type: "brand_plug", duration: 3, text: "Síguenos: @clickeatienda" },
    ],
  },
};

/**
 * TTS voices configuration (edge-tts)
 * These are UNLIMITED and FREE - no API key needed
 */
export const TTS_VOICES = {
  female: "es-CO-SalomeNeural",  // Natural Colombian female voice
  male: "es-CO-GonzaloNeural",    // Natural Colombian male voice
};

/**
 * Multi-account posting strategy
 */
export const POSTING_ACCOUNTS = {
  tiktok: [
    { handle: "@clickeatienda", type: "brand", postsPerDay: 16 },
    { handle: "@clickeaofertas", type: "deals", postsPerDay: 16 },
    { handle: "@clickeatips", type: "organic", postsPerDay: 16 },
  ],
  instagram: [
    { handle: "@clickeatienda", type: "brand", postsPerDay: 8 },
  ],
  youtube: [
    { handle: "Clickea Tienda", type: "brand", postsPerDay: 6 }, // API limit
  ],
  facebook: [
    { handle: "Clickea Tienda", type: "brand", postsPerDay: 10 },
  ],
};

/**
 * Daily content schedule
 * Distributes 48 TikTok videos + content for other platforms
 */
export const DAILY_SCHEDULE = {
  // TikTok: 48 videos/day across 3 accounts (every 30 min per account)
  tiktok: {
    totalVideos: 48,
    accountSplit: { brand: 16, deals: 16, organic: 16 },
    templateMix: {
      productShowcase: 0.40,  // 40% = ~19 videos
      flashDeal: 0.20,        // 20% = ~10 videos
      problemSolution: 0.15,  // 15% = ~7 videos
      multiProduct: 0.10,     // 10% = ~5 videos
      organic: 0.15,          // 15% = ~7 videos
    },
    postingInterval: 30, // minutes between posts per account
  },
  
  // Instagram: 8 pieces/day
  instagram: {
    reels: 4,
    carousels: 2,
    stories: 4,
    posts: 2,
  },
  
  // YouTube Shorts: 6/day (API limit)
  youtube: { shorts: 6 },
  
  // Facebook: 10/day
  facebook: { videos: 4, posts: 4, stories: 2 },
};

/**
 * Content captions bank - Colombian Spanish, playful tone
 */
export const CAPTION_TEMPLATES = {
  productShowcase: [
    "¿Ya viste esto? 😍 Envío GRATIS + Pagas al recibir 💵\n\n#clickeatienda #colombia #ofertas #enviogratis #pagocontraentrega",
    "Tu próxima compra favorita está aquí 🛒✨\nPagas cuando llega a tu puerta 🏠\n\n#compraonline #colombia #ofertas",
    "Esto se agota rapidísimo 🔥 ¡No te quedes sin el tuyo!\nEnvío gratis a toda Colombia 🇨🇴\n\n#clickeatienda #tendencia",
    "POV: Encontraste el producto que buscabas 😱💰\n\n#clickeatienda #ofertas #enviogratis #pagocontraentrega",
  ],
  flashDeal: [
    "⚡ OFERTA FLASH ⚡ Solo por hoy a este precio 🤯\nEnvío GRATIS + Pagas al recibir\n\n#oferta #descuento #colombia",
    "🚨 PRECIO LOCO 🚨 ¿En serio a este precio? 😳\nCorre antes de que se acabe!\n\n#clickeatienda #ofertaflash",
  ],
  organic: [
    "Dato que nadie te pidió pero todos necesitan 😂📱\nSíguenos para más → @clickeatienda\n\n#tips #datos #colombia",
    "Esto le pasa al 99% de colombianos 😂\n¿Te identificas? Comenta 👇\n\n#humor #colombia #memes",
  ],
};

/**
 * Generate FFmpeg command for video creation
 * This is executed in GitHub Actions where FFmpeg is pre-installed
 */
export function generateFFmpegCommand(template, assets) {
  const { images, audioPath, outputPath, texts, brandLogo } = assets;
  
  // Base filter for 9:16 vertical video with image slideshow
  const filters = [
    // Scale images to 1080x1920, center crop
    `[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1[img0]`,
    // Add text overlays
    `[img0]drawtext=text='${texts.hook}':fontcolor=white:fontsize=64:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=(w-text_w)/2:y=h*0.15:enable='between(t,0,3)'[v1]`,
    // Add price text
    `[v1]drawtext=text='${texts.price}':fontcolor=#4A9EFF:fontsize=80:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:x=(w-text_w)/2:y=h*0.75:enable='between(t,${template.duration - 5},${template.duration})'[v2]`,
    // Add brand watermark
    `[v2]drawtext=text='@clickeatienda':fontcolor=white@0.6:fontsize=28:x=w-text_w-20:y=h-50[vout]`,
  ];

  return {
    command: `ffmpeg -loop 1 -i "${images[0]}" -i "${audioPath}" -filter_complex "${filters.join(';')}" -map "[vout]" -map 1:a -c:v libx264 -preset ultrafast -tune stillimage -c:a aac -shortest -t ${template.duration} -pix_fmt yuv420p "${outputPath}"`,
    estimatedRenderTime: template.duration * 2, // ~2x realtime on GitHub Actions
  };
}

/**
 * Generate edge-tts command for voiceover
 */
export function generateTTSCommand(text, voice, outputPath) {
  return `edge-tts --text "${text}" --voice ${voice} --rate=+5% --write-media "${outputPath}"`;
}
