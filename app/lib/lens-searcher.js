/* ============================================
   LENS SEARCHER — Reverse Image Search Engine
   
   3-Strategy approach:
   1. Google Lens (primary) — best for exact visual match
   2. Google Images reverse search (fallback)
   3. Google Images text search (last resort)
   
   Returns structured results with:
   - HD image URLs
   - Source page URLs (for scraping details)
   - Product titles from results
   ============================================ */

import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-blink-features=AutomationControlled',
  '--disable-web-security',
  '--disable-features=VizDisplayCompositor',
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
];

function randomUA() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Filter out junk images (logos, icons, UI elements, tiny images)
 */
function isValidProductImage(src) {
  if (!src || !src.startsWith('http')) return false;
  
  const lower = src.toLowerCase();
  
  // Reject Google's own UI/assets
  const googleJunk = [
    'gstatic.com/images',
    'google.com/images',
    'googleusercontent.com/s/',  // tiny thumbnails
    'ssl.gstatic.com',
    'lh3.googleusercontent.com/fife', // Google UI icons
    'encrypted-tbn0.gstatic.com',     // Google thumbnail proxies (very small)
    '/favicon',
    '/logo',
    '/icon',
    '/avatar',
    '/badge',
    '/sprite',
    '/placeholder',
    'data:image',
    '1x1',
    'pixel',
    'blank.gif',
    'spacer.gif',
    'transparent',
    'loading',
    '.svg',
    'captcha',
  ];
  
  if (googleJunk.some(junk => lower.includes(junk))) return false;
  
  return true;
}

/**
 * Convert Google thumbnail proxy URL to full-size image
 */
function upgradeImageUrl(src) {
  if (!src) return null;
  
  // Google Images proxy: extract original URL
  if (src.includes('encrypted-tbn') && src.includes('?q=tbn:')) {
    return null; // these are low-res proxies, skip
  }
  
  // ML static: convert to HD
  if (src.includes('http2.mlstatic.com')) {
    return src.replace(/-[A-Z]\.jpg/, '-O.jpg').replace(/\?.*/, '');
  }
  
  // AliExpress: get large version
  if (src.includes('ae01.alicdn.com')) {
    return src.replace(/_\d+x\d+/, '').replace(/\?.*/, '');
  }
  
  return src;
}

/**
 * STRATEGY 1: Google Lens — Reverse image search
 * Best for finding exact visual matches across the web
 */
async function searchGoogleLensStrategy(imageUrl, browser) {
  console.log('   🔍 Strategy 1: Google Lens reverse image search...');
  const results = { images: [], sources: [], titles: [] };
  
  let page;
  try {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });
    
    const lensUrl = `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}&hl=es`;
    await page.goto(lensUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
    
    // Wait for results to load
    await page.waitForTimeout(4000);
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(2000);
    
    // Try to click on "Buscar coincidencias exactas" / "Find image source" if available
    try {
      const exactMatchBtn = await page.$('text=Buscar fuente de la imagen');
      if (exactMatchBtn) await exactMatchBtn.click();
      else {
        const exactMatchBtnEn = await page.$('text=Find image source');
        if (exactMatchBtnEn) await exactMatchBtnEn.click();
      }
      await page.waitForTimeout(2000);
    } catch { /* button might not exist */ }
    
    // Extract all result images and their source links
    const lensData = await page.evaluate(() => {
      const data = { images: [], sources: [], titles: [] };
      
      // Method 1: Look for visual match results (cards with images + links)
      document.querySelectorAll('a[href*="http"]').forEach(a => {
        const href = a.href;
        // Skip google's own links
        if (href.includes('google.com') || href.includes('gstatic.com') || 
            href.includes('youtube.com') || href.includes('accounts.google')) return;
        
        // Find images within or near this link
        const img = a.querySelector('img') || a.closest('div')?.querySelector('img');
        if (img) {
          const src = img.src || img.dataset?.src;
          if (src) {
            // ALWAYS capture the source link if it has a visual match
            data.sources.push(href);
            
            // Only capture the image if it's not a proxy thumbnail
            if (src.startsWith('http') && !src.includes('gstatic') && !src.includes('google.com')) {
              data.images.push(src);
            }
          }
        }
        
        // Extract title text
        const titleEl = a.querySelector('span, h3, div[role="heading"]') || a;
        const title = titleEl?.textContent?.trim();
        if (title && title.length > 5 && title.length < 200) {
          data.titles.push(title);
        }
      });
      
      // Method 2: Grab all substantial images on the page
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset?.src;
        const w = img.naturalWidth || img.width || 0;
        const h = img.naturalHeight || img.height || 0;
        
        if (src && src.startsWith('http') && (w > 100 || h > 100)) {
          if (!src.includes('gstatic') && !src.includes('google.com/images')) {
            data.images.push(src);
          }
        }
      });
      
      return data;
    });
    
    // Filter and deduplicate
    const validImages = [...new Set(lensData.images)]
      .filter(isValidProductImage)
      .map(upgradeImageUrl)
      .filter(Boolean);
    
    results.images = validImages.slice(0, 15);
    results.sources = [...new Set(lensData.sources)].slice(0, 10);
    results.titles = [...new Set(lensData.titles)].slice(0, 5);
    
    console.log(`   📸 Lens found: ${results.images.length} images, ${results.sources.length} source pages`);
    
  } catch (err) {
    console.error(`   ❌ Lens strategy failed: ${err.message}`);
  } finally {
    if (page) await page.close().catch(() => {});
  }
  
  return results;
}

