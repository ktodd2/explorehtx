// =============================================================================
// ExploreHTX — Weekly Digest Email Template
// =============================================================================

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

export interface DigestEvent {
  title: string
  start_date: string
  venue_name: string | null
  category: string
  slug: string
  is_free: boolean
  price_min: number | null
  price_max: number | null
}

export interface DigestBlogPost {
  title: string
  excerpt: string | null
  slug: string
}

interface WeeklyDigestProps {
  subscriberName?: string | null
  events: DigestEvent[]
  blogPosts: DigestBlogPost[]
  unsubscribeUrl: string
  dateRange: string
}

const SPACE_BLUE = '#0a2463'
const SUNSET_ORANGE = '#f97316'
const BASE_URL = 'https://explorehtx.us.com'

const CATEGORY_COLORS: Record<string, string> = {
  'music-concerts': '#7c3aed',
  'sports': '#059669',
  'food-dining': '#d97706',
  'arts-culture': '#be185d',
  'nightlife': '#4f46e5',
  'family-kids': '#0891b2',
  'outdoor-parks': '#16a34a',
  'festivals': '#dc2626',
  'free-events': '#2563eb',
  'comedy': '#ea580c',
  'theater': '#9333ea',
  'markets-shopping': '#0d9488',
}

function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] ?? '#6b7280'
}

function categoryLabel(slug: string): string {
  const map: Record<string, string> = {
    'music-concerts': 'Music',
    'sports': 'Sports',
    'food-dining': 'Food',
    'arts-culture': 'Arts',
    'nightlife': 'Nightlife',
    'family-kids': 'Family',
    'outdoor-parks': 'Outdoors',
    'festivals': 'Festivals',
    'free-events': 'Free',
    'comedy': 'Comedy',
    'theater': 'Theater',
    'markets-shopping': 'Markets',
  }
  return map[slug] ?? slug
}

function formatEventDate(isoDate: string): string {
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return isoDate
  }
}

function formatPrice(
  isFree: boolean,
  min: number | null,
  max: number | null
): string {
  if (isFree || (min === 0 && max === 0)) return 'Free'
  if (min == null && max == null) return ''
  const fmt = (n: number) => `$${n % 1 === 0 ? n : n.toFixed(2)}`
  if (min != null && max != null && min !== max) return `${fmt(min)}–${fmt(max)}`
  if (min != null) return fmt(min)
  if (max != null) return fmt(max)
  return ''
}

export default function WeeklyDigest({
  subscriberName,
  events,
  blogPosts,
  unsubscribeUrl,
  dateRange,
}: WeeklyDigestProps) {
  const greeting = subscriberName ? `Hi ${subscriberName},` : 'Hi there,'

  return (
    <Html lang="en">
      <Head />
      <Preview>This Week in Houston — {dateRange}</Preview>
      <Body style={bodyStyle}>
        {/* Header */}
        <Section style={headerStyle}>
          <Text style={logoStyle}>ExploreHTX</Text>
          <Text style={taglineStyle}>Your Weekly Houston Digest</Text>
        </Section>

        {/* Hero */}
        <Container style={heroContainerStyle}>
          <Heading style={heroHeadingStyle}>This Week in Houston</Heading>
          <Text style={heroDateStyle}>{dateRange}</Text>
          <Text style={heroGreetingStyle}>{greeting}</Text>
          <Text style={heroTextStyle}>
            Here are the top events happening in Houston this week, handpicked
            just for you.
          </Text>
        </Container>

        {/* Featured Events */}
        <Container style={sectionContainerStyle}>
          <Text style={sectionLabelStyle}>FEATURED EVENTS</Text>
          <Hr style={sectionHrStyle} />

          {events.length === 0 ? (
            <Text style={emptyTextStyle}>
              No events match your preferences this week. Check back next week!
            </Text>
          ) : (
            events.map((event) => {
              const price = formatPrice(event.is_free, event.price_min, event.price_max)
              const eventUrl = `${BASE_URL}/events/${event.slug}`
              const categoryColor = getCategoryColor(event.category)

              return (
                <Section key={event.slug} style={eventCardStyle}>
                  <Section style={eventHeaderRowStyle}>
                    <Text style={eventTitleStyle}>
                      <a href={eventUrl} style={eventLinkStyle}>
                        {event.title}
                      </a>
                    </Text>
                    <Text
                      style={{
                        ...categoryBadgeStyle,
                        backgroundColor: `${categoryColor}1a`,
                        color: categoryColor,
                      }}
                    >
                      {categoryLabel(event.category)}
                    </Text>
                  </Section>

                  <Text style={eventMetaStyle}>
                    {formatEventDate(event.start_date)}
                    {event.venue_name ? ` &bull; ${event.venue_name}` : ''}
                    {price ? ` &bull; ${price}` : ''}
                  </Text>
                </Section>
              )
            })
          )}
        </Container>

        {/* Blog Posts */}
        {blogPosts.length > 0 && (
          <Container style={sectionContainerStyle}>
            <Text style={sectionLabelStyle}>FROM THE BLOG</Text>
            <Hr style={sectionHrStyle} />

            {blogPosts.map((post) => {
              const postUrl = `${BASE_URL}/blog/${post.slug}`
              return (
                <Section key={post.slug} style={blogCardStyle}>
                  <Text style={blogTitleStyle}>
                    <a href={postUrl} style={blogLinkStyle}>
                      {post.title}
                    </a>
                  </Text>
                  {post.excerpt && (
                    <Text style={blogExcerptStyle}>{post.excerpt}</Text>
                  )}
                </Section>
              )
            })}
          </Container>
        )}

        {/* CTA */}
        <Container style={ctaContainerStyle}>
          <Text style={ctaTextStyle}>
            See everything happening in the Bayou City this week:
          </Text>
          <Section style={ctaButtonRowStyle}>
            <Button
              href={`${BASE_URL}/events`}
              style={ctaButtonStyle}
            >
              Browse All Houston Events
            </Button>
          </Section>
        </Container>

        {/* Footer */}
        <Section style={footerStyle}>
          <Hr style={footerHrStyle} />
          <Text style={footerTextStyle}>
            &copy; {new Date().getFullYear()} ExploreHTX &mdash; Houston&apos;s
            Local Event Guide
          </Text>
          <Text style={footerTextStyle}>
            You&apos;re receiving this because you subscribed at{' '}
            <a href={BASE_URL} style={footerLinkStyle}>
              explorehtx.us.com
            </a>
          </Text>
          <Text style={footerTextStyle}>
            <a href={unsubscribeUrl} style={unsubscribeLinkStyle}>
              Unsubscribe
            </a>
            {' '}&mdash;{' '}
            <a
              href={`${BASE_URL}/subscribe`}
              style={footerLinkStyle}
            >
              Manage preferences
            </a>
          </Text>
        </Section>
      </Body>
    </Html>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f4f6fb',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: 0,
  padding: 0,
}

const headerStyle: React.CSSProperties = {
  backgroundColor: SPACE_BLUE,
  padding: '24px 32px',
  textAlign: 'center',
}

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  margin: '0 0 4px',
}

