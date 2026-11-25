import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Schibsted_Grotesk, Source_Serif_4 } from 'next/font/google';
import './globals.css';

const ui = Schibsted_Grotesk({ subsets: ['latin'], variable: '--font-ui' });
const doc = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-doc',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'CareerPilot',
  description: 'Match your resume to job posts and track your applications.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${doc.variable}`}>
      <body className="font-sans antialiased">
        <ClerkProvider afterSignOutUrl="/sign-in">{children}</ClerkProvider>
      </body>
    </html>
  );
}