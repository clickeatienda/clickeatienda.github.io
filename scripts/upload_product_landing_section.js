require('dotenv').config({ path: '.env.local' });

const store = process.env.SHOPIFY_STORE;
const token = process.env.SHOPIFY_ACCESS_TOKEN;
const themeId = process.env.SHOPIFY_THEME_ID;

const sectionContent = `
<div class="landing-product-page">
  <div class="landing-container">
    {%- assign product = product | default: section.settings.product -%}

    {% comment %} TITLE {% endcomment %}
    <h1 class="landing-title">{{ product.title }}</h1>
    
    {% comment %} PRICE {% endcomment %}
    <div class="landing-price-box">
      <span class="landing-price-sale" style="color: #00a650; font-weight: bold; font-size: 28px;">
        {{ product.price | money }}
      </span>
      {% if product.compare_at_price > product.price %}
        <span class="landing-price-regular" style="text-decoration: line-through; color: #888; margin-left: 10px;">
          {{ product.compare_at_price | money }}
        </span>
        {% assign ahorro = product.compare_at_price | minus: product.price | times: 100.0 | divided_by: product.compare_at_price | round %}
        <span class="landing-badge-discount" style="background: #00a650; color: white; padding: 2px 6px; border-radius: 4px; font-size: 14px; margin-left: 10px; display: inline-block; transform: translateY(-4px);">
          -{{ ahorro }}% OFF
        </span>
      {% endif %}
    </div>

    {% comment %} GALLERY {% endcomment %}
    <div class="landing-gallery">
      {% for media in product.media %}
        <img src="{{ media | image_url: width: 800 }}" alt="{{ media.alt | escape }}" style="width: 100%; border-radius: 8px;">
      {% endfor %}
    </div>

    {% comment %} URGENCY {% endcomment %}
    <div class="landing-urgency" style="background: #fff3cd; color: #856404; padding: 12px; border-radius: 6px; text-align: center; margin: 20px 0; font-size: 15px; border: 1px solid #ffeeba;">
      🔥 <strong>¡Oferta Relámpago!</strong> Solo quedan <span style="color: #d32f2f; font-weight: bold;">7 unidades</span> disponibles.
    </div>

    {% comment %} TRUST BADGES - COMPACT {% endcomment %}
    <div style="display: flex; gap: 8px; margin: 15px 0;">
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 10px 6px; text-align: center;">
        <div style="font-size: 18px; margin-bottom: 2px;">✅</div>
        <div style="font-size: 11px; font-weight: 700; color: #166534; line-height: 1.2;">Pagas al Recibir</div>
      </div>
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 10px 6px; text-align: center;">
        <div style="font-size: 18px; margin-bottom: 2px;">🚚</div>
        <div style="font-size: 11px; font-weight: 700; color: #166534; line-height: 1.2;">Envío Gratis</div>
      </div>
      <div style="flex: 1; background: #f0fdf4; border: 1px solid #dcfce7; border-radius: 8px; padding: 10px 6px; text-align: center;">
        <div style="font-size: 18px; margin-bottom: 2px;">🛡️</div>
        <div style="font-size: 11px; font-weight: 700; color: #166534; line-height: 1.2;">Garantía Total</div>
      </div>
    </div>



    {% comment %} DESCRIPTION {% endcomment %}
    <div class="landing-description" style="margin-top: 40px;">
      <h2 style="font-size: 22px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #f0f0f0;">Detalles del Producto</h2>
      <div class="rte" style="font-size: 16px; line-height: 1.6; color: #444;">
        {{ product.description }}
      </div>
    </div>
  </div>
</div>

<style>
  .landing-product-page {
    max-width: 500px;
    margin: 0 auto;
    padding: 20px 15px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  .landing-title {
    font-size: 26px;
    font-weight: 900;
    margin-bottom: 15px;
    line-height: 1.2;
    color: #111;
  }
  .landing-gallery {
    display: flex;
    overflow-x: auto;
    gap: 10px;
    scroll-snap-type: x mandatory;
    margin-bottom: 20px;
    padding-bottom: 10px;
  }
  .landing-gallery::-webkit-scrollbar {
    height: 6px;
  }
  .landing-gallery::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 4px;
  }
  .landing-gallery img {
    scroll-snap-align: center;
    flex: 0 0 100%;
    object-fit: contain;
    background: #f8f8f8;
  }

  .rte img {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
    margin: 15px 0;
    display: block;
  }
</style>

{% schema %}
{
  "name": "Landing Product Page",
  "class": "section-landing-product",
  "settings": [],
  "blocks": [
    {
      "type": "@app"
    }
  ],
  "presets": [
    {
      "name": "Landing Product Page"
    }
  ]
}
{% endschema %}
`;

async function uploadLandingSection() {
  console.log('Uploading sections/main-product-landing.liquid...');
  const res = await fetch('https://' + store + '/admin/api/2024-04/themes/' + themeId + '/assets.json', {
    method: 'PUT',
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset: { key: 'sections/main-product-landing.liquid', value: sectionContent } })
  });

  if (res.ok) {
    console.log('✅ Uploaded main-product-landing.liquid');
  } else {
    console.error('❌ Error uploading:', await res.text());
  }
}

uploadLandingSection();