const taglineStyle: React.CSSProperties = {
  color: '#93c5fd',
  fontSize: '13px',
  margin: 0,
}

const heroContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '36px 40px 28px',
}

const heroHeadingStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  fontSize: '28px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  margin: '0 0 4px',
}

const heroDateStyle: React.CSSProperties = {
  color: SUNSET_ORANGE,
  fontSize: '14px',
  fontWeight: 600,
  margin: '0 0 20px',
}

const heroGreetingStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  fontWeight: 600,
  margin: '0 0 8px',
}

const heroTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: 0,
}

const sectionContainerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderTop: '4px solid #f4f6fb',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '28px 40px',
}

const sectionLabelStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '1.5px',
  margin: '0 0 8px',
}

const sectionHrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  borderTop: '1px solid #e5e7eb',
  margin: '0 0 20px',
}

const emptyTextStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '14px',
  margin: 0,
}

const eventCardStyle: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  marginBottom: '16px',
  paddingBottom: '16px',
}

const eventHeaderRowStyle: React.CSSProperties = {
  marginBottom: '4px',
}

const eventTitleStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  fontSize: '16px',
  fontWeight: 600,
  lineHeight: '1.4',
  margin: '0 0 6px',
}

const eventLinkStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  textDecoration: 'none',
}

const categoryBadgeStyle: React.CSSProperties = {
  borderRadius: '4px',
  display: 'inline-block',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  margin: '0 0 6px',
  padding: '2px 8px',
  textTransform: 'uppercase',
}

const eventMetaStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
}

const blogCardStyle: React.CSSProperties = {
  borderBottom: '1px solid #f3f4f6',
  marginBottom: '16px',
  paddingBottom: '16px',
}

const blogTitleStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  fontSize: '15px',
  fontWeight: 600,
  lineHeight: '1.4',
  margin: '0 0 6px',
}

const blogLinkStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  textDecoration: 'none',
}

const blogExcerptStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
}

const ctaContainerStyle: React.CSSProperties = {
  backgroundColor: SPACE_BLUE,
  margin: '0 auto',
  maxWidth: '560px',
  padding: '32px 40px',
  textAlign: 'center',
}

const ctaTextStyle: React.CSSProperties = {
  color: '#bfdbfe',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 20px',
}

const ctaButtonRowStyle: React.CSSProperties = {
  textAlign: 'center',
}

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: SUNSET_ORANGE,
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 28px',
  textDecoration: 'none',
}

const footerStyle: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '560px',
  padding: '16px 32px 32px',
  textAlign: 'center',
}

const footerHrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  borderTop: '1px solid #e5e7eb',
  margin: '0 0 16px',
}

const footerTextStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 4px',
}

const footerLinkStyle: React.CSSProperties = {
  color: '#9ca3af',
  textDecoration: 'underline',
}

const unsubscribeLinkStyle: React.CSSProperties = {
  color: '#6b7280',
  textDecoration: 'underline',
}
