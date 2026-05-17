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
    {% assign random_units = product.id | modulo: 8 | plus: 4 %}
    <div class="landing-urgency" style="background: #fff8f8; color: #991b1b; padding: 10px 14px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 8px; margin: 15px 0; font-size: 13px; border: 1px solid #fee2e2; font-weight: 600;">
      <img src="{{ 'flash_sale_icon.png' | asset_url }}" alt="Oferta Relámpago" style="width: 20px; height: 20px; object-fit: contain; flex-shrink: 0;" />
      <span><strong>¡Oferta Relámpago!</strong> Solo quedan <span style="color: #ef4444; font-weight: bold;">{{ random_units }} unidades</span> disponibles.</span>
    </div>

    {% comment %} TRUST BADGES - COMPACT {% endcomment %}
    <div style="display: flex; gap: 8px; margin: 15px 0;">
      <div style="flex: 1; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
        <img src="{{ 'cod_icon.png' | asset_url }}" alt="Pagas al Recibir" style="width: 24px; height: 24px; object-fit: contain;" />
        <div style="font-size: 10px; font-weight: 800; color: #475569; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.2px;">Pagas al Recibir</div>
      </div>
      <div style="flex: 1; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
        <img src="{{ 'shipping_icon.png' | asset_url }}" alt="Envío Gratis" style="width: 24px; height: 24px; object-fit: contain;" />
        <div style="font-size: 10px; font-weight: 800; color: #475569; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.2px;">Envío Gratis</div>
      </div>
      <div style="flex: 1; background: #fafafa; border: 1px solid #f0f0f0; border-radius: 10px; padding: 8px 4px; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;">
        <img src="{{ 'warranty_icon.png' | asset_url }}" alt="Garantía Total" style="width: 24px; height: 24px; object-fit: contain;" />
        <div style="font-size: 10px; font-weight: 800; color: #475569; line-height: 1.2; text-transform: uppercase; letter-spacing: 0.2px;">Garantía Total</div>
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
