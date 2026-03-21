-- =============================================================================
-- ExploreHTX — Restaurants Schema
-- Migration: 002_restaurants
-- Adds restaurant discovery and date night planning features.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- restaurants
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS restaurants (
  id                     uuid            PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core info
  name                   text            NOT NULL,
  slug                   text            NOT NULL UNIQUE,
  description            text,

  -- Location
  address                text,
  neighborhood           text,
  lat                    numeric(9, 6),
  lng                    numeric(9, 6),

  -- Contact
  phone                  text,
  website_url            text,
  reservation_url        text,
  menu_url               text,

  -- Cuisine
  cuisine_type           text            NOT NULL,  -- Primary cuisine: Italian, Mexican, Steakhouse, etc.
  cuisine_tags           text[]          NOT NULL DEFAULT '{}',  -- Additional tags: farm-to-table, seafood, etc.

  -- Pricing
  price_range            text            NOT NULL DEFAULT '$$'
                           CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
  avg_price_per_person   numeric(10, 2),

  -- Hours (JSONB: { "monday": { "open": "11:00", "close": "22:00" }, ... })
  hours                  jsonb           NOT NULL DEFAULT '{}',

  -- Ambiance & Features
  ambiance               text[]          NOT NULL DEFAULT '{}',  -- romantic, upscale, casual, trendy, cozy
  features               text[]          NOT NULL DEFAULT '{}',  -- outdoor-seating, private-dining, bar, live-music
  dress_code             text,                                    -- casual, smart-casual, business-casual, formal
  noise_level            text            CHECK (noise_level IN ('quiet', 'moderate', 'lively', 'loud')),

  -- Date Night specific
  date_night_labels      text[]          NOT NULL DEFAULT '{}',  -- Perfect for First Dates, Anniversary Worthy, etc.
  best_for               text[]          NOT NULL DEFAULT '{}',  -- first-date, anniversary, special-occasion, casual-date

  -- Menu highlights
  signature_dishes       text[]          NOT NULL DEFAULT '{}',
  menu_highlights        jsonb           NOT NULL DEFAULT '{}',  -- { "appetizers": [...], "mains": [...], "desserts": [...] }

  -- Media
  image_url              text,
  gallery_urls           text[]          NOT NULL DEFAULT '{}',

  -- Metadata
  status                 text            NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'archived', 'coming_soon')),
  featured               boolean         NOT NULL DEFAULT false,
  popularity_score       integer         NOT NULL DEFAULT 0,

  created_at             timestamptz     NOT NULL DEFAULT now(),
  updated_at             timestamptz     NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- Update blog_posts: add restaurant support
-- -----------------------------------------------------------------------------

-- Add related_restaurant_ids column
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS related_restaurant_ids uuid[] NOT NULL DEFAULT '{}';

-- Update post_type constraint to include new types
ALTER TABLE blog_posts
  DROP CONSTRAINT IF EXISTS blog_posts_post_type_check;

ALTER TABLE blog_posts
  ADD CONSTRAINT blog_posts_post_type_check
  CHECK (post_type IN (
    'weekend_roundup',
    'neighborhood_guide',
    'seasonal_guide',
    'event_spotlight',
    'listicle',
    'restaurant_spotlight',
    'date_night_guide'
  ));


-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER restaurants_updated_at
  BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- INDEXES
-- =============================================================================

-- Slug lookup
CREATE INDEX IF NOT EXISTS idx_restaurants_slug
  ON restaurants (slug);

-- Cuisine type for filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_cuisine_type
  ON restaurants (cuisine_type);

-- Neighborhood for filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_neighborhood
  ON restaurants (neighborhood);

-- Price range for filtering
CREATE INDEX IF NOT EXISTS idx_restaurants_price_range
  ON restaurants (price_range);

