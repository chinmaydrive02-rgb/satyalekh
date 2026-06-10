import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ServerWarmup from '@/components/ServerWarmup';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Satya-Lekh — Gujarat Land Records (7/12 Satbara) in English, in Minutes',
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
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-[#0a0a0a] text-[#dbfcff]`}>
        {children}
        <ServerWarmup />
      </body>
    </html>
  );
}
