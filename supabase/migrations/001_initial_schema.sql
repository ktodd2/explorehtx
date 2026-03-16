-- =============================================================================
-- ExploreHTX Initial Schema
-- Migration: 001_initial_schema
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- =============================================================================
-- TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id                 uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id        text,
  source             text,
  source_url         text,
  title              text              NOT NULL,
  slug               text              NOT NULL UNIQUE,
  description        text,
  description_html   text,
  start_date         timestamptz       NOT NULL,
  end_date           timestamptz,
  is_all_day         boolean           NOT NULL DEFAULT false,
  venue_name         text,
  venue_address      text,
  venue_lat          numeric(9, 6),
  venue_lng          numeric(9, 6),
  neighborhood       text,
  category           text              NOT NULL,
  tags               text[]            NOT NULL DEFAULT '{}',
  image_url          text,
  image_alt          text,
  price_min          numeric(10, 2),
  price_max          numeric(10, 2),
  is_free            boolean           NOT NULL DEFAULT false,
  ticket_url         text,
  organizer_name     text,
  status             text              NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'cancelled', 'postponed', 'archived')),
  featured           boolean           NOT NULL DEFAULT false,
  popularity_score   integer           NOT NULL DEFAULT 0,
  created_at         timestamptz       NOT NULL DEFAULT now(),
  updated_at         timestamptz       NOT NULL DEFAULT now(),
  raw_data           jsonb
);

