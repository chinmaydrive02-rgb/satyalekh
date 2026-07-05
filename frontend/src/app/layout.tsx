import type { Metadata } from 'next';
import './globals.css';
import ServerWarmup from '@/components/ServerWarmup';
import DemoBanner from '@/components/DemoBanner';

// Fonts are loaded via <link> (runtime) rather than next/font (build-time
// fetch) so the app builds in offline/CI environments. globals.css defines
// --font-sans (Inter), --font-display (Space Grotesk) and --font-serif
// (Fraunces) with system fallbacks, so the UI degrades gracefully while
// fonts stream in.

// Inline SVG brand mark — shield with document rules + check, deep teal.
const FAVICON_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0f766e"/><path d="M16 5.5l7.5 3v7c0 5.2-3.2 9-7.5 11-4.3-2-7.5-5.8-7.5-11v-7l7.5-3z" fill="#0b5d56"/><path d="M16 7.7l5.5 2.2v5.6c0 4.1-2.4 7.1-5.5 8.8-3.1-1.7-5.5-4.7-5.5-8.8V9.9L16 7.7z" fill="#fffefb"/><path d="M12.6 12h6.8M12.6 14.6h6.8" stroke="#b9ddd3" stroke-width="1.2" stroke-linecap="round"/><path d="M12.8 18.2l2.2 2.2 4.4-4.4" stroke="#0f766e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`
  );

export const metadata: Metadata = {
  icons: { icon: [{ url: FAVICON_SVG, type: 'image/svg+xml' }] },
  title: 'Satya-Lekh — India’s Land Title Clearance Checker | Gujarat 7/12 in English',
  description:
    'Search AnyROR Gujarat land records (7/12 / Satbara utara) by district, taluka, village and survey number. Automatic CAPTCHA solving, Gujarati-to-English translation, encumbrance and tenure risk analysis for buyers, lawyers and banks.',
  keywords: [
    'AnyROR', '7/12 extract', 'Satbara utara', 'Gujarat land records',
    'land title search Gujarat', 'jantri rate', 'survey number search',
    'property due diligence India',
  ],
  openGraph: {
    title: 'Satya-Lekh — Gujarat Land Title Intelligence',
    description:
      'AnyROR 7/12 land records in English with risk analysis — CAPTCHA solving and Gujarati translation handled automatically.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0b1f1a" />
      </head>
      <body className="antialiased bg-bg text-ink">
        {children}
        <ServerWarmup />
        <DemoBanner />
      </body>
    </html>
  );
}