/**
 * STRATEGY 2: Google Images — Search by product name + scrape results
 * Good fallback when Lens doesn't return enough results
 */
async function searchGoogleImagesStrategy(productName, browser) {
  console.log('   🔍 Strategy 2: Google Images text search...');
  const results = { images: [], sources: [], titles: [] };
  
  let page;
  try {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });
    
    const searchTerm = productName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, ' ').trim();
    const url = `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}&tbm=isch&hl=es`;
    
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // Click on first few images to get full-size URLs
    const imageResults = await page.evaluate(() => {
      const data = { images: [], sources: [] };
      
      // Google Images stores full URLs in data attributes
      document.querySelectorAll('img').forEach(img => {
        // Full-size image URL is often in data-src or parent anchor's data
        const src = img.dataset?.src || img.src;
        const parentLink = img.closest('a');
        const href = parentLink?.href || '';
        
        if (src && src.startsWith('http') && !src.includes('gstatic') && 
            !src.includes('google.com') && !src.includes('encrypted-tbn')) {
          data.images.push(src);
        }
        
        // Extract destination URL from Google's redirect
        if (href.includes('/imgres?')) {
          const match = href.match(/imgurl=([^&]+)/);
          if (match) {
            try {
              const fullUrl = decodeURIComponent(match[1]);
              data.images.push(fullUrl);
            } catch {}
          }
          const pageMatch = href.match(/imgrefurl=([^&]+)/);
          if (pageMatch) {
            try {
              data.sources.push(decodeURIComponent(pageMatch[1]));
            } catch {}
          }
        }
      });
      
      return data;
    });
    
    const validImages = [...new Set(imageResults.images)]
      .filter(isValidProductImage)
      .map(upgradeImageUrl)
      .filter(Boolean);
    
    results.images = validImages.slice(0, 15);
    results.sources = [...new Set(imageResults.sources)].slice(0, 10);
    
    console.log(`   📸 Google Images found: ${results.images.length} images, ${results.sources.length} sources`);
    
  } catch (err) {
    console.error(`   ❌ Google Images strategy failed: ${err.message}`);
  } finally {
    if (page) await page.close().catch(() => {});
  }
  
  return results;
}

/**
 * STRATEGY 3: Scrape a product page for ALL its images + details
 * Visit the best source URL and extract everything
 */
