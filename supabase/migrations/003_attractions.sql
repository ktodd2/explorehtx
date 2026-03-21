-- =============================================================================
-- ExploreHTX — Attractions Schema
-- Migration: 003_attractions
-- Adds curated Houston attractions (museums, parks, neighborhoods, free activities)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- attraction_categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attraction_categories (
  id                     uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   text            NOT NULL,
  slug                   text            NOT NULL UNIQUE,
  description            text,
  icon                   text,           -- Lucide icon name
  display_order          integer         NOT NULL DEFAULT 0,
  created_at             timestamptz     NOT NULL DEFAULT now(),
  updated_at             timestamptz     NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- attractions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attractions (
  id                     uuid            PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core info
  name                   text            NOT NULL,
  slug                   text            NOT NULL UNIQUE,
  description            text,
  short_description      text,           -- Brief tagline for cards

  -- Location
  address                text,
  neighborhood           text,
  lat                    numeric(9, 6),
  lng                    numeric(9, 6),

  -- Contact
  phone                  text,
  website_url            text,

  -- Category & Tags
  category_id            uuid            REFERENCES attraction_categories(id) ON DELETE SET NULL,
  tags                   text[]          NOT NULL DEFAULT '{}',

  -- Pricing
  price_type             text            NOT NULL DEFAULT 'free'
                           CHECK (price_type IN ('free', 'paid', 'donation', 'varies')),
  price_range            text,           -- $, $$, $$$, or specific price
  price_notes            text,           -- e.g., "Free on Thursdays", "Kids under 12 free"

  -- Hours (JSONB: { "monday": { "open": "09:00", "close": "17:00" }, ... })
  hours                  jsonb           NOT NULL DEFAULT '{}',
  seasonal_notes         text,           -- e.g., "Closed during winter months"

  -- Features
  features               text[]          NOT NULL DEFAULT '{}',  -- parking, restrooms, gift-shop, cafe
  accessibility          text[]          NOT NULL DEFAULT '{}',  -- wheelchair, hearing-loop, braille
  best_for               text[]          NOT NULL DEFAULT '{}',  -- families, couples, solo, groups
  duration_minutes       integer,        -- Typical visit duration

  -- Media
  image_url              text,
  image_alt              text,
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
-- Update blog_posts: add attraction support
-- -----------------------------------------------------------------------------

-- Add related_attraction_ids column
ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS related_attraction_ids uuid[] NOT NULL DEFAULT '{}';

-- Update post_type constraint to include attraction_spotlight
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
    'date_night_guide',
    'attraction_spotlight'
  ));


-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE TRIGGER attraction_categories_updated_at
  BEFORE UPDATE ON attraction_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER attractions_updated_at
  BEFORE UPDATE ON attractions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- INDEXES
-- =============================================================================

-- Slug lookups
CREATE INDEX IF NOT EXISTS idx_attraction_categories_slug
  ON attraction_categories (slug);

CREATE INDEX IF NOT EXISTS idx_attractions_slug
  ON attractions (slug);

-- Category filtering
CREATE INDEX IF NOT EXISTS idx_attractions_category_id
  ON attractions (category_id);

-- Neighborhood filtering
CREATE INDEX IF NOT EXISTS idx_attractions_neighborhood
  ON attractions (neighborhood);

-- Price type filtering
CREATE INDEX IF NOT EXISTS idx_attractions_price_type
  ON attractions (price_type);

