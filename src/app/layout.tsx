import type { Metadata } from 'next';
import { Inter, Bricolage_Grotesque } from 'next/font/google';
import Script from 'next/script';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://explorehtx.us.com'),
  title: {
    default: 'ExploreHTX - Houston Events, Things to Do & Local Guide',
    template: '%s | ExploreHTX',
  },
  description:
    'Discover the best Houston events, concerts, food, nightlife, and things to do. Your local guide to the Bayou City — neighborhoods, hidden gems, and everything HTX has to offer.',
  keywords: [
    'Houston events',
    'things to do in Houston',
    'Houston concerts',
    'Houston food',
    'Houston nightlife',
    'Houston neighborhoods',
    'HTX guide',
    'Houston travel',
    'Houston weekend',
    'Houston local guide',
    'Bayou City events',
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://explorehtx.us.com',
    siteName: 'ExploreHTX',
    title: 'ExploreHTX - Houston Events, Things to Do & Local Guide',
    description:
      'Discover the best Houston events, concerts, food, nightlife, and things to do. Your local guide to the Bayou City.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ExploreHTX — Your Houston Guide',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@explorehtx',
    creator: '@explorehtx',
    title: 'ExploreHTX - Houston Events, Things to Do & Local Guide',
    description:
      'Discover the best Houston events, concerts, food, nightlife, and things to do.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://explorehtx.us.com',
  },
};

const adSenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${bricolage.variable}`}>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground">

        {/* AdSense — production only */}
        {process.env.NODE_ENV === 'production' && adSenseId && (
          <Script
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseId}`}
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}

        <Header />

        <main className="flex-1">
          {children}
        </main>

        <Footer />

      </body>
    </html>
  );
}