async function scrapeProductPage(sourceUrl, browser) {
  console.log(`   🌐 Scraping product page: ${sourceUrl.substring(0, 60)}...`);
  const results = { images: [], features: [], description: '', title: '' };
  
  let page;
  try {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    // Scroll to trigger lazy loading
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, 600));
      await page.waitForTimeout(800);
    }
    
    const pageData = await page.evaluate(() => {
      const data = { images: [], features: [], description: '', title: '' };
      
      // Title
      data.title = document.querySelector('h1')?.textContent?.trim() || 
                    document.title?.split(' - ')[0]?.trim() || '';
      
      // ALL images on the page (sorted by size)
      const imgCandidates = [];
      document.querySelectorAll('img').forEach(img => {
        const src = img.src || img.dataset?.src || img.dataset?.zoom || img.dataset?.large;
        const w = img.naturalWidth || img.width || parseInt(img.getAttribute('width')) || 0;
        const h = img.naturalHeight || img.height || parseInt(img.getAttribute('height')) || 0;
        
        if (src && src.startsWith('http')) {
          imgCandidates.push({ src, size: Math.max(w, h) });
        }
      });
      
      // Also check srcset for HD versions
      document.querySelectorAll('[srcset]').forEach(el => {
        const srcset = el.getAttribute('srcset');
        if (srcset) {
          const parts = srcset.split(',').map(s => s.trim().split(' ')[0]);
          parts.forEach(src => {
            if (src.startsWith('http')) {
              imgCandidates.push({ src, size: 999 }); // srcset = likely HD
            }
          });
        }
      });
      
      // Sort by size (largest first) and deduplicate
      const seen = new Set();
      imgCandidates
        .sort((a, b) => b.size - a.size)
        .forEach(({ src }) => {
          const base = src.split('?')[0]; // ignore query params for dedup
          if (!seen.has(base)) {
            seen.add(base);
            data.images.push(src);
          }
        });
      
      // Features / specs — look for lists, tables, spec sections
      document.querySelectorAll('li, .feature, .spec, [class*="feature"], [class*="spec"], [class*="attribute"]').forEach(el => {
        const text = el.textContent?.trim();
        if (text && text.length > 8 && text.length < 200 && !text.includes('cookie') && !text.includes('privacy')) {
          data.features.push(text);
        }
      });
      
      // Also check tables (common for specs)
      document.querySelectorAll('tr, .ui-pdp-specs__table__row, .andes-table__row').forEach(el => {
        const text = el.textContent?.replace(/\n/g, ': ')?.trim();
        if (text && text.length > 5 && text.length < 150) {
          data.features.push(text);
        }
      });
      
      // Description — look for product description sections
      const descSelectors = [
        '.product-description', '.description', '[class*="description"]',
        '.ui-pdp-description__content', '#description', '[itemprop="description"]',
        '.product-details', '.product-info-text',
      ];
      for (const sel of descSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const text = el.textContent?.trim();
          if (text && text.length > 50) {
            data.description = text.substring(0, 1200);
            break;
          }
        }
      }
      
      // Fallback: find the longest paragraph on the page
      if (!data.description) {
        let longestP = '';
        document.querySelectorAll('p').forEach(p => {
          const t = p.textContent?.trim() || '';
          if (t.length > longestP.length && t.length > 80 && t.length < 2000) {
            longestP = t;
          }
        });
        data.description = longestP;
      }
      
      return data;
    });
    
    // Filter images
    results.images = pageData.images
      .filter(isValidProductImage)
      .map(upgradeImageUrl)
      .filter(Boolean)
      .slice(0, 12);
    
    results.features = [...new Set(pageData.features)].slice(0, 12);
    results.description = pageData.description;
    results.title = pageData.title;
    
    console.log(`   ✅ Scraped: ${results.images.length} imgs, ${results.features.length} features, desc: ${results.description.length} chars`);
    
  } catch (err) {
    console.error(`   ❌ Page scrape failed: ${err.message}`);
  } finally {
    if (page) await page.close().catch(() => {});
  }
  
  return results;
}

/**
 * STRATEGY 2B: MercadoLibre Colombia — Text search + exact keyword matching
 * Since Google Lens is often blocked by Captchas, this is our most robust fallback to get 'many images' and reviews.
 */
