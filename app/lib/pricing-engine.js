/* ============================================
   PRICING ENGINE — Clickea Tienda
   Automatic price calculator for COD dropshipping
   ============================================ */

/**
 * Excluded departments/zones with high shipping costs or low delivery rates
 */
export const EXCLUDED_ZONES = [
  "San Andrés, Providencia y Santa Catalina",
  "Amazonas",
  "Guainía",
  "Vaupés",
  "Vichada",
  "Guaviare",
];

/**
 * High-cost zones that require special handling (higher shipping surcharge)
 */
export const HIGH_COST_ZONES = [
  "Chocó",
  "La Guajira",
  "Putumayo",
  "Caquetá",
  "Arauca",
  "Casanare",
];

/**
 * Default configuration for the pricing engine
 */
export const DEFAULT_PRICING_CONFIG = {
  // Shipping costs (COP)
  avgShippingCost: 12000,        // Average national shipping
  urbanShippingCost: 10000,      // Urban shipping
  regionalShippingCost: 16000,   // Regional shipping
  highCostZoneSurcharge: 8000,   // Extra for difficult zones
  
  // Return/cancellation rates
  returnRate: 0.25,              // 25% conservative initial estimate
  cancellationRate: 0.05,        // 5% cancellation before shipping
  
  // Margins
  targetMargin: 0.08,           // 8% initial margin
  minMargin: 0.05,              // 5% absolute minimum
  maxMargin: 0.30,              // 30% maximum target
  
  // Margin scaling thresholds (monthly orders)
  marginScaling: [
    { orders: 0,    margin: 0.08 },
    { orders: 50,   margin: 0.10 },
    { orders: 100,  margin: 0.12 },
    { orders: 200,  margin: 0.15 },
    { orders: 500,  margin: 0.20 },
    { orders: 1000, margin: 0.25 },
  ],
  
  // Price psychology
  roundTo: 900,                  // Round to nearest X (e.g., 47900, 63900)
  fakeDiscountMultiplier: 1.45,  // Show "before" price inflated by 45%
  
  // Platform fees
  shopifyFee: 0,                 // No transaction fee on basic with Shopify Payments
  dropiFee: 0,                   // No commission on Dropi
};

/**
 * Calculate the selling price for a product
 * @param {number} supplierCost - Product cost from Dropi (COP)
 * @param {object} config - Pricing configuration
 * @param {object} metrics - Real-time metrics for auto-adjustment
 * @returns {object} Pricing breakdown
 */
export function calculatePrice(supplierCost, config = DEFAULT_PRICING_CONFIG, metrics = {}) {
  // Auto-adjust return rate based on real metrics
  let effectiveReturnRate = config.returnRate;
  if (metrics.actualReturnRate !== undefined) {
    // Blend: 70% real data + 30% safety buffer
    effectiveReturnRate = (metrics.actualReturnRate * 0.7) + (config.returnRate * 0.3);
  }
  
  // Auto-adjust margin based on order volume
  let effectiveMargin = config.targetMargin;
  if (metrics.monthlyOrders !== undefined) {
    const scaling = [...config.marginScaling].reverse();
    const tier = scaling.find(t => metrics.monthlyOrders >= t.orders);
    if (tier) effectiveMargin = tier.margin;
  }
  
  // Calculate cost components
  const shippingCost = config.avgShippingCost;
  const returnCushion = supplierCost * effectiveReturnRate;
  const cancellationCushion = supplierCost * config.cancellationRate;
  
  // Total cost per successful sale
  const totalCost = supplierCost + shippingCost + returnCushion + cancellationCushion;
  
  // Selling price
  const rawPrice = totalCost / (1 - effectiveMargin);
  
  // Round to psychology price (e.g., 47900, 63900)
  const roundedPrice = Math.ceil(rawPrice / 1000) * 1000 - (1000 - config.roundTo);
  const sellingPrice = roundedPrice < rawPrice ? roundedPrice + 1000 : roundedPrice;
  
  // "Before" price (fake discount)
  const beforePrice = Math.ceil((sellingPrice * config.fakeDiscountMultiplier) / 1000) * 1000 - 100;
  
  // Discount percentage shown to customer
  const discountPercent = Math.round((1 - sellingPrice / beforePrice) * 100);
  
  // Actual margin
  const actualMargin = (sellingPrice - totalCost) / sellingPrice;
  
  // Profit per sale
  const profitPerSale = sellingPrice - totalCost;
  
  return {
    supplierCost,
    shippingCost,
    returnCushion: Math.round(returnCushion),
    cancellationCushion: Math.round(cancellationCushion),
    totalCost: Math.round(totalCost),
    sellingPrice,
    beforePrice,
    discountPercent,
    actualMargin: Math.round(actualMargin * 1000) / 10, // e.g., 8.5%
    profitPerSale: Math.round(profitPerSale),
    effectiveReturnRate: Math.round(effectiveReturnRate * 100),
    effectiveMargin: Math.round(effectiveMargin * 100),
  };
}

/**
 * Batch calculate prices for multiple products
 * @param {Array} products - Array of { id, supplierCost, ...}
 * @param {object} config
 * @param {object} metrics
 * @returns {Array}
 */
export function batchCalculatePrices(products, config = DEFAULT_PRICING_CONFIG, metrics = {}) {
  return products.map(product => ({
    ...product,
    pricing: calculatePrice(product.supplierCost, config, metrics),
  }));
}

/**
 * Check if a department/zone should be excluded
 * @param {string} department
 * @returns {boolean}
 */
export function isZoneExcluded(department) {
  return EXCLUDED_ZONES.some(z => 
    department.toLowerCase().includes(z.toLowerCase())
  );
}

/**
 * Check if a zone has high shipping costs
 * @param {string} department
 * @returns {boolean}
 */
export function isHighCostZone(department) {
  return HIGH_COST_ZONES.some(z => 
    department.toLowerCase().includes(z.toLowerCase())
  );
}
