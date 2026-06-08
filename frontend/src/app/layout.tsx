import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import ServerWarmup from '@/components/ServerWarmup';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'Satya-Lekh | Digital Sovereign',
  description: 'Premium Title Intelligence Platform for Real Estate Market',
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
