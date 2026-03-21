-- =============================================================================
-- Event Submissions Migration
-- Community-submitted events with moderation workflow
-- =============================================================================

-- Create event_submissions table (mirrors events structure)
CREATE TABLE IF NOT EXISTS public.event_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event details (matches events table structure)
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_all_day BOOLEAN DEFAULT FALSE,

  -- Venue info
  venue_name VARCHAR(255),
  venue_address TEXT,

  -- Category and tags
  category VARCHAR(50) NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Media (URL-based for simplicity)
  image_url TEXT,

  -- Pricing
  price_min DECIMAL(10, 2),
  price_max DECIMAL(10, 2),
  is_free BOOLEAN DEFAULT FALSE,
  ticket_url TEXT,

  -- Organizer
  organizer_name VARCHAR(200),
  organizer_email VARCHAR(255) NOT NULL,
  organizer_phone VARCHAR(50),
  organizer_website TEXT,

  -- Moderation
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  moderation_note TEXT,
  moderated_at TIMESTAMPTZ,
  moderated_by VARCHAR(255),

  -- If approved, reference to created event
  approved_event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  -- Metadata
  ip_address INET,
  user_agent TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_event_submissions_status ON public.event_submissions(status);
CREATE INDEX idx_event_submissions_email ON public.event_submissions(organizer_email);
CREATE INDEX idx_event_submissions_submitted ON public.event_submissions(submitted_at DESC);

-- Enable RLS
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can insert submissions
CREATE POLICY "Allow public insert on event_submissions"
  ON public.event_submissions
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated admin can read/update (handled server-side)
-- Public cannot read submissions directly

-- Trigger for updated_at
CREATE TRIGGER update_event_submissions_updated_at
  BEFORE UPDATE ON public.event_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