-- Tags (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_attractions_tags
  ON attractions USING GIN (tags);

-- Best for categories (GIN for array containment queries)
CREATE INDEX IF NOT EXISTS idx_attractions_best_for
  ON attractions USING GIN (best_for);

-- Featured attractions (partial index)
CREATE INDEX IF NOT EXISTS idx_attractions_featured
  ON attractions (popularity_score DESC)
  WHERE featured = true AND status = 'active';

-- Active attractions by popularity
CREATE INDEX IF NOT EXISTS idx_attractions_active_popularity
  ON attractions (popularity_score DESC)
  WHERE status = 'active';


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE attraction_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attractions ENABLE ROW LEVEL SECURITY;

-- Public read for categories
CREATE POLICY "attraction_categories_public_read"
  ON attraction_categories FOR SELECT
  USING (true);

-- Public read for active attractions
CREATE POLICY "attractions_public_read"
  ON attractions FOR SELECT
  USING (status = 'active');


-- =============================================================================
-- SEED DATA: Categories
-- =============================================================================

INSERT INTO attraction_categories (name, slug, description, icon, display_order)
VALUES
  ('Museums & Culture', 'museums-culture', 'Art, history, and science museums showcasing Houston''s cultural heritage', 'Building', 1),
  ('Parks & Nature', 'parks-nature', 'Green spaces, trails, and outdoor areas for relaxation and recreation', 'Trees', 2),
  ('Free Activities', 'free-activities', 'Enjoy Houston without spending a dime', 'Gift', 3),
  ('Neighborhoods', 'neighborhoods', 'Distinct districts worth exploring on foot', 'MapPin', 4),
  ('Family Fun', 'family-fun', 'Kid-friendly attractions for the whole family', 'Baby', 5),
  ('Outdoor Adventures', 'outdoor-adventures', 'Active outdoor experiences and nature escapes', 'Mountain', 6),
  ('Local Experiences', 'local-experiences', 'Unique Houston activities and hidden gems', 'Star', 7),
  ('Sports & Recreation', 'sports-recreation', 'Active recreation, tours, and sports venues', 'Dumbbell', 8)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- SEED DATA: Houston Attractions (15)
-- =============================================================================

INSERT INTO attractions (
  name, slug, description, short_description,
  address, neighborhood, lat, lng,
  phone, website_url,
  category_id, tags,
  price_type, price_range, price_notes,
  hours, seasonal_notes,
  features, accessibility, best_for, duration_minutes,
  image_url, image_alt,
  featured, popularity_score
) VALUES

-- 1. Space Center Houston
(
  'Space Center Houston',
  'space-center-houston',
  'The official visitor center of NASA''s Johnson Space Center features over 400 space artifacts, traveling exhibits, and attractions including the chance to see real spacecraft, touch a Moon rock, and tour NASA''s astronaut training facilities. Home to the world''s largest collection of Moon rocks and lunar samples.',
  'NASA''s official visitor center with 400+ space artifacts and real spacecraft',
  '1601 E NASA Pkwy, Houston, TX 77058',
  'Clear Lake',
  29.5519, -95.0974,
  '281-244-2100',
  'https://spacecenter.org',
  (SELECT id FROM attraction_categories WHERE slug = 'museums-culture'),
  ARRAY['space', 'science', 'NASA', 'educational', 'family-friendly', 'interactive'],
  'paid',
  '$$$',
  'Adults $29.95, Children 4-11 $24.95. Discounts for seniors, military, and AAA members.',
  '{"monday": {"open": "10:00", "close": "17:00"}, "tuesday": {"open": "10:00", "close": "17:00"}, "wednesday": {"open": "10:00", "close": "17:00"}, "thursday": {"open": "10:00", "close": "17:00"}, "friday": {"open": "10:00", "close": "17:00"}, "saturday": {"open": "10:00", "close": "18:00"}, "sunday": {"open": "10:00", "close": "18:00"}}',
  'Extended hours during summer and holidays. NASA tram tours are weather-dependent.',
  ARRAY['parking', 'restrooms', 'gift-shop', 'cafe', 'wheelchair-accessible', 'guided-tours'],
  ARRAY['wheelchair', 'hearing-loop', 'service-animals'],
  ARRAY['families', 'groups', 'educational', 'tourists'],
  240,
  'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800',
  'Space Center Houston exterior with rocket',
  true,
  98
),

-- 2. Museum of Fine Arts, Houston
(
  'Museum of Fine Arts, Houston',
  'museum-of-fine-arts-houston',
  'One of the largest art museums in the United States, the MFAH houses a permanent collection of nearly 70,000 works spanning 6,000 years of history. The campus includes two main buildings, sculpture garden, and the Bayou Bend Collection of American decorative arts.',
  'World-class art museum with 70,000 works spanning 6,000 years',
  '1001 Bissonnet St, Houston, TX 77005',
  'Museum District',
  29.7260, -95.3907,
  '713-639-7300',
  'https://www.mfah.org',
  (SELECT id FROM attraction_categories WHERE slug = 'museums-culture'),
  ARRAY['art', 'culture', 'history', 'sculpture', 'photography', 'exhibitions'],
  'paid',
  '$$',
  'Adults $19, Seniors/Students $16, Children under 12 free. Free on Thursdays.',
  '{"tuesday": {"open": "11:00", "close": "18:00"}, "wednesday": {"open": "11:00", "close": "21:00"}, "thursday": {"open": "11:00", "close": "21:00"}, "friday": {"open": "11:00", "close": "18:00"}, "saturday": {"open": "11:00", "close": "18:00"}, "sunday": {"open": "12:30", "close": "18:00"}}',
  'Closed Mondays and major holidays.',
  ARRAY['parking', 'restrooms', 'gift-shop', 'cafe', 'wheelchair-accessible', 'audio-guides'],
  ARRAY['wheelchair', 'hearing-loop', 'braille', 'audio-description'],
  ARRAY['couples', 'solo', 'art-lovers', 'tourists'],
  180,
  'https://images.unsplash.com/photo-1566127444979-b3d2b654e3d7?w=800',
  'Museum of Fine Arts, Houston gallery interior',
  true,
  94
),

-- 3. Buffalo Bayou Park
(
  'Buffalo Bayou Park',
  'buffalo-bayou-park',
  'A 160-acre urban green space along Buffalo Bayou featuring hike and bike trails, a dog park, nature playground, kayak and bike rentals, public art installations, and stunning downtown skyline views. The Johnny Steele Dog Park is one of the largest off-leash dog parks in Texas.',
  'Urban park with trails, kayaking, dog park, and skyline views',
  '1800 Allen Pkwy, Houston, TX 77019',
  'Downtown',
  29.7621, -95.3915,
  '713-752-0314',
  'https://buffalobayou.org/visit/destination/buffalo-bayou-park/',
  (SELECT id FROM attraction_categories WHERE slug = 'parks-nature'),
  ARRAY['outdoors', 'hiking', 'biking', 'kayaking', 'dog-park', 'skyline-views', 'nature'],
  'free',
  NULL,
  'Park is free. Kayak and bike rentals available for a fee.',
  '{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}',
  NULL,
  ARRAY['parking', 'restrooms', 'bike-rentals', 'kayak-rentals', 'dog-park', 'playground'],
  ARRAY['wheelchair', 'paved-trails'],
  ARRAY['families', 'couples', 'runners', 'dog-owners', 'photographers'],
  120,
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
  'Buffalo Bayou Park with Houston skyline',
  true,
  96
),

-- 4. Hermann Park
(
  'Hermann Park',
  'hermann-park',
  'Houston''s most beloved urban park features 445 acres of gardens, trails, and attractions including the Miller Outdoor Theatre, Japanese Garden, McGovern Centennial Gardens, and the Hermann Park Railroad. A perfect escape in the heart of the Museum District.',
  '445-acre urban oasis with gardens, trains, and free outdoor concerts',
  '6001 Fannin St, Houston, TX 77030',
  'Museum District',
  29.7178, -95.3901,
  '713-524-5876',
  'https://www.hermannpark.org',
  (SELECT id FROM attraction_categories WHERE slug = 'parks-nature'),
  ARRAY['gardens', 'trails', 'trains', 'theater', 'nature', 'free-concerts', 'picnic'],
  'free',
  NULL,
  'Park is free. Train rides $3.75. Pedal boats available.',
  '{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}',
  NULL,
  ARRAY['parking', 'restrooms', 'cafe', 'train-ride', 'pedal-boats', 'playground', 'picnic-areas'],
  ARRAY['wheelchair', 'paved-trails', 'accessible-restrooms'],
  ARRAY['families', 'couples', 'nature-lovers', 'joggers'],
  150,
  'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=800',
  'Hermann Park Japanese Garden',
  true,
  95
),

-- 5. The Menil Collection
(
  'The Menil Collection',
  'menil-collection',
  'A world-renowned free museum housing the private art collection of John and Dominique de Menil. Features major works of antiquity, Byzantine, tribal, and 20th-century art including pieces by Picasso, Warhol, and Magritte. The serene campus includes the Rothko Chapel and Cy Twombly Gallery.',
  'Free world-class museum with antiquities, surrealism, and modern masters',
  '1533 Sul Ross St, Houston, TX 77006',
  'Montrose',
  29.7371, -95.3986,
  '713-525-9400',
  'https://www.menil.org',
  (SELECT id FROM attraction_categories WHERE slug = 'museums-culture'),
  ARRAY['art', 'free', 'modern-art', 'surrealism', 'antiquities', 'Rothko-Chapel'],
  'free',
  NULL,
  'Always free admission. Suggested donation appreciated.',
  '{"wednesday": {"open": "11:00", "close": "19:00"}, "thursday": {"open": "11:00", "close": "19:00"}, "friday": {"open": "11:00", "close": "19:00"}, "saturday": {"open": "11:00", "close": "19:00"}, "sunday": {"open": "11:00", "close": "19:00"}}',
  'Closed Monday and Tuesday.',
  ARRAY['parking', 'restrooms', 'gift-shop', 'cafe', 'wheelchair-accessible', 'sculpture-garden'],
  ARRAY['wheelchair', 'hearing-loop', 'service-animals'],
  ARRAY['art-lovers', 'couples', 'solo', 'quiet-seekers'],
  120,
  'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800',
  'The Menil Collection exterior',
  true,
  92
),

-- 6. Houston Zoo
(
  'Houston Zoo',
  'houston-zoo',
  'Home to over 6,000 animals representing 900 species, the Houston Zoo is one of the most visited zoos in the nation. Recently renovated areas include the African Forest, Galapagos Islands, and the Kathrine G. McGovern Texas Wetlands. Conservation programs support wildlife around the world.',
  'Top-ranked zoo with 6,000 animals and award-winning exhibits',
  '6200 Hermann Park Dr, Houston, TX 77030',
  'Museum District',
  29.7142, -95.3908,
  '713-533-6500',
  'https://www.houstonzoo.org',
  (SELECT id FROM attraction_categories WHERE slug = 'family-fun'),
  ARRAY['animals', 'wildlife', 'family-friendly', 'educational', 'conservation', 'interactive'],
  'paid',
  '$$',
  'Adults $25.95, Children 2-11 $20.95, Children under 2 free. Parking $15.',
  '{"monday": {"open": "09:00", "close": "17:00"}, "tuesday": {"open": "09:00", "close": "17:00"}, "wednesday": {"open": "09:00", "close": "17:00"}, "thursday": {"open": "09:00", "close": "17:00"}, "friday": {"open": "09:00", "close": "17:00"}, "saturday": {"open": "09:00", "close": "17:00"}, "sunday": {"open": "09:00", "close": "17:00"}}',
  'Extended hours for Zoo Lights (November-January) and other special events.',
  ARRAY['parking', 'restrooms', 'gift-shop', 'cafe', 'wheelchair-accessible', 'stroller-rentals'],
  ARRAY['wheelchair', 'service-animals', 'sensory-friendly-maps'],
  ARRAY['families', 'children', 'animal-lovers', 'groups'],
  240,
  'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800',
  'Houston Zoo elephant exhibit',
  true,
  97
),

-- 7. Discovery Green
(
  'Discovery Green',
  'discovery-green',
  'A vibrant 12-acre urban park in downtown Houston featuring free concerts, outdoor movies, fitness classes, a playground, dog runs, kayaking on Kinder Lake, and a seasonal ice rink. The park hosts over 600 free programs annually.',
  'Downtown''s living room with free events, lake, and year-round activities',
  '1500 McKinney St, Houston, TX 77010',
  'Downtown',
  29.7531, -95.3578,
  '713-400-7336',
  'https://www.discoverygreen.com',
  (SELECT id FROM attraction_categories WHERE slug = 'parks-nature'),
  ARRAY['events', 'free', 'downtown', 'concerts', 'movies', 'fitness', 'kayaking', 'ice-skating'],
  'free',
  NULL,
  'Park and most events are free. Kayak and ice skating rentals available.',
  '{"monday": {"open": "06:00", "close": "23:00"}, "tuesday": {"open": "06:00", "close": "23:00"}, "wednesday": {"open": "06:00", "close": "23:00"}, "thursday": {"open": "06:00", "close": "23:00"}, "friday": {"open": "06:00", "close": "23:00"}, "saturday": {"open": "06:00", "close": "23:00"}, "sunday": {"open": "06:00", "close": "23:00"}}',
  'Ice rink open November through February. Check calendar for events.',
  ARRAY['restrooms', 'playground', 'dog-runs', 'kayak-rentals', 'cafe', 'free-wifi'],
  ARRAY['wheelchair', 'paved-paths', 'accessible-playground'],
  ARRAY['families', 'couples', 'downtown-workers', 'event-seekers'],
  90,
  'https://images.unsplash.com/photo-1558981420-87aa9dad1c89?w=800',
  'Discovery Green park with downtown Houston skyline',
  true,
  93
),

-- 8. The Heights
(
  'The Heights',
  'the-heights-neighborhood',
  'One of Houston''s most walkable neighborhoods featuring Victorian architecture, independent boutiques, craft breweries, and a thriving local food scene along 19th Street and White Oak. The Heights Bike Trail connects the area''s parks and attractions.',
  'Walkable historic neighborhood with boutiques, breweries, and Victorian charm',
  '19th Street, Houston, TX 77008',
  'The Heights',
  29.7924, -95.3994,
  NULL,
  'https://www.houston.org/houston-neighborhoods/heights',
  (SELECT id FROM attraction_categories WHERE slug = 'neighborhoods'),
  ARRAY['shopping', 'dining', 'walkable', 'historic', 'breweries', 'boutiques', 'antiques'],
  'free',
  NULL,
  'Free to explore. Shops and restaurants vary.',
  '{}',
  NULL,
  ARRAY['street-parking', 'bike-friendly', 'walkable', 'restaurants', 'bars'],
  ARRAY['mostly-flat', 'sidewalks'],
  ARRAY['shoppers', 'foodies', 'couples', 'architecture-lovers'],
  180,
  'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800',
  'Historic 19th Street in Houston Heights',
  true,
  90
),

-- 9. Montrose
(
  'Montrose',
  'montrose-neighborhood',
  'Houston''s most eclectic and artistic neighborhood, Montrose is known for its LGBTQ+ culture, street art, vintage shops, diverse restaurants, and bohemian spirit. Home to the Menil Collection and numerous art galleries.',
  'Eclectic arts district with vintage shops, murals, and diverse dining',
  'Westheimer Road, Houston, TX 77006',
  'Montrose',
  29.7428, -95.3944,
  NULL,
  'https://www.houston.org/houston-neighborhoods/montrose',
  (SELECT id FROM attraction_categories WHERE slug = 'neighborhoods'),
  ARRAY['arts', 'culture', 'LGBTQ+', 'vintage', 'murals', 'dining', 'nightlife', 'galleries'],
  'free',
  NULL,
  'Free to explore. Shops and restaurants vary.',
  '{}',
  NULL,
  ARRAY['street-parking', 'public-transit', 'walkable', 'restaurants', 'bars', 'galleries'],
  ARRAY['mostly-flat', 'sidewalks'],
  ARRAY['art-lovers', 'shoppers', 'foodies', 'nightlife-seekers', 'LGBTQ+-friendly'],
  180,
  'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
  'Colorful street scene in Montrose Houston',
  false,
  88
),

-- 10. Miller Outdoor Theatre
(
  'Miller Outdoor Theatre',
  'miller-outdoor-theatre',
  'The nation''s leading outdoor theatre for the performing arts offers over 75 free performances each season including symphony, ballet, opera, Shakespeare, and concerts. Located in Hermann Park with covered seating and hillside lawn.',
  'Free outdoor performances: symphony, ballet, Shakespeare, and concerts',
  '6000 Hermann Park Dr, Houston, TX 77030',
  'Museum District',
  29.7196, -95.3881,
  '281-373-3386',
  'https://www.milleroutdoortheatre.com',
  (SELECT id FROM attraction_categories WHERE slug = 'free-activities'),
  ARRAY['free', 'concerts', 'theater', 'ballet', 'symphony', 'Shakespeare', 'outdoor'],
  'free',
  NULL,
  'All performances are free. Covered seating requires free tickets.',
  '{}',
  'Season runs March through November. Check schedule for performance times.',
  ARRAY['parking', 'restrooms', 'covered-seating', 'hillside-lawn', 'concessions'],
  ARRAY['wheelchair', 'accessible-seating', 'hearing-loop'],
  ARRAY['families', 'couples', 'music-lovers', 'theater-goers', 'budget-conscious'],
  150,
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800',
  'Miller Outdoor Theatre performance at night',
  true,
  91
),

-- 11. Houston Arboretum & Nature Center
(
  'Houston Arboretum & Nature Center',
  'houston-arboretum',
  'A 155-acre urban nature sanctuary in Memorial Park featuring 5 miles of trails through forest, wetland, and meadow habitats. The Nature Center offers exhibits and educational programs about native Texas plants and wildlife.',
  'Urban nature sanctuary with 5 miles of trails and wildlife habitats',
  '4501 Woodway Dr, Houston, TX 77024',
  'Memorial',
  29.7650, -95.4522,
  '713-681-8433',
  'https://houstonarboretum.org',
  (SELECT id FROM attraction_categories WHERE slug = 'parks-nature'),
  ARRAY['nature', 'hiking', 'wildlife', 'education', 'birding', 'trails', 'forest'],
  'free',
  NULL,
  'Free admission. Donations appreciated. Some programs have fees.',
  '{"monday": {"open": "07:00", "close": "19:00"}, "tuesday": {"open": "07:00", "close": "19:00"}, "wednesday": {"open": "07:00", "close": "19:00"}, "thursday": {"open": "07:00", "close": "19:00"}, "friday": {"open": "07:00", "close": "19:00"}, "saturday": {"open": "07:00", "close": "19:00"}, "sunday": {"open": "07:00", "close": "19:00"}}',
  'Trail hours vary seasonally (closes at dusk).',
  ARRAY['parking', 'restrooms', 'nature-center', 'gift-shop', 'educational-programs'],
  ARRAY['some-accessible-trails', 'accessible-nature-center'],
  ARRAY['nature-lovers', 'families', 'birders', 'runners', 'dog-walkers'],
  90,
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
  'Trail through Houston Arboretum forest',
  false,
  85
),

-- 12. Galveston Beach Day Trip
(
  'Galveston Beach Day Trip',
  'galveston-beach-day-trip',
  'Just an hour from Houston, Galveston Island offers beaches, the historic Strand District, Moody Gardens, the Pleasure Pier amusement park, and fresh Gulf seafood. A perfect day trip or weekend getaway.',
  'Beach escape just 1 hour from Houston with Pleasure Pier and seafood',
  'Seawall Boulevard, Galveston, TX 77550',
  'Galveston',
  29.2871, -94.8019,
  NULL,
  'https://www.galveston.com',
  (SELECT id FROM attraction_categories WHERE slug = 'outdoor-adventures'),
  ARRAY['beach', 'day-trip', 'seafood', 'amusement-park', 'historic', 'Gulf-Coast'],
  'varies',
  NULL,
  'Beach access free. Attractions like Pleasure Pier and Moody Gardens have admission fees.',
  '{}',
  'Beach is best spring through fall. Some attractions are seasonal.',
  ARRAY['parking', 'restrooms', 'restaurants', 'shopping', 'attractions'],
  ARRAY['beach-wheelchairs-available', 'varies-by-attraction'],
  ARRAY['families', 'couples', 'beach-lovers', 'seafood-lovers', 'day-trippers'],
  360,
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  'Galveston beach with Pleasure Pier in distance',
  true,
  89
),

-- 13. Memorial Park
(
  'Memorial Park',
  'memorial-park',
  'At nearly 1,500 acres, Memorial Park is one of the largest urban parks in the nation. Features include an 18-hole golf course, miles of running and biking trails, sports facilities, and the Eastern Glades wetland restoration project.',
  '1,500-acre urban park with trails, golf, sports, and wetlands',
  '6501 Memorial Dr, Houston, TX 77007',
  'Memorial',
  29.7649, -95.4381,
  '713-863-8403',
  'https://www.memorialparkconservancy.org',
  (SELECT id FROM attraction_categories WHERE slug = 'parks-nature'),
  ARRAY['running', 'biking', 'golf', 'sports', 'nature', 'trails', 'fitness'],
  'free',
  NULL,
  'Park is free. Golf course has greens fees.',
  '{"monday": {"open": "06:00", "close": "22:00"}, "tuesday": {"open": "06:00", "close": "22:00"}, "wednesday": {"open": "06:00", "close": "22:00"}, "thursday": {"open": "06:00", "close": "22:00"}, "friday": {"open": "06:00", "close": "22:00"}, "saturday": {"open": "06:00", "close": "22:00"}, "sunday": {"open": "06:00", "close": "22:00"}}',
  NULL,
  ARRAY['parking', 'restrooms', 'golf-course', 'tennis-courts', 'trails', 'fitness-center'],
  ARRAY['paved-trails', 'accessible-restrooms'],
  ARRAY['runners', 'cyclists', 'golfers', 'fitness-enthusiasts', 'nature-lovers'],
  120,
  'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
  'Running trail in Memorial Park Houston',
  false,
  87
),

-- 14. Houston Mural Scene
(
  'Houston Mural Scene',
  'houston-mural-scene',
  'Houston has become a street art destination with hundreds of murals across the city. Key spots include the ''Houston Is Inspired'' wings in Montrose, ''Greetings from Houston'' downtown, and entire walls dedicated to local and international artists in EaDo and Market Square.',
  'Self-guided street art tour through Houston''s most Instagram-worthy murals',
  'Various Locations',
  'Various',
  29.7604, -95.3698,
  NULL,
  'https://www.visithoustontexas.com/things-to-do/arts-culture/murals/',
  (SELECT id FROM attraction_categories WHERE slug = 'local-experiences'),
  ARRAY['art', 'murals', 'photography', 'free', 'street-art', 'Instagram', 'walking-tour'],
  'free',
  NULL,
  'Free to view. Self-guided or join a mural walking tour.',
  '{}',
  'Murals are outdoors and always accessible. Best photographed in morning or evening light.',
  ARRAY['street-parking', 'walkable'],
  ARRAY['varies-by-location'],
  ARRAY['photographers', 'art-lovers', 'Instagram-seekers', 'tourists', 'couples'],
  120,
  'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800',
  'Colorful Houston street mural',
  false,
  84
),

-- 15. Minute Maid Park Tours
(
  'Minute Maid Park Tours',
  'minute-maid-park-tours',
  'Go behind the scenes at the home of the Houston Astros with guided tours of Minute Maid Park. Visit the dugout, press box, and learn about the stadium''s history and the team''s World Series championships.',
  'Behind-the-scenes tours of the Houston Astros'' home stadium',
  '501 Crawford St, Houston, TX 77002',
  'Downtown',
  29.7573, -95.3555,
  '713-259-8000',
  'https://www.mlb.com/astros/ballpark/tours',
  (SELECT id FROM attraction_categories WHERE slug = 'sports-recreation'),
  ARRAY['sports', 'baseball', 'Astros', 'stadium', 'tours', 'behind-the-scenes'],
  'paid',
  '$',
  'Adults $20, Seniors/Children $15. Group discounts available.',
  '{}',
  'Tours available on non-game days. Schedule varies by season.',
  ARRAY['parking', 'restrooms', 'team-store', 'wheelchair-accessible'],
  ARRAY['wheelchair', 'elevator-access'],
  ARRAY['sports-fans', 'families', 'tourists', 'Astros-fans', 'groups'],
  75,
  'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800',
  'Minute Maid Park baseball field',
  false,
  82
)
ON CONFLICT (slug) DO NOTHING;
