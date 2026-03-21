import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { InsertEventSubmission } from '@/types/database';

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function isRateLimited(email: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(email);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(email, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

// Validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Valid categories (should match database)
const VALID_CATEGORIES = [
  'music-concerts',
  'sports',
  'food-dining',
  'arts-culture',
  'nightlife',
  'family-kids',
  'outdoor-parks',
  'festivals',
  'free-events',
  'comedy',
  'theater',
  'markets-shopping',
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const headersList = await headers();

    // Extract form fields
    const {
      title,
      category,
      description,
      start_date,
      end_date,
      is_all_day,
      venue_name,
      venue_address,
      image_url,
      is_free,
      price_min,
      price_max,
      ticket_url,
      organizer_name,
      organizer_email,
      organizer_phone,
      organizer_website,
    } = body;

    // Required field validation
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
    }

    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    if (!description?.trim() || description.length < 20) {
      return NextResponse.json(
        { error: 'Description must be at least 20 characters' },
        { status: 400 }
      );
    }

    if (!start_date) {
      return NextResponse.json({ error: 'Start date is required' }, { status: 400 });
    }

    if (!venue_name?.trim()) {
      return NextResponse.json({ error: 'Venue name is required' }, { status: 400 });
    }

    if (!organizer_name?.trim()) {
      return NextResponse.json({ error: 'Organizer name is required' }, { status: 400 });
    }

    if (!organizer_email?.trim() || !isValidEmail(organizer_email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // URL validation
    if (image_url && !isValidUrl(image_url)) {
      return NextResponse.json({ error: 'Invalid image URL' }, { status: 400 });
    }

    if (ticket_url && !isValidUrl(ticket_url)) {
      return NextResponse.json({ error: 'Invalid ticket URL' }, { status: 400 });
    }

    if (organizer_website && !isValidUrl(organizer_website)) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }

    // Date validation
    const startDateTime = new Date(start_date);
    if (isNaN(startDateTime.getTime())) {
      return NextResponse.json({ error: 'Invalid start date' }, { status: 400 });
    }

    if (startDateTime < new Date()) {
      return NextResponse.json({ error: 'Event date must be in the future' }, { status: 400 });
    }

    // Rate limit check
    if (isRateLimited(organizer_email.toLowerCase())) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429 }
      );
    }

    // Build submission data
    const submissionData: InsertEventSubmission = {
      title: title.trim(),
      description: description.trim(),
      start_date: start_date,
      end_date: end_date || null,
      is_all_day: Boolean(is_all_day),
      venue_name: venue_name.trim(),
      venue_address: venue_address?.trim() || null,
      category,
      tags: [],
      image_url: image_url?.trim() || null,
      price_min: is_free ? null : price_min || null,
      price_max: is_free ? null : price_max || null,
      is_free: Boolean(is_free),
      ticket_url: ticket_url?.trim() || null,
      organizer_name: organizer_name.trim(),
      organizer_email: organizer_email.toLowerCase().trim(),
      organizer_phone: organizer_phone?.trim() || null,
      organizer_website: organizer_website?.trim() || null,
      ip_address: headersList.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: headersList.get('user-agent') || null,
    };

    // Insert into database
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('event_submissions')
      .insert(submissionData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating event submission:', error.message);
      return NextResponse.json(
        { error: 'Failed to submit event' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Event submitted successfully',
        id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Submit event API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
