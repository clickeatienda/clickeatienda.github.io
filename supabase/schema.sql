-- ============================================
-- CLICKEA TIENDA — Supabase Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Products table (synced from Dropi → Shopify)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dropi_id TEXT UNIQUE,
  shopify_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  supplier_name TEXT,
  supplier_cost INTEGER NOT NULL, -- COP
  selling_price INTEGER,
  before_price INTEGER,
  discount_percent INTEGER,
  margin_percent NUMERIC(5,2),
  profit_per_sale INTEGER,
  stock INTEGER DEFAULT 0,
  weight_kg NUMERIC(5,2),
  images TEXT[], -- Array of image URLs
  is_premium_supplier BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  landing_page_url TEXT,
  shopify_url TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_order_id TEXT UNIQUE,
  dropi_order_id TEXT,
  product_id UUID REFERENCES products(id),
  customer_name TEXT,
  customer_phone TEXT,
  customer_cedula TEXT,
  department TEXT,
  city TEXT,
  address TEXT,
  status TEXT DEFAULT 'pending', -- pending, confirmed, shipped, delivered, returned, cancelled
  selling_price INTEGER,
  supplier_cost INTEGER,
  shipping_cost INTEGER,
  profit INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Social media content
CREATE TABLE IF NOT EXISTS social_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  content_type TEXT NOT NULL, -- video, carousel, post, story, reel
  platform TEXT NOT NULL, -- tiktok, instagram, youtube, facebook
  title TEXT,
  caption TEXT,
  hashtags TEXT[],
  media_url TEXT, -- Supabase storage URL
  status TEXT DEFAULT 'created', -- created, scheduled, published, failed
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  engagement_views INTEGER DEFAULT 0,
  engagement_likes INTEGER DEFAULT 0,
  engagement_comments INTEGER DEFAULT 0,
  engagement_shares INTEGER DEFAULT 0,
  external_post_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics snapshots (collected periodically)
CREATE TABLE IF NOT EXISTS metrics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  total_cost INTEGER DEFAULT 0,
  total_profit INTEGER DEFAULT 0,
  total_returns INTEGER DEFAULT 0,
  return_rate NUMERIC(5,2) DEFAULT 0,
  total_cancellations INTEGER DEFAULT 0,
  avg_margin NUMERIC(5,2) DEFAULT 0,
  products_active INTEGER DEFAULT 0,
  products_published_today INTEGER DEFAULT 0,
  content_published INTEGER DEFAULT 0,
  social_followers JSONB DEFAULT '{}',
  visitors INTEGER DEFAULT 0,
  conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customer support messages
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL, -- whatsapp, instagram, facebook, shopify
  customer_name TEXT,
  customer_id TEXT,
  message_text TEXT NOT NULL,
  response_text TEXT,
  was_auto_replied BOOLEAN DEFAULT false,
  needs_human_review BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending, auto_replied, human_replied, resolved
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pricing configuration (versioned)
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System activity log
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  details TEXT,
  category TEXT, -- product, order, content, pricing, system
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_social_content_status ON social_content(status);
CREATE INDEX IF NOT EXISTS idx_social_content_platform ON social_content(platform);
CREATE INDEX IF NOT EXISTS idx_social_content_scheduled ON social_content(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_support_messages_status ON support_messages(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
