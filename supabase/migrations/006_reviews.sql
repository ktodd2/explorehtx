-- =============================================================================
-- Reviews Migration
-- User-submitted reviews for restaurants and attractions
-- =============================================================================

-- Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Polymorphic relationship (restaurant or attraction)
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('restaurant', 'attraction')),
  entity_id UUID NOT NULL,

  -- Review content
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(200),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),

  -- Reviewer info (no auth required)
  reviewer_name VARCHAR(100) NOT NULL,
  reviewer_email VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token UUID DEFAULT gen_random_uuid(),

  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderation_note TEXT,
  moderated_at TIMESTAMPTZ,

  -- Metadata
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_reviews_entity ON public.reviews(entity_type, entity_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_email ON public.reviews(reviewer_email);
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Public can only read approved reviews
CREATE POLICY "Allow public read access on approved reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved');

-- Anyone can insert reviews (they start as pending)
CREATE POLICY "Allow public insert on reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Helper function to get average rating for an entity
-- =============================================================================

CREATE OR REPLACE FUNCTION get_entity_rating(p_entity_type VARCHAR, p_entity_id UUID)
RETURNS TABLE (
  average_rating NUMERIC(2,1),
  review_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
    COUNT(*)::BIGINT AS review_count
  FROM public.reviews
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id
    AND status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- View for aggregated ratings (useful for JOINs)
-- =============================================================================

CREATE OR REPLACE VIEW public.entity_ratings AS
SELECT
  entity_type,
  entity_id,
  ROUND(AVG(rating)::NUMERIC, 1) AS average_rating,
  COUNT(*) AS review_count
FROM public.reviews
WHERE status = 'approved'
GROUP BY entity_type, entity_id;
