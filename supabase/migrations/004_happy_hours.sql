-- =============================================================================
-- Happy Hours Migration
-- Adds happy hour deals for restaurants
-- =============================================================================

-- Create happy_hours table
CREATE TABLE IF NOT EXISTS public.happy_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,

  -- Day of week (0=Sunday, 1=Monday, etc.)
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),

  -- Time range
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Deals (stored as JSONB for flexibility)
  -- Example: [{"type": "drink", "description": "$5 margaritas"}, {"type": "food", "description": "Half-off appetizers"}]
  deals JSONB NOT NULL DEFAULT '[]'::JSONB,

  -- Additional info
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique entries per restaurant per day
  UNIQUE(restaurant_id, day_of_week)
);

-- Add index for efficient querying
CREATE INDEX idx_happy_hours_day ON public.happy_hours(day_of_week) WHERE is_active = TRUE;
CREATE INDEX idx_happy_hours_restaurant ON public.happy_hours(restaurant_id);

-- Enable RLS
ALTER TABLE public.happy_hours ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Allow public read access on happy_hours"
  ON public.happy_hours
  FOR SELECT
  USING (is_active = TRUE);

-- Trigger for updated_at
CREATE TRIGGER update_happy_hours_updated_at
  BEFORE UPDATE ON public.happy_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- Add convenience columns to restaurants table
-- =============================================================================

-- Add has_happy_hour flag to restaurants for quick filtering
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS has_happy_hour BOOLEAN DEFAULT FALSE;

-- Create a function to update has_happy_hour flag
CREATE OR REPLACE FUNCTION update_restaurant_happy_hour_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the restaurant's has_happy_hour flag based on active happy hours
  IF TG_OP = 'DELETE' THEN
    UPDATE public.restaurants
    SET has_happy_hour = EXISTS (
      SELECT 1 FROM public.happy_hours
      WHERE restaurant_id = OLD.restaurant_id AND is_active = TRUE
    )
    WHERE id = OLD.restaurant_id;
    RETURN OLD;
  ELSE
    UPDATE public.restaurants
    SET has_happy_hour = EXISTS (
      SELECT 1 FROM public.happy_hours
      WHERE restaurant_id = NEW.restaurant_id AND is_active = TRUE
    )
    WHERE id = NEW.restaurant_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep has_happy_hour in sync
CREATE TRIGGER sync_restaurant_happy_hour_flag
  AFTER INSERT OR UPDATE OR DELETE ON public.happy_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_restaurant_happy_hour_flag();

-- =============================================================================
-- Sample data (optional - uncomment to seed)
-- =============================================================================
/*
-- Example: Add happy hour to a restaurant
INSERT INTO public.happy_hours (restaurant_id, day_of_week, start_time, end_time, deals, notes)
SELECT
  id,
  day_num,
  '16:00'::TIME,
  '19:00'::TIME,
  '[
    {"type": "drink", "description": "$5 house wine", "original_price": "$12"},
    {"type": "drink", "description": "$6 craft cocktails", "original_price": "$14"},
    {"type": "food", "description": "Half-off appetizers"}
  ]'::JSONB,
  'Bar seating only'
FROM public.restaurants, generate_series(1, 5) AS day_num -- Monday through Friday
WHERE slug = 'example-restaurant'
ON CONFLICT (restaurant_id, day_of_week) DO NOTHING;
*/
