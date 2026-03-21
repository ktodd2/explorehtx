-- =============================================================================
-- Venues Migration
-- Adds venue profiles to aggregate events by location
-- =============================================================================

-- Create venues table
CREATE TABLE IF NOT EXISTS public.venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description VARCHAR(500),

  -- Location
  address TEXT,
  neighborhood VARCHAR(100),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  -- Contact & links
  phone VARCHAR(50),
  website_url TEXT,
  booking_url TEXT,

  -- Venue type (concert hall, stadium, bar, theater, etc.)
  venue_type VARCHAR(100),
  capacity INTEGER,

  -- Features (parking, accessible, outdoor, etc.)
  features TEXT[] DEFAULT '{}',
  amenities TEXT[] DEFAULT '{}',

  -- Media
  image_url TEXT,
  image_alt VARCHAR(255),
  gallery_urls TEXT[] DEFAULT '{}',

  -- Metadata
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'coming_soon')),
  featured BOOLEAN DEFAULT FALSE,
  popularity_score INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_venues_slug ON public.venues(slug);
CREATE INDEX idx_venues_status ON public.venues(status);
CREATE INDEX idx_venues_neighborhood ON public.venues(neighborhood);
CREATE INDEX idx_venues_venue_type ON public.venues(venue_type);
CREATE INDEX idx_venues_featured ON public.venues(featured) WHERE featured = TRUE;

-- Enable RLS
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on venues"
  ON public.venues
  FOR SELECT
  USING (status = 'active');

-- Trigger for updated_at
CREATE TRIGGER update_venues_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Link events to venues
-- =============================================================================

-- Add venue_id column to events table
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES public.venues(id) ON DELETE SET NULL;

-- Add index for venue lookups
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events(venue_id);

-- =============================================================================
-- Common Houston Venues (seed data - optional)
-- =============================================================================
/*
INSERT INTO public.venues (name, slug, venue_type, description, neighborhood, address) VALUES
  ('Toyota Center', 'toyota-center', 'Arena', 'Home of the Houston Rockets and major concert venue.', 'Downtown', '1510 Polk St, Houston, TX 77002'),
  ('Minute Maid Park', 'minute-maid-park', 'Stadium', 'Home of the Houston Astros baseball team.', 'Downtown', '501 Crawford St, Houston, TX 77002'),
  ('NRG Stadium', 'nrg-stadium', 'Stadium', 'Home of the Houston Texans and the Houston Livestock Show and Rodeo.', 'NRG Park', '1 NRG Park, Houston, TX 77054'),
  ('713 Music Hall', '713-music-hall', 'Concert Hall', 'Premier live music venue in the heart of downtown Houston.', 'Downtown', '401 Franklin St, Houston, TX 77201'),
  ('House of Blues', 'house-of-blues', 'Concert Hall', 'Live music venue featuring national touring acts and local artists.', 'Downtown', '1204 Caroline St, Houston, TX 77002'),
  ('White Oak Music Hall', 'white-oak-music-hall', 'Concert Hall', 'Indoor/outdoor live music venue in the Heights.', 'Heights', '2915 N Main St, Houston, TX 77009'),
  ('The Hobby Center', 'hobby-center', 'Theater', 'Performing arts venue for Broadway shows and concerts.', 'Downtown', '800 Bagby St, Houston, TX 77002'),
  ('Miller Outdoor Theatre', 'miller-outdoor-theatre', 'Outdoor Amphitheater', 'Free outdoor performances in Hermann Park.', 'Museum District', '6000 Hermann Park Dr, Houston, TX 77030'),
  ('Discovery Green', 'discovery-green', 'Park', 'Urban park with free concerts, movies, and community events.', 'Downtown', '1500 McKinney St, Houston, TX 77010')
ON CONFLICT (slug) DO NOTHING;
*/
