import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { InsertReview } from '@/types/database';

// Rate limiting: simple in-memory store (resets on deploy)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 5;
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

// Simple profanity filter (expand as needed)
const BLOCKED_WORDS = ['spam', 'scam'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

// Email validation
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const { entity_type, entity_id, rating, content, reviewer_name, reviewer_email, title } = body;

    if (!entity_type || !entity_id || !rating || !content || !reviewer_name || !reviewer_email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate entity type
    if (!['restaurant', 'attraction'].includes(entity_type)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Validate rating
    const ratingNum = parseInt(rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Validate content length
    if (content.length < 10) {
      return NextResponse.json(
        { error: 'Review must be at least 10 characters' },
        { status: 400 }
      );
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Review must be less than 5000 characters' },
        { status: 400 }
      );
    }

    // Validate email
    if (!isValidEmail(reviewer_email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check rate limit
    if (isRateLimited(reviewer_email)) {
      return NextResponse.json(
        { error: 'Too many reviews submitted. Please try again later.' },
        { status: 429 }
      );
    }

    // Check for profanity
    if (containsProfanity(content) || containsProfanity(title || '')) {
      return NextResponse.json(
        { error: 'Review contains inappropriate content' },
        { status: 400 }
      );
    }

    // Create review
    const supabase = await createClient();

    const reviewData: InsertReview = {
      entity_type,
      entity_id,
      rating: ratingNum,
      title: title?.trim() || null,
      content: content.trim(),
      reviewer_name: reviewer_name.trim(),
      reviewer_email: reviewer_email.toLowerCase().trim(),
    };

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating review:', error.message);
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Review submitted successfully and is pending approval',
        id: data.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET reviews for an entity
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error.message);
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }

    return NextResponse.json({ reviews: data });
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
