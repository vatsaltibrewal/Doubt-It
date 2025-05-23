import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DoubtIt - AI-Powered Developer Support Platform',
  description: 'Intelligent developer support platform that bridges AI assistance with human expertise. Get instant answers with seamless expert takeover.',
  keywords: 'AI support, developer support, chatbot, Telegram bot, customer service, Aptos, blockchain support',
  openGraph: {
    title: 'DoubtIt - Where AI and Human Expertise Converge',
    description: 'Get instant developer support with AI, seamlessly transition to human experts when needed.',
    url: 'https://your-domain.com',
    siteName: 'DoubtIt',
    images: [
      {
        url: '/doubtItDescription.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DoubtIt - AI-Powered Developer Support',
    description: 'Intelligent support platform bridging AI and human expertise',
    images: ['/doubtItDescription.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}