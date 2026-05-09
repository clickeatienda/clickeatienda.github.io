/* ============================================
   SELECT PRODUCTS FROM DROPI
   Selects 20 premium products daily based on criteria
   Executed by GitHub Actions daily at 6AM COL
   ============================================ */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Product selection criteria
const CRITERIA = {
  minStock: 20,
  maxWeightKg: 3,
  maxSupplierCost: 80000, // COP
  minImages: 2,
  premiumOnly: true,
  dailyImportCount: 20,
};

// Categories to rotate through (prioritize trending)
const CATEGORIES = [
  "Tecnología", "Belleza", "Hogar", "Moda", "Deportes",
  "Herramientas", "Mascotas", "Juguetes", "Vehículos", "Oficina",
];

/**
 * Scrape Dropi catalog page and extract product data
 * Since Dropi doesn't have a public API, we use the Dropify Shopify integration
 * or web scraping as fallback
 */
async function getDropiProducts() {
  // Method 1: Use Dropi's internal API endpoints (discovered from panel)
  // The Dropi panel at app.dropi.co uses REST endpoints internally
  const DROPI_BASE = 'https://app.dropi.co/api';
  
  // Note: These endpoints require authentication cookies from the Dropi session
  // In production, we'll use Playwright in GitHub Actions to:
  // 1. Login to Dropi
  // 2. Navigate catalog with filters (premium, stock, category)
  // 3. Extract product data
  
  // For now, return mock structure matching Dropi's data format
  console.log('📦 Fetching products from Dropi...');
  console.log(`   Criteria: Premium only, Stock ≥ ${CRITERIA.minStock}, Weight ≤ ${CRITERIA.maxWeightKg}kg`);
  console.log(`   Max supplier cost: $${CRITERIA.maxSupplierCost.toLocaleString()} COP`);
  
  // TODO: Replace with actual Dropi scraping when credentials are provided
  return [];
}

/**
 * Filter products based on selection criteria
 */
function filterProducts(products) {
  return products.filter(p => {
    if (CRITERIA.premiumOnly && !p.isPremium) return false;
    if (p.stock < CRITERIA.minStock) return false;
    if (p.weightKg > CRITERIA.maxWeightKg) return false;
    if (p.supplierCost > CRITERIA.maxSupplierCost) return false;
    if ((p.images?.length || 0) < CRITERIA.minImages) return false;
    return true;
  });
}

/**
 * Diversify selection across categories
 */
function diversifyByCategory(products, count) {
  const perCategory = Math.ceil(count / CATEGORIES.length);
  const selected = [];
  const byCategory = {};

  // Group by category
  products.forEach(p => {
    const cat = p.category || 'Otros';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(p);
  });

  // Pick from each category
  for (const cat of CATEGORIES) {
    const catProducts = byCategory[cat] || [];
    const picks = catProducts.slice(0, perCategory);
    selected.push(...picks);
    if (selected.length >= count) break;
  }

  return selected.slice(0, count);
}

/**
 * Check which products are already in our database (avoid duplicates)
 */
async function getExistingDropiIds() {
  const { data } = await supabase
    .from('products')
    .select('dropi_id')
    .not('dropi_id', 'is', null);
  
  return new Set((data || []).map(p => p.dropi_id));
}

/**
 * Save selected products to Supabase
 */
async function saveProducts(products) {
  if (products.length === 0) {
    console.log('⚠️  No new products to import');
    return;
  }

  const { data, error } = await supabase
    .from('products')
    .insert(products.map(p => ({
      dropi_id: p.dropiId,
      name: p.name,
      description: p.description,
      category: p.category,
      supplier_name: p.supplierName,
      supplier_cost: p.supplierCost,
      stock: p.stock,
      weight_kg: p.weightKg,
      images: p.images,
      is_premium_supplier: p.isPremium,
    })));

  if (error) {
    console.error('❌ Error saving products:', error.message);
  } else {
    console.log(`✅ Saved ${products.length} products to database`);
  }
}

/**
 * Log activity
 */
async function logActivity(action, details) {
  await supabase.from('activity_log').insert({
    action,
    details,
    category: 'product',
  });
}

// Main execution
async function main() {
  console.log('🚀 Starting daily product selection...');
  console.log(`📅 Date: ${new Date().toISOString()}`);
  
  try {
    // Get products from Dropi
    const allProducts = await getDropiProducts();
    console.log(`   Found ${allProducts.length} total products`);

    // Filter by criteria
    const filtered = filterProducts(allProducts);
    console.log(`   ${filtered.length} products match criteria`);

    // Remove already imported
    const existingIds = await getExistingDropiIds();
    const newProducts = filtered.filter(p => !existingIds.has(p.dropiId));
    console.log(`   ${newProducts.length} are new (not yet imported)`);

    // Diversify across categories
    const selected = diversifyByCategory(newProducts, CRITERIA.dailyImportCount);
    console.log(`   Selected ${selected.length} products for today`);

    // Save to database
    await saveProducts(selected);

    // Log activity
    await logActivity(
      'Importación diaria de productos',
      `${selected.length} productos nuevos importados de Dropi`
    );

    console.log('✅ Product selection complete!');
  } catch (error) {
    console.error('❌ Error in product selection:', error.message);
    process.exit(1);
  }
}

main();