-- Date night labels (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_restaurants_date_night_labels
  ON restaurants USING GIN (date_night_labels);

-- Best for categories (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_restaurants_best_for
  ON restaurants USING GIN (best_for);

-- Featured restaurants (partial index)
CREATE INDEX IF NOT EXISTS idx_restaurants_featured
  ON restaurants (popularity_score DESC)
  WHERE featured = true AND status = 'active';

-- Active restaurants by popularity
CREATE INDEX IF NOT EXISTS idx_restaurants_active_popularity
  ON restaurants (popularity_score DESC)
  WHERE status = 'active';


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Public read for active restaurants
CREATE POLICY "restaurants_public_read"
  ON restaurants FOR SELECT
  USING (status = 'active');


-- =============================================================================
-- SEED DATA: Houston Date Night Restaurants
-- =============================================================================

INSERT INTO restaurants (
  name, slug, description, address, neighborhood, lat, lng,
  phone, website_url, reservation_url, menu_url,
  cuisine_type, cuisine_tags, price_range, avg_price_per_person,
  hours, ambiance, features, dress_code, noise_level,
  date_night_labels, best_for,
  signature_dishes, menu_highlights,
  image_url, featured, popularity_score
) VALUES
-- 1. Underbelly Hospitality
(
  'Underbelly Hospitality',
  'underbelly-hospitality',
  'James Beard Award-winning chef Chris Shepherd''s flagship restaurant celebrating Houston''s diverse culinary heritage through whole-animal cooking and global flavors.',
  '1100 Westheimer Rd, Houston, TX 77006',
  'Montrose',
  29.7432, -95.3913,
  '713-528-9800',
  'https://www.underbellyhouston.com',
  'https://resy.com/cities/hou/underbelly-hospitality',
  'https://www.underbellyhouston.com/menu',
  'American',
  ARRAY['Southern', 'farm-to-table', 'whole-animal', 'local-sourcing'],
  '$$$$',
  85.00,
  '{"tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "22:30"}, "saturday": {"open": "17:00", "close": "22:30"}, "sunday": {"open": "17:00", "close": "21:00"}}',
  ARRAY['upscale', 'intimate', 'warm'],
  ARRAY['chef-table', 'bar', 'private-dining'],
  'smart-casual',
  'moderate',
  ARRAY['Anniversary Worthy', 'Special Occasion'],
  ARRAY['anniversary', 'special-occasion', 'foodie-date'],
  ARRAY['Korean Braised Goat & Dumplings', 'Whole Roasted Duck', 'Smoked Beef Cheeks'],
  '{"appetizers": ["Crispy Pigs Ears", "Bone Marrow"], "mains": ["Korean Braised Goat", "Whole Roasted Duck"], "desserts": ["Seasonal Fruit Cobbler"]}',
  'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  true,
  95
),

-- 2. Pappas Bros. Steakhouse
(
  'Pappas Bros. Steakhouse',
  'pappas-bros-steakhouse',
  'Houston''s premier steakhouse serving USDA Prime dry-aged beef in an elegant setting with impeccable service and an award-winning wine list.',
  '5839 Westheimer Rd, Houston, TX 77057',
  'Galleria',
  29.7376, -95.4799,
  '713-780-7352',
  'https://www.pappasbros.com',
  'https://www.pappasbros.com/reservations',
  'https://www.pappasbros.com/menu',
  'Steakhouse',
  ARRAY['American', 'prime-beef', 'dry-aged', 'wine-program'],
  '$$$$',
  120.00,
  '{"monday": {"open": "17:00", "close": "22:00"}, "tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "23:00"}, "saturday": {"open": "17:00", "close": "23:00"}, "sunday": {"open": "17:00", "close": "21:00"}}',
  ARRAY['upscale', 'classic', 'refined'],
  ARRAY['bar', 'private-dining', 'valet-parking', 'wine-cellar'],
  'business-casual',
  'moderate',
  ARRAY['Special Occasion', 'Anniversary Worthy'],
  ARRAY['anniversary', 'special-occasion', 'business-dinner'],
  ARRAY['Bone-In Ribeye', 'Porterhouse for Two', 'Lobster Tail', 'Chocolate Crème Brûlée'],
  '{"appetizers": ["Jumbo Lump Crab Cake", "Oysters Rockefeller"], "mains": ["Bone-In Ribeye 22oz", "Porterhouse for Two"], "sides": ["Creamed Spinach", "Truffle Mac & Cheese"], "desserts": ["Chocolate Crème Brûlée"]}',
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800',
  true,
  92
),

-- 3. Uchi Houston
(
  'Uchi Houston',
  'uchi-houston',
  'Award-winning Japanese restaurant from Austin featuring inventive sushi, innovative small plates, and omakase experiences in a sleek, modern setting.',
  '904 Westheimer Rd, Houston, TX 77006',
  'Montrose',
  29.7442, -95.3882,
  '713-522-4808',
  'https://www.uchirestaurants.com/uchi-houston',
  'https://resy.com/cities/hou/uchi-houston',
  'https://www.uchirestaurants.com/uchi-houston/menu',
  'Japanese',
  ARRAY['sushi', 'omakase', 'contemporary', 'small-plates'],
  '$$$$',
  95.00,
  '{"sunday": {"open": "17:00", "close": "22:00"}, "monday": {"open": "17:00", "close": "22:00"}, "tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "23:00"}, "saturday": {"open": "17:00", "close": "23:00"}}',
  ARRAY['modern', 'sleek', 'intimate'],
  ARRAY['sushi-bar', 'omakase', 'bar'],
  'smart-casual',
  'moderate',
  ARRAY['Impressive Date', 'Anniversary Worthy'],
  ARRAY['anniversary', 'foodie-date', 'special-occasion'],
  ARRAY['Hama Chili', 'Machi Cure', 'Wagyu Tataki', 'P-38 Roll'],
  '{"cold-tastings": ["Hama Chili", "Machi Cure"], "hot-tastings": ["Wagyu Tataki", "Shag Roll"], "sushi": ["Omakase", "Yellowtail Sashimi"], "desserts": ["Coconut Crème Brûlée"]}',
  'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
  true,
  94
),

-- 4. Xochi
(
  'Xochi',
  'xochi',
  'James Beard Award-winning Oaxacan-inspired restaurant from Hugo Ortega featuring authentic moles, mezcal, and elevated Mexican cuisine in a vibrant downtown setting.',
  '1777 Walker St, Houston, TX 77010',
  'Downtown',
  29.7562, -95.3638,
  '713-400-3330',
  'https://www.xochihouston.com',
  'https://resy.com/cities/hou/xochi',
  'https://www.xochihouston.com/menus',
  'Mexican',
  ARRAY['Oaxacan', 'moles', 'mezcal', 'contemporary'],
  '$$$',
  75.00,
  '{"tuesday": {"open": "11:30", "close": "22:00"}, "wednesday": {"open": "11:30", "close": "22:00"}, "thursday": {"open": "11:30", "close": "22:00"}, "friday": {"open": "11:30", "close": "23:00"}, "saturday": {"open": "10:00", "close": "23:00"}, "sunday": {"open": "10:00", "close": "21:00"}}',
  ARRAY['vibrant', 'artistic', 'upscale'],
  ARRAY['bar', 'mezcal-program', 'outdoor-seating'],
  'smart-casual',
  'lively',
  ARRAY['Anniversary Worthy', 'Special Occasion'],
  ARRAY['anniversary', 'special-occasion', 'cultural-experience'],
  ARRAY['Mole Negro', 'Tlayuda', 'Carnitas de Pato', 'Ceviche Mixto'],
  '{"appetizers": ["Tlayuda", "Ceviche Mixto", "Guacamole Tradicional"], "mains": ["Mole Negro", "Carnitas de Pato", "Barbacoa de Borrego"], "desserts": ["Churros con Chocolate"]}',
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800',
  true,
  90
),

-- 5. March
(
  'March',
  'march-houston',
  'Sophisticated American bistro from Felipe Riccio serving seasonal, locally-sourced dishes with Mediterranean influences in an elegant yet approachable atmosphere.',
  '1624 Westheimer Rd, Houston, TX 77006',
  'Montrose',
  29.7438, -95.3971,
  '713-574-5080',
  'https://www.marchhouston.com',
  'https://resy.com/cities/hou/march',
  'https://www.marchhouston.com/menu',
  'American',
  ARRAY['Mediterranean', 'seasonal', 'farm-to-table', 'bistro'],
  '$$$',
  65.00,
  '{"tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "22:30"}, "saturday": {"open": "17:00", "close": "22:30"}, "sunday": {"open": "11:00", "close": "14:00"}}',
  ARRAY['elegant', 'approachable', 'romantic'],
  ARRAY['bar', 'patio', 'chef-counter'],
  'smart-casual',
  'moderate',
  ARRAY['Perfect for First Dates', 'Casual Date Night'],
  ARRAY['first-date', 'casual-date', 'brunch-date'],
  ARRAY['House-Made Pasta', 'Roasted Chicken', 'Seasonal Crudo'],
  '{"appetizers": ["Seasonal Crudo", "Burrata"], "mains": ["House-Made Pasta", "Roasted Chicken", "Pan-Seared Fish"], "desserts": ["Olive Oil Cake"]}',
  'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
  false,
  82
),

-- 6. Coltivare
(
  'Coltivare',
  'coltivare',
  'Heights gem serving rustic Italian dishes crafted from ingredients grown in their on-site garden. Pizza, house-made pasta, and seasonal Italian fare in a cozy, unpretentious setting.',
  '3320 White Oak Dr, Houston, TX 77007',
  'The Heights',
  29.7855, -95.3983,
  '713-637-4095',
  'https://www.coltivarehouston.com',
  'https://resy.com/cities/hou/coltivare',
  'https://www.coltivarehouston.com/menu',
  'Italian',
  ARRAY['rustic', 'farm-to-table', 'pizza', 'pasta'],
  '$$',
  45.00,
  '{"monday": {"open": "17:00", "close": "21:00"}, "tuesday": {"open": "17:00", "close": "21:00"}, "wednesday": {"open": "17:00", "close": "21:00"}, "thursday": {"open": "17:00", "close": "21:00"}, "friday": {"open": "17:00", "close": "22:00"}, "saturday": {"open": "10:00", "close": "22:00"}, "sunday": {"open": "10:00", "close": "21:00"}}',
  ARRAY['rustic', 'cozy', 'neighborhood'],
  ARRAY['garden', 'outdoor-seating', 'bar'],
  'casual',
  'lively',
  ARRAY['Perfect for First Dates', 'Casual Date Night'],
  ARRAY['first-date', 'casual-date', 'neighborhood-spot'],
  ARRAY['Wood-Fired Pizza', 'House-Made Gnocchi', 'Seasonal Vegetables'],
  '{"appetizers": ["Burrata", "Seasonal Vegetables"], "pasta": ["House-Made Gnocchi", "Pappardelle"], "pizza": ["Margherita", "Seasonal Pizza"], "desserts": ["Tiramisu"]}',
  'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=800',
  true,
  88
),

-- 7. Riel
(
  'Riel',
  'riel-houston',
  'Inventive Gulf Coast cuisine celebrating Texas ingredients and regional seafood. Chef Ryan Lachaine delivers creative dishes in a stylish Montrose setting.',
  '1927 Fairview St, Houston, TX 77019',
  'Montrose',
  29.7472, -95.3985,
  '832-831-9109',
  'https://www.rikifoods.com/riel',
  'https://resy.com/cities/hou/riel',
  'https://www.rikifoods.com/riel-menu',
  'American',
  ARRAY['Gulf Coast', 'seafood', 'contemporary', 'regional'],
  '$$$',
  70.00,
  '{"tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "22:30"}, "saturday": {"open": "17:00", "close": "22:30"}, "sunday": {"open": "11:00", "close": "14:00"}}',
  ARRAY['stylish', 'contemporary', 'intimate'],
  ARRAY['bar', 'chef-counter', 'private-dining'],
  'smart-casual',
  'moderate',
  ARRAY['Impressive Date', 'Foodie Date'],
  ARRAY['foodie-date', 'special-occasion', 'local-favorite'],
  ARRAY['Pierogies', 'Fried Chicken', 'Gulf Oysters'],
  '{"appetizers": ["Gulf Oysters", "Ceviche"], "mains": ["Fried Chicken", "Pan-Seared Snapper"], "sides": ["Pierogies", "Seasonal Vegetables"], "desserts": ["Seasonal Tart"]}',
  'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800',
  false,
  85
),

-- 8. State of Grace
(
  'State of Grace',
  'state-of-grace',
  'Elegant Southern American restaurant serving refined takes on Gulf Coast classics. Stunning interiors, impeccable cocktails, and a polished River Oaks experience.',
  '3258 Westheimer Rd, Houston, TX 77098',
  'River Oaks',
  29.7371, -95.4252,
  '832-942-5080',
  'https://www.stateofgracehtx.com',
  'https://resy.com/cities/hou/state-of-grace',
  'https://www.stateofgracehtx.com/menu',
  'Southern',
  ARRAY['American', 'Gulf Coast', 'refined', 'cocktails'],
  '$$$',
  75.00,
  '{"monday": {"open": "17:00", "close": "22:00"}, "tuesday": {"open": "17:00", "close": "22:00"}, "wednesday": {"open": "17:00", "close": "22:00"}, "thursday": {"open": "17:00", "close": "22:00"}, "friday": {"open": "17:00", "close": "23:00"}, "saturday": {"open": "11:00", "close": "23:00"}, "sunday": {"open": "11:00", "close": "21:00"}}',
  ARRAY['elegant', 'refined', 'sophisticated'],
  ARRAY['bar', 'cocktail-program', 'outdoor-seating', 'private-dining'],
  'smart-casual',
  'moderate',
  ARRAY['Special Occasion', 'Anniversary Worthy'],
  ARRAY['anniversary', 'special-occasion', 'business-dinner'],
  ARRAY['Deviled Eggs', 'Fried Chicken', 'Gulf Fish', 'Buttermilk Pie'],
  '{"appetizers": ["Deviled Eggs", "Crab Cake"], "mains": ["Fried Chicken", "Gulf Fish", "Prime Ribeye"], "desserts": ["Buttermilk Pie", "Chocolate Torte"]}',
  'https://images.unsplash.com/photo-1550966871-3ed3cdb51f3a?w=800',
  false,
  86
),

-- 9. Feges BBQ
(
  'Feges BBQ',
  'feges-bbq',
  'Modern Texas barbecue from husband-wife team Patrick Feges and Erin Smith. Exceptional brisket, creative sides, and surprising vegetable dishes in a welcoming Heights space.',
  '8217 Long Point Rd, Houston, TX 77055',
  'Spring Branch',
  29.7937, -95.4852,
  '346-443-6063',
  'https://www.fegesbbq.com',
  null,
  'https://www.fegesbbq.com/menu',
  'Barbecue',
  ARRAY['Texas BBQ', 'craft', 'smoked-meats', 'Southern'],
  '$$',
  35.00,
  '{"wednesday": {"open": "11:00", "close": "14:30"}, "thursday": {"open": "11:00", "close": "14:30"}, "friday": {"open": "11:00", "close": "14:30"}, "saturday": {"open": "11:00", "close": "15:00"}, "sunday": {"open": "11:00", "close": "15:00"}}',
  ARRAY['casual', 'welcoming', 'neighborhood'],
  ARRAY['outdoor-seating', 'counter-service'],
  'casual',
  'lively',
  ARRAY['Casual Date Night', 'Impressive but Affordable'],
  ARRAY['casual-date', 'daytime-date', 'local-favorite'],
  ARRAY['Brisket', 'Pork Ribs', 'Smoked Turkey', 'Roasted Carrots'],
  '{"meats": ["Brisket", "Pork Ribs", "Smoked Turkey", "Pulled Pork"], "sides": ["Roasted Carrots", "Mac & Cheese", "Potato Salad"], "desserts": ["Banana Pudding"]}',
  'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800',
  true,
  87
),

-- 10. Nancy's Hustle
(
  'Nancys Hustle',
  'nancys-hustle',
  'Hip East End bistro serving globally-inspired small plates, natural wines, and creative cocktails in a candlelit, late-night-friendly setting. Perfect for adventurous eaters.',
  '2704 Polk St, Houston, TX 77003',
  'East End',
  29.7448, -95.3478,
  '346-571-7931',
  'https://www.nancyshustle.com',
  'https://resy.com/cities/hou/nancys-hustle',
  'https://www.nancyshustle.com/menu',
  'American',
  ARRAY['small-plates', 'natural-wine', 'global', 'contemporary'],
  '$$$',
  60.00,
  '{"monday": {"open": "17:00", "close": "23:00"}, "tuesday": {"open": "17:00", "close": "23:00"}, "wednesday": {"open": "17:00", "close": "23:00"}, "thursday": {"open": "17:00", "close": "23:00"}, "friday": {"open": "17:00", "close": "24:00"}, "saturday": {"open": "17:00", "close": "24:00"}, "sunday": {"open": "11:00", "close": "15:00"}}',
  ARRAY['hip', 'candlelit', 'intimate', 'trendy'],
  ARRAY['bar', 'natural-wine-program', 'late-night'],
  'casual',
  'lively',
  ARRAY['Late Night Romance', 'Perfect for First Dates'],
  ARRAY['first-date', 'late-night-date', 'foodie-date'],
  ARRAY['Lamb Ribs', 'Grilled Bread', 'Daily Pasta', 'Oysters'],
  '{"small-plates": ["Lamb Ribs", "Grilled Bread", "Oysters"], "mains": ["Daily Pasta", "Whole Fish"], "desserts": ["Seasonal Dessert"]}',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
  true,
  89
)
ON CONFLICT (slug) DO NOTHING;