async function searchMercadoLibreStrategy(productName, browser) {
  console.log('   🔍 Strategy 2B: MercadoLibre Text Search Fallback...');
  const results = { images: [], sources: [], titles: [], features: [], description: '', reviewImages: [], reviewComments: [] };
  
  if (!productName) return results;

  let page;
  try {
    page = await browser.newPage();
    await page.setViewportSize({ width: 1366, height: 900 });
    
    // We search in ML Colombia as this is a Colombian store
    const searchTerm = productName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ ]/g, ' ').trim();
    const mlUrl = `https://listado.mercadolibre.com.co/${encodeURIComponent(searchTerm)}`;
    
    await page.goto(mlUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2500);
    
    // Find the best matching product link based on title keywords
    const bestLink = await page.evaluate((pName) => {
      const keywords = pName.toLowerCase().split(' ').filter(k => k.length > 3);
      const items = Array.from(document.querySelectorAll('.ui-search-item__group a, .ui-search-result__wrapper a, .ui-search-layout__item a'));
      
      let bestMatch = null;
      let highestScore = 0;

      for (const a of items) {
        if (!a.href || !a.href.includes('mercadolibre')) continue;
        if (a.closest('.ui-search-item--sponsored')) continue; // Skip ads
        
        const title = a.innerText?.toLowerCase() || '';
        if (title.length < 5) continue;

        let score = 0;
        for (const kw of keywords) {
          if (title.includes(kw)) score++;
        }
        
        if (score > highestScore) {
          highestScore = score;
          bestMatch = a.href;
        }
      }
      
      // If we matched at least 1 significant keyword, accept it
      return highestScore > 0 ? bestMatch : (items[0]?.href || null);
    }, productName);

    if (!bestLink) {
      console.log('   ⚠️ No ML matches found via text search.');
      return results;
    }
    
    console.log(`   ✅ Scraping BEST ML match: ${bestLink.substring(0, 70)}...`);
    results.sources.push(bestLink);
    
    // Visit the exact product page
    await page.goto(bestLink, { waitUntil: 'domcontentloaded', timeout: 20000 });

    await page.waitForTimeout(2500);
    
    // Scroll deeply to trigger lazy loading for the REVIEWS section
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1000);
    }
    
    // Also try to click on "Ver todas las opiniones" if it exists to load more review images
    try {
      const allReviewsBtn = await page.$('text=Ver todas las opiniones');
      if (allReviewsBtn) {
        await allReviewsBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch { /* ignore */ }
    
    const mlData = await page.evaluate(() => {
      const data = { images: [], reviewImages: [], reviewComments: [], title: '', features: [], description: '' };
      
      // Title
      data.title = document.querySelector('h1')?.textContent?.trim() || '';
      
      // ALL gallery images (HD versions)
      document.querySelectorAll('.ui-pdp-gallery img, .ui-pdp-image, img[data-zoom]').forEach(img => {
        const src = img.dataset?.zoom || img.dataset?.src || img.src;
        if (src && src.includes('http2.mlstatic.com') && !src.includes('placeholder')) {
          // Convert to highest resolution
          const hd = src.replace(/-[A-Z]\.jpg/, '-O.jpg').replace(/\?.*/, '');
          data.images.push(hd);
        }
      });
      
      // BUYER REVIEW IMAGES - STRICT SELECTORS to avoid cross-sell carousels
      // ONLY look inside containers that are definitely reviews
      const reviewContainer = document.querySelector('#reviews, .ui-review-capability, .ui-pdp-reviews');
      if (reviewContainer) {
        reviewContainer.querySelectorAll('img').forEach(img => {
          const src = img.src || img.dataset?.src;
          if (src && src.includes('http2.mlstatic.com') && !src.includes('avatar') && !src.includes('logo')) {
            const hq = src.replace(/-[A-Z]\.jpg/, '-F.jpg').replace(/\?.*/, '');
            data.reviewImages.push(hq);
          }
        });
        
        // BUYER REVIEW COMMENTS
        reviewContainer.querySelectorAll('.ui-review-capability__comment, .ui-pdp-reviews__comment, .ui-review-view__comment').forEach(el => {
          const text = el.innerText?.trim();
          if (text && text.length > 15) {
            data.reviewComments.push(text);
          }
        });
      }
      
      // Specs/features
      document.querySelectorAll('.andes-table__row, .ui-pdp-specs__table__row, .ui-vpp-striped-specs__row').forEach(el => {
        const text = el.innerText?.replace(/\n/g, ': ')?.trim();
        if (text && text.length > 5 && text.length < 150) data.features.push(text);
      });
      
      // Features list fallback
      if (data.features.length === 0) {
        document.querySelectorAll('.ui-pdp-features__list-item, .ui-pdp-highlights__list-item').forEach(el => {
          const t = el.innerText?.trim();
          if (t && t.length > 5 && t.length < 120) data.features.push(t);
        });
      }
      
      // Description
      const descEl = document.querySelector('.ui-pdp-description__content, .ui-pdp-description p');
      if (descEl) {
        data.description = descEl.innerText?.trim()?.substring(0, 1000) || '';
      }
      
      return data;
    });
    
    // Remove review images from main gallery to prevent mixing
    results.images = [...new Set(mlData.images)]
      .filter(Boolean)
      .filter(src => !mlData.reviewImages.includes(src))
      .slice(0, 10);
      
    results.reviewImages = [...new Set(mlData.reviewImages)].filter(Boolean).slice(0, 8);
    results.titles = mlData.title ? [mlData.title] : [];
    results.features = mlData.features.slice(0, 10);
    results.description = mlData.description;
    
    console.log(`   📸 ML found: ${results.images.length} studio images, ${results.reviewImages.length} BUYER REVIEW images, ${results.features.length} features`);
    
  } catch (err) {
    console.error(`   ❌ MercadoLibre strategy failed: ${err.message}`);

  } finally {
    if (page) await page.close().catch(() => {});
  }
  
  return results;
}