-- -----------------------------------------------------------------------------
-- blog_posts
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blog_posts (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  text        NOT NULL UNIQUE,
  title                 text        NOT NULL,
  excerpt               text,
  content               text,
  content_html          text,
  cover_image_url       text,
  cover_image_alt       text,
  author                text        NOT NULL DEFAULT 'ExploreHTX',
  post_type             text        NOT NULL
                          CHECK (post_type IN (
                            'weekend_roundup',
                            'neighborhood_guide',
                            'seasonal_guide',
                            'event_spotlight',
                            'listicle'
                          )),
  category              text,
  tags                  text[]      NOT NULL DEFAULT '{}',
  meta_title            text,
  meta_description      text,
  keywords              text[]      NOT NULL DEFAULT '{}',
  related_event_ids     uuid[]      NOT NULL DEFAULT '{}',
  status                text        NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft', 'published', 'archived')),
  published_at          timestamptz,
  ai_generated          boolean     NOT NULL DEFAULT true,
  ai_model              text,
  ai_prompt_hash        text,
  word_count            integer,
  reading_time_minutes  integer,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL UNIQUE,
  slug              text        NOT NULL UNIQUE,
  description       text,
  icon              text,
  meta_title        text,
  meta_description  text,
  display_order     integer     NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- neighborhoods
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS neighborhoods (
  id                uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text            NOT NULL UNIQUE,
  slug              text            NOT NULL UNIQUE,
  description       text,
  meta_title        text,
  meta_description  text,
  lat               numeric(9, 6),
  lng               numeric(9, 6),
  image_url         text,
  is_active         boolean         NOT NULL DEFAULT true
);

-- -----------------------------------------------------------------------------
-- subscribers
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscribers (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email               text        NOT NULL UNIQUE,
  name                text,
  categories          text[]      NOT NULL DEFAULT '{}',
  neighborhoods       text[]      NOT NULL DEFAULT '{}',
  frequency           text        NOT NULL DEFAULT 'weekly'
                        CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  is_verified         boolean     NOT NULL DEFAULT false,
  verification_token  text,
  unsubscribe_token   uuid        NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  last_email_sent_at  timestamptz,
  status              text        NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- email_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS email_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id  uuid        REFERENCES subscribers (id) ON DELETE SET NULL,
  email_type     text        NOT NULL,
  resend_id      text,
  subject        text,
  status         text        NOT NULL DEFAULT 'sent'
                   CHECK (status IN ('sent', 'delivered', 'bounced', 'failed')),
  sent_at        timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- ingestion_logs
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ingestion_logs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source                text        NOT NULL,
  job_type              text        NOT NULL,
  status                text        NOT NULL
                          CHECK (status IN ('running', 'completed', 'failed')),
  events_fetched        integer     NOT NULL DEFAULT 0,
  events_created        integer     NOT NULL DEFAULT 0,
  events_updated        integer     NOT NULL DEFAULT 0,
  events_deduplicated   integer     NOT NULL DEFAULT 0,
  error_message         text,
  duration_ms           integer,
  started_at            timestamptz NOT NULL DEFAULT now(),
  completed_at          timestamptz
);


-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================================
-- INDEXES
-- =============================================================================

-- events
CREATE INDEX IF NOT EXISTS idx_events_start_date
  ON events (start_date);

CREATE INDEX IF NOT EXISTS idx_events_category
  ON events (category);

CREATE INDEX IF NOT EXISTS idx_events_neighborhood
  ON events (neighborhood);

CREATE INDEX IF NOT EXISTS idx_events_slug
  ON events (slug);

CREATE INDEX IF NOT EXISTS idx_events_source_external_id
  ON events (source, external_id);

CREATE INDEX IF NOT EXISTS idx_events_tags
  ON events USING GIN (tags);

-- Partial index: only active events need fast date-ordered lookups
CREATE INDEX IF NOT EXISTS idx_events_active_start_date
  ON events (start_date)
  WHERE status = 'active';

-- blog_posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
  ON blog_posts (slug);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at
  ON blog_posts (status, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_posts_post_type
  ON blog_posts (post_type);

CREATE INDEX IF NOT EXISTS idx_blog_posts_tags
  ON blog_posts USING GIN (tags);

-- subscribers
CREATE INDEX IF NOT EXISTS idx_subscribers_email
  ON subscribers (email);

CREATE INDEX IF NOT EXISTS idx_subscribers_status
  ON subscribers (status);

-- email_logs (path + created_at style query per spec)
CREATE INDEX IF NOT EXISTS idx_email_logs_subscriber_id
  ON email_logs (subscriber_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at
  ON email_logs (sent_at);

-- ingestion_logs
CREATE INDEX IF NOT EXISTS idx_ingestion_logs_source_started_at
  ON ingestion_logs (source, started_at DESC);


-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- events: public read
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_read"
  ON events FOR SELECT
  USING (true);

-- blog_posts: public read of published posts only
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_posts_public_read"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- categories: public read
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_public_read"
  ON categories FOR SELECT
  USING (true);

-- neighborhoods: public read
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "neighborhoods_public_read"
  ON neighborhoods FOR SELECT
  USING (true);

-- subscribers: RLS enabled, no user-facing policies yet (auth not implemented)
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- email_logs: internal only, no public policies
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- ingestion_logs: internal only, no public policies
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- SEED DATA: categories
-- =============================================================================

INSERT INTO categories (name, slug, description, icon, display_order)
VALUES
  ('Music & Concerts',    'music-concerts',     'Live music, concerts, and performances across Houston',              '🎵', 1),
  ('Sports',              'sports',             'Professional sports, recreational leagues, and sporting events',     '🏟️', 2),
  ('Food & Dining',       'food-dining',        'Food festivals, restaurant openings, tastings, and culinary events', '🍽️', 3),
  ('Arts & Culture',      'arts-culture',       'Gallery openings, cultural events, and artistic experiences',        '🎨', 4),
  ('Nightlife',           'nightlife',          'Bars, clubs, and after-dark entertainment in Houston',               '🌙', 5),
  ('Family & Kids',       'family-kids',        'Family-friendly activities and events for children of all ages',     '👨‍👩‍👧‍👦', 6),
  ('Outdoor & Parks',     'outdoor-parks',      'Outdoor activities, parks, and nature experiences',                  '🌿', 7),
  ('Festivals',           'festivals',          'Festivals, fairs, and large community celebrations',                 '🎪', 8),
  ('Free Events',         'free-events',        'Events with free admission throughout Houston',                      '🎉', 9),
  ('Comedy',              'comedy',             'Stand-up comedy shows and improv performances',                      '😂', 10),
  ('Theater',             'theater',            'Stage productions, musicals, and dramatic performances',             '🎭', 11),
  ('Markets & Shopping',  'markets-shopping',   'Farmers markets, pop-up shops, and shopping events',                 '🛍️', 12)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- SEED DATA: neighborhoods
-- =============================================================================

INSERT INTO neighborhoods (name, slug, description, lat, lng, meta_title, meta_description)
VALUES
  (
    'Downtown',
    'downtown',
    'The urban core of Houston, home to theaters, sports arenas, and a thriving restaurant scene.',
    29.756900, -95.369800,
    'Events in Downtown Houston',
    'Discover events happening in Downtown Houston — concerts, sports, festivals, and more.'
  ),
  (
    'Midtown',
    'midtown',
    'A lively neighborhood known for its bars, restaurants, and arts scene just south of Downtown.',
    29.744000, -95.376000,
    'Events in Midtown Houston',
    'Find things to do in Midtown Houston, from nightlife to local dining and entertainment.'
  ),
  (
    'Montrose',
    'montrose',
    'Houston''s most eclectic neighborhood, celebrated for its art galleries, LGBTQ+ culture, and independent dining.',
    29.742500, -95.390000,
    'Events in Montrose Houston',
    'Explore events in Montrose — art walks, live music, festivals, and unique Houston experiences.'
  ),
  (
    'The Heights',
    'the-heights',
    'A historic neighborhood with Victorian homes, local boutiques, and a strong community arts presence.',
    29.798000, -95.399000,
    'Events in The Heights Houston',
    'Discover events in The Heights — markets, live music, outdoor festivals, and neighborhood gatherings.'
  ),
  (
    'Museum District',
    'museum-district',
    'Home to 19 museums clustered within a walkable area, offering world-class art, science, and culture.',
    29.722000, -95.390000,
    'Events in Museum District Houston',
    'Find cultural events in the Museum District — exhibitions, lectures, and family-friendly programs.'
  ),
  (
    'Rice Village',
    'rice-village',
    'A charming shopping and dining destination near Rice University with boutiques and local restaurants.',
    29.716000, -95.413000,
    'Events in Rice Village Houston',
    'Explore events in Rice Village Houston — shopping, dining, and community happenings.'
  ),
  (
    'River Oaks',
    'river-oaks',
    'An affluent neighborhood known for elegant shopping, fine dining, and luxury boutiques.',
    29.749000, -95.419000,
    'Events in River Oaks Houston',
    'Discover upscale events and happenings in River Oaks, Houston.'
  ),
  (
    'Galleria/Uptown',
    'galleria-uptown',
    'Houston''s premier shopping and business district centered around the iconic Galleria mall.',
    29.736000, -95.462000,
    'Events in Galleria & Uptown Houston',
    'Find events near the Galleria and Uptown Houston — shopping events, dining, and entertainment.'
  ),
  (
    'East End/EaDo',
    'east-end-eado',
    'A vibrant, rapidly growing area east of Downtown with murals, breweries, and a strong arts scene.',
    29.745000, -95.337000,
    'Events in East End & EaDo Houston',
    'Explore events in EaDo and the East End — art, food, music, and Houston''s creative culture.'
  ),
  (
    'Washington Avenue',
    'washington-avenue',
    'A popular entertainment corridor known for its bars, restaurants, and weekend nightlife.',
    29.763000, -95.405000,
    'Events on Washington Avenue Houston',
    'Find events on Washington Avenue — bars, live music, dining, and nightlife in Houston.'
  ),
  (
    'Memorial Park',
    'memorial-park',
    'One of the largest urban parks in the US, offering trails, sports facilities, and outdoor events.',
    29.764000, -95.435000,
    'Events at Memorial Park Houston',
    'Discover outdoor events and activities at Memorial Park in Houston.'
  ),
  (
    'Medical Center',
    'medical-center',
    'The world''s largest medical complex, also featuring parks, restaurants, and community events.',
    29.706000, -95.397000,
    'Events in Medical Center Houston',
    'Find events in the Texas Medical Center area of Houston.'
  ),
  (
    'Chinatown/Bellaire',
    'chinatown-bellaire',
    'A rich cultural hub offering authentic Asian cuisine, markets, and cultural festivals.',
    29.706000, -95.471000,
    'Events in Chinatown & Bellaire Houston',
    'Explore cultural events, food festivals, and community happenings in Houston''s Chinatown and Bellaire.'
  ),
  (
    'Katy',
    'katy',
    'A fast-growing suburb west of Houston with shopping, family entertainment, and community events.',
    29.785900, -95.824200,
    'Events in Katy TX',
    'Find things to do in Katy, Texas — family events, outdoor activities, and local festivals.'
  ),
  (
    'Sugar Land',
    'sugar-land',
    'A thriving suburb southwest of Houston with a vibrant town square, sports venues, and performing arts.',
    29.619700, -95.634800,
    'Events in Sugar Land TX',
    'Discover events in Sugar Land — concerts, family activities, and community festivals.'
  ),
  (
    'The Woodlands',
    'the-woodlands',
    'A master-planned community north of Houston with a renowned outdoor amphitheater and extensive parks.',
    30.158000, -95.484400,
    'Events in The Woodlands TX',
    'Find events in The Woodlands — concerts at the Pavilion, outdoor festivals, and family activities.'
  ),
  (
    'Clear Lake/NASA',
    'clear-lake-nasa',
    'Southeast Houston''s lakeside community, home to NASA''s Johnson Space Center and waterfront dining.',
    29.559000, -95.101000,
    'Events in Clear Lake & NASA Area Houston',
    'Explore events near Clear Lake and NASA — space-themed activities, waterfront events, and family fun.'
  ),
  (
    'Pearland',
    'pearland',
    'A rapidly growing suburb south of Houston with parks, shopping, and a strong community event calendar.',
    29.563500, -95.286200,
    'Events in Pearland TX',
    'Find events in Pearland, Texas — family activities, local festivals, and community gatherings.'
  )
ON CONFLICT (slug) DO NOTHING;
