-- =============================================================================
-- ExploreHTX — Restaurant Discovery Schema Updates
-- Migration: 008_restaurant_discovery
-- Adds AI discovery tracking and featured rotation to restaurants.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Add discovery tracking columns to restaurants
-- -----------------------------------------------------------------------------

-- Track AI-generated vs manual restaurants
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false;

-- Where the restaurant data came from
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS discovery_source text DEFAULT 'manual';

-- Confidence score for AI-discovered restaurants (0-100)
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS confidence_score integer;

-- Track when restaurant was last featured for rotation
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS last_featured_at timestamptz;


-- -----------------------------------------------------------------------------
-- Add constraint for confidence score range
-- -----------------------------------------------------------------------------

ALTER TABLE restaurants
  ADD CONSTRAINT restaurants_confidence_score_check
  CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 100));


-- -----------------------------------------------------------------------------
-- Indexes for discovery queries
-- -----------------------------------------------------------------------------

-- Index for finding AI-generated restaurants pending review
CREATE INDEX IF NOT EXISTS idx_restaurants_ai_pending
  ON restaurants (confidence_score ASC)
  WHERE ai_generated = true AND status = 'coming_soon';

-- Index for featured rotation (oldest featured first)
CREATE INDEX IF NOT EXISTS idx_restaurants_featured_rotation
  ON restaurants (last_featured_at ASC NULLS FIRST)
  WHERE featured = true AND status = 'active';


-- -----------------------------------------------------------------------------
-- Update existing restaurants to have discovery metadata
-- -----------------------------------------------------------------------------

UPDATE restaurants
SET
  ai_generated = false,
  discovery_source = 'manual'
WHERE ai_generated IS NULL;