/**
 * MAIN: Multi-strategy reverse image search
 * Combines all strategies for maximum coverage
 */
export async function searchGoogleLens(imageUrl, productName = '') {
  console.log(`\n🔍 === MULTI-STRATEGY IMAGE RESEARCH ===`);
  console.log(`   Image: ${imageUrl?.substring(0, 60)}...`);
  console.log(`   Name:  ${productName}`);
  
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: BROWSER_ARGS,
    });
    
    // STRATEGY 1: Google Lens (reverse image search)
    let lensResults = { images: [], sources: [], titles: [] };
    if (imageUrl) {
      lensResults = await searchGoogleLensStrategy(imageUrl, browser);
    }
    
    // STRATEGY 2A: Google Images (text search) — if Lens found < 3 images
    let googleResults = { images: [], sources: [], titles: [] };
    if (lensResults.images.length < 3 && productName) {
      googleResults = await searchGoogleImagesStrategy(productName, browser);
    }
    
    // STRATEGY 2B: MercadoLibre Colombia — ALWAYS run with strict keyword matching
    let mlResults = { images: [], reviewImages: [], reviewComments: [], sources: [], titles: [], features: [], description: '' };
    if (productName) {
      mlResults = await searchMercadoLibreStrategy(productName, browser);
    }
    
    // Combine all images and sources (deduped)
    // Priority: Lens FIRST (Exact visual match), then ML (Strict text match), then Google.
    // The product-researcher.js will ensure the Dropi image stays first regardless.
    const allImages = [...new Set([
      ...lensResults.images,
      ...mlResults.images,
      ...googleResults.images,
    ])];


    const allSources = [...new Set([
      ...lensResults.sources, 
      ...googleResults.sources,
      ...mlResults.sources,
    ])];
    const allTitles = [...new Set([
      ...lensResults.titles, 
      ...googleResults.titles,
      ...mlResults.titles,
    ])];
    
    // Use ML features/description as primary (most reliable)
    let bestFeatures = mlResults.features || [];
    let bestDescription = mlResults.description || '';
    
    // STRATEGY 3: Scrape additional source pages for more data (if ML wasn't enough)
    if (allImages.length < 4 || bestFeatures.length < 3) {
      const sourcesToScrape = allSources
        .filter(u => !u.includes('google.com') && !u.includes('youtube.com') && !u.includes('mercadolibre'))
        .slice(0, 2);
      
      for (const sourceUrl of sourcesToScrape) {
        const scraped = await scrapeProductPage(sourceUrl, browser);
        allImages.push(...scraped.images);
        if (!bestDescription && scraped.description) {
          bestDescription = scraped.description;
        }
        if (scraped.features.length > bestFeatures.length) {
          bestFeatures = scraped.features;
        }
      }
      console.log(`   🌐 Additional sources scraped: ${sourcesToScrape.length}`);
    }
    
    // Final combined results (deduped)
    const finalImages = [...new Set(allImages)]
      .filter(Boolean)
      .slice(0, 12);
    
    const result = {
      images: finalImages,
      reviewImages: mlResults.reviewImages || [],
      reviewComments: mlResults.reviewComments || [],
      features: bestFeatures,
      description: bestDescription,
      title: allTitles[0] || productName,
      sources: allSources,
      searchTitles: allTitles,
    };
    
    console.log(`\n📊 === RESEARCH COMPLETE ===`);
    console.log(`   📸 Total images: ${result.images.length}`);
    console.log(`   📸 Review images: ${result.reviewImages.length}`);
    console.log(`   📋 Review comments: ${result.reviewComments.length}`);
    console.log(`   📋 Features: ${result.features.length}`);
    console.log(`   📝 Description: ${result.description.length} chars`);
    console.log(`   🌐 Sources: ${allSources.length}`);
    
    return result;
    
  } catch (err) {
    console.error(`❌ Multi-strategy search failed: ${err.message}`);
    return { images: [], features: [], description: '', title: productName, sources: [], searchTitles: [] };
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}
