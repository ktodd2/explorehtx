// =============================================================================
// ExploreHTX — Email Verification Template
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

interface VerificationEmailProps {
  verificationUrl: string
  subscriberName?: string | null
}

const SPACE_BLUE = '#0a2463'
const SUNSET_ORANGE = '#f97316'

export default function VerificationEmail({
  verificationUrl,
  subscriberName,
}: VerificationEmailProps) {
  const greeting = subscriberName ? `Hi ${subscriberName},` : 'Hi there,'

  return (
    <Html lang="en">
      <Head />
      <Preview>Verify your email address for ExploreHTX</Preview>
      <Body style={bodyStyle}>
        {/* Header */}
        <Section style={headerStyle}>
          <Text style={logoStyle}>ExploreHTX</Text>
        </Section>

        {/* Content */}
        <Container style={containerStyle}>
          <Heading style={headingStyle}>Verify your email address</Heading>

          <Text style={textStyle}>{greeting}</Text>

          <Text style={textStyle}>
            Thanks for signing up for ExploreHTX — your guide to the best
            events, food, and things to do in Houston. Click the button below
            to confirm your email address and start receiving weekly Houston
            event digests.
          </Text>

          <Section style={buttonContainerStyle}>
            <Button href={verificationUrl} style={buttonStyle}>
              Verify Email Address
            </Button>
          </Section>

          <Text style={smallTextStyle}>
            This link expires in 24 hours. If the button doesn&apos;t work,
            copy and paste this URL into your browser:
          </Text>
          <Text style={linkTextStyle}>{verificationUrl}</Text>

          <Hr style={hrStyle} />

          <Text style={disclaimerStyle}>
            If you didn&apos;t sign up for ExploreHTX, you can safely ignore
            this email. Someone may have entered your address by mistake.
          </Text>
        </Container>

        {/* Footer */}
        <Section style={footerStyle}>
          <Text style={footerTextStyle}>
            &copy; {new Date().getFullYear()} ExploreHTX &mdash; Houston&apos;s
            Local Event Guide
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
  margin: '0 0 24px',
}

const textStyle: React.CSSProperties = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 16px',
}

const buttonContainerStyle: React.CSSProperties = {
  margin: '32px 0',
  textAlign: 'center',
}

const buttonStyle: React.CSSProperties = {
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
  margin: '0 0 8px',
}

const linkTextStyle: React.CSSProperties = {
  color: SUNSET_ORANGE,
  fontSize: '13px',
  lineHeight: '1.5',
  margin: '0 0 24px',
  wordBreak: 'break-all',
}

const hrStyle: React.CSSProperties = {
  borderColor: '#e5e7eb',
  borderTop: '1px solid #e5e7eb',
  margin: '24px 0',
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
