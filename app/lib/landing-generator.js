import { getSalesCopy, getCreativeBenefits, getProductFaqs, getFaqsHtml } from './copywriting-engine.js';

function uid() {
  return 'ct' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/**
 * AliExpress/Temu Style Real Reviews Wall
 */
function buildRealReviewsWall(research, scopeId) {
  const images = research.images || [];
  const reviewImagesData = research.reviewImages || [];
  const reviewCommentsData = research.reviewComments || [];
  
  if (images.length < 2 && reviewImagesData.length === 0) return '';

  const names = ['Juan P.', 'María L.', 'Carlos R.', 'Elena M.', 'Andrés G.', 'Sandra V.', 'Ricardo T.', 'Paola C.'];
  const dates = ['Hace 2 días', 'Hace 5 días', 'Ayer', 'La semana pasada', 'Hace 3 días'];
  const defaultComments = [
    "Excelente producto, llegó muy rápido y funciona tal cual la descripción. Súper recomendado.",
    "Me encantó, la calidad es mucho mejor de lo que esperaba por el precio. Muy feliz con mi compra.",
    "Llegó en perfecto estado a Medellín. El vendedor estuvo muy pendiente. 5 estrellas.",
    "Funciona perfecto, muy útil y práctico. Lo volvería a comprar sin duda.",
    "Muy buen empaque y el producto se siente de muy buena calidad. Gracias!"
  ];
  
  // Prioritize REAL buyer review photos from ML. Fallback to the end of the main gallery (lifestyle shots).
  const reviewImages = reviewImagesData.length > 0 
    ? reviewImagesData.slice(0, 8) 
    : (images.length > 5 ? images.slice(-4) : images.slice(1, 4));

  const reviewComments = reviewCommentsData.length > 0
    ? reviewCommentsData.slice(0, reviewImages.length)
    : Array(reviewImages.length).fill(null).map((_, i) => defaultComments[i % defaultComments.length]);

  return `
    <div class="${scopeId}-reviews-wall">
      ${reviewImages.map((src, i) => {
        const rating = i % 3 === 0 ? '⭐⭐⭐⭐' : '⭐⭐⭐⭐⭐';
        return `
          <div class="${scopeId}-review-card">
            <div class="${scopeId}-review-header">
              <div class="${scopeId}-review-user">
                <strong>${names[i % names.length]}</strong>
                <span>Compra Verificada</span>
              </div>
              <div class="${scopeId}-review-stars">${rating}</div>
            </div>
            <div class="${scopeId}-review-image">
              <img src="${src}" alt="Reseña real">
            </div>
            <div class="${scopeId}-review-footer">
              <p>"${reviewComments[i]}"</p>
              <span>${dates[i % dates.length]}</span>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div style="text-align:center; margin-top:15px; font-size:13px; color:#10b981; font-weight:700; text-transform:uppercase; letter-spacing:1px;">
      ✅ +2,480 clientes satisfechos en Colombia
    </div>
  `;
}

/**
 * Professional Trust Badges - Side by Side with Images
 */
function buildTrustBadges(scopeId) {
  return `
    <div class="${scopeId}-trust-row">
      <div class="${scopeId}-trust-col">
        <div class="${scopeId}-trust-icon-bg">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#00a650" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        </div>
        <span>Envío Gratis</span>
      </div>
      <div class="${scopeId}-trust-col">
        <div class="${scopeId}-trust-icon-bg">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#3483fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
        </div>
        <span>Paga al Recibir</span>
      </div>
      <div class="${scopeId}-trust-col">
        <div class="${scopeId}-trust-icon-bg">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ff7733" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path></svg>
        </div>
        <span>Garantía Directa</span>
      </div>
    </div>
  `;
}

/**
 * Payment Security Seals
 */
function buildPaymentSecuritySeals(scopeId) {
  return `
    <div style="background: #ffffff; padding: 25px 15px; border-radius: 20px; margin: 20px 15px; border: 1px solid #e2e8f0; text-align: center;">
      <p style="font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px;">Pago 100% Seguro y Protegido</p>
      <div style="display: flex; justify-content: center; gap: 25px; align-items: center;">
        <svg viewBox="0 0 24 24" width="35" height="35" fill="none" stroke="#00a650" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        <svg viewBox="0 0 24 24" width="35" height="35" fill="none" stroke="#00a650" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="12" cy="12" r="2"></circle><path d="M6 12h.01M18 12h.01"></path></svg>
        <svg viewBox="0 0 24 24" width="35" height="35" fill="none" stroke="#00a650" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      </div>
      <p style="font-size: 11px; color: #64748b; margin-top: 15px; line-height: 1.4;">Tus datos están protegidos con encriptación SSL de 256 bits. Compras con total tranquilidad en Clickea Tienda.</p>
    </div>
  `;
}

/**
 * Social Proof Badges - Compact single line
 */
function buildSocialProofCompact(scopeId) {
  const baseViewers = Math.floor(Math.random() * (450 - 280) + 280);
  const baseSold = Math.floor(Math.random() * (95 - 45) + 45);
  const rating = (Math.random() * (5.0 - 4.8) + 4.8).toFixed(1);

  return `
    <div class="${scopeId}-social-row">
      <div class="${scopeId}-social-item">👁️ <span id="${scopeId}-viewers">${baseViewers}</span> personas viendo ahora</div>
      <div class="${scopeId}-social-item">🛒 <span id="${scopeId}-sold">${baseSold}</span> vendidos hoy</div>
      <div class="${scopeId}-social-item">⭐ ${rating} valoración</div>
    </div>
    <script>
      (function(){
        const vEl = document.getElementById('${scopeId}-viewers');
        const sEl = document.getElementById('${scopeId}-sold');
        if(vEl) {
          setInterval(() => {
            const current = parseInt(vEl.innerText);
            const diff = Math.floor(Math.random() * 7) - 3;
            vEl.innerText = Math.max(150, current + diff);
          }, 3000);
        }
        if(sEl) {
          setInterval(() => {
            const current = parseInt(sEl.innerText);
            if(Math.random() > 0.8) sEl.innerText = current + 1;
          }, 10000);
        }
      })();
    </script>
  `;
}

/**
 * Features List with Benefits (Name: Benefit)
 */
function buildFeaturesList(features, scopeId) {
  if (!features || features.length === 0) return '';
  
  const benefitMap = {
    'color': 'Disponible en tonos premium que combinan con tu estilo.',
    'material': 'Construcción robusta que garantiza años de uso sin desgaste.',
    'bateria': 'Autonomía extendida para que nunca te quedes a medias.',
    'pantalla': 'Alta resolución para una claridad visual sin precedentes.',
    'diseño': 'Ergonomía avanzada para máxima comodidad durante horas.',
    'garantía': 'Tu inversión está protegida ante cualquier eventualidad.',
    'voltaje': 'Compatible con la red eléctrica estándar para tu comodidad.',
    'capacidad': 'Espacio generoso para cubrir todas tus necesidades diarias.'
  };

  return `
    <div style="margin:30px 15px;">
      <h3 class="${scopeId}-section-title">✨ Características Técnicas</h3>
      <ul class="${scopeId}-feature-list">
        ${features.slice(0, 8).map(f => {
          let [name, benefit] = f.includes(':') ? f.split(':') : [f, ''];
          name = name.trim();
          benefit = benefit?.trim();

          // Handle "SI/SÍ/YES" or empty values in features list
          const isBooleanPos = /^(si|sí|yes|true|1)$/i.test(benefit);
          if (!benefit || isBooleanPos) {
            const key = Object.keys(benefitMap).find(k => name.toLowerCase().includes(k));
            benefit = key ? benefitMap[key] : 'Calidad superior diseñada para superar tus expectativas.';
          }

          return `<li><strong>${name}</strong> <span>${benefit}</span></li>`;
        }).join('')}
      </ul>
    </div>
  `;
}

/**
 * Carousel logic
 */
function buildCarousel(images, productName, scopeId) {
  if (!images || images.length === 0) return { css: '', html: '' };
  const carouselImages = images.slice(0, 6);
  const count = carouselImages.length;
  const cycleDuration = count * 3;
  const showPercent = Math.round(85 / count);

  const css = `
    .${scopeId}-carousel { position: relative; width: 100%; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden; background: #f8fafc; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .${scopeId}-carousel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; opacity: 0; animation: ${scopeId}-cycle ${cycleDuration}s infinite; }
    ${carouselImages.map((_, i) => `.${scopeId}-carousel img:nth-child(${i + 1}) { animation-delay: ${i * 3}s; }`).join('')}
    @keyframes ${scopeId}-cycle { 0%, 3% { opacity: 0; } 6%, ${showPercent}% { opacity: 1; } ${showPercent + 5}%, 100% { opacity: 0; } }
  `;
  const html = `<div class="${scopeId}-carousel">${carouselImages.map((src, i) => `<img src="${src}" alt="${productName}" loading="${i === 0 ? 'eager' : 'lazy'}">`).join('')}</div>`;
  return { css, html };
}

/**
 * Dynamic CSS Anatomical Highlight
 */
function buildAnatomicalHighlight(research, scopeId) {
  // If user provided a manual features image, render it directly
  if (research.featuresImage) {
    return `
      <div style="background: #f8fafc; padding: 30px 15px; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; margin: 20px 15px; position: relative;">
        <h2 class="${scopeId}-section-title" style="margin-bottom: 35px;">Anatomía del Producto</h2>
        <div style="width: 100%; max-width: 500px; margin: 0 auto; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <img src="${research.featuresImage}" alt="Características Técnicas" style="width: 100%; height: auto; display: block;" />
        </div>
        <div style="text-align:center; margin-top:25px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; display:flex; align-items:center; justify-content:center; gap:8px;">
          <span style="width:20px; height:1px; background:#cbd5e1;"></span>
          ESPECIFICACIONES TÉCNICAS
          <span style="width:20px; height:1px; background:#cbd5e1;"></span>
        </div>
      </div>
    `;
  }

  // Otherwise, use the automated CSS Blueprint overlay
  const mainImage = research.images[0];
  const feats = research.features && research.features.length >= 4 
    ? research.features.slice(0, 4) 
    : [];
  
  // Default labels if features are missing
  const labels = [
    feats[0] ? feats[0].split(':')[0].trim() : 'Material Premium',
    feats[1] ? feats[1].split(':')[0].trim() : 'Diseño Ergonómico',
    feats[2] ? feats[2].split(':')[0].trim() : 'Alta Durabilidad',
    feats[3] ? feats[3].split(':')[0].trim() : 'Tecnología Avanzada'
  ];

  return `
    <style>
      .${scopeId}-anatomy-container { position: relative; width: 100%; max-width: 400px; margin: 0 auto; aspect-ratio: 1/1; }
      .${scopeId}-anatomy-img { width: 100%; height: 100%; object-fit: contain; }
      .${scopeId}-anatomy-dot { position: absolute; width: 12px; height: 12px; background: #10b981; border-radius: 50%; box-shadow: 0 0 0 4px rgba(16,185,129,0.3); z-index: 10; }
      .${scopeId}-anatomy-label { position: absolute; background: white; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 800; color: #1e293b; box-shadow: 0 4px 10px rgba(0,0,0,0.1); white-space: nowrap; z-index: 20; border: 2px solid #10b981; }
      .${scopeId}-anatomy-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
      
      /* Position 1: Top Left */
      .${scopeId}-dot-1 { top: 30%; left: 35%; }
      .${scopeId}-lbl-1 { top: 10%; left: 5%; }
      
      /* Position 2: Top Right */
      .${scopeId}-dot-2 { top: 35%; right: 30%; }
      .${scopeId}-lbl-2 { top: 15%; right: 5%; }
      
      /* Position 3: Bottom Left */
      .${scopeId}-dot-3 { bottom: 35%; left: 30%; }
      .${scopeId}-lbl-3 { bottom: 15%; left: 5%; }
      
      /* Position 4: Bottom Right */
      .${scopeId}-dot-4 { bottom: 40%; right: 35%; }
      .${scopeId}-lbl-4 { bottom: 20%; right: 5%; }
    </style>
    
    <div style="background: #f8fafc; padding: 30px 15px; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; margin: 20px 15px; position: relative;">
      <h2 class="${scopeId}-section-title" style="margin-bottom: 35px;">Anatomía del Producto</h2>
      
      <div class="${scopeId}-anatomy-container">
        <img src="${mainImage}" alt="Anatomía del Producto" class="${scopeId}-anatomy-img">
        
        <svg class="${scopeId}-anatomy-svg" viewBox="0 0 400 400">
          <line x1="140" y1="120" x2="60" y2="70" stroke="#10b981" stroke-width="2" stroke-dasharray="4" />
          <line x1="280" y1="140" x2="340" y2="90" stroke="#10b981" stroke-width="2" stroke-dasharray="4" />
          <line x1="120" y1="260" x2="60" y2="320" stroke="#10b981" stroke-width="2" stroke-dasharray="4" />
          <line x1="260" y1="240" x2="340" y2="300" stroke="#10b981" stroke-width="2" stroke-dasharray="4" />
        </svg>

        <!-- Callout 1 -->
        <div class="${scopeId}-anatomy-dot ${scopeId}-dot-1"></div>
        <div class="${scopeId}-anatomy-label ${scopeId}-lbl-1">${labels[0]}</div>
        
        <!-- Callout 2 -->
        <div class="${scopeId}-anatomy-dot ${scopeId}-dot-2"></div>
        <div class="${scopeId}-anatomy-label ${scopeId}-lbl-2">${labels[1]}</div>
        
        <!-- Callout 3 -->
        <div class="${scopeId}-anatomy-dot ${scopeId}-dot-3"></div>
        <div class="${scopeId}-anatomy-label ${scopeId}-lbl-3">${labels[2]}</div>
        
        <!-- Callout 4 -->
        <div class="${scopeId}-anatomy-dot ${scopeId}-dot-4"></div>
        <div class="${scopeId}-anatomy-label ${scopeId}-lbl-4">${labels[3]}</div>
      </div>
      
      <div style="text-align:center; margin-top:25px; font-size:12px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:1.5px; display:flex; align-items:center; justify-content:center; gap:8px;">
        <span style="width:20px; height:1px; background:#cbd5e1;"></span>
        ESPECIFICACIONES TÉCNICAS
        <span style="width:20px; height:1px; background:#cbd5e1;"></span>
      </div>
    </div>
  `;
}

export function generateLanding(research, globalIcons = {}) {
  const scopeId = uid();
  const copy = getSalesCopy(research.name, research.features, research.category);
  const benefits = getCreativeBenefits(research.name, research.features);
  const carousel = buildCarousel(research.images, research.name, scopeId);
  const specificFaqs = getProductFaqs(research.name, research.features);

  return `
<style>
  #${scopeId} { font-family: 'Inter', sans-serif; color: #1e293b; max-width: 600px; margin: 0 auto; background: #fff; line-height: 1.5; }
  .${scopeId}-trust-row { display: flex; justify-content: space-between; padding: 15px 10px; gap: 5px; border-top: 1px solid #f1f5f9; margin-top: 5px; background: #fafafa; }
  .${scopeId}-trust-col { flex: 1; text-align: center; font-size: 13px; font-weight: 800; color: #1e293b; }
  .${scopeId}-trust-col img { width: 48px; height: 48px; margin: 0 auto 8px; display: block; }
  .${scopeId}-social-row { display: flex; justify-content: center; gap: 8px; font-size: 10px; color: #94a3b8; margin: 10px 0; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
  .${scopeId}-social-item { background: #fff; padding: 4px 8px; border-radius: 4px; display: flex; align-items: center; gap: 3px; border: 1px solid #f1f5f9; }
  .${scopeId}-section-title { font-size: 22px; font-weight: 900; color: #0f172a; text-align: center; margin-bottom: 20px; letter-spacing: -0.5px; }
  .${scopeId}-feature-list { list-style: none; padding: 0; margin: 15px 0; border-top: 1px solid #f1f5f9; }
  .${scopeId}-feature-list li { padding: 4px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; color: #64748b; line-height: 1.2; display: flex; align-items: flex-start; }
  .${scopeId}-feature-list li strong { color: #334155; text-transform: uppercase; font-size: 11px; letter-spacing: 0.3px; flex-shrink: 0; width: 100px; margin-right: 10px; }
  .${scopeId}-feature-list li span { flex: 1; }
  
  .${scopeId}-reviews-wall { display: flex; gap: 15px; overflow-x: auto; padding: 10px 5px; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; }
  .${scopeId}-review-card { flex: 0 0 240px; background: #fff; border-radius: 12px; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.05); scroll-snap-align: start; display: flex; flex-direction: column; overflow: hidden; }
  .${scopeId}-review-header { padding: 10px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #f8fafc; }
  .${scopeId}-review-user strong { display: block; font-size: 13px; color: #1e293b; }
  .${scopeId}-review-user span { font-size: 10px; color: #10b981; font-weight: 700; }
  .${scopeId}-review-stars { font-size: 10px; }
  .${scopeId}-review-image { width: 100%; aspect-ratio: 1/1; overflow: hidden; }
  .${scopeId}-review-image img { width: 100%; height: 100%; object-fit: cover; }
  .${scopeId}-review-footer { padding: 10px; }
  .${scopeId}-review-footer p { font-size: 12px; color: #475569; margin: 0 0 5px 0; line-height: 1.4; font-style: italic; }
  .${scopeId}-review-footer span { font-size: 10px; color: #94a3b8; }
  .${scopeId}-reviews-wall::-webkit-scrollbar { display: none; }
  
  ${carousel.css}
</style>

<div id="${scopeId}">
  <!-- TITLE & CAROUSEL -->
  <div style="padding: 25px 20px;">
    <h1 style="font-size: 26px; font-weight: 900; text-align: center; margin-bottom: 25px; line-height:1.2; color:#0f172a;">${research.name}</h1>
    ${carousel.html}
  </div>

  <!-- ORDER: SOCIAL PROOF FIRST -->
  ${buildSocialProofCompact(scopeId)}

  <!-- PAIN POINT SECTION (DYNAMIC & SPECIFIC) -->
  <div style="padding: 30px 20px; background: #fef2f2; border-radius: 20px; margin: 25px 15px; border: 1px dashed #fca5a5;">
    <h2 style="font-size: 20px; font-weight: 900; color: #991b1b; margin-bottom: 12px; line-height:1.3;">${copy.hook}</h2>
    <p style="font-size: 15px; color: #7f1d1d; line-height: 1.6;">${copy.pain}</p>
    <div style="margin-top:20px; padding:15px; background:white; border-radius:12px; border-left: 5px solid #ef4444;">
       <p style="font-size: 14px; color: #1e293b; margin:0;">${copy.solution}</p>
    </div>
  </div>

  <!-- ORDER: TRUST BADGES SECOND -->
  ${buildTrustBadges(scopeId)}

  <!-- SOCIAL VALIDATION COLLAGE (PRODUCT SPECIFIC) -->
  <div style="padding: 30px 0;">
    <h2 class="${scopeId}-section-title">Lo que dicen nuestros clientes</h2>
    ${buildRealReviewsWall(research, scopeId)}
  </div>

  <!-- BENEFITS LIST (CREATIVE & LONG) -->
  <div style="padding: 35px 20px; background: #0f172a; color: white; border-radius: 24px; margin: 25px 15px;">
    <h2 style="font-size: 22px; font-weight: 900; color: #fff; margin-bottom: 20px; text-align:center;">¿Por qué elegir el ${research.name}?</h2>
    <div style="display: flex; flex-direction: column; gap: 20px;">
      ${benefits.map(b => {
        const parts = b.split('**');
        const title = parts.length > 1 ? parts[1].replace(':', '') : 'Beneficio';
        const desc = parts.length > 2 ? parts[2] : b;
        return `
          <div style="display:flex; gap:15px; align-items:flex-start;">
            <div style="font-size:24px;">✅</div>
            <div>
              <p style="font-size:16px; font-weight:800; margin:0 0 5px 0; color:#10b981;">${title}</p>
              <p style="font-size:14px; color:#cbd5e1; margin:0; line-height:1.5;">${desc}</p>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </div>

  <!-- TECHNICAL HIGHLIGHT IMAGE (DYNAMIC) -->
  ${buildAnatomicalHighlight(research, scopeId)}

  <!-- FEATURES LIST -->
  ${buildFeaturesList(research.features, scopeId)}

  <!-- PAYMENT SECURITY -->
  ${buildPaymentSecuritySeals(scopeId)}

  <!-- FAQS -->
  ${getFaqsHtml(specificFaqs)}

  <div style="height:40px;"></div>
</div>
`;
}
