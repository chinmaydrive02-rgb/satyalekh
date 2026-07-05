import type { Metadata } from 'next';
import './globals.css';
import ServerWarmup from '@/components/ServerWarmup';
import DemoBanner from '@/components/DemoBanner';

// Fonts are loaded via <link> (runtime) rather than next/font (build-time
// fetch) so the app builds in offline/CI environments. globals.css defines
// --font-sans (Inter) and --font-display (Space Grotesk) with system
// fallbacks, so the UI degrades gracefully while fonts stream in.

export const metadata: Metadata = {
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
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-bg text-ink">
        {children}
        <ServerWarmup />
        <DemoBanner />
      </body>
    </html>
  );
}
