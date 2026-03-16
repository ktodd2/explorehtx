// =============================================================================
// ExploreHTX — Welcome Email Template (sent after verification)
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

interface WelcomeEmailProps {
  subscriberName?: string | null
  preferencesUrl: string
  eventsUrl: string
}

const SPACE_BLUE = '#0a2463'
const SUNSET_ORANGE = '#f97316'
const BASE_URL = 'https://explorehtx.us.com'

export default function WelcomeEmail({
  subscriberName,
  preferencesUrl = `${BASE_URL}/subscribe`,
  eventsUrl = `${BASE_URL}/events`,
}: WelcomeEmailProps) {
  const greeting = subscriberName
    ? `Welcome to ExploreHTX, ${subscriberName}!`
    : 'Welcome to ExploreHTX!'

  return (
    <Html lang="en">
      <Head />
      <Preview>You&apos;re in! Houston&apos;s best events, delivered weekly.</Preview>
      <Body style={bodyStyle}>
        {/* Header */}
        <Section style={headerStyle}>
          <Text style={logoStyle}>ExploreHTX</Text>
          <Text style={taglineStyle}>Houston&apos;s Local Event Guide</Text>
        </Section>

        {/* Content */}
        <Container style={containerStyle}>
          <Heading style={headingStyle}>{greeting}</Heading>

          <Text style={textStyle}>
            You&apos;re officially subscribed to ExploreHTX — your weekly
            digest of the best things to do in the Bayou City.
          </Text>

          <Text style={subheadingStyle}>What you&apos;ll receive:</Text>

          <Section style={listItemStyle}>
            <Text style={listTextStyle}>
              <span style={bulletStyle}>&#9642;</span>
              <strong>Weekly Event Digest</strong> — curated picks for concerts,
              food events, festivals, sports, and more happening in Houston each
              week.
            </Text>
          </Section>
          <Section style={listItemStyle}>
            <Text style={listTextStyle}>
              <span style={bulletStyle}>&#9642;</span>
              <strong>Neighborhood Guides &amp; Blog Posts</strong> — local
              stories and hidden gems across HTX.
            </Text>
          </Section>
          <Section style={listItemStyle}>
            <Text style={listTextStyle}>
              <span style={bulletStyle}>&#9642;</span>
              <strong>Personalized by Category</strong> — we&apos;ll highlight
              events in the categories you care about most.
            </Text>
          </Section>

          <Hr style={hrStyle} />

          <Text style={textStyle}>
            Ready to explore? Browse what&apos;s happening in Houston right now:
          </Text>

          <Section style={buttonRowStyle}>
            <Button href={eventsUrl} style={primaryButtonStyle}>
              Browse Houston Events
            </Button>
          </Section>

          <Text style={smallTextStyle}>
            Want to update your categories or change how often you hear from us?
          </Text>

          <Section style={secondaryLinkContainerStyle}>
            <Button href={preferencesUrl} style={secondaryButtonStyle}>
              Manage Preferences
            </Button>
          </Section>

          <Hr style={hrStyle} />

          <Text style={disclaimerStyle}>
            You&apos;re receiving this because you signed up at explorehtx.us.com.
            You can unsubscribe at any time using the link in future emails.
          </Text>
        </Container>

        {/* Footer */}
        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            &copy; {new Date().getFullYear()} ExploreHTX &mdash; Houston, TX
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

const containerStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '0 0 8px 8px',
  margin: '0 auto',
  maxWidth: '560px',
  padding: '40px 40px 32px',
}

const headingStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  fontSize: '26px',
  fontWeight: 700,
  letterSpacing: '-0.5px',
  margin: '0 0 20px',
}

const textStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const subheadingStyle: React.CSSProperties = {
  color: SPACE_BLUE,
  fontSize: '15px',
  fontWeight: 600,
  margin: '24px 0 12px',
}

const listItemStyle: React.CSSProperties = {
  margin: '0 0 8px',
}

const listTextStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: 0,
}

const bulletStyle: React.CSSProperties = {
  color: SUNSET_ORANGE,
  marginRight: '8px',
}

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  borderTop: '1px solid #e5e7eb',
  margin: '28px 0',
}

const buttonRowStyle: React.CSSProperties = {
  margin: '24px 0 16px',
  textAlign: 'center',
}

const primaryButtonStyle: React.CSSProperties = {
  backgroundColor: SUNSET_ORANGE,
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: 600,
  padding: '14px 32px',
  textDecoration: 'none',
}

const smallTextStyle: React.CSSProperties = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '1.5',
  margin: '0 0 12px',
  textAlign: 'center',
}

const secondaryLinkContainerStyle: React.CSSProperties = {
  margin: '0 0 8px',
  textAlign: 'center',
}

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  color: SPACE_BLUE,
  display: 'inline-block',
  fontSize: '14px',
  fontWeight: 600,
  padding: '10px 24px',
  textDecoration: 'none',
}

const disclaimerStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '13px',
  lineHeight: '1.5',
  margin: 0,
}

const footerStyle: React.CSSProperties = {
  margin: '0 auto',
  maxWidth: '560px',
  padding: '16px 32px 32px',
  textAlign: 'center',
}

const footerTextStyle: React.CSSProperties = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: 0,
}
